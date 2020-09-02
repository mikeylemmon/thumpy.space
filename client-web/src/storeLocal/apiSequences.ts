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
const selectOutputs = (seqId: string) =>
	createSelector<StateLocal, StateSequence, StateInstrumentSlice, SeqOutWithInst[]>(
		[selectById(seqId), apiInstruments.slice.select],
		(seq: StateSequence, instrumentsSlice: StateInstrumentSlice) => {
			console.log('[apiSequences #selectOutputs]', seq)
			if (!seq) {
				console.error(`[apiSequences #selectOutputs] No sequence found for id ${seqId}`)
				return []
			}
			return seq.outputs.map(
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
// ) as (seqId: string) => Selector<StateLocal, StateSequenceOutput[]>

export default {
	selectAll: selectors.selectAll,
	selectById: selectors.selectById,
	addOne: actionsSequences.addOne,
	trigger: {
		on: actionsSequences.triggerOn,
		off: actionsSequences.triggerOff,
	},
	currentStep: {
		set: actionsSequences.setCurrentStep,
	},
	id: (seqId: string) => ({
		outputs: {
			selectAll: selectOutputs(seqId),
		},
	}),
}
