import * as p5 from 'p5'
import Sketch from './Sketch'
import { clockUpdateReq, ClockOpts } from './serverApi/serverClock'

const userInputsY = 40

export class SketchInputs {
	parent: Sketch
	pp?: p5
	nameCustomized = false
	inputs: {
		// DOM input elements
		name?: any
		instrument?: any
		inputDevice?: any
		offset?: any
		bpm?: any
		hide?: any
	} = {}
	hidden = false
	clockOpts: ClockOpts = {
		bpm: 95,
	}

	constructor(parent: Sketch) {
		this.parent = parent
	}

	bpm = () => (this.inputs.bpm ? this.inputs.bpm.value() : this.clockOpts.bpm)

	isFocused = () => {
		for (const key in this.inputs) {
			const input = (this.inputs as any)[key]
			if (input && input.focused) {
				return true
			}
		}
		return false
	}

	toggleHide = () => {
		if (!this.pp) {
			return
		}
		this.hidden = !this.hidden
		this.setup(this.pp)
		if (!this.hidden) {
			this.setupInputsBPM()
		}
	}

	setup = (pp: p5) => {
		this.pp = pp
		if (this.hidden) {
			for (const key in this.inputs) {
				const input = (this.inputs as any)[key]
				if (!input) {
					continue
				}
				input.remove()
				delete (this.inputs as any)[key]
			}
			this.setupInputsHide(this.pp)
			return
		}
		this.setupInputsUser(this.parent.ws.clientId)
		this.setupInputsInstrument()
		if (!this.inputs.inputDevice) {
			this.setupInputsMidi(this.parent.midi.webMidi)
		}
		this.setupInputsHide(pp)
	}

	setupInputsHide = (pp: p5) => {
		if (this.inputs.hide) {
			this.inputs.hide.remove()
		}
		const inHide = pp.createButton(this.hidden ? 'Show Settings' : 'Hide Settings') as any
		inHide.position(pp.width - inHide.width - 50, pp.height - inHide.height - 10)
		inHide.mousePressed(this.toggleHide)
		this.inputs.hide = inHide
	}

	setupInputsUser = (clientId: number): any => {
		console.log('[SketchInputs #setupInputsUser] clientId', clientId)
		const uu = this.parent.user
		const defaultName = this.nameCustomized ? uu.name : `User ${this.parent.ws.clientId}`
		if (this.hidden) {
			if (uu.name === '') {
				this.parent.updateUser({ name: defaultName })
			}
			return
		}
		if (!this.pp) {
			console.warn(
				'[SketchInputs #setupInputsUser] Attempted to setup user input before sketch was initialized',
			)
			return
		}
		if (this.inputs.name && this.nameCustomized) {
			// Don't re-create the input if the user has already customized their name
			return
		}
		if (this.inputs.name) {
			this.inputs.name.remove()
		}
		if (this.inputs.offset) {
			this.inputs.offset.remove()
		}
		const inName = this.pp.createInput(defaultName) as any
		inName.size(80)
		inName.position(20, userInputsY)
		inName.input(() => {
			console.log('[SketchInputs #inputs.name] Changed:', inName.value())
			this.nameCustomized = true
			this.parent.updateUser({ name: inName.value() })
		})
		inName.elt.onfocus = () => (inName.focused = true)
		inName.elt.onblur = () => (inName.focused = false)
		inName.elt.focus()
		inName.elt.select()
		this.inputs.name = inName
		this.parent.updateUser({ name: inName.value() }, false)

		const inOffset = this.pp.createInput(`${this.parent.user.offset}`) as any
		inOffset.size(50)
		inOffset.position(inName.x + inName.width + 10, userInputsY)
		const setOffset = () => {
			const off = parseFloat(inOffset.value())
			if (!Number.isNaN(off)) {
				this.parent.updateUser({ offset: off })
				this.parent.loops.updateRecOffset(off)
			}
		}
		inOffset.input(() => {
			console.log('[SketchInputs #inputs.offset] Changed:', inOffset.value())
			setOffset()
		})
		inOffset.elt.onfocus = () => (inOffset.focused = true)
		inOffset.elt.onblur = () => (inOffset.focused = false)
		this.inputs.offset = inOffset
		setOffset()
	}

	setupInputsInstrument = () => {
		if (!this.pp || !this.inputs.offset || this.hidden) {
			return
		}
		if (this.inputs.instrument) {
			this.inputs.instrument.remove()
		}
		const inInst = this.pp.createSelect() as any
		inInst.position(this.inputs.offset.x + this.inputs.offset.width + 10, userInputsY)
		const uinst = this.parent.user.instrument
		inInst.size(130)
		for (const instName in this.parent.instruments) {
			inInst.option(instName)
			if (instName === uinst) {
				inInst.selected(instName)
			}
		}
		inInst.changed(() => {
			console.log('[SketchInputs #inputs.instrument] Changed:', inInst.value())
			this.parent.updateUser({ instrument: inInst.value() })
		})
		inInst.elt.onfocus = () => (inInst.focused = true)
		inInst.elt.onblur = () => (inInst.focused = false)
		this.inputs.instrument = inInst
		this.parent.updateUser({ instrument: inInst.value() }, false)
	}

