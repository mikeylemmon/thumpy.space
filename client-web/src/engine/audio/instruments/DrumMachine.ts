import { Time } from 'tone/Tone/core/type/Units'
import { StateInstrument, StateInstrumentInput } from 'storeShared/sliceInstruments'
import { Trigger } from 'storeShared/sliceSequences'
import { EngineInstrument, SubengineType } from 'engine/EngineInstrument'

let drumMachineId = 0

// implements IAbstractInstrument
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

	constructor(initialState: Partial<StateInstrument> = DrumMachine.StateDefault()) {
		super()
		console.log('[DrumMachine #constructor] New drum machine', initialState)
	}

	dispose(): void {}

	trigger(time: Time, inputId: string, trig: Trigger): void {
		console.log('[DrumMachine #trigger] trigger:', time, inputId, trig)
	}

	updateState(inst: StateInstrument): void {
		console.log('[DrumMachine #updateState] Received new state', inst)
	}
}
