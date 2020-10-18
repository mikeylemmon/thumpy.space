import * as Tone from 'tone'
import { MidiEventCC, MidiEventNote, MidiEventPitchbend } from '../MIDI'
import { Instrument } from '../Instrument'
import { noteFreq } from './util'
import { Avatar } from 'engine3d'

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
	gain: Tone.Gain
	synth: Tone.Synth
	amOsc: Tone.OmniOscillator<Tone.FatOscillator>
	panVol: Tone.PanVol
	ps = 0
	psSpread = 7
	attack = 0.01
	decay = 0.07
	sustain = 1.0
	release = 0.3
	modwheel = 0.0
	harmonicity = new Tone.Multiply(3.03)
	freq = 440
	attacks = 0

	constructor() {
		super()
		this.panVol = new Tone.PanVol(0, 0).toDestination()
		this.chorus = new Tone.Chorus(0.15, 30, 1).connect(this.panVol)
		this.filter = new Tone.Filter({
			type: 'bandpass',
			frequency: 1000,
			Q: 0,
		}).connect(this.chorus)
		this.gain = new Tone.Gain(1).connect(this.filter)
		this.synth = new Tone.Synth({
			oscillator: {
				type: 'fatsawtooth',
				count: 4,
				spread: 59,
			},
			portamento: 0.25,
			envelope: {
				attack: this.attack,
				decay: this.decay,
				sustain: this.sustain,
				release: this.release,
			},
		}).connect(this.gain)
		const modScale = new Tone.AudioToGain().connect(this.gain.gain)
		this.amOsc = new Tone.OmniOscillator({
			type: 'fatsquare',
			count: 3,
			spread: 30,
		})
			.start()
			.connect(modScale)
		this.synth.frequency.chain(this.harmonicity, this.amOsc.frequency)
		this.updateModwheel(this.modwheel)
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

	controlchange = (_avatar: Avatar, time: number, evt: MidiEventCC) => {
		const num = evt.controller.number
		let delayed: (() => void) | null = null
		switch (true) {
			case num === 1:
				delayed = () => {
					this.updateModwheel(evt.value)
				}
				break
			case num === 21:
				delayed = () => {
					const vv = evt.value * evt.value
					this.harmonicity.value = vv * 20
				}
				break
			case num === 22:
				delayed = () => {
					const vv = evt.value * evt.value
					this.filter.frequency.rampTo(20 + 10000 * vv, 0.005)
				}
				break
			case num === 23:
				delayed = () => {
					const vv = evt.value * evt.value
					this.filter.set({ Q: vv * 8 })
				}
				break
			case num === 24:
				delayed = () => {
					const vv = evt.value * evt.value
					this.synth.set({ portamento: vv * 2 })
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
			// 	`[Hoover #controlchange] Unsupported CC event on channel ${evt.channel}:`,
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

	updateModwheel = (val: number) => {
		this.modwheel = val
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
