import * as p5 from 'p5'
import * as Tone from 'tone'
import AudioKeys from 'audiokeys'
import WSClient, { DONT_REOPEN } from './serverApi/WSClient'
import { userEventReq, userUpdateReq, User, UserEvent } from './serverApi/serverApi'
import { clockUpdateReq, ClockOpts } from './serverApi/serverClock'
import MIDI, { MidiEvent, MidiEventCC, MidiEventNote, MidiEventPitchbend } from './MIDI'
import { piano, eightOhEight } from './instruments'
import VisualNotes from './VisualNotes'
import { EasyCam } from 'vendor/p5.easycam.js'

type Instruments = {
	piano: ReturnType<typeof piano>
	piano2: ReturnType<typeof piano>
	eightOhEight: ReturnType<typeof eightOhEight>
}

type AudioKeysEvent = {
	// the midi number of the note
	note: number
	// the keyCode of the key being pressed down
	keyCode: number
	// the frequency of the note
	frequency: number
	// on note down: the current velocity (this can only be set when rows = 1)
	// on note up: 0
	velocity: number
}

const userInputsY = 40

export default class Sketch {
	width: number = 0
	height: number = 0
	visualNotes: VisualNotes = new VisualNotes()
	started: boolean = false
	syncing: boolean = true
	instruments: Instruments = {
		piano: piano(),
		piano2: piano(),
		eightOhEight: eightOhEight(),
	}
	ws: WSClient
	midi: MIDI
	audioKeys: AudioKeys
	pp?: p5
	pg?: p5.Graphics
	cam?: EasyCam
	user: User = {
		clientId: 0,
		name: '',
		instrument: '',
		inputDevice: '',
		offset: 2,
		posX: Math.random() * 0.8 + 0.1,
		posY: Math.random() * 0.6 + 0.2,
	}
	clockOpts: ClockOpts = {
		bpm: 95,
	}
	inputs: {
		name?: any
		instrument?: any
		inputDevice?: any
		offset?: any
		bpm?: any
	} = {}
	nameCustomized: boolean = false

	constructor() {
		console.log('[Sketch #ctor]')
		this.ws = new WSClient(window, {
			clock: {
				onSynced: () => {
					this.syncing = false
					this.setupInputsBPM()
				},
			},
			onClientId: this.setupInputsUser,
			onClockUpdate: this.onClockUpdate,
			onUserEvent: this.onUserEvent,
		})
		this.audioKeys = new AudioKeys({ polyphony: Infinity })
		this.audioKeys.down(this.keyPressed)
		this.audioKeys.up(this.keyReleased)
		this.midi = new MIDI({
			onMessage: this.onMIDI,
			onEnabled: this.setupInputsMidi,
		})
		window.Tone = Tone
		window.me = this
	}

	destroy = () => {
		this.ws.conn.close(DONT_REOPEN, 'sketch destroyed')
	}

	timeGlobalToTone = (globalTime: number) => {
		const rawCtx = Tone.context.rawContext as any
		const { contextTime, performanceTime } = rawCtx._nativeAudioContext.getOutputTimestamp()
		const lt = this.ws.clock.toLocal(globalTime)
		const delta = lt - performanceTime
		const toneTime = contextTime + delta / 1000
		return toneTime
	}

	timeToneToGlobal = (toneTime: number) => {
		const rawCtx = Tone.context.rawContext as any
		const { contextTime, performanceTime } = rawCtx._nativeAudioContext.getOutputTimestamp()
		const delta = toneTime - contextTime
		const pt = performanceTime + delta * 1000
		const globalTime = this.ws.clock.toGlobal(pt)
		// console.log('[Sketch #timeToneToGlobal]', toneTime * 1000, '>', globalTime)
		return globalTime
	}

	setSize = (width: number, height: number) => {
		this.width = width
		this.height = height
	}

	sketch = (pp: p5) => {
		this.pp = pp
		pp.setup = () => this.setup(pp)
		pp.draw = () => this.draw(pp)
		pp.mousePressed = () => this.mousePressed(pp)
		// pp.keyPressed = () => this.keyPressed(pp)
		// pp.keyReleased = () => this.keyReleased(pp)
	}

