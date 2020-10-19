import * as Tone from 'tone'
import * as p5 from 'p5'
import { sketch } from './Sketch'
import { ctrlColor } from './util'
import { MidiEvent, MidiEventCC } from './MIDI'

type Sliders = { [key: string]: InstSlider }
type InstSlidersOpts = { sliders: Sliders }

export class InstSliders {
	sliders: Sliders

	constructor(opts: InstSlidersOpts = { sliders: {} }) {
		this.sliders = opts.sliders
	}

	update = (pp: p5) => {
		for (const ss of Object.values(this.sliders)) {
			ss.update(pp)
		}
	}

	draw = (pp: p5) => {
		pp.push()
		const { sliders } = this
		let xx = 30
		for (const kk in sliders) {
			const ss = sliders[kk]
			ss.xx = xx
			ss.draw(pp)
			xx += ss.width
			if (['mod', 'r'].includes(kk)) {
				xx += ss.width // extra space after modwheel
			}
		}
		pp.pop()
	}

	mousePressed = (evt: p5) => {
		const { mouse } = sketch.cam || {}
		for (const ss of Object.values(this.sliders)) {
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
		Object.values(this.sliders).forEach(ss => ss.mouseReleased())
	}

	controlchangeNext = (evt: MidiEventCC): InstSlider | undefined => {
		const ss = this.sliderForCtrl(evt.controller.number)
		if (ss && !ss.pressed) {
			ss.valueNext = evt.value
		}
		return ss
	}

	controlchange = (evt: MidiEventCC): InstSlider | undefined => {
		const ss = this.sliderForCtrl(evt.controller.number)
		if (ss) {
			ss.value.value = evt.value
		}
		return ss
	}

	sliderForCtrl = (ctrl: number): InstSlider | undefined => {
		const sliders = Object.values(this.sliders).filter(s => s.ctrl === ctrl)
		return sliders[0]
	}
}

export class InstSlider {
	height = 150
	width = 20
	value = new Tone.Signal(0.5)
	valueNext = 0.5
	strokeWeight = 4
	xx = 40
	yy = 100
	pressed = false
	label: string
	ctrl: number

	constructor(opts: { label: string; ctrl: number }) {
		this.label = opts.label
		this.ctrl = opts.ctrl
	}

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
		this.setValueNextMouse(mouseY)
		this.pressed = true
		return true
	}

	update(pp: p5) {
		if (!this.pressed) {
			return
		}
		this.setValueNextMouse(pp.mouseY)
	}

	setValueNextMouse(mouseY: number) {
		const tt = this.yy + this.width / 2
		const hh = this.height - this.width - this.strokeWeight / 2
		this.valueNext = 1 - Math.max(0, Math.min(1, (mouseY - tt) / hh))
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
			kind: 'controlchange',
			controller: { number: this.ctrl, name: this.label },
			value: this.valueNext,
		} as MidiEvent
		sketch.sendUserEvent('keyboard', midiEvt.kind, midiEvt)
	}

	valueY(val: number) {
		const tt = this.yy + this.width / 2
		const hh = this.height - this.width
		return (1 - val) * hh + tt - this.width / 2 + this.strokeWeight / 2
	}

	mouseReleased = () => (this.pressed = false)
}
