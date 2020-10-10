import * as p5 from 'p5'
import * as Tone from 'tone'
import WSClient, { DONT_REOPEN } from './serverApi/WSClient'
import { NOTE_METRONOME_DOWN } from './serverApi/serverClock'
import {
	userEventReq,
	userUpdateReq,
	userXformReq,
	User,
	UserEvent,
	UserForce,
	UserXform,
} from './serverApi/serverApi'
import MIDI, { MidiEvent, MidiEventCC, MidiEventNote, MidiEventPitchbend } from './MIDI'
import { Instrument } from './Instrument'
import { EightOhEight, Metronome, Piano, PolySynth } from './instruments'
import VisualNotes from './VisualNotes'
import { EasyCam } from 'vendor/p5.easycam.js'
import { engine3d, Avatar, Ground, Vec } from 'engine3d'
import { SketchInputs } from './SketchInputs'
import { SketchAudioKeys } from './SketchAudioKeys'

type Instruments = { [key: string]: Instrument }

const worldScale = 1000
const newAvatarPos = () => {
	const rr = () => Math.random() * 1.8 - 0.9
	return new Vec(rr() * worldScale, 100, rr() * worldScale)
}

export default class Sketch {
	width: number = 0
	height: number = 0
	visualNotes: VisualNotes = new VisualNotes()
	started: boolean = false
	syncing: boolean = true
	instruments: Instruments
	ws: WSClient
	midi: MIDI
	audioKeys: SketchAudioKeys
	pp?: p5
	pg?: p5.Graphics
	cam?: EasyCam
	user: User = {
		clientId: 0,
		name: '',
		instrument: 'synth',
		inputDevice: 'keyboard',
		offset: 2,
	}
	avatar: Avatar
	users: User[] = []
	avatars: Avatar[] = []
	inputs: SketchInputs
	ground = new Ground({ pos: new Vec(0, -1, 0), scale: new Vec(worldScale) })
	engine3d = engine3d
	bgCol = {
		hue: 0.5,
		sat: 0,
		lgt: 0.2,
	}
	loops: number[] = []

	constructor(_global: any) {
		console.log('[Sketch #ctor]')
		this.inputs = new SketchInputs(this)
		this.ws = new WSClient(window, {
			clock: {
				onSynced: () => {
					this.syncing = false
					this.inputs.setupInputsBPM()
				},
			},
			onClientId: (clientId: number) => {
				this.user.clientId = clientId
				this.inputs.setupInputsUser(clientId)
				this.sendUserXform(this.avatar.getUserXform())
			},
			onClockUpdate: this.inputs.onClockUpdate,
			onUsers: this.onUsers,
			onUserEvent: this.onUserEvent,
			onUserForce: this.onUserForce,
			onUserXform: this.onUserXform,
		})
		this.instruments = {
			synth: new PolySynth(),
			eightOhEight: new EightOhEight(this),
			piano: new Piano(),
			metronome: new Metronome(this),
		}
		this.midi = new MIDI({
			onEnabled: this.inputs.setupInputsMidi,
			onMessage: this.sendUserEvent,
		})
		this.audioKeys = new SketchAudioKeys(this)
		this.avatar = new Avatar({
			user: this.user,
			pos: newAvatarPos(),
			scale: new Vec(40),
			phys: { worldScale },
			onForce: this.sendUserXform,
		})
		// Tone.Destination.chain(
		// 	new Tone.Reverb({ decay: 4, wet: 0.6 }),
		// )
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
	}

	draw = (pp: p5) => {
		engine3d.update()
		let loading = false
		for (const instName in this.instruments) {
			if (!this.instruments[instName].loaded()) {
				loading = true
				break
			}
		}
		pp.colorMode(pp.HSL, 1)
		pp.background(this.bgCol.hue, this.bgCol.sat, this.bgCol.lgt)
		pp.colorMode(pp.RGB, 255)
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
		if (this.started) {
			return
		}
		this.started = true
		Tone.start()
		console.log('[Sketch #mousePressed] Started Tone')
	}

