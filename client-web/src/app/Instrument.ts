import * as Tone from 'tone'
import { Avatar } from 'engine3d'
import { MidiEventCC, MidiEventNote, MidiEventPitchbend } from './MIDI'
import { InstSlider, InstSliders } from './InstSliders'

export type ControlChange = {
	avatar?: Avatar
	evt?: MidiEventCC
	slider?: InstSlider
}

export class Instrument {
	ctrls = new InstSliders({
		sliders: [
			// new Slider({ label: 'pb', ctrl: 0, value: 0.0, signed: true }),
			new InstSlider({ label: 'mod', ctrl: 1, value: 0.0 }),
			new InstSlider({ label: 'a', ctrl: 71, value: 0.05 }),
			new InstSlider({ label: 'd', ctrl: 72, value: 0.1 }),
			new InstSlider({ label: 's', ctrl: 73, value: 1.0 }),
			new InstSlider({ label: 'r', ctrl: 74, value: 0.4 }),
			new InstSlider({ label: 'pan', ctrl: 27, value: 0.5 }),
			new InstSlider({ label: 'vol', ctrl: 28, value: 0.857 }),
		],
	})
	envelope?: any // automatically bound to ADSR sliders if set by subclass
	panVol?: Tone.PanVol // automatically bound to pan/vol sliders if set by subclass

	loaded() {
		return false
	}
	noteon(_avatar: Avatar, _time: number, _evt: MidiEventNote) {}
	noteoff(_avatar: Avatar, _time: number, _evt: MidiEventNote) {}
	controlchange(avatar: Avatar, time: number, evt: MidiEventCC) {
		this.ctrls.controlchangeNext(evt)
		Tone.Draw.schedule(() => {
			const slider = this.ctrls.controlchange(evt)
			const cc = { avatar, evt, slider }
			this.handleCC(cc)
		}, time)
	}
	pitchbend(_avatar: Avatar, _time: number, _evt: MidiEventPitchbend) {}

	handleCC(cc: ControlChange) {
		const { slider } = cc
		if (!slider) {
			return
		}
		const { label } = slider
		let vv = slider.value.value
		if (label === 'vol') {
			if (this.panVol) {
				this.panVol.mute = !vv
				this.panVol.set({ volume: vv * 70 - 60 })
			}
			return
		}
		if (label === 'pan') {
			if (this.panVol) {
				this.panVol.set({ pan: vv * 2 - 1 })
			}
			return
		}

		// // TODO: default filter bindings
		// case num === 21:
		// 	vv = Math.pow(10, evt.value * 3 + 1) // 10 to 10000
		// 	this.filter.frequency.rampTo(vv, 0.005)
		// 	break
		// case num === 22:
		// 	this.filter.set({ Q: vv * 8 })
		// 	break

		// Apply ADSR val to envelope
		if (!this.envelope || !this.envelope.set) {
			return
		}
		if (['a', 'd', 'r'].includes(label)) {
			vv = 10 * vv * vv * vv * vv + 0.0001
		}
		switch (label) {
			case 'a':
				this.envelope.set({ attack: vv })
				break
			case 'd':
				this.envelope.set({ decay: vv })
				break
			case 's':
				this.envelope.set({ sustain: vv * vv })
				break
			case 'r':
				this.envelope.set({ release: vv })
				break
		}
		return
	}
}
