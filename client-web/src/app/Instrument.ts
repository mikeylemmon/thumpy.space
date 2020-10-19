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
		sliders: {
			// pitch: new Slider({ label: 'PB', ctrl: 0 }),
			mod: new InstSlider({ label: 'mod', ctrl: 1 }),
			a: new InstSlider({ label: 'a', ctrl: 71 }),
			d: new InstSlider({ label: 'd', ctrl: 72 }),
			s: new InstSlider({ label: 's', ctrl: 73 }),
			r: new InstSlider({ label: 'r', ctrl: 74 }),
			// pan: new InstSlider({ label: 'pan', ctrl: 27 }),
			vol: new InstSlider({ label: 'vol', ctrl: 28 }),
		},
	})
	envelope?: Tone.Envelope
	panVol?: Tone.PanVol

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
			this.updateValForCtrl(cc)
		}, time)
	}
	pitchbend(_avatar: Avatar, _time: number, _evt: MidiEventPitchbend) {}

	updateValsFromSliders() {
		for (const key in this.ctrls.sliders) {
			const ss = this.ctrls.sliders[key]
			this.updateValForCtrl({ slider: ss })
		}
	}

	updateValForCtrl(cc: ControlChange) {
		const { slider } = cc
		if (!slider) {
			return
		}
		const { label } = slider
		let vv = slider.value.value
		if (label === 'vol') {
			if (this.panVol) {
				this.panVol.mute = !vv
				this.panVol.set({ volume: vv * 66 - 60 })
			}
			return
		}
		// Apply ADSR val to envelope
		if (!this.envelope) {
			return
		}
		if (['a', 'd', 'r'].includes(label)) {
			vv = 10 * vv * vv * vv * vv
		}
		switch (label) {
			case 'a':
				this.envelope.attack = vv
				break
			case 'd':
				this.envelope.decay = vv
				break
			case 's':
				this.envelope.sustain = vv
				break
			case 'r':
				this.envelope.release = vv
				break
		}
		return
	}
}
