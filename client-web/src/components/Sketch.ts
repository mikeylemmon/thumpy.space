import * as p5 from 'p5'
import * as Tone from 'tone'
import WSClient from './serverApi/WSClient'
import { userUpdateReq, User } from './serverApi/serverApi'
import MIDI, { MidiEvent, MidiEventCC, MidiEventNote, MidiEventPitchbend } from './MIDI'

type Instruments = {
	piano: Tone.Sampler
	piano2: Tone.Sampler
}

export default class Sketch {
	width: number = 0
	height: number = 0
	nn: number = 0
	started: boolean = false
	syncing: boolean = true
	instruments: Instruments = {
		piano: instPiano(),
		piano2: instPiano(),
	}
	ws: WSClient
	midi: MIDI
	pp: p5 | null = null
	user: User = {
		name: '',
		instrument: '',
		input: '',
	}

	inputs: {
		user?: any
		userCustomized?: boolean
		instrument?: any
		midi?: any
	} = {}

	constructor() {
		console.log('[Sketch #ctor]')
		this.ws = new WSClient(window, {
			clock: {
				onSynced: () => {
					this.syncing = false
				},
			},
			onClientId: this.setupInputsUser,
		})
		this.midi = new MIDI({
			onMessage: this.onMIDI,
			onEnabled: this.setupInputsMidi,
		})
		window.now = this.now
		window.Tone = Tone
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
		console.log(
			'[Sketch #timeGlobalToTone]',
			globalTime,
			'>',
			toneTime * 1000,
			`(d:${(toneTime - contextTime) * 1000})`,
		)
		return toneTime
	}

	timeToneToGlobal = (toneTime: number) => {
		const rawCtx = Tone.context.rawContext as any
		const { contextTime, performanceTime } = rawCtx._nativeAudioContext.getOutputTimestamp()
		const delta = toneTime - contextTime
		const pt = performanceTime + delta * 1000
		const globalTime = this.ws.clock.toGlobal(pt)
		console.log('[Sketch #timeToneToGlobal]', toneTime * 1000, '>', globalTime)
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
		inInst.position(inUser.x + inUser.width + 10, 20)
		for (const instName in this.instruments) {
			inInst.option(instName)
		}
		inInst.changed(() => {
			console.log('[Sketch #inputs.instrument] Changed:', inInst.value())
			this.user.instrument = inInst.value()
			this.sendUserUpdate()
		})
		this.inputs.instrument = inInst
		this.user.instrument = inInst.value()

		if (this.midi.enabled && !this.inputs.midi) {
			this.setupInputsMidi(this.midi.webMidi)
		}
	}

	setupInputsUser = (clientId: number): any => {
		if (!this.pp) {
			console.warn(
				'[Sketch #setupInputsUser] Attempted to setup user input before sketch was initialized',
			)
			return
		}
		if (this.inputs.user && this.inputs.userCustomized) {
			// Don't re-create the input if the user has already customized their name
			return
		}
		const inUser = this.pp.createInput(`User ${this.ws.clientId + 1}`) as any
		inUser.position(20, 20)
		inUser.input(() => {
			console.log('[Sketch #inputs.user] Changed:', inUser.value())
			this.inputs.userCustomized = true
			this.user.name = inUser.value()
			this.sendUserUpdate()
		})
		this.inputs.user = inUser
		this.user.name = inUser.value()
		this.sendUserUpdate()
		return inUser
	}

	setupInputsMidi = (webMidi: any) => {
		if (!this.pp || !this.inputs.instrument) {
			return
		}
		const { inputs } = webMidi
		const inMidi = this.pp.createSelect() as any
		const inInst = this.inputs.instrument
		inMidi.position(inInst.x + inInst.width + 50, 20)
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
			this.user.input = inMidi.value()
			this.sendUserUpdate()
		})
		this.inputs.midi = inMidi
		this.user.input = inMidi.value()
	}

	sendUserUpdate = () => {
		const { conn } = this.ws
		if (!conn || conn.readyState !== WebSocket.OPEN) {
			console.error("[Sketch #sendUserUpdate] Can't send user update, websocket connection is not open")
			return
		}
		conn.send(userUpdateReq(this.user))
	}

	draw = (pp: p5) => {
		const nn = this.nn++
		pp.background((nn / 3) % 255, (nn / 2) % 255, nn % 255)
		if (this.syncing) {
			this.drawSyncing(pp)
			return
		}
		if (!this.started) {
			this.drawClickToStart(pp)
			return
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

	onMIDI = (eventName: string, evt: MidiEvent) => {
		// const { attack, data, note, target, value } = evt
		const { data, target } = evt
		const { number: channel } = target || {}
		switch (eventName) {
			case 'noteon': {
				const nn = evt as MidiEventNote
				this.instruments.piano.triggerAttack(
					Tone.Frequency(nn.note._number, 'midi').toFrequency(),
					Tone.immediate(),
					nn.attack,
				)
				break
			}
			case 'noteoff': {
				const nn = evt as MidiEventNote
				this.instruments.piano.triggerRelease(
					Tone.Frequency(nn.note._number, 'midi').toFrequency(),
					Tone.immediate(),
				)
				break
			}
			case 'controlchange': {
				const cc = evt as MidiEventCC
				console.log(
					`[Sketch #onMIDI] CC event on channel ${channel}:`,
					cc.controller.number,
					cc.controller.name,
					cc.value,
				)
				break
			}
			case 'pitchbend': {
				const pb = evt as MidiEventPitchbend
				console.log(`[Sketch #onMIDI] Pitchbend event on channel ${channel}:`, pb.value)
				break
			}
			default:
				console.warn(
					`[Sketch #onMIDI] Unhandled MIDI event on channel ${channel}:`,
					eventName,
					data,
					evt,
				)
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
