import * as p5 from 'p5'
import * as Tone from 'tone'
import { MidiEventCC, MidiEventNote, MidiEventPitchbend } from '../MIDI'
import { ControlChange, Instrument } from '../Instrument'
import { noteFreq, srand, srandVec } from '../util'
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
	modwheel = 0.3
	objs: Obj[] = []
	maxObjs = 24
	ii = 0

	constructor() {
		super()
		for (const ss of this.ctrls.sliders) {
			// set default values for controls
			switch (ss.label) {
				case 'mod':
					ss.set(0.5)
					break
				case 'a':
					ss.set(0.01)
					break
				case 'd':
					ss.set(0.4)
					break
				case 's':
					ss.set(0.66)
					break
				case 'r':
					ss.set(0.5)
					break
			}
		}
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
		}).connect(this.filter)
		this.envelope = {
			// enable base class to auto-bind ASDR sliders
			set: (props: { [key: string]: number }) => this.synth.set({ envelope: props }),
		}
		// Initialize values from sliders
		for (const ss of this.ctrls.sliders) {
			this.handleCC({ slider: ss })
		}
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

	handleCC(cc: ControlChange) {
		super.handleCC(cc)
		const { evt, slider } = cc
		if (slider && slider.label === 'mod') {
			this.updateModwheel(slider.value.value)
			return
		}
		// Handle customized control events that don't have sliders
		if (!evt) {
			return
		}
		const num = evt.controller.number
		let vv = evt.value * evt.value
		switch (true) {
			case num === 21:
				vv = Math.pow(10, evt.value * 3 + 1) // 10 to 10000
				this.filter.frequency.rampTo(vv, 0.005)
				break
			case num === 22:
				this.filter.set({ Q: vv * 8 })
				break
			case num === 26:
				this.psSpread = evt.value * 12
				this.updatePitchbend()
				break
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

	updateModwheel = (val: number) => {
		this.modwheel = val
		const vv = Math.pow(10, val * 3 + 1) // 10 to 10000
		this.filter.frequency.rampTo(vv, 0.005)
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
