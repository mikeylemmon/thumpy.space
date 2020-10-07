import { MidiEventCC, MidiEventNote, MidiEventPitchbend } from './MIDI'

export class Instrument {
	loaded() { return false }
	noteon(_time: number, _evt: MidiEventNote) {}
	noteoff(_time: number, _evt: MidiEventNote) {}
	controlchange(_time: number, _evt: MidiEventCC) {}
	pitchbend(_time: number, _evt: MidiEventPitchbend) {}
}
