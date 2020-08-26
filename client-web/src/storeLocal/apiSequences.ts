import { EntityState } from '@reduxjs/toolkit'
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

// Re-export types for handier imports
export type StateSequence = IStateSequence
export type StateSequenceOutput = IStateSequenceOutput
export type Step = IStep
export type Trigger = ITrigger

const selectors = adapterSequences.getSelectors<StateLocal>(
	state => apiShared.selector(state)[sliceNameSequences] as EntityState<StateSequence>,
)

export default {
	selectAll: selectors.selectAll,
	selectById: selectors.selectById,
	addOne: actionsSequences.addOne,
	trigger: {
		on: actionsSequences.triggerOn,
		off: actionsSequences.triggerOff,
	},
}
