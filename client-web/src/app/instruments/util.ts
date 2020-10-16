import * as Tone from 'tone'
import { Vec } from 'engine3d'

export function noteFreq(note: number) {
	return Tone.Frequency(note, 'midi').toFrequency()
}

export const srand = () => Math.random() * 2 - 1

export const srandVec = () => new Vec(srand(), srand(), srand())
