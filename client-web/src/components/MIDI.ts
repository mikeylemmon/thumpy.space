// type MidiInputChannel = {
// 	eventMap: any // {...}
// 	eventsSuspended: boolean
// 	input: any // Input
// 	number: number
// }

type FieldsShared = {
	data: number[]
	// rawData: number[]
	// target: MidiInputChannel
	// target: { number: number }
	channel: number
	// timestamp: number
	kind: string
}

type FieldsNote = {
	attack?: number
	note: number
	release?: number
	// note: {
	// 	_number: number
	// 	// _duration: number
	// 	// _rawAttack: number
	// 	// _rawRelease: number
	// }
	// // rawAttack: number
	// // rawRelease?: number
	// release?: number
}

type FieldsCC = {
	value: number // 0 - 1 (data[2])
	// rawValue: number // 0 - 127
	controller: {
		number: number // (data[1])
		name: string
	}
}

type FieldsPitchbend = {
	value: number // 0 - 1 (data[2])
	// rawValue: number // 0 - 127
}

export type MidiEventNote = FieldsShared & FieldsNote
export type MidiEventCC = FieldsShared & FieldsCC
export type MidiEventPitchbend = FieldsShared & FieldsPitchbend
// export type MidiEvent = MidiEventCC | MidiEventNote | MidiEventPitchbend | FieldsShared
export type MidiEvent = FieldsShared & FieldsCC & FieldsNote & FieldsPitchbend
export function newMidiEvent(evt: any): MidiEvent {
	return {
		data: evt.data,
		channel: evt.target.number,
		kind: evt.type,
		attack: evt.attack,
		note: evt.note && evt.note._number,
		release: evt.release,
		value: evt.value,
		controller: evt.controller,
	}
}

const allChannels = [...Array(16).keys()].map(x => x + 1) // Array of numbers 1 thru 16
const allEvents = ['controlchange', 'noteoff', 'noteon', 'pitchbend'] // 'keyaftertouch',

type MIDIOptions = {
	onMessage: (inputName: string, eventName: string, evt: MidiEvent) => void
	onEnabled?: (webMidi: any) => void
}

export default class MIDI {
	webMidi: any | null = null
	enabled: boolean = false

	constructor(opts: MIDIOptions) {
		this.enable(opts)
	}

	enable = async (opts: MIDIOptions) => {
		const { onMessage, onEnabled } = opts
		const { WebMidi } = window
		try {
			await WebMidi.enable()
		} catch (err) {
			console.error('[MIDI #enable] Failed to enable MIDI', err)
			return
		}
		this.webMidi = WebMidi
		this.enabled = true
		const { inputs, outputs } = this.webMidi
		console.log('[MIDI #enable] inputs', inputs)
		console.log('[MIDI #enable] outputs', outputs)
		if (onEnabled) {
			onEnabled(this.webMidi)
		}
		for (const input of inputs) {
			for (const eventName of allEvents) {
				input.addListener(
					eventName,
					(evt: any) => onMessage(input.name, eventName, newMidiEvent(evt)),
					{
						channels: allChannels,
					},
				)
			}
		}
	}
}
