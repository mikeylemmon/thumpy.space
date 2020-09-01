import { Frequency, Sampler } from 'tone'
import { Time } from 'tone/Tone/core/type/Units'
import { StateInstrument, StateInstrumentInput } from 'storeShared/sliceInstruments'
import { Trigger } from 'storeShared/sliceSequences'
import { EngineInstrument, SubengineType } from 'engine/EngineInstrument'
import { registerInstrumentType } from 'engine/Engine'

let casioId = 0

// Casio statically implements EngineInstrumentStatic
export default class Casio extends EngineInstrument {
	static DisplayName: string = 'Casio'
	static Subengine: SubengineType = 'audio'
	static TypeId: string = 'audio-casio'

	static StateInputs(): StateInstrumentInput[] {
		return [{ id: 'trigger', name: 'Trigger' }]
	}

	static StateDefault(): StateInstrument {
		const idStr = casioId > 0 ? ` ${casioId + 1}` : ''
		return {
			id: `${Casio.TypeId}-${casioId}`,
			name: `Casio${idStr}`,
			typeId: Casio.TypeId,
			subengine: Casio.Subengine,
			triggers: Casio.StateInputs(),
			fields: [],
		}
	}

	public subengine: SubengineType = Casio.Subengine
	private synth: Sampler

	constructor(initialState: Partial<StateInstrument> = Casio.StateDefault()) {
		super()
		console.log('[Casio #constructor] New drum machine', initialState)
		this.synth = new Sampler({
			urls: {
				A1: 'A1.mp3',
				A2: 'A2.mp3',
			},
			baseUrl: 'https://tonejs.github.io/audio/casio/',
		}).toDestination()
	}

	dispose(): void {
		console.log('[Casio #dispose] Disposed')
	}

	trigger(time: Time, _inputId: string, trig: Trigger): void {
		// console.log('[Casio #trigger] trigger:', time, inputId, trig)
		this.synth.triggerAttackRelease(Frequency(trig.freq, trig.unit).toFrequency(), trig.dur, time)
	}

	updateState(inst: StateInstrument): void {
		console.log('[Casio #updateState] Received new state', inst)
	}
}

registerInstrumentType(Casio)
