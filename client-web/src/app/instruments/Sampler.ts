import * as Tone from 'tone'
import { Avatar } from 'engine3d'
import { MidiEventNote } from '../MIDI'
import { FilterProps, Instrument } from '../Instrument'
import { InstSlider } from '../InstSliders'
import { noteFreq } from '../util'

export class Sampler extends Instrument {
	panVol: Tone.PanVol
	filter: Tone.Filter
	pitchShift: Tone.PitchShift
	sampler: Tone.Sampler
	ps = 0
	psSpread = 7

	constructor(sampler: Tone.Sampler) {
		super()
		this.panVol = new Tone.PanVol(0, 0).toDestination()
		this.filter = new Tone.Filter({ type: 'bandpass' }).connect(this.panVol)
		this.pitchShift = new Tone.PitchShift().connect(this.filter)
		this.sampler = sampler.connect(this.pitchShift)
		this.ctrls.sliders = [
			new InstSlider({ label: 'pb', ctrl: -1, pitchbend: true }),
			new InstSlider({ label: 'mod', ctrl: 1, value: 0.0 }),
			new InstSlider({ label: 'ff', ctrl: 21, value: 0.67 }),
			new InstSlider({ label: 'fq', ctrl: 22, value: 0.0 }),
			new InstSlider({ label: 'pan', ctrl: 27, value: 0.5 }),
			new InstSlider({ label: 'vol', ctrl: 28, value: 0.857 }),
		]
		for (const ss of this.ctrls.sliders) {
			this.handleCC({ slider: ss })
		}
	}

	loaded() {
		return this.sampler.loaded
	}

	noteon = (_avatar: Avatar, time: number, evt: MidiEventNote) => {
		this.sampler.triggerAttack(noteFreq(evt.note), time, evt.attack)
	}

	noteoff = (_avatar: Avatar, time: number, evt: MidiEventNote) => {
		this.sampler.triggerRelease(noteFreq(evt.note), time)
	}

	handleDetune = (val: number) => {
		this.ps = val
		this.pitchShift.pitch = this.ps * this.psSpread
	}

	handleModwheel = (val: number) => {
		// bind modwheel to filter freq and Q
		const ff = this.ctrls.getSliderForLabel('ff')
		if (ff) {
			ff.set(val)
			this.handleCC({ slider: ff })
		}
		const fq = this.ctrls.getSliderForLabel('fq')
		if (fq) {
			const sin = Math.sin(val * Math.PI)
			let vv = 1 - val
			vv = 1 - vv * vv * vv
			fq.set(sin * 0.2 + 0 + 0.2 * vv)
			this.handleCC({ slider: fq })
		}
	}

	handleFilter = (props: FilterProps) => this.filter.set(props)
}
