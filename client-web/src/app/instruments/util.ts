import * as Tone from 'tone'

export function noteFreq(note: number) {
	return Tone.Frequency(note, 'midi').toFrequency()
}
