import { Avatar } from 'engine3d'
import { MidiEventCC, MidiEventNote } from '../MIDI'
import { Instrument } from '../Instrument'
import { InstControl } from '../InstControls'
import { sketch } from '../Sketch'

export class Dancer extends Instrument {
	constructor() {
		super()
		this.ctrls.sliders = [
			new InstControl({ label: 'mod', ctrl: 1, value: 0.0 }), // color of the dancer
			new InstControl({ label: 'a', ctrl: 71, value: 0.25 }), // unit = beats
			new InstControl({ label: 'd', ctrl: 72, value: 0.25 }), // unit = beats
			new InstControl({ label: 's', ctrl: 73, value: 1.0 }),
			new InstControl({ label: 'r', ctrl: 74, value: 0.5 }), // unit = beats
			new InstControl({ label: 'vol', ctrl: 28, value: 0.5 }), // amplitude of movements
		]
	}

	loaded() {
		return true
	}

	lr = -1
	noteon = (avatar: Avatar, time: number, evt: MidiEventNote) => {
		avatar.dancer.noteEvent(time, evt)
	}

	noteoff = (avatar: Avatar, time: number, evt: MidiEventNote) => {
		avatar.dancer.noteEvent(time, evt)
	}

	controlchange(avatar: Avatar, time: number, evt: MidiEventCC) {
		avatar.dancer.handleCC({
			evt,
			ctrls: this.ctrls,
			localUser: avatar === sketch.avatar,
			time,
		})
	}
}
