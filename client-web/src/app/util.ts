import * as Tone from 'tone'
import { Vec } from 'engine3d'
import seedrandom from 'seedrandom'

export function noteFreq(note: number) {
	return Tone.Frequency(note, 'midi').toFrequency()
}

export const srand = () => Math.random() * 2 - 1

export const srandVec = () => new Vec(srand(), srand(), srand())

export const ctrlColor = (ctrl: string) => {
	// override seed for some ctrls if their default color is too close to others
	let seed = ctrl
	switch (ctrl) {
		case '73':
			seed = '73##'
			break
		case '77':
			seed = '77#'
			break
	}
	return {
		hue: seedrandom(seed).quick(),
		sat: 0.8,
		lgt: 0.4,
	}
}
