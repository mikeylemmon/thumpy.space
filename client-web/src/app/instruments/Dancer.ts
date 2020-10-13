import { MidiEventCC, MidiEventNote, MidiEventPitchbend } from '../MIDI'
import { Instrument } from '../Instrument'
import { Avatar } from 'engine3d'

export class Dancer extends Instrument {
	loaded() {
		return true
	}

	lr = -1
	noteon = (avatar: Avatar, time: number, evt: MidiEventNote) => {
		avatar.dancer.moves.noteEvent(time, evt)
	}

	noteoff = (avatar: Avatar, time: number, evt: MidiEventNote) => {
		avatar.dancer.moves.noteEvent(time, evt)
	}

	// controlchange = (avatar: Avatar, time: number, evt: MidiEventCC) => {}
	// pitchbend = (avatar: Avatar, time: number, evt: MidiEventPitchbend) => {}
}