	setup = (pp: p5) => {
		console.log(`[Sketch #setup] ${this.width} x ${this.height}`)
		pp.createCanvas(this.width, this.height)
		this.pg = pp.createGraphics(this.width, this.height, 'webgl')
		this.cam = new EasyCam((this.pg as any)._renderer, { distance: 600 })
		this.cam.setDistanceMin(1)
		this.cam.setDistanceMax(1000)
		this.cam.attachMouseListeners((pp as any)._renderer)
		this.cam.setViewport([0, 0, this.width, this.height])
		this.setupInputs(pp)
		this.user.posX = Math.random() * 0.8 + 0.1
		this.user.posY = Math.random() * 0.6 + 0.2
	}

	setupInputs = (pp: p5) => {
		const inUser = this.setupInputsUser(this.ws.clientId)

		const inInst = pp.createSelect() as any
		inInst.position(inUser.x + inUser.width + 10, userInputsY)
		for (const instName in this.instruments) {
			inInst.option(instName)
		}
		inInst.size(100)
		inInst.changed(() => {
			console.log('[Sketch #inputs.instrument] Changed:', inInst.value())
			this.user.instrument = inInst.value()
			this.sendUserUpdate()
		})
		this.inputs.instrument = inInst
		this.user.instrument = inInst.value()

		if (this.midi.enabled && !this.inputs.inputDevice) {
			this.setupInputsMidi(this.midi.webMidi)
		}
	}

	setupInputsUser = (clientId: number): any => {
		this.user.clientId = clientId
		if (!this.pp) {
			console.warn(
				'[Sketch #setupInputsUser] Attempted to setup user input before sketch was initialized',
			)
			return
		}
		if (this.inputs.name && this.nameCustomized) {
			// Don't re-create the input if the user has already customized their name
			return
		}
		const inUser = this.pp.createInput(`User ${this.ws.clientId}`) as any
		inUser.size(80)
		inUser.position(20, userInputsY)
		inUser.input(() => {
			console.log('[Sketch #inputs.name] Changed:', inUser.value())
			this.nameCustomized = true
			this.user.name = inUser.value()
			this.sendUserUpdate()
		})
		inUser.elt.onfocus = () => (inUser.focused = true)
		inUser.elt.onblur = () => (inUser.focused = false)
		inUser.elt.focus()
		inUser.elt.select()
		this.inputs.name = inUser
		this.user.name = inUser.value()

		const inOffset = this.pp.createInput(`${this.user.offset}`) as any
		inOffset.size(50)
		inOffset.position(inUser.x + inUser.width + 10, userInputsY)
		const setOffset = () => {
			const off = parseFloat(inOffset.value())
			if (!Number.isNaN(off)) {
				this.user.offset = off
				this.sendUserUpdate()
			}
		}
		inOffset.input(() => {
			console.log('[Sketch #inputs.offset] Changed:', inOffset.value())
			setOffset()
		})
		inOffset.elt.onfocus = () => (inOffset.focused = true)
		inOffset.elt.onblur = () => (inOffset.focused = false)
		inOffset.elt.focus()
		inOffset.elt.select()
		this.inputs.offset = inOffset
		setOffset()
		return inOffset
	}

	setupInputsMidi = (webMidi: any) => {
		if (!this.pp || !this.inputs.instrument) {
			return
		}
		const { inputs } = webMidi
		const inMidi = this.pp.createSelect() as any
		const inInst = this.inputs.instrument
		inMidi.position(inInst.x + inInst.width + 10, userInputsY)
		for (const input of inputs) {
			const { _midiInput } = input
			if (!_midiInput) {
				console.error('[Sketch #setupInputsMidi] Received a midi input with missing data')
				continue
			}
			inMidi.option(_midiInput.name)
		}
		inMidi.option('keyboard')
		inMidi.changed(() => {
			console.log('[Sketch #setupInputsMidi] Changed:', inMidi.value())
			this.user.inputDevice = inMidi.value()
			this.sendUserUpdate()
		})
		this.inputs.inputDevice = inMidi
		this.user.inputDevice = inMidi.value()
	}

