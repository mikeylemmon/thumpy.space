import * as Tone from 'tone'

export function piano() {
	return new Tone.Sampler({
		urls: {
			A0: 'A0.mp3',
			C1: 'C1.mp3',
			'D#1': 'Ds1.mp3',
			'F#1': 'Fs1.mp3',
			A1: 'A1.mp3',
			C2: 'C2.mp3',
			'D#2': 'Ds2.mp3',
			'F#2': 'Fs2.mp3',
			A2: 'A2.mp3',
			C3: 'C3.mp3',
			'D#3': 'Ds3.mp3',
			'F#3': 'Fs3.mp3',
			A3: 'A3.mp3',
			C4: 'C4.mp3',
			'D#4': 'Ds4.mp3',
			'F#4': 'Fs4.mp3',
			A4: 'A4.mp3',
			C5: 'C5.mp3',
			'D#5': 'Ds5.mp3',
			'F#5': 'Fs5.mp3',
			A5: 'A5.mp3',
			C6: 'C6.mp3',
			'D#6': 'Ds6.mp3',
			'F#6': 'Fs6.mp3',
			A6: 'A6.mp3',
			C7: 'C7.mp3',
			'D#7': 'Ds7.mp3',
			'F#7': 'Fs7.mp3',
			A7: 'A7.mp3',
			C8: 'C8.mp3',
		},
		release: 1,
		baseUrl: 'https://tonejs.github.io/audio/salamander/',
	}).toDestination()
}

export function eightOhEight() {
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
	const urls: { [key: number]: string } = {}
	const start = 20
	for (let ii = start; ii < 128; ++ii) {
		urls[ii] = samps[(ii - start) % samps.length]
	}
	return new Tone.Sampler({
		urls,
		release: 1,
		baseUrl: '/samples/808/',
	}).toDestination()
}
