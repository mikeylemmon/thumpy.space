import * as p5 from 'p5'
import * as Tone from 'tone'
import { MidiEventCC, MidiEventNote, MidiEventPitchbend } from '../MIDI'
import { Instrument } from '../Instrument'
import { noteFreq, srand, srandVec } from '../util'
import { Avatar, Obj, ObjOpts, Vec } from 'engine3d'
import { sketch } from '../Sketch'

export class BlackHole extends Instrument {
	synth: Tone.Synth
	gain: Tone.Gain
	freqNode = new Tone.Add()
	freq = new Tone.Signal(440)
	noiseGain: Tone.Gain
	noise: Tone.Noise
	reverb: Tone.Reverb
	panVol: Tone.PanVol
	ps = 0
	psSpread = 7
	attack = 0.01
	decay = 0.07
	sustain = 0.3
	release = 0.6
	modwheel = 0.3
	objs: Obj[] = []
	maxObjs = 32
	ii = 0

	constructor() {
		super()
		this.ctrls.sliders = {}
		this.panVol = new Tone.PanVol(0, 0).toDestination()
		this.reverb = new Tone.Reverb({ decay: 4, wet: 0.6 }).connect(this.panVol)
		const filter = new Tone.Filter({
			type: 'lowpass',
			frequency: 8000,
			Q: 0.5,
		}).connect(this.reverb)
		const delay = new Tone.PingPongDelay({
			delayTime: '4n',
			feedback: 0.6,
			wet: 0.3,
		}).connect(filter)
		this.gain = new Tone.Gain(1).connect(delay)
		this.synth = new Tone.Synth().connect(this.gain)
		this.freqNode.connect(this.synth.frequency)
		this.freq.connect(this.freqNode)
		this.noiseGain = new Tone.Gain(100).connect(this.freqNode.addend)
		this.noise = new Tone.Noise({ volume: 0, playbackRate: 0.5, type: 'brown' })
			.start()
			.connect(this.noiseGain)
	}

	loaded() {
		return true
	}

	noteon = (avatar: Avatar, time: number, evt: MidiEventNote) => {
		const freq = noteFreq(evt.note)
		this.freq.exponentialRampToValueAtTime(freq, time)
		try {
			this.synth.triggerAttack(freq, time, evt.attack)
		} catch {}
		Tone.Draw.schedule(() => this.addBHObj(avatar, evt), time)
	}

	noteoff = (_avatar: Avatar, time: number, _evt: MidiEventNote) => {
		this.synth.triggerRelease(time)
	}

	controlchange = (_avatar: Avatar, time: number, evt: MidiEventCC) => {
		const num = evt.controller.number
		let delayed: (() => void) | null = null
		switch (true) {
			case num === 1:
				delayed = () => {
					const vv = evt.value * evt.value
					this.noiseGain.set({ gain: vv * this.freq.value * 3 })
					this.modwheel = evt.value
				}
				break
			case num === 21:
				delayed = () => {
					const vv = evt.value * evt.value
					this.noise.set({ playbackRate: vv * 2 })
				}
				break
			case num === 27:
				delayed = () => {
					this.psSpread = evt.value * 12
					this.updatePitchbend()
				}
				break
			case num === 28:
				delayed = () => {
					this.panVol.set({ pan: evt.value * 2 - 1 })
				}
				break
			case 71 <= num && num <= 74: {
				let vv = evt.value * evt.value * evt.value * evt.value
				const key = ['attack', 'decay', 'sustain', 'release'][num - 71]
				delayed = () => {
					vv = key === 'sustain' ? evt.value : 10 * vv
					;(this as any)[key] = vv
					this.synth.envelope.set({ [key]: vv })
				}
				break
			}
			case 75 <= num && num <= 79:
				delayed = () => {
					this.panVol.mute = !evt.value
					this.panVol.set({ volume: (evt.value - 1) * 50 })
				}
				break
			case 15 <= num && num <= 19:
				delayed = () => {
					this.panVol.mute = !evt.value
				}
				break
			default:
			// console.log(
			// 	`[BlackHole #controlchange] Unsupported CC event on channel ${evt.channel}:`,
			// 	evt.controller,
			// 	evt.value,
			// )
		}
		if (delayed) {
			Tone.Draw.schedule(delayed, time)
		}
	}

