declare module 'audiokeys' {
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

	type AudioKeysCallback = (evt: AudioKeysEvent) => void

	class AudioKeys {
		_state: {
			polyphony: number
			rows: number
			priority: string
			rootNote: number
			octaveControls: boolean
			octave: number
			velocityControls: boolean
			velocity: number
			keys: any[]
			buffer: any[]
		}
		constructor(opts: any)
		up(cb: AudioKeysCallback): void
		down(cb: AudioKeysCallback): void
		get(property: string): any
		set(property: string, value: any)
	}

	export = AudioKeys
}
