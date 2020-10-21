import * as Tone from 'tone'
import * as p5 from 'p5'
import { sketch } from './Sketch'
import { ctrlColor } from './util'
import { MidiEvent, MidiEventCC, MidiEventPitchbend } from './MIDI'

// type Sliders = { [key: string]: InstControl }
type InstSlidersOpts = { sliders: InstControl[] }

export class InstControls {
	sliders: InstControl[]

	constructor(opts: InstSlidersOpts = { sliders: [] }) {
		this.sliders = opts.sliders
	}

	update = (pp: p5) => {
		for (const ss of this.sliders) {
			ss.update(pp)
		}
	}

	draw = (pp: p5) => {
		pp.push()
		const { sliders } = this
		let xx = 30
		for (const ss of sliders) {
			ss.xx = xx
			ss.draw(pp)
			xx += ss.width
			if (['ff', 'a', 'd', 's'].includes(ss.label)) {
				// no margin
			} else if (['pb', 'pan'].includes(ss.label)) {
				xx += ss.width / 2 // half margin
			} else {
				xx += ss.width // full margin
			}
		}
		pp.pop()
	}

	mousePressed = (evt: p5) => {
		const { mouse } = sketch.cam || {}
		for (const ss of this.sliders) {
			if (ss.mousePressed(evt.mouseX, evt.mouseY)) {
				if (mouse) {
					mouse.ismousedown = false
				}
				return true
			}
		}
		return false
	}

	mouseReleased = (_evt: p5) => {
		this.sliders.forEach(ss => ss.mouseReleased())
	}

	controlchangeNext = (evt: MidiEventCC): InstControl | undefined => {
		const ss = this.getSliderForCtrl(evt.controller.number)
		if (ss && !ss.pressed) {
			ss.valueNext = evt.value
		}
		return ss
	}
	controlchange = (evt: MidiEventCC): InstControl | undefined => {
		const ss = this.getSliderForCtrl(evt.controller.number)
		if (ss) {
			ss.value.value = evt.value
		}
		return ss
	}

	pitchbendNext = (evt: MidiEventPitchbend): InstControl | undefined => {
		const ss = this.getSliderForPitchbend()
		if (ss && !ss.pressed) {
			ss.valueNext = evt.value
		}
		return ss
	}
	pitchbend = (evt: MidiEventPitchbend): InstControl | undefined => {
		const ss = this.getSliderForPitchbend()
		if (ss) {
			ss.value.value = evt.value
		}
		return ss
	}

	getSliderForLabel = (lbl: string): InstControl | undefined => {
		const sliders = this.sliders.filter(s => s.label === lbl)
		return sliders[0]
	}
	getSliderForCtrl = (ctrl: number): InstControl | undefined => {
		const sliders = this.sliders.filter(s => s.ctrl === ctrl)
		return sliders[0]
	}
	getSliderForPitchbend = (): InstControl | undefined => {
		const sliders = this.sliders.filter(s => s.pitchbend)
		return sliders[0]
	}
}

type InstSliderOpts = {
	label: string
	ctrl: number
	value?: number
	pitchbend?: boolean
}

export class InstControl {
	height = 150
	width = 20
	value = new Tone.Signal(0)
	valueNext = 0
	strokeWeight = 4
	xx = 40
	yy = 100
	pressed = false
	label: string
	ctrl: number
	pitchbend: boolean

	constructor(opts: InstSliderOpts) {
		this.label = opts.label
		this.ctrl = opts.ctrl
		if (opts.value) {
			this.set(opts.value)
		}
		this.pitchbend = !!opts.pitchbend
	}

	_wasPressed = false
	update(pp: p5) {
		if (!this.pressed) {
			if (this.pitchbend && this._wasPressed) {
				this.valueNext = 0
				this.sendValue()
			}
			this._wasPressed = false
			return
		}
		this._wasPressed = true
		this.setValueNext(pp.mouseY)
	}

	_ee = 0
	draw(pp: p5) {
		pp.colorMode(pp.HSL, 1)
		pp.fill(0, 0, 0.1).stroke(0, 0, 0.7).strokeWeight(this.strokeWeight)
		pp.rect(this.xx, this.yy, this.width, this.height)
		const col = ctrlColor(`${this.ctrl}`)
		pp.fill(col.hue, col.sat * 0.3, col.lgt).noStroke()
		this.drawVal(pp, this.valueNext)
		pp.fill(col.hue, col.sat, col.lgt).noStroke()
		this.drawVal(pp, this.value.value)
		pp.fill(0, 0, 0.8).stroke(0).strokeWeight(1)
		pp.textSize(10).textAlign(pp.CENTER, pp.TOP).textStyle(pp.BOLD)
		pp.text(this.label.toUpperCase(), this.xx + this.width / 2, this.yy + this.height + 5)
	}

	drawVal(pp: p5, val: number) {
		const vw = this.width - this.strokeWeight
		const vx = this.xx + this.strokeWeight / 2
		pp.square(vx, this.valueY(val), vw)
	}

	mousePressed(mouseX: number, mouseY: number) {
		if (mouseX < this.xx || mouseX > this.xx + this.width) {
			return false
		}
		if (mouseY < this.yy || mouseY > this.yy + this.height) {
			return false
		}
		this.setValueNext(mouseY)
		this.pressed = true
		return true
	}

	_onRelease?: () => void
	mouseReleased() {
		this.pressed = false
		if (this._onRelease) {
			this._onRelease()
			this._onRelease = undefined
		}
	}
	onRelease(cb: (ctrl?: InstControl) => void) {
		if (this._onRelease) {
			return
		}
		if (!this.pressed) {
			return cb()
		}
		this._onRelease = cb
	}

	setValueNext(mouseY: number) {
		const tt = this.yy + this.width / 2
		const hh = this.height - this.width - this.strokeWeight / 2
		const vv = 1 - (mouseY - tt) / hh
		if (this.pitchbend) {
			this.valueNext = Math.max(-1, Math.min(1, vv * 2 - 1))
		} else {
			this.valueNext = Math.max(0, Math.min(1, vv))
		}
		this.sendValue()
	}

	valueLastSent = 0
	sendValue() {
		if (this.valueNext === this.valueLastSent) {
			return
		}
		this.valueLastSent = this.valueNext
		// Send update
		const midiEvt = {
			kind: this.pitchbend ? 'pitchbend' : 'controlchange',
			controller: this.pitchbend ? undefined : { number: this.ctrl, name: this.label },
			value: this.valueNext,
		} as MidiEvent
		sketch.sendUserEvent('keyboard', midiEvt.kind, midiEvt)
	}

	valueY(val: number) {
		const tt = this.yy + this.width / 2
		const hh = this.height - this.width
		const vv = this.pitchbend ? val / 2 + 0.5 : val
		return (1 - vv) * hh + tt - this.width / 2 + this.strokeWeight / 2
	}

	set(val: number) {
		this.value.value = val
		if (!this.pressed) {
			this.valueNext = val
		}
	}
}
