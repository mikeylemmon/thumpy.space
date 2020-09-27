import { MidiEvent, MidiEventCC, MidiEventNote, MidiEventPitchbend } from './MIDI'

export interface AudioInstrument {
	noteon: (evt: MidiEventNote) => void
	noteoff: (evt: MidiEventNote) => void
	controlchange: (evt: MidiEventCC) => void
	pitchbend: (evt: MidiEventPitchbend) => void
}

export default class Instrument {
	audioInst: AudioInstrument

	constructor(audioInst: AudioInstrument) {
		this.audioInst = audioInst
	}

	noteon = (evt: MidiEventNote) => {
		this.audioInst.noteon(evt)
	}

	noteoff = (evt: MidiEventNote) => {
		this.audioInst.noteoff(evt)
	}

	controlchange = (evt: MidiEventCC) => {
		this.audioInst.controlchange(evt)
	}

	pitchbend = (evt: MidiEventPitchbend) => {
		this.audioInst.pitchbend(evt)
	}
}
