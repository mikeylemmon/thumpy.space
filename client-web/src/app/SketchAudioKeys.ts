import AudioKeys from 'audiokeys'
import Sketch from './Sketch'
import { MidiEvent } from './MIDI'

type AudioKeysEvent = {
	// the midi number of the note
	note: number
	// the keyCode of the key being pressed down
	keyCode: number
	// the frequency of the note
	frequency: number
	// on note down: the current velocity (this can only be set when rows = 1)
	// on note up: 0
	velocity: number
}

export  class SketchAudioKeys {
	parent: Sketch
	audioKeys: AudioKeys

	constructor(parent: Sketch) {
		this.parent = parent
		this.audioKeys = new AudioKeys({ polyphony: Infinity })
		this.audioKeys.down(this.keyPressed)
		this.audioKeys.up(this.keyReleased)
	}

	keyPressed = (evt: AudioKeysEvent) => {
		const { note, velocity } = evt
		if (this.parent.keyboardInputDisabled()) {
			return
		}
		if (this.parent.user.inputDevice !== 'keyboard') {
			return
		}
		const midiEvt = { kind: 'noteon', note: note, attack: velocity / 128.0 } as MidiEvent
		this.parent.onMIDI('keyboard', 'noteon', midiEvt)
	}

	keyReleased = (evt: AudioKeysEvent) => {
		const { note } = evt
		if (this.parent.keyboardInputDisabled()) {
			return
		}
		if (this.parent.user.inputDevice !== 'keyboard') {
			return
		}
		const midiEvt = { kind: 'noteoff', note: note } as MidiEvent
		this.parent.onMIDI('keyboard', 'noteoff', midiEvt)
	}

}
