import * as Tone from 'tone'
import { MidiEventCC, MidiEventNote, MidiEventPitchbend } from '../MIDI'
import { Instrument } from '../Instrument'
import { noteFreq } from './util'

export class Sampler extends Instrument {
	sampler: Tone.Sampler
	pitchShift: Tone.PitchShift
	ps = 0
	psSpread = 7

	constructor(sampler: Tone.Sampler) {
		super()
		this.pitchShift = new Tone.PitchShift().toDestination()
		this.sampler = sampler.connect(this.pitchShift)
	}

	loaded() { return this.sampler.loaded }

	noteon = (time: number, evt: MidiEventNote) => {
		this.sampler.triggerAttack(noteFreq(evt.note), time, evt.attack)
	}
	noteoff = (time: number, evt: MidiEventNote) => {
		this.sampler.triggerRelease(noteFreq(evt.note), time)
	}
	controlchange = (time: number, evt: MidiEventCC) => {
		if (evt.controller.number === 1) {
			Tone.Draw.schedule(() => {
				this.psSpread = evt.value * 12
				this.pitchShift.pitch = this.ps * this.psSpread
			}, time)
		} else {
			console.log('[Sampler #controlchange] Unsupported controller', evt.controller)
		}
	}
	pitchbend = (time: number, evt: MidiEventPitchbend) => {
		Tone.Draw.schedule(() => {
			this.ps = evt.value
			this.pitchShift.pitch = this.ps * this.psSpread
		}, time)
	}
}
