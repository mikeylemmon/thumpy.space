/// <reference types="react-scripts" />
import modP5 from 'p5'
import * as globalP5 from 'p5/global'
export = modP5
export as namespace p5

import modWM from 'webmidi.iife'
declare global {
	interface Window {
		p5: typeof modP5
		WebMidi: typeof modWM
		now: any
		Tone: any
		syncs: any
		me: any
	}
	interface Navigator {
		requestMIDIAccess: any
	}
}
