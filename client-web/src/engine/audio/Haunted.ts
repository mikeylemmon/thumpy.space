import {
	AutoFilter,
	AutoPanner,
	AutoWah,
	Frequency,
	Gain,
	OnePoleFilter,
	PingPongDelay,
	PolySynth,
	Reverb,
	Synth,
} from 'tone'
import { Time } from 'tone/Tone/core/type/Units'
import { StateInstrument, StateInstrumentInput } from 'storeShared/sliceInstruments'
import { Trigger } from 'storeShared/sliceSequences'
import { EngineInstrument, SubengineType } from 'engine/EngineInstrument'
import { registerInstrumentType } from 'engine/Engine'

type HauntedSynth = PolySynth

let hauntedId = 0

export default class Haunted extends EngineInstrument {
	static DisplayName: string = 'Haunted'
	static Subengine: SubengineType = 'audio'
	static TypeId: string = 'audio-haunted'

	static StateInputs(): StateInstrumentInput[] {
		return [{ id: 'trigger', name: 'Trigger' }]
	}

	static StateDefault(): StateInstrument {
		const idStr = hauntedId > 0 ? ` ${hauntedId + 1}` : ''
		return {
			id: `${Haunted.TypeId}-${hauntedId}`,
			name: `Haunted${idStr}`,
			typeId: Haunted.TypeId,
			subengine: Haunted.Subengine,
			triggers: Haunted.StateInputs(),
			fields: [],
		}
	}

	public subengine: SubengineType = Haunted.Subengine

	private synth: HauntedSynth
	// private autoFilter: AutoFilter

	constructor(initialState: Partial<StateInstrument> = Haunted.StateDefault()) {
		super()
		console.log('[Haunted #constructor]', initialState)
		// const gain = new Gain(0.5).toDestination()
		const gain = new Gain(0.3).toDestination()
		const reverb = new Reverb({
			decay: 4,
			wet: 0.6,
		}).connect(gain)
		const delayGain = new Gain(0.7).connect(reverb)
		const delayFilter = new OnePoleFilter(500, 'lowpass').connect(delayGain)
		const delay = new PingPongDelay({
			delayTime: '4t',
			feedback: 0.45,
			wet: 1.0,
		}).connect(delayFilter)
		const autoPanner = new AutoPanner({
			frequency: 0.1,
			wet: 0.4,
		})
			.fan(reverb, delay)
			.start()
		const autoWah = new AutoWah({
			baseFrequency: 60,
			gain: 1.0,
			octaves: 5,
			sensitivity: 0,
			wet: 0.7,
		}).connect(autoPanner)
		autoWah.Q.value = 0.4
		// this.autoFilter = new AutoFilter('10m').connect(autoWah)
		this.synth = new PolySynth(Synth, {
			oscillator: {
				type: 'fatsawtooth',
				count: 3,
				spread: 30,
			},
			envelope: {
				attack: 0.02,
				decay: 0.1,
				sustain: 0.7,
				// release: 1.0,
				release: 0.2,
			},
			volume: -5,
		}).connect(autoWah)
		// }).connect(this.autoFilter)
	}

	start(): void {
		// this.autoFilter.start()
	}
	stop(): void {
		// this.autoFilter.stop()
	}

	dispose(): void {
		console.log('[Haunted #dispose] Disposed')
	}

	trigger(time: Time, _inputId: string, trig: Trigger): void {
		// console.log('[Haunted #trigger] trigger:', time, inputId, trig)
		this.synth.triggerAttackRelease(Frequency(trig.freq, trig.unit).toFrequency(), trig.dur, time)
	}

	updateState(inst: StateInstrument): void {
		console.log('[Haunted #updateState] Received new state', inst)
	}
}

registerInstrumentType(Haunted)