	setupInputsMidi = (webMidi: any) => {
		if (!this.pp || !this.inputs.instrument || this.hidden) {
			return
		}
		if (this.inputs.inputDevice) {
			this.inputs.inputDevice.remove()
		}
		const { inputs } = webMidi || { inputs: [] }
		const inMidi = this.pp.createSelect() as any
		const inInst = this.inputs.instrument
		inMidi.position(inInst.x + inInst.width + 10, userInputsY)
		inMidi.option('keyboard')
		for (const input of inputs) {
			const { _midiInput } = input
			if (!_midiInput) {
				console.error('[SketchInputs #setupInputsMidi] Received a midi input with missing data')
				continue
			}
			inMidi.option(_midiInput.name)
		}
		inMidi.selected(this.parent.user.inputDevice)
		inMidi.changed(() => {
			console.log('[SketchInputs #setupInputsMidi] Changed:', inMidi.value())
			this.parent.updateUser({ inputDevice: inMidi.value() })
		})
		inMidi.elt.onfocus = () => (inMidi.focused = true)
		inMidi.elt.onblur = () => (inMidi.focused = false)
		this.inputs.inputDevice = inMidi
		this.parent.updateUser({ inputDevice: inMidi.value() }, false)
	}

	setupInputsBPM = () => {
		if (!this.pp || this.hidden) {
			return
		}
		if (this.inputs.bpm) {
			this.inputs.bpm.remove()
		}
		const inBPM = this.pp.createSlider(30, 200, this.clockOpts.bpm) as any
		inBPM.position(20, this.pp.height - 40)
		inBPM.size(this.pp.width / 2)
		inBPM.input(() => {
			// console.log('[SketchInputs #setupInputsBPM] Changed:', inBPM.value())
			this.clockOpts.bpm = inBPM.value()
			this.clockOpts.clientId = this.parent.user.clientId
			this.sendClockUpdate(this.clockOpts)
		})
		inBPM.elt.onfocus = () => (inBPM.focused = true)
		inBPM.elt.onblur = () => (inBPM.focused = false)
		this.inputs.bpm = inBPM
	}

	draw = (pp: p5) => {
		pp.textSize(12)
		pp.fill(255)
		pp.strokeWeight(1)
		pp.stroke(0)
		pp.textAlign(pp.LEFT, pp.BOTTOM)
		pp.textStyle(pp.BOLD)
		for (const key in this.inputs) {
			if (key === 'hide') {
				continue
			}
			const input = (this.inputs as any)[key]
			if (!input) {
				continue
			}
			const xx = input.x + 3
			const yy = input.y - 5
			switch (true) {
				case key === 'offset':
					const off = parseFloat(input.value())
					let msg = ``
					if (Number.isNaN(off)) {
						// Show the user that they have an invalid value
						pp.fill(255, 0, 0)
						msg = ` (NaN!)`
					}
					pp.text(`${key.toUpperCase()}${msg}${'\n'}(in beats)`, xx, yy)
					if (Number.isNaN(off)) {
						// put fill color back
						pp.fill(255)
					}
					break
				case key in this.parent.user:
					pp.text(key.toUpperCase(), xx, yy)
					break
				case key === 'bpm':
					const prec = Math.abs(this.parent.ws.clock.precisionNow)
					const xp = input.x + input.width
					pp.textAlign(pp.RIGHT, pp.BOTTOM)
					if (!this.parent.ws.ready()) {
						pp.fill(255, 0, 0)
						pp.text(`NO CONNECTION TO SERVER`, xp, yy)
						pp.fill(255)
					} else if (prec < 1) {
						pp.text(`Clock precision: ${(prec * 1000).toFixed(0)}µs`, xp, yy)
					} else if (prec < 10) {
						pp.text(`Clock precision: ${prec.toFixed(1)}ms`, xp, yy)
					} else {
						pp.fill(255, 0, 0)
						pp.text(`Clock precision: ${prec.toFixed(0)}ms`, xp, yy)
						pp.fill(255)
					}
					pp.textAlign(pp.LEFT, pp.BOTTOM)
				// fallthrough
				default:
					pp.text(`${key.toUpperCase()}: ${input.value()}`, xx, yy)
					break
			}
		}
	}

	sendClockUpdate = (clk: ClockOpts) => {
		const { conn, ready } = this.parent.ws
		if (!ready()) {
			console.warn(
				"[SketchInputs #sendClockUpdate] Can't send bpm update, websocket connection is not open",
			)
			return
		}
		conn.send(clockUpdateReq(clk))
	}

	onClockUpdate = (clk: ClockOpts) => {
		this.clockOpts = clk
		if (!this.inputs.bpm) {
			return
		}
		this.inputs.bpm.value(clk.bpm)
	}
}
