import * as p5 from 'p5'
import { v4 as uuid } from 'uuid'
import { UserEvent } from './serverApi/serverApi'
import Sketch from './Sketch'
import seedrandom from 'seedrandom'
import { BLACK_KEYS } from './constants'

export const radBig = 50
export const radSmall = 35

type LoopEvent = {
	evt: UserEvent
	loopTime: number // normalized 0-1 to loop duration
	release?: LoopEvent // reference to release for attack events
}

type LoopData = {
	id: string
	beats: number
	evts: LoopEvent[]
	isMuted: boolean
}

export type LoopOpts = {
	id?: string
	beats: number
	radius: number
	sketch: Sketch
	isDial?: boolean
}

export class Loop {
	opts: LoopOpts
	id: string
	xx = 0
	yy = 0
	evts: LoopEvent[] = []
	headPlay = 0
	headRec = 0
	isActive = false
	isDial = false
	isRecording = false
	isMuted = false
	loaded = false
	pgControls?: p5.Graphics
	pgNotes?: p5.Graphics
	needsRenderControls = false
	needsRenderNotes = false
	// data: LoopData

	constructor(opts: LoopOpts) {
		this.opts = opts
		if (opts.id) {
			this.id = opts.id
			if (this.load()) {
				console.log(`[Loop #ctor] Loaded loop ${opts.id} from local storage`)
				this.needsRenderControls = true
				this.needsRenderNotes = true
				return // loaded loop from local storage
			} else {
				console.error(`[Loop #ctor] Failed to load loop ${opts.id} from local storage`)
			}
		} else {
			this.id = uuid()
		}
		if (opts.isDial) {
			this.isDial = true
		} else {
			this.isActive = true
		}
	}

	save = () => {
		const { id, isMuted, evts, opts } = this
		const { beats, sketch } = opts
		const data = { id, beats, evts, isMuted }
		sketch.localStorage.setItem(id, JSON.stringify(data))
		// console.log(`[Loop #save] Saved loop ${id} to local storage`)
	}

	load = () => {
		const { id, opts } = this
		const { sketch } = opts
		const dataStr = sketch.localStorage.getItem(id)
		if (!dataStr || dataStr === '') {
			this.loaded = false
			return false
		}
		const data = JSON.parse(dataStr) as LoopData
		opts.beats = data.beats
		this.evts = data.evts
		this.evts.forEach(le => (le.evt.timestamp = 0))
		this.isMuted = data.isMuted
		this.loaded = true
		return true
	}

	remove = () => {
		this.opts.sketch.localStorage.removeItem(this.id)
	}

	setRadius = (rad: number) => {
		if (rad === this.opts.radius) {
			return
		}
		this.opts.radius = rad
		// redraw notes and controls
		if (this.pgControls) {
			this.needsRenderControls = true
		}
		if (this.pgNotes) {
			this.needsRenderNotes = true
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
			this.needsRenderNotes = true
			return
		}
		if (kind === 'controlchange' || kind === 'pitchbend') {
			this.needsRenderControls = true
		}
		if (kind === 'noteon' || kind === 'noteoff') {
			this.needsRenderNotes = true
		}
		this.evts.push(levt)
	}

	sanitizeEvents = () => {
		// Remove any attacks that don't have releases
		this.evts = this.evts.filter(ee => ee.evt.midiEvent.kind !== 'noteon' || ee.release)
	}

	updateClientId = (clientId: number) => {
		for (const le of this.evts) {
			le.evt.clientId = clientId
			if (le.release) {
				le.release.evt.clientId = clientId
			}
		}
	}

	attackEvents = () => this.evts.filter(ee => ee.evt.midiEvent.kind === 'noteon')
	releaseEvents = () => this.evts.filter(ee => ee.evt.midiEvent.kind === 'noteoff')
	controlEvents = () =>
		this.evts.filter(
			ee => ee.evt.midiEvent.kind === 'controlchange' || ee.evt.midiEvent.kind === 'pitchbend',
		)
	sortByLoopTime = (evts: LoopEvent[]) =>
		evts.sort((aa: LoopEvent, bb: LoopEvent) => (aa.loopTime > bb.loopTime ? 1 : -1))
	groupByController = (evts: LoopEvent[]) => {
		const resp: { [key: number]: LoopEvent[] } = {}
		for (const le of evts) {
			const { controller } = le.evt.midiEvent
			const ctrl = controller ? controller.number : 0
			if (!resp[ctrl]) {
				resp[ctrl] = []
			}
			resp[ctrl].push(le)
		}
		return resp
	}
	filterNote = (evts: LoopEvent[], note: number) => evts.filter(ee => ee.evt.midiEvent.note === note)