	keyboardInputDisabled = () => {
		return this.inputs.isFocused() // Ignore keyboard if inputs are focused
	}
	keyPressed = (evt: p5) => {
		if (!this.keyboardInputDisabled()) {
			this.avatar.keyPressed(evt)
		}
		if (evt.keyCode === 27) {
			// ESC pressed, clear loops
			for (const loop of this.loops) {
				Tone.Transport.clear(loop)
			}
		}
	}
	keyReleased = (evt: p5) => {
		if (!this.keyboardInputDisabled()) {
			this.avatar.keyReleased(evt)
		}
	}

	updateUser = (uu: Partial<User>, sendUpdate: boolean = true) => {
		this.user = Object.assign(this.user, uu)
		if (sendUpdate) {
			this.sendUserUpdate()
		}
	}

	// getUser returns the user matching clientId,
	// or this.user if no matching user is found
	getUser = (clientId: number): User => {
		if (clientId === this.user.clientId) {
			return this.user
		}
		for (const uu of this.users) {
			if (clientId === uu.clientId) {
				return uu
			}
		}
		return this.user
	}

	getAvatar = (clientId: number): Avatar | null => {
		if (clientId === this.user.clientId) {
			return this.avatar
		}
		for (const aa of this.avatars) {
			if (clientId === aa.user.clientId) {
				return aa
			}
		}
		return null
	}
	getAvatarSafe = (clientId: number): Avatar => {
		const aa = this.getAvatar(clientId)
		if (!aa) {
			console.warn("[Sketch #getAvatarSafe] Can't find avatar for client", clientId)
			return this.avatar
		}
		return aa
	}

	sendUserUpdate = () => {
		const { conn, ready } = this.ws
		if (!ready()) {
			console.warn("[Sketch #sendUserUpdate] Can't send user update, websocket connection is not open")
			return
		}
		conn.send(userUpdateReq(this.user))
	}

	sendUserXform = (data: UserXform) => {
		const { conn, ready } = this.ws
		if (!ready()) {
			console.warn("[Sketch #sendUserXform] Can't send user xform, websocket connection is not open")
			return
		}
		conn.send(userXformReq(data))
	}

	sendUserEvent = (inputName: string, _eventName: string, evt: MidiEvent) => {
		let instName = this.user.instrument
		if (evt.controller) {
			// Hardcode some CC events to control instrument volumes
			switch (evt.controller.number) {
				case 79: // master volume (local only)
					Tone.Destination.volume.value = (evt.value - 1) * 50
				// fallthrough
				case 19: // master mute (local only)
					Tone.Destination.mute = !evt.value
					return
				case 18:
				case 78:
					instName = 'metronome'
					break
				case 17:
				case 77:
					instName = 'synth'
					break
				case 16:
				case 76:
					instName = 'eightOhEight'
					break
				case 15:
				case 75:
					instName = 'piano'
					break
				default:
					// Commented out for easier deving -- MIDI input always enabled
					// if (inputName !== this.user.inputDevice) {
					// 	return // not a whitelisted CC and not the active device, so don't send
					// }
					break
			}
			// Commented out for easier deving -- MIDI input always enabled
			// } else {
			// 	if (inputName !== this.user.inputDevice) {
			// 		return
			// 	}
		}
		const off = this.offsetMs()
		const sendIt = () => {
			const uevt = {
				clientId: this.user.clientId,
				instrument: instName,
				midiEvent: evt,
				timestamp: this.ws.now() + off,
			}
			const { conn, ready } = this.ws
			if (!ready()) {
				// websocket connection isn't ready, handle event locally
				this.onUserEvent(uevt)
				return
			}
			conn.send(userEventReq(uevt))
		}
		const shiftKeyDown = this.pp && this.pp.keyIsDown(16)
		if (shiftKeyDown && Tone.Transport.state === 'started') {
			this.loops.push(Tone.Transport.scheduleRepeat(_time => sendIt(), '2m'))
			return
		}
		sendIt()
	}

