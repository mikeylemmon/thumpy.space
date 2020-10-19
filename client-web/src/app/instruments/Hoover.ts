import * as Tone from 'tone'
import { MidiEventCC, MidiEventNote, MidiEventPitchbend } from '../MIDI'
import { ControlChange, Instrument } from '../Instrument'
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
	attacks = 0
	obj: Obj
	wave: Tone.Waveform
	fft: Tone.FFT

	constructor() {
		super()
		for (const key in this.ctrls.sliders) {
			// set default values for controls
			const ss = this.ctrls.sliders[key]
			const vv = ss.value
			switch (key) {
				case 'mod':
					vv.value = ss.valueNext = 0.0
					break
				case 'a':
					vv.value = ss.valueNext = 0.6
					break
				case 'd':
					vv.value = ss.valueNext = 0.07
					break
				case 's':
					vv.value = ss.valueNext = 1.0
					break
				case 'r':
					vv.value = ss.valueNext = 0.6
					break
				case 'vol':
					vv.value = ss.valueNext = 0.9
					break
			}
		}

		this.panVol = new Tone.PanVol(0, 0).toDestination()
		this.chorus = new Tone.Chorus(0.15, 30, 1).connect(this.panVol)
		this.filter = new Tone.Filter({
			type: 'bandpass',
			frequency: 1000,
			Q: 0,
		}).connect(this.chorus)
		this.amGain = new Tone.Gain(1).connect(this.filter)
		this.synth = new Tone.Synth({
			oscillator: {
				type: 'fatsawtooth',
				count: 4,
				spread: 59,
			},
			portamento: 0.25,
		}).connect(this.amGain)
		this.envelope = this.synth.envelope
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

		this.updateValsFromSliders()
	}

	updateValForCtrl(cc: ControlChange) {
		super.updateValForCtrl(cc)
		const { evt, slider } = cc

		if (slider && slider.label === 'mod') {
			this.updateModwheel(slider.value.value)
			return
		}

		// Handle customized control events
		if (!evt) {
			return
		}
		const num = evt.controller.number
		let vv = evt.value * evt.value
		switch (true) {
			case num === 21:
				this.harmonicity.value = vv * 20
				break
			case num === 22:
				this.filter.frequency.rampTo(20 + 10000 * vv, 0.005)
				break
			case num === 23:
				this.filter.set({ Q: vv * 8 })
				break
			case num === 24:
				this.synth.set({ portamento: vv * 2 })
				break
			// case num === 26:
			// 	delayed = () => {
			// 		this.psSpread = evt.value * 12
			// 		this.updatePitchbend()
			// 	}
			// 	break
			case num === 27:
				this.panVol.set({ pan: evt.value * 2 - 1 })
				break
			// case 71 <= num && num <= 74: {
			// 	let vv = evt.value * evt.value * evt.value * evt.value
			// 	const key = ['attack', 'decay', 'sustain', 'release'][num - 71]
			// 	delayed = () => {
			// 		vv = key === 'sustain' ? evt.value : 10 * vv
			// 		;(this as any)[key] = vv
			// 		this.synth.envelope.set({ [key]: vv })
			// 	}
			// 	break
			// }
			case 75 <= num && num <= 79:
				this.panVol.mute = !evt.value
				this.panVol.set({ volume: (evt.value - 1) * 50 })
				break
			case 15 <= num && num <= 19:
				this.panVol.mute = !evt.value
				break
			default:
			// console.log(
			// 	`[Hoover #controlchange] Unsupported CC event on channel ${evt.channel}:`,
			// 	evt.controller,
			// 	evt.value,
			// )
		}
	}

	loaded() {
		return true
	}

	noteon = (_avatar: Avatar, time: number, evt: MidiEventNote) => {
		this.freq = noteFreq(evt.note) / 2
		try {
			if (this.attacks) {
				this.synth.setNote(this.freq, time)
			} else {
				this.synth.triggerAttack(this.freq, time, evt.attack)
			}
		} catch {}
		this.attacks++
	}

	noteoff = (_avatar: Avatar, time: number, _evt: MidiEventNote) => {
		this.attacks = Math.max(0, this.attacks - 1)
		if (!this.attacks) {
			this.synth.triggerRelease(time)
		}
	}

	// controlchange = (avatar: Avatar, time: number, evt: MidiEventCC) => {
	// 	const num = evt.controller.number
	// 	let delayed: (() => void) | undefined = undefined
	// 	super.controlchange(avatar, time, evt, () => {
	// 		// callback runs at time
	// 		this.updateValForCtrl(num)
	// 		if (delayed) {
	// 			delayed()
	// 		}
	// 	})
	// 	switch (true) {
	// 		// case num === 1:
	// 		// 	delayed = () => {
	// 		// 		this.updateModwheel(evt.value)
	// 		// 	}
	// 		// 	break
	// 		case num === 21:
	// 			delayed = () => {
	// 				const vv = evt.value * evt.value
	// 				this.harmonicity.value = vv * 20
	// 			}
	// 			break
	// 		case num === 22:
	// 			delayed = () => {
	// 				const vv = evt.value * evt.value
	// 				this.filter.frequency.rampTo(20 + 10000 * vv, 0.005)
	// 			}
	// 			break
	// 		case num === 23:
	// 			delayed = () => {
	// 				const vv = evt.value * evt.value
	// 				this.filter.set({ Q: vv * 8 })
	// 			}
	// 			break
	// 		case num === 24:
	// 			delayed = () => {
	// 				const vv = evt.value * evt.value
	// 				this.synth.set({ portamento: vv * 2 })
	// 			}
	// 			break
	// 		// case num === 26:
	// 		// 	delayed = () => {
	// 		// 		this.psSpread = evt.value * 12
	// 		// 		this.updatePitchbend()
	// 		// 	}
	// 		// 	break
	// 		case num === 27:
	// 			delayed = () => {
	// 				this.panVol.set({ pan: evt.value * 2 - 1 })
	// 			}
	// 			break
	// 		// case 71 <= num && num <= 74: {
	// 		// 	let vv = evt.value * evt.value * evt.value * evt.value
	// 		// 	const key = ['attack', 'decay', 'sustain', 'release'][num - 71]
	// 		// 	delayed = () => {
	// 		// 		vv = key === 'sustain' ? evt.value : 10 * vv
	// 		// 		;(this as any)[key] = vv
	// 		// 		this.synth.envelope.set({ [key]: vv })
	// 		// 	}
	// 		// 	break
	// 		// }
	// 		case 75 <= num && num <= 79:
	// 			delayed = () => {
	// 				this.panVol.mute = !evt.value
	// 				this.panVol.set({ volume: (evt.value - 1) * 50 })
	// 			}
	// 			break
	// 		case 15 <= num && num <= 19:
	// 			delayed = () => {
	// 				this.panVol.mute = !evt.value
	// 			}
	// 			break
	// 		default:
	// 		// console.log(
	// 		// 	`[Hoover #controlchange] Unsupported CC event on channel ${evt.channel}:`,
	// 		// 	evt.controller,
	// 		// 	evt.value,
	// 		// )
	// 	}
	// 	// if (delayed) {
	// 	// 	Tone.Draw.schedule(delayed, time)
	// 	// }
	// }

	pitchbend = (_avatar: Avatar, time: number, evt: MidiEventPitchbend) => {
		Tone.Draw.schedule(() => {
			this.ps = evt.value
			this.updatePitchbend()
		}, time)
	}

	updateModwheel = (val: number) => {
		const sin = Math.sin(val * Math.PI)
		let ss = 1 - sin
		ss = 1 - ss * ss
		const vv = Math.pow(2, Math.floor((1 - val) * 32) / 8 - 1)
		this.harmonicity.value = vv
		this.filter.Q.value = sin * sin * sin * 1.0
		this.filter.frequency.value = Math.pow(10, (1 - val) * 3 + 1)
		if (val < 0.5) {
			this.amOsc.volume.value = ss * 60 - 60
		} else {
			this.amOsc.volume.value = 0
		}
	}

	updatePitchbend = () => {
		this.synth.set({ detune: 100 * this.ps * this.psSpread })
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
		const vals = this.inst.wave.getValue()

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