	pitchbend = (_avatar: Avatar, time: number, evt: MidiEventPitchbend) => {
		Tone.Draw.schedule(() => {
			this.ps = evt.value
			this.updatePitchbend()
		}, time)
	}

	updatePitchbend = () => {
		this.synth.set({ detune: 100 * this.ps * this.psSpread })
	}

	lastPos: { [key: number]: Vec } = {}
	addBHObj = (avatar: Avatar, evt: MidiEventNote) => {
		const { blackHole } = sketch
		if (!blackHole) {
			return
		}
		// Create obj for note
		const objSize = 130
		const { objs, maxObjs } = this
		const { clientId } = avatar.user
		let pos = avatar.xform.pos
		if (this.lastPos[clientId]) {
			pos = this.lastPos[clientId]
		}
		const off = new Vec(srand(), Math.random(), srand()).applyMult(objSize * 0.6)
		pos = pos.cloneAdd(off)
		if (this.ii++ % 16 === 0 || pos.y > 1000) {
			for (const oo of objs) {
				oo.xform.scale.applyMult(0.8)
			}
			const { facing, xform } = avatar
			const { pos: apos, scale: ascale } = xform
			const theta = Math.random() * Math.PI * 2
			const ff = facing.cloneMult(objSize * 4)
			pos.x = apos.x + ff.x + ascale.x * 3 * Math.sin(theta)
			pos.y = apos.y
			pos.z = apos.z + ff.z + ascale.x * 3 * Math.cos(theta)
		}
		this.lastPos[clientId] = pos
		const rot = new Vec(
			Math.random() * Math.PI * 2,
			Math.random() * Math.PI * 2,
			Math.random() * Math.PI * 2,
		)
		let extraScale = pos.y / 1000
		extraScale *= extraScale * extraScale * 10 * objSize
		const obj = new BHObj(this, {
			noteEvt: evt,
			pos: pos,
			rot: rot,
			scale: new Vec(objSize * 0.7 + extraScale),
			twist: this.modwheel * this.modwheel,
			mass: evt.attack || 0.7,
		})
		objs.unshift(obj)
		// Add obj to root blackhole object
		blackHole.addChild(obj)
		if (objs.length > maxObjs) {
			// remove oldest obj
			blackHole.rmChild(objs[objs.length - 1])
			this.objs = objs.slice(0, maxObjs)
		}
	}
}

type BHObjOpts = ObjOpts & {
	noteEvt: MidiEventNote
	twist: number
	mass: number
}

class BHObj extends Obj {
	inst: BlackHole
	createdAt: number
	noteEvt: MidiEventNote
	scaleOrig: Vec
	voice: Tone.Synth | null = null
	hue = Math.random()
	mass: number
	twist = 0

	constructor(inst: BlackHole, opts: BHObjOpts) {
		super(opts)
		this.inst = inst
		this.createdAt = new Date().valueOf() / 1000
		this.noteEvt = opts.noteEvt
		this.scaleOrig = this.xform.scale.clone()
		this.mass = 1 - opts.mass // invert to apply square
		this.mass = 1 - this.mass * this.mass // un-invert the square
		if (opts.twist) {
			this.twist = Math.random() > 0.5 ? opts.twist : -opts.twist
		}
	}

	update = (dt: number) => {
		let mod = 1 - this.inst.modwheel // invert to apply square
		mod = 1 - mod * mod // un-invert the square
		this.xform.rot.applyAdd(srandVec().applyMult(dt * mod))
	}

	origin2D = new Vec()
	scale2D = 1
	drawFunc = (pg: p5.Graphics) => {
		if (sketch.shaderBlackHole) {
			sketch.shaderBlackHole.setUniform('origin', [
				this.origin2D.x / pg.width,
				this.origin2D.y / pg.height,
			])
			sketch.shaderBlackHole.setUniform('scale', this.scale2D / pg.width)
			sketch.shaderBlackHole.setUniform('rotate', this.twist * Math.PI)
			sketch.shaderBlackHole.setUniform('mass', this.mass)
		}
		pg.sphere(1, 3, 4)
	}

	drawFunc2D = (pp: p5, pos: Vec, scale: number) => {
		this.origin2D = pos
		this.scale2D = Math.min(pp.height * 2, scale)
	}
}
