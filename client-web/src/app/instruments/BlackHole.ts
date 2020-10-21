import * as p5 from 'p5'
import * as Tone from 'tone'
import { MidiEventNote } from '../MIDI'
import { ADSR, ControlChange, FilterProps, Instrument } from '../Instrument'
import { mix, noteFreq, srand, srandVec } from '../util'
import { Avatar, Obj, ObjOpts, Vec } from 'engine3d'
import { sketch } from '../Sketch'

export class BlackHole extends Instrument {
	panVol: Tone.PanVol
	reverb: Tone.Reverb
	filter: Tone.Filter
	synth: Tone.Synth
	freqNode = new Tone.Add()
	freq = new Tone.Signal(440)
	noiseGain: Tone.Gain
	noise: Tone.Noise
	modwheel = 0.3
	ps = 0
	psSpread = 7
	objs: Obj[] = []
	maxObjs = 30
	ii = 0

	constructor() {
		super()
		this.panVol = new Tone.PanVol(0, 0).toDestination()
		this.reverb = new Tone.Reverb({ decay: 4, wet: 0.6 }).connect(this.panVol)
		this.filter = new Tone.Filter({ type: 'lowpass' }).connect(this.reverb)
		const delay = new Tone.PingPongDelay({
			delayTime: '4n',
			feedback: 0.6,
			wet: 0.3,
		}).connect(this.filter)
		this.synth = new Tone.Synth().connect(delay)
		this.freqNode.connect(this.synth.frequency)
		this.freq.connect(this.freqNode)
		this.noiseGain = new Tone.Gain(100).connect(this.freqNode.addend)
		this.noise = new Tone.Noise({ volume: 0, playbackRate: 0.5, type: 'brown' })
			.start()
			.connect(this.noiseGain)

		// Initialize control sliders
		for (const ss of this.ctrls.sliders) {
			switch (ss.label) {
				case 'mod':
					ss.set(0.3)
					break
				case 'ff':
					ss.set(0.9)
					break
				case 'fq':
					ss.set(0.25)
					break
				case 'a':
					ss.set(0.1)
					break
				case 'd':
					ss.set(0.3)
					break
				case 's':
					ss.set(0.66)
					break
				case 'r':
					ss.set(0.6)
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

	_attacks = 0
	noteon = (avatar: Avatar, time: number, evt: MidiEventNote) => {
		const freq = noteFreq(evt.note)
		try {
			if (this._attacks) {
				this.freq.exponentialRampToValueAtTime(freq, time)
			} else {
				this.freq.setValueAtTime(freq, time)
				this.synth.triggerAttack(freq, time, evt.attack)
			}
		} catch {}
		this._attacks++
		Tone.Draw.schedule(() => this.addBHObj(avatar, evt), time)
	}
	noteoff = (_avatar: Avatar, time: number, _evt: MidiEventNote) => {
		this._attacks = Math.max(0, this._attacks - 1)
		if (!this._attacks) {
			this.synth.triggerRelease(time)
		}
	}

	handleDetune = (val: number) => {
		this.ps = val
		this.synth.set({ detune: 100 * val * this.psSpread })
	}

	handleModwheel = (val: number) => {
		this.modwheel = val
		const vv = val * val
		this.noiseGain.set({ gain: vv * this.freq.value * 3 })
	}

	handleFilter = (props: FilterProps) => this.filter.set(props)
	handleADSR = (props: ADSR) => this.synth.set({ envelope: props })

	handleCC(cc: ControlChange) {
		super.handleCC(cc)
		const { evt } = cc
		if (!evt) {
			return
		}
		// Handle customized control events that don't have sliders
		const num = evt.controller.number
		let vv = evt.value * evt.value
		switch (true) {
			case num === 23:
				this.noise.set({ playbackRate: vv * 2 })
				break
			case num === 24:
				this.synth.set({ portamento: vv * 2 })
				break
		}
	}

	_rr = 0
	_lastPos: { [key: number]: Vec } = {}
	addBHObj = (avatar: Avatar, evt: MidiEventNote) => {
		const { blackHole } = sketch
		if (!blackHole) {
			return
		}
		// Create obj for note
		const objSize = 150
		const { objs, maxObjs } = this
		const { clientId } = avatar.user
		let pos = avatar.xform.pos
		if (this._lastPos[clientId]) {
			pos = this._lastPos[clientId]
		}
		const off = new Vec(srand() / 2, Math.random() / 2 + 0.5, srand() / 2).applyMult(objSize * 0.6)
		pos = pos.cloneAdd(off)
		if (this.ii++ % 8 === 0 || pos.y > 1000) {
			// Start a new column (4 total columns in semicircle behind avatar),
			// place between PolySynth columns
			const { facing, xform } = avatar
			const { pos: apos } = xform
			const ff = new Vec(facing.x, facing.z, 0).applyMult(-700)
			let rr = 1 + 2 * (this._rr++ % 4)
			if (rr > 3) {
				rr += 2
			}
			ff.rotate(-Math.PI / 2 + (Math.PI * rr) / 10)
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
		// let extraScale = pos.y / 1000
		// extraScale *= extraScale * extraScale * 10 * objSize
		const obj = new BHObj(this, {
			noteEvt: evt,
			pos: pos,
			rot: rot,
			// scale: new Vec(objSize * 0.7 + extraScale),
			scale: new Vec(objSize),
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
	massOrig: number
	twist = 0
	twistDir = 1

	constructor(inst: BlackHole, opts: BHObjOpts) {
		super(opts)
		this.inst = inst
		this.createdAt = new Date().valueOf() / 1000
		this.noteEvt = opts.noteEvt
		this.scaleOrig = this.xform.scale.clone()
		this.mass = 1 - opts.mass // invert to apply square
		this.mass = 1 - this.mass * this.mass // un-invert the square
		this.massOrig = this.mass
		this.twistDir = Math.random() > 0.5 ? 1 : -1
	}

	update = (dt: number) => {
		const { modwheel } = this.inst
		const mm = modwheel * modwheel
		let im = 1 - modwheel // invert to apply square
		im = 1 - im * im // un-invert the square
		this.xform.rot.applyAdd(srandVec().applyMult(dt * im))
		this.twist = mix(mm, this.twist, 0.99)
		this.mass = mix(mix(im, this.massOrig, 0.65), this.mass, 0.99)
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
			sketch.shaderBlackHole.setUniform('rotate', this.twist * Math.PI * this.twistDir)
			sketch.shaderBlackHole.setUniform('mass', this.mass)
		}
		pg.sphere(1, 3, 4)
	}

	drawFunc2D = (pp: p5, pos: Vec, scale: number) => {
		this.origin2D = pos
		this.scale2D = Math.min(pp.height * 2, scale)
	}
}
