import AudioKeys from 'audiokeys'
import Sketch from './Sketch'
import { MidiEvent } from './MIDI'
import { KEYCODE_CONTROL } from './constants'

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

export class SketchAudioKeys {
	sketch: Sketch
	audioKeys: AudioKeys

	constructor(sketch: Sketch) {
		this.sketch = sketch
		this.audioKeys = new AudioKeys({ polyphony: Infinity })
		this.audioKeys.down(this.keyPressed)
		this.audioKeys.up(this.keyReleased)
	}

	keyPressed = (evt: AudioKeysEvent) => {
		const { note, velocity } = evt
		if (this.sketch.keyboardInputDisabled()) {
			return
		}
		const { pp } = this.sketch
		if (pp && pp.keyIsDown(KEYCODE_CONTROL)) {
			return
		}
		if (this.sketch.user.inputDevice !== 'keyboard') {
			return
		}
		const midiEvt = { kind: 'noteon', note: note, attack: velocity / 128.0 } as MidiEvent
		this.sketch.sendUserEvent('keyboard', 'noteon', midiEvt)
	}

	keyReleased = (evt: AudioKeysEvent) => {
		const { note } = evt
		if (this.sketch.keyboardInputDisabled()) {
			return
		}
		if (this.sketch.user.inputDevice !== 'keyboard') {
			return
		}
		const midiEvt = { kind: 'noteoff', note: note } as MidiEvent
		this.sketch.sendUserEvent('keyboard', 'noteoff', midiEvt)
	}
}
