import * as Tone from 'tone'
import { Vec } from 'engine3d'
import seedrandom from 'seedrandom'

export function noteFreq(note: number) {
	return Tone.Frequency(note, 'midi').toFrequency()
}

export const srand = () => Math.random() * 2 - 1
export const srandVec = () => new Vec(srand(), srand(), srand())
export const mix = (aa: number, bb: number, xx: number) => {
	return bb * xx + aa * (1 - xx)
}

const _ctrlColorMemo: { [key: string]: number } = {}
export const ctrlColor = (ctrl: string) => {
	const sat = 0.8,
		lgt = 0.4
	if (_ctrlColorMemo[ctrl]) {
		return { hue: _ctrlColorMemo[ctrl], sat, lgt }
	}
	// override seed for some ctrls if their default color is too close to others
	let seed = ctrl
	switch (ctrl) {
		case '21':
			seed = '21###'
			break
		case '22':
			seed = '22&$&'
			break
		case '73':
			seed = '73##'
			break
		case '77':
			seed = '77#'
			break
	}
	_ctrlColorMemo[ctrl] = seedrandom(seed).quick()
	return {
		hue: _ctrlColorMemo[ctrl],
		sat,
		lgt,
	}
}