	setupInputsBPM = () => {
		if (!this.pp) {
			return
		}
		const inBPM = this.pp.createSlider(30, 200, this.clockOpts.bpm) as any
		inBPM.position(20, this.pp.height - 40)
		inBPM.size(this.pp.width / 2)
		inBPM.input(() => {
			// console.log('[Sketch #setupInputsBPM] Changed:', inBPM.value())
			this.clockOpts.bpm = inBPM.value()
			this.sendClockUpdate(this.clockOpts)
		})
		this.inputs.bpm = inBPM
	}

	draw = (pp: p5) => {
		let loading = false
		for (const instName in this.instruments) {
			const inst = (this.instruments as any)[instName]
			loading = loading || !inst.loaded
		}
		pp.background(0x33)
		this.drawLabels(pp)
		this.drawUsers(pp)
		if (loading) {
			this.drawMessage(pp, 'Loading instruments...')
		} else if (this.syncing) {
			this.drawMessage(pp, 'Syncing clock with server...')
		} else if (!this.started) {
			this.drawMessage(pp, 'Click to enable audio')
		}
		// Draw notes to separate graphics canvas
		if (this.pg) {
			this.visualNotes.draw(pp, this.pg)
			pp.image(this.pg, 0, 0)
		}
	}

	drawUsers = (pp: p5) => {
		pp.strokeWeight(0)
		pp.textAlign(pp.CENTER, pp.CENTER)
		for (const user of this.ws.users) {
			const xx = user.posX * pp.width
			const yy = user.posY * pp.height
			pp.fill(255)
			pp.textSize(14)
			pp.textStyle(pp.BOLD)
			pp.text(user.name, xx, yy)
			pp.fill(200)
			pp.textSize(11)
			pp.textStyle(pp.ITALIC)
			pp.text(`${user.instrument} (@${user.offset})`, xx, yy + 18)
		}
	}

