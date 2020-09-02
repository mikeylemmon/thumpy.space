import { Frequency, Sampler } from 'tone'
import { Time } from 'tone/Tone/core/type/Units'
import { StateInstrument, StateInstrumentInput } from 'storeShared/sliceInstruments'
import { Trigger } from 'storeShared/sliceSequences'
import { EngineInstrument, SubengineType } from 'engine/EngineInstrument'
import { registerInstrumentType } from 'engine/Engine'

let drumMachineId = 0

// DrumMachine statically implements EngineInstrumentStatic
export default class DrumMachine extends EngineInstrument {
	static DisplayName: string = 'Drum Machine'
	static Subengine: SubengineType = 'audio'
	static TypeId: string = 'audio-drum-machine'

	static StateInputs(): StateInstrumentInput[] {
		return [{ id: 'trigger', name: 'Trigger' }]
	}

	static StateDefault(): StateInstrument {
		const idStr = drumMachineId > 0 ? ` ${drumMachineId + 1}` : ''
		return {
			id: `${DrumMachine.TypeId}-${drumMachineId}`,
			name: `Drum Machine${idStr}`,
			typeId: DrumMachine.TypeId,
			subengine: DrumMachine.Subengine,
			triggers: DrumMachine.StateInputs(),
			fields: [],
		}
	}

	public subengine: SubengineType = DrumMachine.Subengine
	private synth: Sampler
	private loaded = false

	constructor(initialState: Partial<StateInstrument> = DrumMachine.StateDefault()) {
		super()
		console.log('[DrumMachine #constructor] New drum machine', initialState)
		// const samps: { [key: number]: string } = {}
		// for (let ii = 1; ii <= 4; ii++) {
		// 	const ss = String(ii + 8)
		// 	const padded = String(0).repeat(Math.max(0, 2 - ss.length)) + ss
		// 	const samp = `Bass-Drum--BD--E808_BD-short--${padded}.wav`
		// 	samps[ii + 44] = samp
		// }
		// for (let ii = 1; ii <= 8; ii++) {
		// 	const ss = String(ii + 4)
		// 	const padded = String(0).repeat(Math.max(0, 2 - ss.length)) + ss
		// 	const samp = `Bass-Drum--BD--E808_BD-long--${padded}.wav`
		// 	samps[ii + 44] = samp
		// }
		this.synth = new Sampler({
			// urls: samps,
			urls: {
				45: 'Bass-Drum--BD--E808_BD-long--09.wav',
				46: 'Bass-Drum--BD--E808_BD-long--03.wav',
				47: 'Bass-Drum--BD--E808_BD-short--09.wav',
				48: 'Bass-Drum--BD--E808_BD-long--08.wav',
				49: 'Bass-Drum--BD--E808_BD-long--10.wav',
				40: 'Bass-Drum--BD--E808_BD-long--05.wav',
				51: 'Bass-Drum--BD--E808_BD-short--11.wav',
				52: 'Bass-Drum--BD--E808_BD-short--12.wav',
			},
			baseUrl: '/samples/808/',
			onload: () => {
				this.loaded = true
			},
		}).toDestination()
	}

	dispose(): void {
		console.log('[DrumMachine #dispose] Disposed')
	}

	trigger(time: Time, _inputId: string, trig: Trigger): void {
		this.synth.triggerAttackRelease(Frequency(trig.freq, trig.unit).toFrequency(), trig.dur, time)
		if (!this.loaded) {
			console.warn('[DrumMachine #trigger] Skipping trigger, still waiting for samples to load:', trig)
		}
	}

	updateState(inst: StateInstrument): void {
		console.log('[DrumMachine #updateState] Received new state', inst)
	}
}

registerInstrumentType(DrumMachine)
