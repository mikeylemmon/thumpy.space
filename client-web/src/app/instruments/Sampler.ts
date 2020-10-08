import * as Tone from 'tone'
import { MidiEventCC, MidiEventNote, MidiEventPitchbend } from '../MIDI'
import { Instrument } from '../Instrument'
import { noteFreq } from './util'

export class Sampler extends Instrument {
	sampler: Tone.Sampler
	pitchShift: Tone.PitchShift
	panVol: Tone.PanVol
	ps = 0
	psSpread = 7

	constructor(sampler: Tone.Sampler) {
		super()
		this.panVol = new Tone.PanVol(0, 0).toDestination()
		this.pitchShift = new Tone.PitchShift().connect(this.panVol)
		this.sampler = sampler.connect(this.pitchShift)
	}

	loaded() {
		return this.sampler.loaded
	}

	noteon = (time: number, evt: MidiEventNote) => {
		this.sampler.triggerAttack(noteFreq(evt.note), time, evt.attack)
	}
	noteoff = (time: number, evt: MidiEventNote) => {
		this.sampler.triggerRelease(noteFreq(evt.note), time)
	}
	controlchange = (time: number, evt: MidiEventCC) => {
		const num = evt.controller.number
		let delayed: (() => void) | null = null
		switch (true) {
			case num === 1:
				delayed = () => {
					this.psSpread = evt.value * 12
					this.pitchShift.pitch = this.ps * this.psSpread
				}
				break
			case 75 <= num && num <= 79:
				delayed = () => {
					this.panVol.mute = !evt.value
					this.panVol.volume.value = (evt.value - 1) * 50
				}
				break
			case 15 <= num && num <= 19:
				delayed = () => {
					this.panVol.mute = !evt.value
				}
				break
			case num === 28:
				delayed = () => {
					this.panVol.pan.value = evt.value * 2 - 1
				}
				break
			default:
				console.log(
					`[Sampler #controlchange] Unsupported CC event on channel ${evt.channel}:`,
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
			this.pitchShift.pitch = this.ps * this.psSpread
		}, time)
	}
}