	clearAllEvents = () => {
		// Remove all loop events
		this.evts = []
		this.save()
		// Update note and control graphics
		if (this.pgControls) {
			this.needsRenderControls = true
		}
		if (this.pgNotes) {
			this.needsRenderNotes = true
		}
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
			const { evt, loopTime, release } = levt
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
				if (release) {
					let after = release.loopTime - loopTime
					if (after <= 0) {
						after += 1
					}
					sketch._sendUserEvent({
						...release.evt,
						timestamp: this.timeLoopNormToGlobal(now + recOff, lt + after),
					})
				}
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
			pp.fill(30).stroke(255, 0, 0).strokeWeight(4)
		} else {
			this.recStartedAt = null
			pp.fill(30).stroke(0).strokeWeight(2)
		}
		pp.circle(this.xx, this.yy, radius * 2 + (isRecording ? 2 : 0))

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

		if (isActive || !isMuted) {
			if (isMuted) {
				pp.stroke(100).strokeWeight(3)
			} else {
				pp.stroke(0, 200, 0).strokeWeight(3)
			}
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
		if (this.isDial) {
			return
		}
		this.drawControls(pp)
		this.drawNotes(pp)
	}

	drawControls = (pp: p5) => {
		const { radius } = this.opts
		if (this.needsRenderControls) {
			this.needsRenderControls = false
			if (!this.pgControls) {
				this.pgControls = pp.createGraphics(radBig * 2, radBig * 2)
			}
			// Stash the x and y coords and override with center of graphics
			const [tmpx, tmpy] = [this.xx, this.yy]
			this.xx = radius
			this.yy = radius
			this.renderControls()
			this.xx = tmpx
			this.yy = tmpy
		}
		if (this.pgControls) {
			pp.image(this.pgControls, this.xx - radius, this.yy - radius)
		}
	}

	drawNotes = (pp: p5) => {
		const { radius } = this.opts
		if (this.needsRenderNotes) {
			this.needsRenderNotes = false
			if (!this.pgNotes) {
				this.pgNotes = pp.createGraphics(radBig * 2, radBig * 2)
			}
			const [tmpx, tmpy] = [this.xx, this.yy]
			this.xx = radius
			this.yy = radius
			this.renderNotes()
			this.xx = tmpx
			this.yy = tmpy
		}
		if (this.pgNotes) {
			pp.image(this.pgNotes, this.xx - radius, this.yy - radius)
		}
		if (this.isRecording) {
			this._drawNotes(pp, true) // draw any unreleased notes
		}
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

	renderControls = () => {
		if (!this.pgControls) {
			return
		}
		const pg = this.pgControls
		pg.clear()
		const cevts = this.groupByController(this.sortByLoopTime(this.controlEvents()))
		if (!Object.keys(cevts).length) {
			return
		}
		const { radius } = this.opts
		pg.strokeWeight(2).noFill()
		pg.colorMode(pg.HSL, 1)
		for (const ctrl in cevts) {
			const hue = seedrandom(ctrl).quick()
			const sat = 0.8
			const len = cevts[ctrl].length
			for (let ii = 0; ii < len; ii++) {
				const { loopTime, evt } = cevts[ctrl][ii]
				const nextEvtIdx = ii === len - 1 ? 0 : ii + 1
				const { loopTime: nextTime } = cevts[ctrl][nextEvtIdx]
				const { kind, value } = evt.midiEvent
				const isPitchbend = kind === 'pitchbend'
				const vv = isPitchbend ? value / 2 + 0.5 : value
				const rad = radius * (0.3 + 0.7 * vv)
				pg.stroke(hue, sat, 0.4)
				this.drawArc(pg, rad, nextTime, loopTime)
			}
		}
	}

	renderNotes = () => {
		if (!this.pgNotes) {
			return
		}
		this.pgNotes.clear()
		this._drawNotes(this.pgNotes)
	}

	_drawNotes = (pp: p5, unreleasedOnly = false) => {
		const modNotes = 12
		const { radius } = this.opts
		pp.strokeWeight(radius / modNotes).noFill()
		pp.colorMode(pp.HSL, 1)
		for (const { loopTime, evt, release } of this.attackEvents()) {
			const { note, attack } = evt.midiEvent
			let relTime = this.headRec
			if (release) {
				if (unreleasedOnly) {
					continue
				}
				relTime = release.loopTime
			}
			const rad = radius * (0.3 + (0.7 * (note % modNotes)) / modNotes)
			const nn = note % 12
			let hue = BLACK_KEYS.includes(nn) ? 0.5 + nn / 36 : nn / 36
			let sat = attack ? 1 - attack : 0.5
			sat = 1 - sat * sat
			pp.stroke(hue, sat, 0.4)
			this.drawArc(pp, rad, relTime, loopTime)
		}
		pp.colorMode(pp.RGB, 255)
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
