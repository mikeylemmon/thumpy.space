import { Frequency, MembraneSynth } from 'tone'
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
		return {
			id: `${DrumMachine.TypeId}-${drumMachineId}`,
			name: 'Drum Machine',
			typeId: DrumMachine.TypeId,
			triggers: DrumMachine.StateInputs(),
			fields: [],
		}
	}

	private synth: MembraneSynth

	constructor(initialState: Partial<StateInstrument> = DrumMachine.StateDefault()) {
		super()
		console.log('[DrumMachine #constructor] New drum machine', initialState)
		this.synth = new MembraneSynth({
			octaves: 3,
			pitchDecay: 0.07,
			oscillator: { type: 'triangle' },
		}).toDestination()
	}

	dispose(): void {
		console.log('[DrumMachine #dispose] Disposed')
	}

	trigger(time: Time, inputId: string, trig: Trigger): void {
		// console.log('[DrumMachine #trigger] trigger:', time, inputId, trig)
		this.synth.triggerAttackRelease(Frequency(trig.freq, trig.unit).toFrequency(), trig.dur, time)
	}

	updateState(inst: StateInstrument): void {
		console.log('[DrumMachine #updateState] Received new state', inst)
	}
}

registerInstrumentType(DrumMachine)
