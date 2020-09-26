import * as p5 from 'p5'
import * as Tone from 'tone'
import WSClient, { DONT_REOPEN } from './serverApi/WSClient'
import { userEventReq, userUpdateReq, User, UserEvent } from './serverApi/serverApi'
import { clockUpdateReq, ClockOpts } from './serverApi/serverClock'
import MIDI, { MidiEvent, MidiEventCC, MidiEventNote, MidiEventPitchbend } from './MIDI'
import { piano, eightOhEight } from './instruments'

type Instruments = {
	eightOhEight: ReturnType<typeof eightOhEight>
	piano: ReturnType<typeof piano>
}

const userInputsY = 40

export default class Sketch {
	width: number = 0
	height: number = 0
	nn: number = 0
	started: boolean = false
	syncing: boolean = true
	instruments: Instruments = {
		eightOhEight: eightOhEight(),
		piano: piano(),
	}
	ws: WSClient
	midi: MIDI
	pp: p5 | null = null
	user: User = {
		clientId: 0,
		name: '',
		instrument: '',
		inputDevice: '',
		// offset: 3.9,
		offset: 0,
	}
	clockOpts: ClockOpts = {
		bpm: 95,
	}

	nameCustomized: boolean = false

	inputs: {
		name?: any
		instrument?: any
		inputDevice?: any
		offset?: any
		bpm?: any
	} = {}

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
		this.midi = new MIDI({
			onMessage: this.onMIDI,
			onEnabled: this.setupInputsMidi,
		})
		window.now = this.now
		window.Tone = Tone
		window.me = this
	}

	destroy = () => {
		this.ws.conn.close(DONT_REOPEN, 'sketch destroyed')
	}

	now = () => {
		this.nowTestGlobal(this.ws.now())
		this.nowTestTone(Tone.immediate())
		this.nowTestTone(Tone.now())
	}

	nowTestGlobal = (nn: number) => {
		const tt = this.timeToneToGlobal(this.timeGlobalToTone(nn))
		console.log('[Sketch #nowTestGlobal] diff:', nn - tt)
	}
	nowTestTone = (nn: number) => {
		const tt = this.timeGlobalToTone(this.timeToneToGlobal(nn))
		console.log('[Sketch #nowTestTone] diff:', nn - tt)
	}

	timeGlobalToTone = (globalTime: number) => {
		const rawCtx = Tone.context.rawContext as any
		const { contextTime, performanceTime } = rawCtx._nativeAudioContext.getOutputTimestamp()
		const lt = this.ws.clock.toLocal(globalTime)
		const delta = lt - performanceTime
		const toneTime = contextTime + delta / 1000
		// console.log(
		// 	'[Sketch #timeGlobalToTone]',
		// 	globalTime,
		// 	'>',
		// 	toneTime * 1000,
		// 	`(d:${(toneTime - contextTime) * 1000})`,
		// )
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
	}

	setup = (pp: p5) => {
		console.log(`[Sketch #setup] ${this.width} x ${this.height}`)
		pp.createCanvas(this.width, this.height)
		this.setupInputs(pp)
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
		const inUser = this.pp.createInput(`User ${this.ws.clientId + 1}`) as any
		inUser.size(80)
		inUser.position(20, userInputsY)
		inUser.input(() => {
			console.log('[Sketch #inputs.name] Changed:', inUser.value())
			this.nameCustomized = true
			this.user.name = inUser.value()
			this.sendUserUpdate()
		})
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
			console.log('[Sketch #setupInputsBPM] Changed:', inBPM.value())
			this.clockOpts.bpm = inBPM.value()
			this.sendClockUpdate(this.clockOpts)
		})
		this.inputs.bpm = inBPM
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

	draw = (pp: p5) => {
		const nn = this.nn++
		pp.background((nn / 3) % 255, (nn / 2) % 255, nn % 255)
		this.drawLabels(pp)
		if (this.syncing) {
			this.drawSyncing(pp)
			return
		}
		if (!this.started) {
			this.drawClickToStart(pp)
			return
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

	drawSyncing = (pp: p5) => {
		pp.fill(0)
		pp.stroke(120)
		pp.strokeWeight(2)
		pp.textSize(20)
		pp.textAlign(pp.CENTER, pp.CENTER)
		pp.textStyle(pp.BOLDITALIC)
		pp.text('Syncing clock with server...', pp.width / 2, pp.height / 2)
	}

	drawClickToStart = (pp: p5) => {
		pp.fill(0)
		pp.stroke(120)
		pp.strokeWeight(5)
		pp.textSize(32)
		pp.textAlign(pp.CENTER, pp.CENTER)
		pp.textStyle(pp.BOLD)
		pp.text('CLICK TO START', pp.width / 2, pp.height / 2)
	}

	mousePressed = (pp: p5) => {
		if (!this.started) {
			this.startTone()
			this.started = true
			return
		}
	}

	startTone = () => {
		Tone.start()
		console.log('[Sketch #mousePressed] Started Tone')
	}

	offsetMs = () => {
		if (!this.inputs.bpm) {
			return 0
		}
		const bps = this.inputs.bpm.value() / 60
		const beatMs = 1000.0 / bps
		return beatMs * this.user.offset
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
			// timestamp: this.timeToneToGlobal(Tone.immediate()) + this.offsetMs(),
		}
		const { conn } = this.ws
		if (!conn || conn.readyState !== WebSocket.OPEN) {
			this.onUserEvent(uevt)
			return
		}
		// this.onUserEvent({
		// 	clientId: this.user.clientId,
		// 	instrument: this.user.instrument,
		// 	midiEvent: evt,
		// 	timestamp: this.ws.now(),
		// 	// timestamp: this.ws.now() + this.offsetMs(),
		// 	// timestamp: this.timeToneToGlobal(Tone.immediate()),
		// })
		conn.send(userEventReq(uevt))
	}

	onUserEvent = (evt: UserEvent) => {
		const { clientId, instrument, midiEvent, timestamp } = evt
		const { data, channel, kind } = midiEvent
		const inst = (this.instruments as any)[instrument]
		if (!inst) {
			console.error('[Sketch #onUserEvent] Unable to find instrument', instrument)
		}
		switch (kind) {
			case 'noteon': {
				const nn = midiEvent as MidiEventNote
				inst.triggerAttack(
					Tone.Frequency(nn.note, 'midi').toFrequency(),
					this.timeGlobalToTone(timestamp),
					nn.attack,
				)
				break
			}
			case 'noteoff': {
				const nn = midiEvent as MidiEventNote
				inst.triggerRelease(
					Tone.Frequency(nn.note, 'midi').toFrequency(),
					this.timeGlobalToTone(timestamp),
				)
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

function instPiano() {
	return new Tone.Sampler({
		urls: {
			A0: 'A0.mp3',
			C1: 'C1.mp3',
			'D#1': 'Ds1.mp3',
			'F#1': 'Fs1.mp3',
			A1: 'A1.mp3',
			C2: 'C2.mp3',
			'D#2': 'Ds2.mp3',
			'F#2': 'Fs2.mp3',
			A2: 'A2.mp3',
			C3: 'C3.mp3',
			'D#3': 'Ds3.mp3',
			'F#3': 'Fs3.mp3',
			A3: 'A3.mp3',
			C4: 'C4.mp3',
			'D#4': 'Ds4.mp3',
			'F#4': 'Fs4.mp3',
			A4: 'A4.mp3',
			C5: 'C5.mp3',
			'D#5': 'Ds5.mp3',
			'F#5': 'Fs5.mp3',
			A5: 'A5.mp3',
			C6: 'C6.mp3',
			'D#6': 'Ds6.mp3',
			'F#6': 'Fs6.mp3',
			A6: 'A6.mp3',
			C7: 'C7.mp3',
			'D#7': 'Ds7.mp3',
			'F#7': 'Fs7.mp3',
			A7: 'A7.mp3',
			C8: 'C8.mp3',
		},
		release: 1,
		baseUrl: 'https://tonejs.github.io/audio/salamander/',
	}).toDestination()
}
