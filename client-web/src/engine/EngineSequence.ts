import { Sequence } from 'tone'
import { StateSequence, StateSequenceOutput, Step } from 'storeShared/sliceSequences'
import storeLocal from 'storeLocal/storeLocal'
import apiSequences from 'storeLocal/apiSequences'
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
	private state: StateSequence

	constructor(state: StateSequence) {
		this.sequencer = new Sequence(
			this.tick,
			tickEvents(state),
			state.id === 'seq-1' ? '8n' : '16n', // TODO: parameterize in StateSequence
		).start(0)
		this.outputs = {}
		this.state = state
	}

	dispose() {
		this.sequencer.dispose()
		console.log('[EngineSequence #dispose] Disposed')
	}

	update(state: StateSequence) {
		if (this.state.steps !== state.steps) {
			// Steps updated, reset the sequencer events
			this.sequencer.events = tickEvents(state)
		}
		this.state = state
		// console.log('[EngineSequence #update] Updated', state)
	}

	connect(ref: StateSequenceOutput, to: EngineInstrument) {
		this.outputs[seqOutputKey(ref)] = to
		// console.log('[EngineSequence #connect] Connected', ref)
	}

	stop() {
		storeLocal.dispatch(
			apiSequences.currentStep.set({
				seqId: this.state.id,
				stepId: 0,
			}),
		)
	}

	private tick = (time: number, tickEvt: TickEvent) => {
		const { seq, step } = tickEvt
		for (const trig of step.triggers) {
			for (const oo of seq.outputs) {
				const output = this.outputs[seqOutputKey(oo)]
				if (!output) {
					console.error('[EngineSequence #tick] Unable to find instrument for output', oo)
					continue
				}
				output.trigger(time, oo.inputId, trig)
			}
		}
		// storeLocal.dispatch(
		// 	apiSequences.currentStep.set({
		// 		seqId: seq.id,
		// 		stepId: step.id,
		// 	}),
		// )
	}
}
