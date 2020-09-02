import { Filter, Frequency, Gain, LFO, Phaser, PingPongDelay, Reverb, Sampler } from 'tone'
import { Time } from 'tone/Tone/core/type/Units'
import { StateInstrument, StateInstrumentInput } from 'storeShared/sliceInstruments'
import { Trigger } from 'storeShared/sliceSequences'
import { EngineInstrument, SubengineType } from 'engine/EngineInstrument'
import { registerInstrumentType } from 'engine/Engine'

let tappyId = 0

export default class Tappy extends EngineInstrument {
	static DisplayName: string = 'Tappy'
	static Subengine: SubengineType = 'audio'
	static TypeId: string = 'audio-tappy'

	static StateInputs(): StateInstrumentInput[] {
		return [{ id: 'trigger', name: 'Trigger' }]
	}

	static StateDefault(): StateInstrument {
		const idStr = tappyId > 0 ? ` ${tappyId + 1}` : ''
		return {
			id: `${Tappy.TypeId}-${tappyId}`,
			name: `Tappy${idStr}`,
			typeId: Tappy.TypeId,
			subengine: Tappy.Subengine,
			triggers: Tappy.StateInputs(),
			fields: [],
		}
	}

	public subengine: SubengineType = Tappy.Subengine
	private synth: Sampler
	private loaded = false
	private lfo: LFO
	private lfo2: LFO

	constructor(initialState: Partial<StateInstrument> = Tappy.StateDefault()) {
		super()
		console.log('[Tappy #constructor]', initialState)
		const gain = new Gain(0.6).toDestination()
		const reverb = new Reverb({
			decay: 4,
			wet: 0.2,
		}).connect(gain)
		const delayGain = new Gain(0.5).connect(reverb)
		const delay = new PingPongDelay({
			delayTime: '2n',
			feedback: 0.4,
		}).connect(delayGain)
		const phaser = new Phaser({
			baseFrequency: 100,
			frequency: 0.05,
			octaves: 3,
			stages: 3,
			wet: 0.8,
		}).fan(reverb, delay)
		const filter = new Filter({
			Q: 1.35,
			type: 'bandpass',
		}).connect(phaser)
		this.lfo = new LFO({
			frequency: '4n',
			min: 40,
			max: 1200,
			phase: 90,
			type: 'triangle',
		}).connect(filter.frequency)
		this.lfo2 = new LFO({
			frequency: 0.02,
			min: 0.1,
			max: 3,
		}).connect(filter.Q)
		this.synth = new Sampler({
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
		}).connect(filter)
	}

	start(): void {
		this.lfo.start()
		this.lfo2.start()
	}
	stop(): void {
		this.lfo.stop()
		this.lfo2.stop()
	}

	dispose(): void {
		console.log('[Tappy #dispose] Disposed')
	}

	trigger(time: Time, _inputId: string, trig: Trigger): void {
		this.synth.triggerAttackRelease(Frequency(trig.freq, trig.unit).toFrequency(), trig.dur, time)
		if (!this.loaded) {
			console.warn('[Tappy #trigger] Skipping trigger, still waiting for samples to load:', trig)
		}
	}

	updateState(inst: StateInstrument): void {
		console.log('[Tappy #updateState] Received new state', inst)
	}
}

registerInstrumentType(Tappy)
