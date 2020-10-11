import * as p5 from 'p5'
import { UserEvent } from './serverApi/serverApi'
import Sketch from './Sketch'

export type LoopOpts = {
	beats: number
	radius: number
	sketch: Sketch
	doPlayRecArcs?: boolean
}

type LoopEvent = {
	evt: UserEvent
	loopTime: number // normalized 0-1 to loop duration
	release?: LoopEvent
}

export class Loop {
	opts: LoopOpts
	xx = 0
	yy = 0
	evts: LoopEvent[] = []
	headPlay = 0
	headRec = 0

	constructor(opts: LoopOpts) {
		this.opts = opts
	}

	loopLenMs = () => this.opts.beats * this.opts.sketch.beatMs()

	loopUserEvent = (evt: UserEvent) => {
		const { sketch } = this.opts
		const recOff = sketch.offsetMs()
		const now = sketch.nowMs()
		const loopTime = this.timeGlobalToLoopNorm(now + recOff)
		const levt = {
			evt,
			loopTime,
		}
		const { kind, note } = evt.midiEvent
		if (kind === 'noteoff') {
			// Attach event to the associated noteon event
			const attacks = this.filterNote(this.attackEvents(), note)
			let attackEvt: LoopEvent | null = null
			let minDiff = 1
			const relTime = loopTime + 1
			for (const ae of attacks) {
				let attTime = ae.loopTime > loopTime ? ae.loopTime : ae.loopTime + 1
				const diff = relTime - attTime
				if (diff < minDiff) {
					minDiff = diff
					attackEvt = ae
				}
			}
			if (attackEvt) {
				attackEvt.release = levt
			} else {
				console.warn('[Loop #loopUserEvent] No attack event found for release', levt)
			}
		}
		this.evts.push(levt)
	}

	sanitizeEvents = () => {
		// Remove any attacks that don't have releases
		this.evts = this.evts.filter(ee => ee.evt.midiEvent.kind !== 'noteon' || ee.release)
	}

	attackEvents = () => this.evts.filter(ee => ee.evt.midiEvent.kind === 'noteon')
	releaseEvents = () => this.evts.filter(ee => ee.evt.midiEvent.kind === 'noteoff')
	filterNote = (evts: LoopEvent[], note: number) => evts.filter(ee => ee.evt.midiEvent.note === note)

	clearAllEvents = () => {
		// Trigger any releases
		const { sketch } = this.opts
		const now = sketch.nowMs()
		const recOff = sketch.offsetMs()
		for (const le of this.releaseEvents()) {
			sketch._sendUserEvent({
				...le.evt,
				timestamp: now + recOff,
			})
		}
		// Remove all loop events
		this.evts = []
	}

	update = () => {
		// Calculate play and rec heads normalized (0-1) to the loop length
		const { sketch } = this.opts
		const now = sketch.nowMs()
		const recOff = sketch.offsetMs()
		const play = this.timeGlobalToLoopNorm(now)
		const rec = this.timeGlobalToLoopNorm(now + recOff)

		// Trigger looped events if an offset boundary was crossed
		for (const levt of this.evts) {
			const { evt, loopTime: lt } = levt
			if (evt.timestamp > now - sketch.beatMs() / 2) {
				continue // don't trigger the first event since it is sent directly
			}
			if (this.headRec < lt && lt <= rec) {
				sketch._sendUserEvent({
					...levt.evt,
					timestamp: this.timeLoopNormToGlobal(now + recOff, lt),
				})
			}
		}

		this.headPlay = play
		this.headRec = rec
	}

	draw = (pp: p5, yy: number) => {
		const { beats, radius, doPlayRecArcs } = this.opts
		this.xx = pp.width - radius - 20
		this.yy = yy
		pp.fill(30).stroke(0).strokeWeight(2)
		pp.circle(this.xx, this.yy, radius * 2)

		// Draw a line for every beat
		for (let ii = 0; ii < beats; ii++) {
			const isDown = ii % 4 === 0
			const isFirst = ii === 0
			pp.stroke(isFirst ? 180 : isDown ? 130 : 80)
			pp.strokeWeight(isFirst ? 3 : isDown ? 2 : 1)
			const bb = ii / beats
			this.drawLine(pp, radius, bb)
		}

		this.drawEvents(pp)

		// Draw indicators for playhead and record-head
		const { headPlay, headRec } = this
		if (doPlayRecArcs) {
			const arcPlay = (Math.ceil(headPlay * beats) % beats) / beats
			const arcRec = (Math.ceil(headRec * beats) % beats) / beats
			pp.fill(0, 200, 0, 60).noStroke()
			this.drawArc(pp, radius, arcPlay)
			pp.fill(200, 0, 0, 120)
			if (headRec !== headPlay) {
				this.drawArc(pp, radius * 0.7, arcRec, headPlay)
			}
		}

		pp.stroke(0, 200, 0).strokeWeight(3)
		this.drawLine(pp, radius, headPlay)
		pp.stroke(200, 0, 0).strokeWeight(4)
		this.drawLine(pp, radius * 0.7, headRec)
	}

