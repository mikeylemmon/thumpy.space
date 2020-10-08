import * as Tone from 'tone'
import { MidiEventCC, MidiEventNote, MidiEventPitchbend } from '../MIDI'
import { Instrument } from '../Instrument'
import { noteFreq } from './util'

export class PolySynth extends Instrument {
	synth: Tone.PolySynth
	filter: Tone.Filter
	filterVol: Tone.Volume
	reverb: Tone.Reverb
	panVol: Tone.PanVol
	ps = 0
	psSpread = 7

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
		// this.setFilterGain(5)
		this.synth = new Tone.PolySynth(Tone.Synth, {
			oscillator: {
				type: 'fatsawtooth',
				count: 3,
				spread: 30,
			},
			envelope: {
				attack: 0.02,
				decay: 0.1,
				sustain: 0.7,
				release: 1.0,
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

	noteon = (time: number, evt: MidiEventNote) => {
		this.synth.triggerAttack(noteFreq(evt.note), time, evt.attack)
	}
	noteoff = (time: number, evt: MidiEventNote) => {
		this.synth.triggerRelease(noteFreq(evt.note), time)
	}

	controlchange = (time: number, evt: MidiEventCC) => {
		const num = evt.controller.number
		let delayed: (() => void) | null = null
		switch (true) {
			case num === 1:
				delayed = () => {
					const vv = evt.value * evt.value
					this.filter.set({ frequency: 20 + 10000 * vv })
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

	pitchbend = (time: number, evt: MidiEventPitchbend) => {
		Tone.Draw.schedule(() => {
			this.ps = evt.value
			this.updatePitchbend()
		}, time)
	}

	updatePitchbend = () => {
		this.synth.set({ detune: 100 * this.ps * this.psSpread })
	}
}
