import { Sequence } from 'tone'
import { StateSequence, StateSequenceOutput, Step } from 'storeShared/sliceSequences'
import { EngineInstrument } from 'engine/EngineInstrument'

type TickEvent = {
	seq: StateSequence
	step: Step
}

function tickEvents(seq: StateSequence): TickEvent[] {
	return seq.steps.map((step: Step) => ({ seq, step }))
}

function seqOutputKey(output: StateSequenceOutput): string {
	return `${output.instrumentId}-${output.inputId}`
}

export class EngineSequence {
	private sequencer: Sequence
	private outputs: { [key: string]: EngineInstrument }

	constructor(state: StateSequence) {
		this.sequencer = new Sequence(this.tick, tickEvents(state), '8n').start(0)
		this.outputs = {}
	}

	dispose() {
		this.sequencer.dispose()
		console.log('[EngineSequence #dispose] Disposed')
	}

	update(state: StateSequence) {
		this.sequencer.events = tickEvents(state)
		console.log('[EngineSequence #update] Updated', state)
	}

	connect(ref: StateSequenceOutput, to: EngineInstrument) {
		this.outputs[seqOutputKey(ref)] = to
		console.log('[EngineSequence #connect] Connected', ref)
	}

	private tick = (time: number, tickEvt: TickEvent) => {
		const { seq, step } = tickEvt
		for (const trig of step.triggers) {
			// const ss = seq.id === 'seq-1' ? synth1 : synth2
			// ss.triggerAttackRelease(Frequency(trig.freq, trig.unit).toFrequency(), trig.dur, time)
			for (const oo of seq.outputs) {
				const output = this.outputs[seqOutputKey(oo)]
				if (!output) {
					console.error('[EngineSequence #tick] Unable to find instrument for output', oo)
					continue
				}
				output.trigger(time, oo.inputId, trig)
			}
		}
	}
}