	drawLabels = (pp: p5) => {
		pp.textSize(12)
		pp.fill(255)
		pp.strokeWeight(1)
		pp.stroke(0)
		pp.textAlign(pp.LEFT, pp.BOTTOM)
		pp.textStyle(pp.BOLD)
		for (const key in this.inputs) {
			const input = (this.inputs as any)[key]
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
				case key in this.user:
					pp.text(key.toUpperCase(), xx, yy)
					break
				default:
					pp.text(`${key.toUpperCase()}: ${input.value()}`, xx, yy)
					break
			}
		}
	}

	drawMessage = (pp: p5, msg: string) => {
		pp.fill(200)
		pp.strokeWeight(0)
		pp.textSize(20)
		pp.textAlign(pp.CENTER, pp.CENTER)
		pp.textStyle(pp.BOLDITALIC)
		pp.text(msg, pp.width / 2, pp.height / 2)
	}

	mousePressed = (pp: p5) => {
		if (!this.started) {
			Tone.start()
			console.log('[Sketch #mousePressed] Started Tone')
			this.started = true
			return
		}
		// Update user position if click is in the center area
		if (pp.mouseX < pp.width * 0.1 || pp.mouseX > pp.width * 0.9) {
			return
		}
		if (pp.mouseY < pp.height * 0.2 || pp.mouseY > pp.height * 0.8) {
			return
		}
		this.user.posX = pp.mouseX / pp.width
		this.user.posY = pp.mouseY / pp.height
		this.sendUserUpdate()
	}

	keyboardInputDisabled = () => {
		if (this.user.inputDevice !== 'keyboard') {
			return true
		}
		// Ignore keyboard if inputs are focused
		const { name, offset } = this.inputs
		return (name && name.focused) || (offset && offset.focused)
	}
	keyPressed = (evt: AudioKeysEvent) => {
		const { note, velocity } = evt
		if (this.keyboardInputDisabled()) {
			console.log('Ignoring keyPressed', note, velocity)
			return
		}
		console.log('Handling keyPressed', note, velocity)
		const midiEvt = { kind: 'noteon', note: note, attack: velocity / 128.0 } as MidiEvent
		this.onMIDI('keyboard', 'noteon', midiEvt)
	}
	keyReleased = (evt: AudioKeysEvent) => {
		const { note, velocity } = evt
		if (this.keyboardInputDisabled()) {
			console.log('Ignoring keyReleased', note, velocity)
			return
		}
		console.log('Handling keyReleased', note, velocity)
		const midiEvt = { kind: 'noteoff', note: note } as MidiEvent
		this.onMIDI('keyboard', 'noteoff', midiEvt)
	}

	sendUserUpdate = () => {
		const { conn } = this.ws
		if (!conn || conn.readyState !== WebSocket.OPEN) {
			console.warn("[Sketch #sendUserUpdate] Can't send user update, websocket connection is not open")
			return
		}
		conn.send(userUpdateReq(this.user))
	}

	sendClockUpdate = (clk: ClockOpts) => {
		const { conn } = this.ws
		if (!conn || conn.readyState !== WebSocket.OPEN) {
			console.warn("[Sketch #sendUserUpdate] Can't send bpm update, websocket connection is not open")
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

	onMIDI = (inputName: string, eventName: string, evt: MidiEvent) => {
		if (inputName !== this.user.inputDevice) {
			return
		}
		const uevt = {
			clientId: this.user.clientId,
			instrument: this.user.instrument,
			midiEvent: evt,
			timestamp: this.ws.now() + this.offsetMs(),
		}
		const { conn } = this.ws
		if (!conn || conn.readyState !== WebSocket.OPEN) {
			this.onUserEvent(uevt)
			return
		}
		conn.send(userEventReq(uevt))
	}

	offsetMs = () => {
		if (!this.inputs.bpm) {
			return 0
		}
		const bps = this.inputs.bpm.value() / 60
		const beatMs = 1000.0 / bps
		return beatMs * this.user.offset
	}

	onUserEvent = (evt: UserEvent) => {
		const { clientId, instrument, midiEvent, timestamp } = evt
		const { data, channel, kind } = midiEvent
		const inst = (this.instruments as any)[instrument]
		if (!inst) {
			console.error('[Sketch #onUserEvent] Unable to find instrument', instrument)
			return
		}
		if (inst.loaded === false) {
			return // don't send events if instrument hasn't finished loading
		}
		const tt = this.timeGlobalToTone(timestamp)
		if (tt - Tone.immediate() < -1) {
			console.warn(`[Sketch #onUserEvent] Received event ${tt - Tone.immediate()} seconds late`)
			return
		}
		switch (kind) {
			case 'noteon': {
				const nn = midiEvent as MidiEventNote
				inst.triggerAttack(Tone.Frequency(nn.note, 'midi').toFrequency(), tt, nn.attack)
				let user = this.user
				if (clientId !== user.clientId) {
					const uu = this.ws.getUser(clientId)
					user = uu || user
				}
				Tone.Draw.schedule(() => this.visualNotes.noteon(evt, user), tt)
				break
			}
			case 'noteoff': {
				const nn = midiEvent as MidiEventNote
				inst.triggerRelease(Tone.Frequency(nn.note, 'midi').toFrequency(), tt)
				Tone.Draw.schedule(() => this.visualNotes.noteoff(evt), tt)
				break
			}
			case 'controlchange': {
				const cc = midiEvent as MidiEventCC
				console.log(
					`[Sketch #onMIDI] CC event on channel ${channel}:`,
					cc.controller.number,
					cc.controller.name,
					cc.value,
				)
				break
			}
			case 'pitchbend': {
				const pb = midiEvent as MidiEventPitchbend
				console.log(`[Sketch #onMIDI] Pitchbend event on channel ${channel}:`, pb.value)
				break
			}
			default:
				console.warn(`[Sketch #onMIDI] Unhandled MIDI event on channel ${channel}:`, kind, data, evt)
				break
		}
	}
}
