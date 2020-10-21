import * as p5 from 'p5'
import { KEYCODE_CONTROL } from './constants'
import { sketch } from './Sketch'
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
	pp?: p5
	nameCustomized = false
	inputs: {
		// DOM input elements
		name?: any
		instrument?: any
		inputDevice?: any
		latency?: any
		bpm?: any
		hide?: any
		hideLoops?: any
		// hideDial?: any
		hideLabels?: any
		showHelp?: any
	} = {}
	hidden = false
	hiddenLabels = false
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

	constructor(loadedFromStorage = false) {
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

	toggleHelp = () => {
		if (!this.pp) {
			return
		}
		const { loops } = sketch
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
		this.setup(this.pp)
		if (!this.help && !this.hidden) {
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
		this.setupInputsUser(sketch.ws.clientId)
		this.setupInputsInstrument()
		// // setupInputsMidi is commented out because the inputDevice does nothing right now
		// // (it's disabled in Sketch.sendUserEvent because it's easier to dev if all inputs are handled)
		// if (!this.inputs.inputDevice) {
		// 	this.setupInputsMidi(sketch.midi.webMidi)
		// }
		this.setupInputsHide(pp)
	}

	setupInputsHide = (pp: p5) => {
		if (this.inputs.hide) {
			this.inputs.hide.remove()
		}
		if (this.inputs.hideLoops) {
			this.inputs.hideLoops.remove()
		}
		// if (this.inputs.hideDial) {
		// 	this.inputs.hideDial.remove()
		// }
		if (this.inputs.hideLabels) {
			this.inputs.hideLabels.remove()
		}
		if (this.inputs.showHelp) {
			this.inputs.showHelp.remove()
		}
		const { loops } = sketch
		this.inputs.showHelp = pp.createButton(this.help ? 'Hide Help' : 'Show Help') as any
		const { showHelp } = this.inputs
		let xx = pp.width - showHelp.width - 50
		const yy = pp.height - showHelp.height - 10
		showHelp.position(xx, yy)
		showHelp.mousePressed(this.toggleHelp)
		if (this.help) {
			return
		}
		xx -= 100
		this.inputs.hide = pp.createButton(this.hidden ? 'Show Settings' : 'Hide Settings') as any
		this.inputs.hideLoops = pp.createButton(loops.toggleHideText()) as any
		// this.inputs.hideDial = pp.createButton(loops.toggleHideDialText()) as any
		this.inputs.hideLabels = pp.createButton(this.hiddenLabels ? 'Show Names' : 'Hide Names') as any
		const { hide, hideLoops, /* hideDial, */ hideLabels } = this.inputs
		hideLoops.position(xx, yy)
		hideLoops.mousePressed(() => {
			loops.toggleHideDial()
			loops.toggleHide()
			hideLoops.elt.innerHTML = loops.toggleHideText()
		})
		xx -= 105
		// hideDial.position(xx, yy)
		// hideDial.mousePressed(() => {
		// 	loops.toggleHideDial()
		// 	hideDial.elt.innerHTML = loops.toggleHideDialText()
		// })
		hideLabels.position(xx, yy)
		hideLabels.mousePressed(() => {
			this.hiddenLabels = !this.hiddenLabels
			hideLabels.elt.innerHTML = this.hiddenLabels ? 'Show Names' : 'Hide Names'
		})
		xx -= 110
		hide.position(xx, yy)
		hide.mousePressed(this.toggleHide)
	}

	setupInputsUser = (clientId: number): any => {
		const uu = sketch.user
		const defaultName = this.nameCustomized ? uu.name : `User ${sketch.ws.clientId}`
		if (this.hidden) {
			if (uu.name === '') {
				sketch.updateUser({ name: defaultName })
			}
			return
		}
		if (!this.pp) {
			console.log(
				'[SketchInputs #setupInputsUser] Attempted to setup user input before sketch was initialized',
			)
			return
		}
		if (this.inputs.name) {
			this.inputs.name.remove()
		}
		if (this.inputs.latency) {
			this.inputs.latency.remove()
		}
		this.inputs.name = this.pp.createInput(defaultName) as any
		this.inputs.latency = this.pp.createInput(`${sketch.user.offset}`) as any
		const { name: inName, latency: inLatency } = this.inputs
		inName.size(80)
		inName.position(20, userInputsY)
		inName.input(() => {
			// console.log('[SketchInputs #inputs.name] Changed:', inName.value())
			this.nameCustomized = true
			sketch.updateUser({ name: inName.value() })
		})
		inName.elt.onfocus = () => (inName.focused = true)
		inName.elt.onblur = () => (inName.focused = false)
		// // Uncomment to select name field on load:
		// inName.elt.focus()
		// inName.elt.select()
		sketch.updateUser({ name: inName.value() }, false)

		inLatency.size(50)
		inLatency.position(inName.x + inName.width + 10, userInputsY)
		const setLatency = () => {
			const lat = parseFloat(inLatency.value())
			if (!Number.isNaN(lat)) {
				sketch.updateUser({ offset: lat })
				sketch.loops.updateRecOffset(lat)
			}
		}
		inLatency.input(() => {
			console.log('[SketchInputs #inputs.latency] Changed:', inLatency.value())
			setLatency()
		})
		inLatency.elt.onfocus = () => (inLatency.focused = true)
		inLatency.elt.onblur = () => (inLatency.focused = false)
		setLatency()
	}

	setupInputsInstrument = () => {
		if (!this.pp || !this.inputs.latency || this.hidden) {
			return
		}
		if (this.inputs.instrument) {
			this.inputs.instrument.remove()
		}
		const inInst = this.pp.createSelect() as any
		inInst.position(this.inputs.latency.x + this.inputs.latency.width + 10, userInputsY)
		const uinst = sketch.user.instrument
		inInst.size(130)
		for (const instName in sketch.instruments) {
			inInst.option(instName)
			if (instName === uinst) {
				inInst.selected(instName)
			}
		}
		inInst.changed(() => {
			sketch.updateUser({ instrument: inInst.value() })
		})
		inInst.elt.onfocus = () => (inInst.focused = true)
		inInst.elt.onblur = () => (inInst.focused = false)
		this.inputs.instrument = inInst
		sketch.updateUser({ instrument: inInst.value() }, false)
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
		inMidi.selected(sketch.user.inputDevice)
		inMidi.changed(() => {
			sketch.updateUser({ inputDevice: inMidi.value() })
		})
		inMidi.elt.onfocus = () => (inMidi.focused = true)
		inMidi.elt.onblur = () => (inMidi.focused = false)
		this.inputs.inputDevice = inMidi
		sketch.updateUser({ inputDevice: inMidi.value() }, false)
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
			this.clockOpts.clientId = sketch.user.clientId
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
				case key === 'hideLabels':
				case key === 'showHelp':
					continue
				case key === 'latency':
					pp.push()
					const lat = parseFloat(input.value())
					let msg = ``
					if (Number.isNaN(lat)) {
						// Show the user that they have an invalid value
						pp.fill(255, 40, 40)
						msg = ` (NaN!)`
					} else if (this.pingBeats > lat / 2) {
						// Warn user that latency is less than half of ping
						pp.fill(255, 128, 0)
						msg = ` (check ping)`
					}
					pp.text(`${key.toUpperCase()}${msg}${'\n'}in beats`, xx, yy)
					pp.pop()
					break
				case key in sketch.user:
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
		const beatMs = sketch.beatMs()
		const xx = 20,
			xc = xx + 60 // x pos for colon in aligned '<label>: <value>' rows
		let yy = pp.height - 140
		// draw heading
		pp.fill(0.58, 0.8, 0.65).strokeWeight(1).stroke(0)
		pp.textAlign(pp.LEFT, pp.BOTTOM).textSize(13).textStyle(pp.BOLD)
		pp.text(`Clock stats (B = beat = ${prettyUnit('s', beatMs / 1000)})`, xx, yy)
		pp.textSize(12).strokeWeight(1)
		yy += 20
		if (!sketch.ws.ready()) {
			ppValue(true).text(`NO CONNECTION TO SERVER`, xx, yy)
			pp.pop()
			return
		}
		// draw precision and ping stats
		const { offset: latency } = sketch.user
		const { precisionNow, pingMs } = sketch.ws.clock
		this.pingBeats = pingMs / beatMs
		const prec = Math.abs(precisionNow)
		const precStr = `${prettyUnit('s', prec / 1000)} (${prettyUnit('B', prec / beatMs, true)})`
		const pingStr = `${prettyUnit('s', pingMs / 1000)} (${prettyUnit('B', this.pingBeats, true)})`
		ppLabel().text(`precision:`, xc, yy)
		ppValue(prec / beatMs >= 1.0 / 32) // warn if clock precision is worse than 128th note
			.text(precStr, xc + 5, yy)
		yy += 20
		ppLabel().text(`ping:`, xc, yy)
		ppValue(this.pingBeats > latency / 2) // warn if ping is close to latency value
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
		const { conn, ready } = sketch.ws
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

	keyPressed = (evt: p5) => {
		if (evt.keyIsDown(KEYCODE_CONTROL)) {
			return
		}
		let prev: boolean
		switch (evt.key) {
			case 'c':
				prev = true
				break
			case 'v':
				prev = false
				break
			default:
				return
		}
		const uinst = sketch.user.instrument
		const keys = Object.keys(sketch.instruments)
		for (let ii = 0; ii < keys.length; ii++) {
			const iname = keys[ii]
			if (iname !== uinst) {
				continue
			}
			let switchTo: string
			if (prev) {
				if (ii === 0) {
					switchTo = keys[keys.length - 1]
				} else {
					switchTo = keys[ii - 1]
				}
			} else {
				if (ii === keys.length - 1) {
					switchTo = keys[0]
				} else {
					switchTo = keys[ii + 1]
				}
			}
			if (this.inputs.instrument) {
				this.inputs.instrument.selected(switchTo)
			}
			sketch.updateUser({ instrument: switchTo })
			return
		}
	}
}
