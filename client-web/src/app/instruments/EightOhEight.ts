import * as Tone from 'tone'
import { Avatar } from 'engine3d'
import { Sampler } from './Sampler'
import { MidiEventNote } from '../MIDI'
import { noteFreq } from '../util'
import Sketch from '../Sketch'

const samps = [
	'BD0010.WAV',
	'BD0050.WAV',
	// 'BD0025.WAV',
	// 'BD0075.WAV',
	'SD7510.WAV',
	'CP.WAV',
	// 'SD7550.WAV',
	// 'SD7500.WAV',
	// 'SD7525.WAV',
	'CH.WAV',
	'OH10.WAV',
	'LT00.WAV',
	'MT00.WAV',
	'HT00.WAV',
	'LC00.WAV',
	'MC00.WAV',
	'HC00.WAV',
	'CB.WAV',
	'CY0075.WAV',
	// 'CY1000.WAV',
	'MA.WAV',
	'RS.WAV',
	// 'CL.WAV',
]

function eightOhEight() {
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

export class EightOhEight extends Sampler {
	sketch: Sketch

	constructor(sketch: Sketch) {
		super(eightOhEight())
		this.sketch = sketch
	}

	modNote(note: number) {
		return (note + 12) % samps.length
	}

	noteon = (_avatar: Avatar, time: number, note: MidiEventNote) => {
		let nn = this.modNote(note.note)
		this.sampler.triggerAttack(noteFreq(nn), time, note.attack)
		Tone.Draw.schedule(() => {
			// Update color of sky & ground
			const { bgCol, ground } = this.sketch
			bgCol.hue = Math.random()
			bgCol.sat = Math.random() * 0.4 + 0.5
			ground.hue = bgCol.hue
			ground.sat = bgCol.sat
			ground.lgt = bgCol.lgt * 1.35
		}, time)
	}

	noteoff = (_avatar: Avatar, time: number, note: MidiEventNote) => {
		let nn = this.modNote(note.note)
		this.sampler.triggerRelease(noteFreq(nn), time)
	}
}