	onUsers = (users: User[]) => {
		for (const user of users) {
			if (user.clientId === this.user.clientId) {
				continue // skip local user
			}
			const prevs = this.users.filter(uu => uu.clientId === user.clientId)
			if (!prevs.length) {
				this.users.push(user)
				this.avatars.push(
					new Avatar({
						user: user,
						pos: newAvatarPos(),
						scale: new Vec(20),
						phys: { worldScale },
					}),
				)
				continue
			}
			if (prevs.length > 1) {
				console.warn(
					`[Sketch #onUsers] Found more than one user for clientId #${user.clientId}`,
					user.clientId,
					user.name,
				)
			}
			// Update pre-existing user
			const prev = prevs[0]
			Object.assign(prev, user)
		}
		for (const user of this.users) {
			if (users.some(uu => uu.clientId === user.clientId)) {
				continue
			}
			// user dropped, remove user and its avatar
			const aa = this.getAvatar(user.clientId)
			if (aa) {
				engine3d.rmObj(aa)
			} else {
				console.warn(
					`[Sketch #onUsers] Unable to find avatar for dropped user #${user.clientId}`,
					user.name,
				)
			}
			this.users = this.users.filter(uu => uu.clientId !== user.clientId)
			this.avatars = this.avatars.filter(aa => aa.user.clientId !== user.clientId)
		}
	}

	onUserForce = (evt: UserForce) => {
		const { clientId } = evt
		const avatar = this.getAvatar(clientId)
		if (!avatar) {
			console.warn('[Sketch #onUserForce] No avatar for user', clientId)
			return
		}
		avatar.setUserForce(evt)
	}

	onUserXform = (evt: UserXform) => {
		const { clientId } = evt
		const avatar = this.getAvatar(clientId)
		if (!avatar) {
			console.warn('[Sketch #onUserXform] No avatar for user', clientId)
			return
		}
		avatar.setUserXform(evt)
	}

	onUserEvent = (evt: UserEvent) => {
		const { clientId, instrument, midiEvent, timestamp } = evt
		const { data, channel, kind } = midiEvent
		const inst = this.instruments[instrument]
		if (!inst) {
			console.error('[Sketch #onUserEvent] Unable to find instrument', instrument)
			return
		}
		if (!inst.loaded()) {
			return // don't send events if instrument hasn't finished loading
		}
		const isMetronome = instrument === 'metronome'
		if (isMetronome && this.syncing) {
			return // don't handle metronome events until clock has synced
		}
		const tt = this.timeGlobalToTone(timestamp)
		if (tt - Tone.immediate() < -1) {
			console.warn(`[Sketch #onUserEvent] Received event ${tt - Tone.immediate()} seconds late`)
			return
		}
		const avatar = this.getAvatarSafe(clientId)
		switch (kind) {
			case 'noteon': {
				const nn = midiEvent as MidiEventNote
				inst.noteon(avatar, tt, nn)
				if (isMetronome && nn.note === NOTE_METRONOME_DOWN) {
					if (Tone.Transport.state !== 'started') {
						Tone.Transport.set({ bpm: this.inputs.bpm() })
						Tone.Transport.start(tt) // Start the Transport on the first post-sync down beat
					}
				}
				break
			}
			case 'noteoff': {
				const nn = midiEvent as MidiEventNote
				inst.noteoff(avatar, tt, nn)
				break
			}
			case 'controlchange': {
				const cc = midiEvent as MidiEventCC
				inst.controlchange(avatar, tt, cc)
				break
			}
			case 'pitchbend': {
				const pb = midiEvent as MidiEventPitchbend
				inst.pitchbend(avatar, tt, pb)
				break
			}
			default:
				console.warn(
					`[Sketch #onUserEvent] Unhandled MIDI event on channel ${channel}:`,
					kind,
					data,
					evt,
				)
				break
		}
	}

	offsetMs = () => {
		const bps = this.inputs.bpm() / 60
		if (!bps) {
			return 0
		}
		const beatMs = 1000.0 / bps
		return beatMs * this.user.offset
	}
}
