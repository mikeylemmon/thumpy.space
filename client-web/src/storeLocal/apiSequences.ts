import { createSelector, EntityState } from '@reduxjs/toolkit'
import {
	actionsSequences,
	adapterSequences,
	sliceNameSequences,
	StateSequence as IStateSequence,
	StateSequenceOutput as IStateSequenceOutput,
	Step as IStep,
	Trigger as ITrigger,
} from 'storeShared/sliceSequences'
import { StateLocal } from './rootReducerLocal'
import apiShared from './apiShared'
import apiInstruments, { StateInstrument, StateInstrumentSlice } from './apiInstruments'

// Re-export types for handier imports
export type StateSequence = IStateSequence
export type StateSequenceOutput = IStateSequenceOutput
export type Step = IStep
export type Trigger = ITrigger

const selectors = adapterSequences.getSelectors<StateLocal>(
	state => apiShared.selector(state)[sliceNameSequences] as EntityState<StateSequence>,
)

// Source: https://addyosmani.com/blog/faster-javascript-memoization/
// via: https://stackoverflow.com/questions/44289468/assign-correct-types-to-reselect-createselector-function
function memoize(f: any) {
	return function (this: any, ...args: any[]) {
		const arghs = Array.prototype.slice.call(args) as any
		f.memoize = f.memoize || {}
		return arghs in f.memoize ? f.memoize[arghs] : (f.memoize[arghs] = f.apply(this, arghs))
	}
}

export type SeqOutWithInst = StateSequenceOutput & {
	instrument: StateInstrument | undefined
}

const selectById = memoize((seqId: string) => (state: StateLocal) => selectors.selectById(state, seqId))
const selectByIdOutputs = memoize((seqId: string) =>
	createSelector<StateLocal, StateSequence, StateSequenceOutput[]>(
		[selectById(seqId)],
		(seq: StateSequence) => seq.outputs,
	),
)

const selectOutputs = (seqId: string) => {
	return createSelector<StateLocal, StateSequenceOutput[], StateInstrumentSlice, SeqOutWithInst[]>(
		[selectByIdOutputs(seqId), apiInstruments.slice.select],
		(outs: StateSequenceOutput[], instrumentsSlice: StateInstrumentSlice) => {
			return outs.map(
				(seqOut: StateSequenceOutput): SeqOutWithInst => ({
					...seqOut,
					instrument: apiInstruments.slice.selectors.selectById(
						instrumentsSlice,
						seqOut.instrumentId,
					),
				}),
			)
		},
	)
}
const mSelectOutputs = memoize(selectOutputs) as typeof selectOutputs

export default {
	selectAll: selectors.selectAll,
	selectById: selectors.selectById,
	addOne: actionsSequences.addOne,
	event: {
		add: actionsSequences.eventAdd,
		delete: actionsSequences.eventDelete,
	},
	trigger: {
		on: actionsSequences.triggerOn,
		off: actionsSequences.triggerOff,
	},
	currentStep: {
		set: actionsSequences.setCurrentStep,
	},
	id: (seqId: string) => ({
		outputs: {
			selectAll: mSelectOutputs(seqId),
		},
	}),
}
