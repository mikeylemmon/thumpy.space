import * as Tone from 'tone'
import { Sampler } from './Sampler'
import { MidiEventNote } from '../MIDI'
import { noteFreq } from './util'
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
	}

	modNote(note: number) {
		return note % samps.length
	}

	noteon = (time: number, note: MidiEventNote) => {
		let nn = this.modNote(note.note)
		this.sampler.triggerAttack(noteFreq(nn), time, note.attack)
		if (nn % samps.length === 0) {
			// Update ground color on down beat
			Tone.Draw.schedule(() => {
				this.sketch.ground.hue = Math.random()
				this.sketch.ground.sat = Math.random() * 0.4 + 0.5
			}, time)
		} else {
			// Update sky color on other beats
			Tone.Draw.schedule(() => {
				this.sketch.bgCol.hue = Math.random()
				this.sketch.bgCol.sat = Math.random() * 0.4 + 0.5
			}, time)
		}
	}

	noteoff = (time: number, note: MidiEventNote) => {
		let nn = this.modNote(note.note)
		this.sampler.triggerRelease(noteFreq(nn), time)
	}
}
