import * as Tone from 'tone'
import { MidiEventCC, MidiEventNote, MidiEventPitchbend } from '../MIDI'
import { Instrument } from '../Instrument'
import { Avatar } from 'engine3d'

export class Dancer extends Instrument {
	constructor() {
		super()
	}

	loaded() {
		return true
	}

	lr = -1
	noteon = (avatar: Avatar, time: number, evt: MidiEventNote) => {
		// avatar.dancer.moves.dipOn(time, evt.attack)
		avatar.dancer.moves.noteEvent(time, evt)
	}

	noteoff = (avatar: Avatar, time: number, evt: MidiEventNote) => {
		// avatar.dancer.moves.dipOff(time)
		avatar.dancer.moves.noteEvent(time, evt)
	}

	// controlchange = (avatar: Avatar, time: number, evt: MidiEventCC) => {
	// 	let delayed: (() => void) | null = null
	// 	switch (evt.controller.number) {
	// 	}
	// 	if (delayed) {
	// 		Tone.Draw.schedule(delayed, time)
	// 	}
	// }
	//
	// pitchbend = (avatar: Avatar, time: number, evt: MidiEventPitchbend) => {
	// 	Tone.Draw.schedule(() => {}, time)
	// }
}
