import * as p5 from 'p5'
import * as Tone from 'tone'
import { MidiEventNote } from '../MIDI'
import { ADSR, FilterProps, Instrument } from '../Instrument'
import { noteFreq, srand, srandVec } from '../util'
import { engine3d, Avatar, Obj, ObjOpts, Vec } from 'engine3d'

export class PolySynth extends Instrument {
	synth: Tone.PolySynth
	filter: Tone.Filter
	filterVol: Tone.Volume
	reverb: Tone.Reverb
	panVol: Tone.PanVol
	ps = 0
	psSpread = 7
	modwheel = 0.6
	objs: Obj[] = []
	maxObjs = 30
	ii = 0

	constructor() {
		super()
		this.panVol = new Tone.PanVol(0, 0).toDestination()
		this.reverb = new Tone.Reverb({ decay: 4, wet: 0.6 }).connect(this.panVol)
		this.filterVol = new Tone.Volume(0).connect(this.reverb)
		this.filter = new Tone.Filter({ type: 'bandpass' }).connect(this.filterVol)
		this.synth = new Tone.PolySynth(Tone.Synth, {
			oscillator: {
				type: 'fatsquare',
				count: 3,
				spread: 30,
			},
		}).connect(this.filter)

		// Initialize control sliders
		for (const ss of this.ctrls.sliders) {
			switch (ss.label) {
				case 'mod':
					ss.set(0.6)
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
		// Tone.PolySynth can leave voices dangling, so manually release all voices matching this note
		Tone.Draw.schedule(() => {
			for (const vv of (this.synth as any)._activeVoices) {
				if (!vv.released && vv.midi === freq) {
					vv.voice.triggerRelease(Tone.immediate())
				}
			}
		}, `+${time - Tone.immediate()}`)
	}

	handleDetune = (val: number) => {
		this.ps = val
		this.synth.set({ detune: 100 * val * this.psSpread })
	}

	handleModwheel = (val: number) => {
		this.modwheel = val
		// bind modwheel to filter freq and Q
		const ff = this.ctrls.getSliderForLabel('ff')
		if (ff) {
			ff.set(val)
			this.handleCC({ slider: ff })
		}
		const fq = this.ctrls.getSliderForLabel('fq')
		if (fq) {
			const sin = Math.sin(val * Math.PI)
			let vv = 1 - val
			vv = 1 - vv * vv * vv
			fq.set(sin * 0.2 + 0.06 + 0.2 * vv)
			this.handleCC({ slider: fq })
		}
	}

	handleFilter = (props: FilterProps) => this.filter.set(props)
	handleADSR = (props: ADSR) => this.synth.set({ envelope: props })

	_rr = 0
	_lastPos: { [key: number]: Vec } = {}
	addSynthObj = (avatar: Avatar, evt: MidiEventNote) => {
		// Create obj for note
		const objSize = 100
		const { objs, maxObjs } = this
		const { clientId } = avatar.user
		let pos = avatar.xform.pos
		if (this._lastPos[clientId]) {
			pos = this._lastPos[clientId]
		}
		const off = new Vec(srand(), Math.random() / 2 + 1, srand()).applyMult(objSize * 0.6)
		pos = pos.cloneAdd(off)
		if (this.ii++ % 8 === 0 || pos.y > 1000) {
			// Start a new column (4 total columns in semicircle behind avatar)
			const { facing, xform } = avatar
			const { pos: apos } = xform
			const ff = new Vec(facing.x, facing.z, 0).applyMult(-700)
			ff.rotate(-Math.PI / 2 + (Math.PI * ((this._rr++ % 4) + 1)) / 5)
			pos.x = apos.x + ff.x
			pos.y = apos.y
			pos.z = apos.z + ff.y
		}
		this._lastPos[clientId] = pos
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

type SynthObjOpts = ObjOpts & {
	noteEvt: MidiEventNote
}

class SynthObj extends Obj {
	polySynth: PolySynth
	hue = Math.random()
	lgt = 0.3
	// envValLast = 1
	// voice: Tone.Synth | null = null
	// noteEvt: MidiEventNote
	// scaleOrig: Vec

	constructor(polySynth: PolySynth, opts: SynthObjOpts) {
		super(opts)
		this.polySynth = polySynth
		// this.noteEvt = opts.noteEvt
		// this.scaleOrig = this.xform.scale.clone()
	}

	update = (dt: number) => {
		let mod = 1 - this.polySynth.modwheel
		mod = 1 - mod * mod
		this.lgt = mod * 0.6 + 0.2
		this.hue += (Math.random() * 2 - 1) * dt * mod
		if (this.hue < 0) {
			this.hue += 1
		} else if (this.hue > 1) {
			this.hue -= 1
		}
		this.xform.rot.applyAdd(srandVec().applyMult(dt * mod))
		// // Disabled: scale by envelope value
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

	drawFunc = (pg: p5.Graphics) => {
		pg.colorMode(pg.HSL, 1)
		pg.fill(this.hue, 0.8, this.lgt)
		pg.stroke(this.hue, 0.8, this.lgt - 0.2)
		pg.strokeWeight(1)
		pg.sphere(1, 3, 4)
		pg.colorMode(pg.RGB, 255)
	}
}
