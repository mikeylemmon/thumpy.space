import * as Tone from 'tone'
import { Avatar } from 'engine3d'
import { Sampler } from './Sampler'
import { MidiEventNote } from '../MIDI'
import { noteFreq } from '../util'
import Sketch from '../Sketch'

const samps = ['MA.WAV', 'RS.WAV']

function metronome() {
	const urls: { [key: number]: string } = {}
	for (let ii = 0; ii < samps.length; ++ii) {
		urls[ii] = samps[ii % samps.length]
	}
	return new Tone.Sampler({
		urls,
		release: 1,
		baseUrl: '/samples/808/',
	})
}

export class Metronome extends Sampler {
	sketch: Sketch

	constructor(sketch: Sketch) {
		super(metronome())
		this.sketch = sketch
		this.panVol.set({ volume: -10 })
		this.panVol.mute = true
	}

	modNote(note: number) {
		return note % samps.length
	}

	noteon = (_avatar: Avatar, time: number, note: MidiEventNote) => {
		let nn = this.modNote(note.note)
		this.sampler.triggerAttack(noteFreq(nn), time, note.attack)
	}

	noteoff = (_avatar: Avatar, time: number, note: MidiEventNote) => {
		let nn = this.modNote(note.note)
		this.sampler.triggerRelease(noteFreq(nn), time)
	}
}
