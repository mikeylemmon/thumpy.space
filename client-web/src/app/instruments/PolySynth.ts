import * as p5 from 'p5'
import * as Tone from 'tone'
import { MidiEventCC, MidiEventNote, MidiEventPitchbend } from '../MIDI'
import { Instrument } from '../Instrument'
import { noteFreq, srand, srandVec } from './util'
import { engine3d, Avatar, Obj, ObjOpts, Vec } from 'engine3d'

type SynthObjOpts = ObjOpts & {
	noteEvt: MidiEventNote
}

class SynthObj extends Obj {
	polySynth: PolySynth
	createdAt: number
	noteEvt: MidiEventNote
	scaleOrig: Vec
	voice: Tone.Synth | null = null
	hue = Math.random()
	lgt = 0.3
	envValLast = 1

	constructor(polySynth: PolySynth, opts: SynthObjOpts) {
		super(opts)
		this.polySynth = polySynth
		this.createdAt = new Date().valueOf() / 1000
		this.noteEvt = opts.noteEvt
		this.drawFunc = this.render
		this.scaleOrig = this.xform.scale.clone()
	}

	update = (dt: number) => {
		let mod = 1 - this.polySynth.modwheel
		mod = 1 - mod * mod
		// set lightness
		this.lgt = mod * 0.8 + 0.2
		// set hue
		this.hue += (Math.random() * 2 - 1) * dt * mod
		if (this.hue < 0) {
			this.hue += 1
		} else if (this.hue > 1) {
			this.hue -= 1
		}
		this.xform.rot.applyAdd(srandVec().applyMult(dt * mod))
		// // Disabled for now: scale by envelope value
		// const voices = (this.polySynth.synth as any)._activeVoices
		// if (!this.voice) {
		// 	for (const vv of voices) {
		// 		if (vv.midi === noteFreq(this.noteEvt.note) && !vv.released) {
		// 			this.voice = vv.voice
		// 			break
		// 		}
		// 	}
		// }
		// if (this.voice) {
		// 	this.envValLast = this.voice.envelope.value
		// }
		// this.xform.scale = this.scaleOrig.cloneMult(this.envValLast)
	}

	render = (pg: p5.Graphics) => {
		pg.colorMode(pg.HSL, 1)
		pg.fill(this.hue, 0.8, this.lgt)
		pg.stroke(this.hue, 0.8, this.lgt - 0.2)
		pg.strokeWeight(1)
		pg.sphere(1, 3, 4)
		pg.colorMode(pg.RGB, 255)
	}
}

export class PolySynth extends Instrument {
	synth: Tone.PolySynth
	filter: Tone.Filter
	filterVol: Tone.Volume
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
	maxObjs = 24
	ii = 0

	constructor() {
		super()
		this.panVol = new Tone.PanVol(0, 0).toDestination()
		this.reverb = new Tone.Reverb({ decay: 4, wet: 0.6 }).connect(this.panVol)
		this.filterVol = new Tone.Volume(0).connect(this.reverb)
		this.filter = new Tone.Filter({
			type: 'bandpass',
			frequency: 1000,
			Q: 2,
		}).connect(this.filterVol)
		this.synth = new Tone.PolySynth(Tone.Synth, {
			oscillator: {
				type: 'fatsquare',
				count: 3,
				spread: 30,
			},
			envelope: {
				attack: this.attack,
				decay: this.decay,
				sustain: this.sustain,
				release: this.release,
			},
		}).connect(this.filter)
	}

	setFilterGain = (db: number) => {
		this.filter.set({ gain: db })
		this.filterVol.volume.set({ value: Math.min(0, -db) })
	}

	loaded() {
		return true
	}

	noteon = (avatar: Avatar, time: number, evt: MidiEventNote) => {
		this.synth.triggerAttack(noteFreq(evt.note), time, evt.attack)
		Tone.Draw.schedule(() => this.addSynthObj(avatar, evt), time)
	}

	noteoff = (_avatar: Avatar, time: number, evt: MidiEventNote) => {
		const freq = noteFreq(evt.note)
		// this.synth.triggerRelease(freq, time) // sometimes fails to release
		// Tone.PolySynth can leave voices dangling, so manually release all voices matching this note
		Tone.Draw.schedule(() => {
			for (const vv of (this.synth as any)._activeVoices) {
				if (!vv.released && vv.midi === freq) {
					vv.voice.triggerRelease(Tone.immediate())
				}
			}
		}, `+${time - Tone.immediate()}`)
	}

	controlchange = (_avatar: Avatar, time: number, evt: MidiEventCC) => {
		const num = evt.controller.number
		let delayed: (() => void) | null = null
		switch (true) {
			case num === 1:
				delayed = () => {
					const vv = evt.value * evt.value
					this.filter.frequency.rampTo(20 + 10000 * vv, 0.005)
					this.modwheel = evt.value
				}
				break
			case num === 21:
				delayed = () => {
					const vv = evt.value * evt.value
					this.filter.set({ Q: vv * 8 })
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
					this.synth.set({ envelope: { [key]: vv } })
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
				console.log(
					`[PolySynth #controlchange] Unsupported CC event on channel ${evt.channel}:`,
					evt.controller,
					evt.value,
				)
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
	addSynthObj = (avatar: Avatar, evt: MidiEventNote) => {
		// Create obj for note
		const objSize = 100
		const { objs, maxObjs } = this
		const { clientId } = avatar.user
		let pos = avatar.xform.pos
		if (this.lastPos[clientId]) {
			pos = this.lastPos[clientId]
		}
		const off = new Vec(srand(), Math.random(), srand()).applyMult(objSize * 0.6)
		pos = pos.cloneAdd(off)
		if (this.ii++ % 8 === 0 || pos.y > 1000) {
			for (const oo of objs) {
				oo.xform.scale.applyMult(0.6)
			}
			const { pos: apos, scale: ascale } = avatar.xform
			const theta = Math.random() * Math.PI * 2
			pos.x = apos.x + ascale.x * 5 * Math.sin(theta)
			pos.y = apos.y
			pos.z = apos.z + ascale.x * 5 * Math.cos(theta)
		}
		this.lastPos[clientId] = pos
		const rot = new Vec(
			Math.random() * Math.PI * 2,
			Math.random() * Math.PI * 2,
			Math.random() * Math.PI * 2,
		)
		const obj = new SynthObj(this, {
			noteEvt: evt,
			pos: pos,
			rot: rot,
			scale: new Vec(objSize),
		})
		// Add obj to engine
		objs.unshift(obj)
		engine3d.addObj(obj)
		if (objs.length > maxObjs) {
			// remove oldest obj
			engine3d.rmObj(objs[objs.length - 1])
			this.objs = objs.slice(0, maxObjs)
		}
	}
}
