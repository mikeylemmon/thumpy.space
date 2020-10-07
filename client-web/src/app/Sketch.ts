import * as p5 from 'p5'
import * as Tone from 'tone'
import WSClient, { DONT_REOPEN } from './serverApi/WSClient'
import { userEventReq, userUpdateReq, User, UserEvent } from './serverApi/serverApi'
import MIDI, { MidiEvent, MidiEventCC, MidiEventNote, MidiEventPitchbend } from './MIDI'
import { piano, eightOhEight } from './instruments'
import VisualNotes from './VisualNotes'
import { EasyCam } from 'vendor/p5.easycam.js'
import { engine3d, Avatar, AvatarData, Ground, Vec } from 'engine3d'
import { SketchInputs } from './SketchInputs'
import { SketchAudioKeys } from './SketchAudioKeys'

type Instruments = {
	piano: ReturnType<typeof piano>
	piano2: ReturnType<typeof piano>
	eightOhEight: ReturnType<typeof eightOhEight>
}

const worldScale = 1000

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
	audioKeys: SketchAudioKeys
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
	inputs: SketchInputs

	avatar: Avatar = new Avatar({
		draw: (pg: p5.Graphics) => {
			pg.fill(0)
			pg.stroke(255)
			pg.strokeWeight(2)
			pg.sphere(1, 7, 7)
		},
		draw2D: (pp: p5, pos: p5.Vector) => {
			const { name, instrument, offset } = this.user
			pp.translate(pos.x, pos.y)
			pp.textAlign(pp.CENTER, pp.BOTTOM)
			pp.fill(255)
			pp.noStroke()
			pp.textSize(16)
			pp.textStyle(pp.BOLD)
			pp.text(name, 0, -50)
			pp.fill(225)
			pp.textSize(12)
			pp.textStyle(pp.ITALIC)
			pp.text(`${instrument} (@${offset > 0 ? '+' : ''}${offset})`, 0, -35)
		},
		pos: new Vec(40, 100, 40),
		scale: new Vec(40),
		phys: { worldScale },
		onForce: (data: AvatarData) => {
			const { force, vel, xform } = data
			this.user.force = force
			this.user.vel = vel
			this.user.xform = xform
			this.sendUserUpdate()
		},
	})
	ground = new Ground({ scale: new Vec(worldScale) })
	engine3d = engine3d

	constructor(global: any) {
		console.log('[Sketch #ctor]')
		this.inputs = new SketchInputs(this)
		this.ws = new WSClient(window, {
			clock: {
				onSynced: () => {
					this.syncing = false
					this.inputs.setupInputsBPM()
				},
			},
			onClientId: this.inputs.setupInputsUser,
			onClockUpdate: this.inputs.onClockUpdate,
			onUserEvent: this.onUserEvent,
		})
		this.midi = new MIDI({
			onEnabled: this.inputs.setupInputsMidi,
			onMessage: this.onMIDI,
		})
		this.audioKeys = new SketchAudioKeys(this)
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
		pp.keyPressed = () => this.keyPressed(pp)
		pp.keyReleased = () => this.keyReleased(pp)
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
		this.cam.rotateY(Math.PI)
		this.cam.rotateZ(Math.PI)
		;(this.cam.state as any).center[2] = 40
		this.avatar.addFollowCam(this.cam)
		this.inputs.setup(pp)
		this.user.posX = Math.random() * 0.8 + 0.1
		this.user.posY = Math.random() * 0.6 + 0.2
	}

	update = (pp: p5) => {
		engine3d.update()
	}

	draw = (pp: p5) => {
		this.update(pp)
		let loading = false
		for (const instName in this.instruments) {
			const inst = (this.instruments as any)[instName]
			loading = loading || !inst.loaded
		}
		pp.background(0x33)
		if (this.pg) {
			// Draw notes to separate graphics canvas
			this.visualNotes.draw(pp, this.pg)
			engine3d.draw(this.pg)
			pp.image(this.pg, 0, 0)
			engine3d.draw2D(pp, this.pg)
		}
		this.inputs.draw(pp)
		if (loading) {
			this.drawMessage(pp, 'Loading instruments...')
		} else if (this.syncing) {
			this.drawMessage(pp, 'Syncing clock with server...')
		} else if (!this.started) {
			this.drawMessage(pp, 'Click to enable audio')
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
		return this.inputs.isFocused() // Ignore keyboard if inputs are focused
	}
	keyPressed = (evt: p5) => {
		if (!this.keyboardInputDisabled()) {
			this.avatar.keyPressed(evt)
		}
	}
	keyReleased = (evt: p5) => {
		if (!this.keyboardInputDisabled()) {
			this.avatar.keyReleased(evt)
		}
	}

	updateUser = (uu: Partial<User>, sendUpdate: boolean = true) => {
		this.user = { ...this.user, ...uu }
		if (sendUpdate) {
			this.sendUserUpdate()
		}
	}

	sendUserUpdate = () => {
		const { conn, ready } = this.ws
		if (!ready()) {
			console.warn("[Sketch #sendUserUpdate] Can't send user update, websocket connection is not open")
			return
		}
		conn.send(userUpdateReq(this.user))
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
		const { conn, ready } = this.ws
		if (!ready()) {
			this.onUserEvent(uevt)
			return
		}
		conn.send(userEventReq(uevt))
	}

	offsetMs = () => {
		const bps = this.inputs.bpm() / 60
		if (!bps) {
			return 0
		}
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
