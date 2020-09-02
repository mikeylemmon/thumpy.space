import { Frequency, MembraneSynth } from 'tone'
import { Time } from 'tone/Tone/core/type/Units'
import { StateInstrument, StateInstrumentInput } from 'storeShared/sliceInstruments'
import { Trigger } from 'storeShared/sliceSequences'
import { EngineInstrument, SubengineType } from 'engine/EngineInstrument'
import { registerInstrumentType } from 'engine/Engine'

let syntheticKickId = 0

// SyntheticKick statically implements EngineInstrumentStatic
export default class SyntheticKick extends EngineInstrument {
	static DisplayName: string = 'Synthetic Kick'
	static Subengine: SubengineType = 'audio'
	static TypeId: string = 'audio-synthetic-kick'

	static StateInputs(): StateInstrumentInput[] {
		return [{ id: 'trigger', name: 'Trigger' }]
	}

	static StateDefault(): StateInstrument {
		const idStr = syntheticKickId > 0 ? ` ${syntheticKickId + 1}` : ''
		return {
			id: `${SyntheticKick.TypeId}-${syntheticKickId}`,
			name: `Synthetic Kick${idStr}`,
			typeId: SyntheticKick.TypeId,
			subengine: SyntheticKick.Subengine,
			triggers: SyntheticKick.StateInputs(),
			fields: [],
		}
	}

	public subengine: SubengineType = SyntheticKick.Subengine
	private synth: MembraneSynth

	constructor(initialState: Partial<StateInstrument> = SyntheticKick.StateDefault()) {
		super()
		console.log('[SyntheticKick #constructor]', initialState)
		this.synth = new MembraneSynth({
			octaves: 3,
			pitchDecay: 0.07,
			oscillator: { type: 'triangle' },
		}).toDestination()
	}

	dispose(): void {
		console.log('[SyntheticKick #dispose] Disposed')
	}

	trigger(time: Time, _inputId: string, trig: Trigger): void {
		// console.log('[SyntheticKick #trigger] trigger:', time, inputId, trig)
		this.synth.triggerAttackRelease(Frequency(trig.freq, trig.unit).toFrequency(), trig.dur, time)
	}

	updateState(inst: StateInstrument): void {
		console.log('[SyntheticKick #updateState] Received new state', inst)
	}
}

registerInstrumentType(SyntheticKick)
