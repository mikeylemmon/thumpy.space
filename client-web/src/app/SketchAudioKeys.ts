import * as p5 from 'p5'
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

export class SketchAudioKeys {
	sketch: Sketch
	audioKeys: AudioKeys
	// customs stores state vals for custom controlchange keybindings
	customs: { [key: string]: number } = {
		mod: 0.5,
		a: 0.02,
		d: 0.1,
		s: 1.0,
		r: 0.3,
	}
	// customToCtrl maps custom values to MIDI controlchange channels
	customToCtrl: { [key: string]: number } = {
		mod: 1,
		a: 71,
		d: 72,
		s: 73,
		r: 74,
	}

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

	//
	// Handling for custom keys not built-in to the audiokeys library
	//
	keyPressedP5 = (evt: p5) => {
		switch (evt.key) {
			case '[':
			case '{': this.handleCustom('mod', false); break
			case ']':
			case '}': this.handleCustom('mod', true); break
			case 'c':
			case 'C': this.handleCustom('a', false); break
			case 'v':
			case 'V': this.handleCustom('a', true); break
			case 'b':
			case 'B': this.handleCustom('d', false); break
			case 'n':
			case 'N': this.handleCustom('d', true); break
			case 'm':
			case 'M': this.handleCustom('s', false); break
			case ',':
			case '<': this.handleCustom('s', true); break
			case '.':
			case '>': this.handleCustom('r', false); break
			case '/':
			case '?': this.handleCustom('r', true); break
		}
	}

	handleCustom = (prop: string, increase = false) => {
		const { customs } = this
		const vel = this.audioKeys._state.velocity / 127
		if (increase) {
			customs[prop] = Math.min(1, customs[prop] + vel / 4)
		} else {
			customs[prop] = Math.max(0, customs[prop] - vel / 4)
		}
		this.sketch.sendUserEvent('keyboard', 'controlchange', {
			kind: 'controlchange',
			channel: 1,
			controller: { number: this.customToCtrl[prop] },
			value: customs[prop],
		} as MidiEvent)
	}

	keyReleasedP5 = (_evt: p5) => {}
}
