import * as Tone from 'tone'
import { MidiEventNote } from '../MIDI'
import { ADSR, ControlChange, FilterProps, Instrument } from '../Instrument'
import { noteFreq } from '../util'
import { engine3d, Avatar, Obj, ObjOpts, Vec } from 'engine3d'

// Hoover implements a very rough approximation of a Alpha Juno 2 'rave hoover'
// by amplitude-modulating a fatsawtooth by a fatsquare (would have used pulse
// like the Juno does, but Tone doesn't have a fatpulse oscillator built in)
//
// References:
// * https://www.listarc.bham.ac.uk/lists/sc-users-2009/msg53728.html
// * ...via http://superdupercollider.blogspot.com/2009/06/more-dominator-deconstruction.html
// * ...via https://tidalcycles.org/index.php/All_effects_and_synths#superhoover
export class Hoover extends Instrument {
	chorus: Tone.Chorus
	filter: Tone.Filter
	amGain: Tone.Gain
	synth: Tone.Synth
	amOsc: Tone.OmniOscillator<Tone.FatOscillator>
	panVol: Tone.PanVol
	ps = 0
	psSpread = 7
	harmonicity = new Tone.Multiply(3.03)
	freq = 440
	obj: Obj
	wave: Tone.Waveform
	fft: Tone.FFT

	constructor() {
		super()
		this.panVol = new Tone.PanVol(0, 0).toDestination()
		this.chorus = new Tone.Chorus(0.15, 30, 1).connect(this.panVol)
		this.filter = new Tone.Filter({ type: 'bandpass' }).connect(this.chorus)
		this.amGain = new Tone.Gain(1).connect(this.filter)
		this.synth = new Tone.Synth({
			oscillator: {
				type: 'fatsawtooth',
				count: 4,
				spread: 59,
			},
			portamento: 0.25,
		}).connect(this.amGain)
		const amScale = new Tone.AudioToGain().connect(this.amGain.gain)
		this.amOsc = new Tone.OmniOscillator({
			type: 'fatsquare',
			count: 3,
			spread: 30,
		})
			.start()
			.connect(amScale)
		this.synth.frequency.chain(this.harmonicity, this.amOsc.frequency)

		// Waveform and FFT
		this.wave = new Tone.Waveform(32)
		this.panVol.connect(this.wave)
		this.fft = new Tone.FFT({
			size: 16,
			normalRange: true,
		})
		this.panVol.connect(this.fft)
		const obj = engine3d.getObj(HooverObj)
		if (obj) {
			this.obj = obj
		} else {
			this.obj = new HooverObj(this, {
				scale: new Vec(4),
			})
		}

		// Initialize control sliders
		for (const ss of this.ctrls.sliders) {
			switch (ss.label) {
				case 'mod': ss.set(1.0); break
				case 'a': ss.set(0.6); break
				case 'd': ss.set(0.07); break
				case 's': ss.set(1.0); break
				case 'r': ss.set(0.7); break
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
	noteon = (_avatar: Avatar, time: number, evt: MidiEventNote) => {
		this.freq = noteFreq(evt.note) / 2
		try {
			if (this._attacks) {
				this.synth.setNote(this.freq, time)
			} else {
				this.synth.triggerAttack(this.freq, time, evt.attack)
			}
		} catch {}
		this._attacks++
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
		const sin = Math.sin(val * Math.PI)
		let ss = 1 - sin
		ss = 1 - ss * ss
		const vv = Math.pow(2, Math.floor((1 - val) * 32) / 8 - 1)
		this.harmonicity.value = vv
		if (val < 0.5) {
			this.amOsc.volume.value = ss * 60 - 60
		} else {
			this.amOsc.volume.value = 0
		}
		const ff = this.ctrls.getSliderForLabel('ff')
		if (ff) {
			ff.set(val)
			this.handleCC({ slider: ff })
		}
		const fq = this.ctrls.getSliderForLabel('fq')
		if (fq) {
			fq.set(sin * sin * sin * 0.35)
			this.handleCC({ slider: fq })
		}
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
				this.harmonicity.value = vv * 20
				break
			case num === 24:
				this.synth.set({ portamento: vv * 2 })
				break
		}
	}
}

class HooverObj extends Obj {
	inst: Hoover
	hue = 0

	constructor(hoover: Hoover, opts: ObjOpts) {
		super(opts)
		this.inst = hoover
	}

	every = 0
	ff = 0.0
	drawFunc = (pg: p5.Graphics) => {
		pg.rotateX(this.ff / 59371)
		pg.rotateY(this.ff / -37523)
		pg.rotateZ(this.ff / 294783)
		const fft = this.inst.fft.getValue()
		let fftVals: number[] = []
		const fftStart = 2
		for (let ii = fftStart; ii < fft.length; ii++) {
			fftVals[ii - fftStart] = fft[ii] * ii * 100
		}
		const max = Math.max(0.001, ...fftVals)
		fftVals = fftVals.map(ff => ff / max).filter(ff => ff > 0.05)
		const vals = this.inst.wave.getValue().filter(vv => Math.abs(vv) > 0.0005)

		// Draw waveform lasers, with colors modulated by fft values
		pg.colorMode(pg.HSL, 1)
		pg.noFill().strokeWeight(3)
		for (let ii = 0; ii < vals.length; ii++) {
			const val = vals[ii] * 2000
			this.ff++
			const ff = this.ff % fftVals.length || 0
			const hh = ((ff / fft.length) * 6.7 + ((this.ff / 100000) % 1.0)) % 1.0
			const ss = (fftVals[ff] || 0) / 2 + 0.5
			pg.stroke(hh, ss, 0.5)
			pg.rotateZ((Math.PI * 2) / vals.length)
			pg.line(0, 0, 0, val)
		}
		pg.rotateX(-Math.PI / 2)
		for (let ii = 0; ii < vals.length; ii++) {
			const val = vals[ii] * 2000
			this.ff++
			const ff = this.ff % fftVals.length || 0
			const hh = ((ff / fft.length) * 6.7 + ((this.ff / 100000) % 1.0)) % 1.0
			const ss = (fftVals[ff] || 0) / 2 + 0.5
			pg.stroke(hh, ss, 0.5)
			pg.rotateZ((Math.PI * 2) / vals.length)
			pg.line(0, 0, 0, val)
		}
		pg.rotateY(-Math.PI / 2)
		for (let ii = 0; ii < vals.length; ii++) {
			const val = vals[ii] * 2000
			this.ff++
			const ff = this.ff % fftVals.length || 0
			const hh = ((ff / fft.length) * 6.7 + ((this.ff / 100000) % 1.0)) % 1.0
			const ss = (fftVals[ff] || 0) / 2 + 0.5
			pg.stroke(hh, ss, 0.5)
			pg.rotateZ((Math.PI * 2) / vals.length)
			pg.line(0, 0, 0, val)
		}
	}
}