	// drawEvents draws an arc stroke for every note
	drawEvents = (pp: p5) => {
		const modNotes = 24
		const { radius } = this.opts
		pp.noFill()
		pp.strokeWeight((radius / modNotes) * 2)
		pp.colorMode(pp.HSL, 1)
		for (const { loopTime, evt, release } of this.attackEvents()) {
			let relTime = this.headRec
			if (release) {
				relTime = release.loopTime
			}
			const { note, attack } = evt.midiEvent
			const rad = (radius * (note % modNotes)) / modNotes
			const hue = (note % 12) / 12
			let sat = attack ? 1 - attack : 0.5
			sat = 1 - sat * sat
			pp.stroke(hue, sat, 0.35)
			this.drawArc(pp, rad, relTime, loopTime)
		}
		pp.colorMode(pp.RGB, 255)
	}

	drawLine = (pp: p5, rad: number, loopTime: number) => {
		const theta = Math.PI * 2 * loopTime
		const lx = this.xx + (rad - 2) * Math.sin(theta)
		const ly = this.yy - (rad - 2) * Math.cos(theta)
		pp.line(this.xx, this.yy, lx, ly)
	}

	drawArc = (pp: p5, rad: number, loopTime: number, fromTime: number = 0) => {
		const theta = Math.PI * (2 * loopTime - 0.5)
		const from = Math.PI * (2 * fromTime - 0.5)
		pp.arc(this.xx, this.yy, rad * 2, rad * 2, from, theta)
	}

	timeGlobalToLoop = (tt: number) => {
		return (tt - this.opts.sketch.downbeat) / this.loopLenMs()
	}

	timeGlobalToLoopNorm = (tt: number) => {
		const lt = this.timeGlobalToLoop(tt)
		return lt - Math.floor(lt) // 0-1 from start to end of loop
	}

	timeLoopToGlobal = (loopTime: number) => {
		const { sketch } = this.opts
		const loopLenMs = this.loopLenMs()
		return sketch.downbeat + loopTime * loopLenMs
	}

	timeLoopNormToGlobal = (tt: number, loopTime: number) => {
		const loopLenMs = this.loopLenMs()
		return this.timeLastLoopStartMs(tt) + loopTime * loopLenMs
	}

	timeLastLoopStartMs = (tt: number) => {
		const { sketch } = this.opts
		const loopLenMs = this.loopLenMs()
		const lt = this.timeGlobalToLoop(tt)
		return sketch.downbeat + Math.floor(lt) * loopLenMs
	}
}

export type LoopsOpts = {
	sketch: Sketch
	recOffset: number
}

export class Loops {
	dial: Loop
	loops: Loop[] = []
	activeLoop: Loop

	constructor(opts: LoopsOpts) {
		this.dial = new Loop({
			beats: this.dialBeats(opts.recOffset),
			radius: 50,
			sketch: opts.sketch,
			doPlayRecArcs: true,
		})
		this.activeLoop = new Loop({
			beats: 8,
			radius: 35,
			sketch: opts.sketch,
		})
		this.loops.push(this.activeLoop)
	}

	dialBeats = (recOffset: number) => 4 * Math.ceil((recOffset + 1) / 4)

	updateRecOffset = (off: number) => {
		this.dial.opts.beats = this.dialBeats(off)
	}

	loopUserEvent = (evt: UserEvent) => {
		this.activeLoop.loopUserEvent(evt)
	}

	clearAllEvents = () => {
		this.loops.forEach(ll => ll.clearAllEvents())
	}

	sanitizeEvents = () => {
		this.loops.forEach(ll => ll.sanitizeEvents())
	}

	update = () => {
		this.dial.update()
		this.loops.forEach(ll => ll.update())
	}

	draw = (pp: p5) => {
		let rad = this.dial.opts.radius
		let yy = rad + 20
		this.dial.draw(pp, yy)
		yy += rad + 20
		pp.fill(210).stroke(0).strokeWeight(1)
		pp.textSize(14).textAlign(pp.RIGHT, pp.TOP)
		pp.text('LOOPS:', pp.width - 40, yy)
		yy += 20
		for (const ll of this.loops) {
			rad = ll.opts.radius
			yy += rad
			ll.draw(pp, yy)
			yy += rad + 20
		}
	}
}
