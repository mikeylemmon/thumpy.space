import * as p5 from 'p5'
import Sketch from './Sketch'
import { clockUpdateReq, ClockOpts } from './serverApi/serverClock'

const userInputsY = 40

function prettyUnit(unit: string, val: number, coarse = false) {
	let uu = unit
	let vv = val
	const thresh = coarse ? 0.1 : 1
	if (vv < thresh) {
		vv *= 1000
		uu = `m${unit}`
	}
	if (vv < thresh) {
		vv *= 1000
		uu = `µ${unit}`
	}
	const dec = vv >= 10 ? 0 : vv >= 1 ? 1 : 2
	return `${vv.toFixed(dec)}${uu}`
}

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
		hideLoops?: any
		hideDial?: any
		showHelp?: any
	} = {}
	hidden = false
	clockOpts: ClockOpts = {
		bpm: 95,
	}
	help = false
	helpRetoggle = {
		loops: true,
		dial: true,
	}
	helpImg?: p5.Image
	pingBeats = 0 // number of beats it takes for a round-trip message to/from the server

	constructor(parent: Sketch, loadedFromStorage = false) {
		this.parent = parent
		this.nameCustomized = loadedFromStorage
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
		if (!this.helpImg) {
			this.helpImg = pp.loadImage('/help-overlay.png')
		}
		if (this.hidden || this.help) {
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
		if (this.inputs.hideLoops) {
			this.inputs.hideLoops.remove()
		}
		if (this.inputs.hideDial) {
			this.inputs.hideDial.remove()
		}
		if (this.inputs.showHelp) {
			this.inputs.showHelp.remove()
		}
		const { loops } = this.parent
		this.inputs.showHelp = pp.createButton(this.help ? 'Hide Help' : 'Show Help') as any
		const { showHelp } = this.inputs
		let xx = pp.width - showHelp.width - 50
		const yy = pp.height - showHelp.height - 10
		showHelp.position(xx, yy)
		showHelp.mousePressed(() => {
			this.help = !this.help
			if (this.help) {
				this.helpRetoggle.loops = !loops.hidden
				this.helpRetoggle.dial = !loops.hiddenDial
			}
			if (this.helpRetoggle.loops) {
				loops.toggleHide()
			}
			if (this.helpRetoggle.dial) {
				loops.toggleHideDial()
			}
			this.setup(pp)
			if (!this.help && !this.hidden) {
				this.setupInputsBPM()
			}
		})
		if (this.help) {
			return
		}
		xx -= 100
		this.inputs.hide = pp.createButton(this.hidden ? 'Show Settings' : 'Hide Settings') as any
		this.inputs.hideLoops = pp.createButton(loops.toggleHideText()) as any
		this.inputs.hideDial = pp.createButton(loops.toggleHideDialText()) as any
		const { hide, hideLoops, hideDial } = this.inputs
		hideLoops.position(xx, yy)
		hideLoops.mousePressed(() => {
			loops.toggleHide()
			hideLoops.elt.innerHTML = loops.toggleHideText()
		})
		xx -= 130
		hideDial.position(xx, yy)
		hideDial.mousePressed(() => {
			loops.toggleHideDial()
			hideDial.elt.innerHTML = loops.toggleHideDialText()
		})
		xx -= 110
		hide.position(xx, yy)
		hide.mousePressed(this.toggleHide)
	}

	setupInputsUser = (clientId: number): any => {
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
			// console.log('[SketchInputs #inputs.name] Changed:', inName.value())
			this.nameCustomized = true
			this.parent.updateUser({ name: inName.value() })
		})
		inName.elt.onfocus = () => (inName.focused = true)
		inName.elt.onblur = () => (inName.focused = false)
		// // Uncomment to select name field on load:
		// inName.elt.focus()
		// inName.elt.select()
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
		inBPM.size(300)
		inBPM.input(() => {
			this.clockOpts.bpm = inBPM.value()
			this.clockOpts.clientId = this.parent.user.clientId
			this.sendClockUpdate(this.clockOpts)
		})
		inBPM.elt.onfocus = () => (inBPM.focused = true)
		inBPM.elt.onblur = () => (inBPM.focused = false)
		this.inputs.bpm = inBPM
	}

	draw = (pp: p5) => {
		if (this.help) {
			this.drawHelp(pp)
			return
		}
		if (this.hidden) {
			return
		}
		// Draw labels for inputs
		this.drawClockStats(pp)
		pp.textSize(12).textAlign(pp.LEFT, pp.BOTTOM).textStyle(pp.BOLD)
		pp.fill(255).strokeWeight(1).stroke(0)
		for (const key in this.inputs) {
			const input = (this.inputs as any)[key]
			if (!input) {
				continue
			}
			const xx = input.x + 3
			const yy = input.y - 5
			switch (true) {
				case key === 'hide':
				case key === 'hideLoops':
				case key === 'hideDial':
				case key === 'showHelp':
					continue
				case key === 'offset':
					pp.push()
					const off = parseFloat(input.value())
					let msg = ``
					if (Number.isNaN(off)) {
						// Show the user that they have an invalid value
						pp.fill(255, 40, 40)
						msg = ` (NaN!)`
					} else if (this.pingBeats > off / 2) {
						pp.fill(255, 128, 0)
						msg = ` (check ping)`
					}
					pp.text(`${key.toUpperCase()}${msg}${'\n'}in beats`, xx, yy)
					pp.pop()
					break
				case key in this.parent.user:
					pp.text(key.toUpperCase(), xx, yy)
					break
				default:
					pp.text(`${key.toUpperCase()}: ${input.value()}`, xx, yy)
					break
			}
		}
	}

	drawClockStats = (pp: p5) => {
		pp.push()
		pp.colorMode(pp.HSL, 1)
		const ppLabel = () => pp.fill(0, 0, 0.7).textAlign(pp.RIGHT, pp.BOTTOM)
		const ppValue = (warn: boolean) =>
			pp.textAlign(pp.LEFT, pp.BOTTOM).fill(0, warn ? 1 : 0, warn ? 0.65 : 0.85)
		const beatMs = this.parent.beatMs()
		const xx = 20,
			xc = xx + 60 // x pos for colon in aligned '<label>: <value>' rows
		let yy = pp.height - 140
		// draw heading
		pp.fill(0.58, 0.8, 0.65).strokeWeight(1).stroke(0)
		pp.textAlign(pp.LEFT, pp.BOTTOM).textSize(13).textStyle(pp.BOLD)
		pp.text(`Clock stats (B = beat = ${prettyUnit('s', beatMs / 1000)})`, xx, yy)
		pp.textSize(12).strokeWeight(1)
		yy += 20
		if (!this.parent.ws.ready()) {
			ppValue(true).text(`NO CONNECTION TO SERVER`, xx, yy)
			pp.pop()
			return
		}

		// draw precision and ping stats
		const { offset } = this.parent.user
		const { precisionNow, pingMs } = this.parent.ws.clock
		this.pingBeats = pingMs / beatMs
		const prec = Math.abs(precisionNow)
		const precStr = `${prettyUnit('s', prec / 1000)} (${prettyUnit('B', prec / beatMs, true)})`
		const pingStr = `${prettyUnit('s', pingMs / 1000)} (${prettyUnit('B', this.pingBeats, true)})`
		// pp.textAlign(pp.LEFT, pp.BOTTOM).textStyle(pp.BOLD).fill(200)
		ppLabel().text(`precision:`, xc, yy)
		ppValue(prec / beatMs >= 1.0 / 32) // warn if clock precision is worse than 128th note
			.text(precStr, xc + 5, yy)
		yy += 20
		ppLabel().text(`ping:`, xc, yy)
		ppValue(this.pingBeats > offset / 2) // warn if ping is close to offset value
			.text(pingStr, xc + 5, yy)
		pp.pop()
	}

	drawHelp = (pp: p5) => {
		if (!this.helpImg) {
			return
		}
		const haspect = this.helpImg.height / this.helpImg.width
		const hx = 40
		const ww = pp.width - hx * 2
		const hh = haspect * ww
		const hy = (pp.height - hh) / 2
		pp.background(60, 220)
		pp.image(this.helpImg, hx, hy, ww, hh)
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
