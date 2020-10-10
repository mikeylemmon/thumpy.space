import { Avatar } from 'engine3d'
import { MidiEventCC, MidiEventNote, MidiEventPitchbend } from './MIDI'

export class Instrument {
	loaded() {
		return false
	}
	noteon(_avatar: Avatar, _time: number, _evt: MidiEventNote) {}
	noteoff(_avatar: Avatar, _time: number, _evt: MidiEventNote) {}
	controlchange(_avatar: Avatar, _time: number, _evt: MidiEventCC) {}
	pitchbend(_avatar: Avatar, _time: number, _evt: MidiEventPitchbend) {}
}
