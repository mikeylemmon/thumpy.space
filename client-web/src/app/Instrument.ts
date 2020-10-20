import * as Tone from 'tone'
import { Avatar } from 'engine3d'
import { MidiEventCC, MidiEventNote, MidiEventPitchbend } from './MIDI'
import { InstControl, InstControls } from './InstControls'

export type ControlChange = {
	avatar?: Avatar
	evt?: MidiEventCC
	slider?: InstControl
}

export type ADSR = Partial<{
	attack: number
	decay: number
	sustain: number
	release: number
}>

export type FilterProps = Partial<{
	frequency: number
	Q: number
}>

export class Instrument {
	ctrls = new InstControls({
		sliders: [
			new InstControl({ label: 'pb', ctrl: -1, pitchbend: true }),
			new InstControl({ label: 'mod', ctrl: 1, value: 0.0 }),
			new InstControl({ label: 'ff', ctrl: 21, value: 0.67 }), // Filter freq
			new InstControl({ label: 'fq', ctrl: 22, value: 0.0 }), // Filter Q
			new InstControl({ label: 'a', ctrl: 71, value: 0.05 }),
			new InstControl({ label: 'd', ctrl: 72, value: 0.1 }),
			new InstControl({ label: 's', ctrl: 73, value: 1.0 }),
			new InstControl({ label: 'r', ctrl: 74, value: 0.4 }),
			new InstControl({ label: 'pan', ctrl: 27, value: 0.5 }),
			new InstControl({ label: 'vol', ctrl: 28, value: 0.857 }),
		],
	})
	panVol?: Tone.PanVol // automatically bound to pan/vol sliders
	handleDetune?: (val: number) => void // called when pitchbend control changes
	handleModwheel?: (val: number) => void // called when modwheel control changes
	handleFilter?: (props: FilterProps) => void // called when filter controls change
	handleADSR?: (props: ADSR) => void // called when ADSR controls change

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

	pitchbend(avatar: Avatar, time: number, evt: MidiEventPitchbend) {
		this.ctrls.pitchbendNext(evt)
		Tone.Draw.schedule(() => {
			const slider = this.ctrls.pitchbend(evt)
			const cc = { avatar, evt, slider } as ControlChange
			this.handlePitchbend(cc)
		}, time)
	}

	handleCC(cc: ControlChange) {
		const { slider } = cc
		if (!slider) {
			return
		}
		const { label, pitchbend } = slider
		if (pitchbend) {
			if (this.handlePitchbend) {
				this.handlePitchbend(cc)
			}
			return
		}
		let vv = slider.value.value

		if (label === 'mod') {
			if (this.handleModwheel) {
				this.handleModwheel(vv)
			}
			return
		}

		if (['ff', 'fq'].includes(label)) {
			if (this.handleFilter) {
				if (label === 'ff') {
					this.handleFilter({ frequency: Math.pow(10, vv * 3 + 1) }) // 10 to 10000
				} else {
					this.handleFilter({ Q: vv * vv * 8 })
				}
			}
			return
		}

		// Apply ADSR val to envelope
		if (['a', 'd', 's', 'r'].includes(label)) {
			if (!this.handleADSR) {
				return
			}
			if (['a', 'd', 'r'].includes(label)) {
				vv = 10 * vv * vv * vv * vv + 0.0001
			} else {
				vv *= vv
			}
			switch (label) {
				case 'a':
					this.handleADSR({ attack: vv })
					break
				case 'd':
					this.handleADSR({ decay: vv })
					break
				case 's':
					this.handleADSR({ sustain: vv })
					break
				case 'r':
					this.handleADSR({ release: vv })
					break
			}
			return
		}

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
	}

	handlePitchbend = (cc: ControlChange) => {
		if (!this.handleDetune) {
			return
		}
		const { evt, slider } = cc
		if (slider) {
			this.handleDetune(slider.value.value)
			return
		}
		if (evt) {
			this.handleDetune(evt.value)
			return
		}
	}
}
