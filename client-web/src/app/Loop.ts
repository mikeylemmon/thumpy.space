import * as p5 from 'p5'
import { UserEvent } from './serverApi/serverApi'
import Sketch from './Sketch'

const KEYCODE_SHIFT = 16

export type LoopOpts = {
	beats: number
	radius: number
	sketch: Sketch
	isDial?: boolean
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
	isActive = false
	isDial = false
	isRecording = false
	isMuted = false

	constructor(opts: LoopOpts) {
		this.opts = opts
		if (opts.isDial) {
			this.isDial = true
		} else {
			this.isActive = true
		}
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

	releaseAll = () => {
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
	}

	clearAllEvents = () => {
		this.releaseAll()
		// Remove all loop events
		this.evts = []
	}

	update = () => {
		// Calculate play and rec heads normalized (0-1) to the loop length
		const { sketch } = this.opts
		const now = sketch.nowMs()
		const recOff = sketch.offsetMs()
		const play = this.timeGlobalToLoopNorm(now)
		let rec = this.timeGlobalToLoopNorm(now + recOff)
		const headRecPrev = this.headRec

		this.headPlay = play
		this.headRec = rec

		if (this.isMuted) {
			return
		}

		// Trigger looped events if an offset boundary was crossed
		for (const levt of this.evts) {
			const { evt, loopTime } = levt
			let lt = loopTime
			if (evt.timestamp > now - sketch.beatMs() / 2) {
				continue // don't trigger the first event since it is sent directly
			}
			if (rec < headRecPrev) {
				// crossed the 1/0 boundary
				if (lt <= rec) {
					lt += 1
				}
				rec += 1
			}
			if (headRecPrev < lt && lt <= rec) {
				sketch._sendUserEvent({
					...levt.evt,
					timestamp: this.timeLoopNormToGlobal(now + recOff, lt),
				})
			}
		}
	}

	recStartedAt: number | null = null
	draw = (pp: p5, xx: number, yy: number) => {
		const { beats, radius } = this.opts
		const { isActive, isDial, isMuted, isRecording } = this
		this.xx = xx
		this.yy = yy
		if (isRecording) {
			if (this.recStartedAt === null) {
				this.recStartedAt = this.headRec
			}
			pp.fill(30).stroke(255, 0, 0).strokeWeight(2)
		} else {
			this.recStartedAt = null
			pp.fill(30).stroke(0).strokeWeight(2)
		}
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

		if (isMuted) {
			pp.fill(30, 150).noStroke()
			pp.circle(this.xx, this.yy, radius * 2)
		}

		// Draw indicators for playhead and record-head
		const { headPlay, headRec } = this
		if (isDial || isRecording) {
			const arcPlay = (Math.ceil(headPlay * beats) % beats) / beats
			const arcRec = (Math.ceil(headRec * beats) % beats) / beats
			let recFillAlpha = 100
			if (isDial) {
				pp.fill(0, 200, 0, 60).noStroke()
				this.drawArc(pp, radius, arcPlay)
				recFillAlpha = 140
			}
			pp.fill(180, 0, 0, recFillAlpha).noStroke()
			if (headRec !== headPlay) {
				const rad = isRecording ? radius : radius * 0.7
				if (isRecording && this.recStartedAt !== null) {
					this.drawArc(pp, rad, headRec, this.recStartedAt)
				} else {
					this.drawArc(pp, rad, arcRec, headPlay)
				}
			}
		}

		pp.stroke(0, 200, 0).strokeWeight(3)
		if (!isMuted) {
			this.drawLine(pp, radius, headPlay)
		}
		if (isDial || isActive) {
			pp.stroke(200, 0, 0).strokeWeight(4)
			const rad = isRecording ? radius : radius * 0.7
			this.drawLine(pp, rad, headRec)
		}
	}

	// drawEvents draws an arc stroke for every note
	drawEvents = (pp: p5) => {
		const modNotes = 12
		const { radius } = this.opts
		pp.noFill()
		pp.strokeWeight(radius / modNotes)
		pp.colorMode(pp.HSL, 1)
		for (const { loopTime, evt, release } of this.attackEvents()) {
			let relTime = this.headRec
			if (release) {
				relTime = release.loopTime
			}
			const { note, attack } = evt.midiEvent
			const rad = radius * (0.3 + (0.7 * (note % modNotes)) / modNotes)
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

	hitTest = (xx: number, yy: number) => {
		const { radius } = this.opts
		if (xx < this.xx - radius || xx > this.xx + radius) {
			return false
		}
		if (yy < this.yy - radius || yy > this.yy + radius) {
			return false
		}
		return true
	}
}

export type LoopsOpts = {
	sketch: Sketch
	recOffset: number
}

export class Loops {
	sketch: Sketch
	dial: Loop
	loops: Loop[] = []
	activeLoop: Loop
	inputs: {
		loopLen?: any
		newLoopBtn?: any
	} = {}
	hidden = false
	hiddenDial = false

	constructor(opts: LoopsOpts) {
		this.sketch = opts.sketch
		this.dial = new Loop({
			beats: this.dialBeats(opts.recOffset),
			radius: 50,
			sketch: opts.sketch,
			isDial: true,
		})
		this.activeLoop = new Loop({
			beats: 8,
			radius: 50,
			sketch: opts.sketch,
		})
		this.loops.push(this.activeLoop)
	}

	update = () => {
		this.dial.update()
		this.loops.forEach(ll => ll.update())
	}

	draw = (pp: p5) => {
		const { activeLoop, didSetup, hidden, hiddenDial } = this
		if (hidden) {
			if (didSetup) {
				this.inputs.loopLen.remove()
				this.inputs.newLoopBtn.remove()
				this.didSetup = false
			}
		} else if (!didSetup) {
			this.setupInputs(pp)
		}
		const { loopLen, newLoopBtn } = this.inputs

		// Draw active loop
		let rad = 50
		let yy = rad + 20
		let xx = pp.width - 20
		if (!hidden) {
			activeLoop.opts.radius = rad
			activeLoop.isRecording = pp.keyIsDown(KEYCODE_SHIFT)
			xx -= rad + 20
			activeLoop.draw(pp, xx, yy)
			pp.fill(210).stroke(0).strokeWeight(1)
			pp.textSize(14).textAlign(pp.CENTER, pp.TOP)
			pp.text(`Active loop: ${loopLen.value()} beats`, xx, yy + rad + 10)
			loopLen.position(xx - 60, yy + rad + 30)
			const btnHalfwidth = Math.max(48, Math.floor(newLoopBtn.elt.offsetWidth / 2))
			newLoopBtn.position(xx - btnHalfwidth, yy + rad + 60)
			xx -= rad + 20
		}

		if (!hiddenDial) {
			// Draw metronome dial
			rad = this.dial.opts.radius
			xx -= rad + 20
			this.dial.draw(pp, xx, yy)
			pp.fill(210).stroke(0).strokeWeight(1)
			pp.textSize(14).textAlign(pp.CENTER, pp.TOP)
			pp.text('Metronome', xx, yy + rad + 10)
		}

		if (hidden) {
			return
		}

		yy = newLoopBtn.y + newLoopBtn.elt.offsetHeight + 20

		const othersTop = yy
		rad = 35
		xx = pp.width - rad - 20
		for (const ll of this.inactiveLoops()) {
			ll.isActive = false
			ll.opts.radius = 35
			yy += rad
			ll.draw(pp, xx, yy)
			yy += rad + 20
			if (yy > pp.height - rad * 3) {
				yy = othersTop
				xx -= rad * 2 + 20
			}
		}
	}

	didSetup = false
	setupInputs = (pp: p5) => {
		this.didSetup = true
		this.inputs.loopLen = pp.createSlider(1, 64, this.activeLoop.opts.beats) as any
		this.inputs.newLoopBtn = pp.createButton('Add new loop') as any
		const { loopLen, newLoopBtn } = this.inputs
		loopLen.size(120)
		loopLen.input(() => {
			this.activeLoop.releaseAll()
			this.activeLoop.opts.beats = loopLen.value()
		})
		newLoopBtn.mousePressed(this.addLoop)
	}

	dialBeats = (recOffset: number) => 4 * Math.ceil((recOffset + 1) / 4)

	updateRecOffset = (off: number) => {
		this.dial.opts.beats = this.dialBeats(off)
	}

	loopUserEvent = (evt: UserEvent) => {
		this.activeLoop.loopUserEvent(evt)
	}

	clearAll = () => {
		this.loops.forEach(ll => ll.clearAllEvents())
	}

	clearActiveLoop = () => {
		this.activeLoop.clearAllEvents()
	}

	toggleActiveLoopMute = () => {
		const al = this.activeLoop
		al.isMuted = !al.isMuted
		if (al.isMuted) {
			al.releaseAll()
		}
	}

	toggleHide = () => (this.hidden = !this.hidden)
	toggleHideText = () => (this.hidden ? 'Show Loops' : 'Hide Loops')
	toggleHideDial = () => (this.hiddenDial = !this.hiddenDial)
	toggleHideDialText = () => (this.hiddenDial ? 'Show Metronome' : 'Hide Metronome')

	sanitizeEvents = () => {
		this.loops.forEach(ll => ll.sanitizeEvents())
	}

	addLoop = () => {
		this.activeLoop = new Loop({
			beats: this.inputs.loopLen.value(),
			radius: 50,
			sketch: this.sketch,
		})
		this.loops.push(this.activeLoop)
	}

	inactiveLoops = () => this.loops.filter(ll => ll !== this.activeLoop)

	mousePressed = (pp: p5) => {
		for (const loop of this.inactiveLoops()) {
			if (loop.hitTest(pp.mouseX, pp.mouseY)) {
				if (pp.keyIsDown(KEYCODE_SHIFT)) {
					// Remove loop
					this.loops = this.loops.filter(ll => ll !== loop)
					return
				}
				this.inputs.loopLen.value(loop.opts.beats)
				this.activeLoop.isActive = false
				this.activeLoop = loop
				loop.isActive = true
				return
			}
		}
	}
}
