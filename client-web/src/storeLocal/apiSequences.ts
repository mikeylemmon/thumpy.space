import { EntityState } from '@reduxjs/toolkit'
import {
	actionsSequences,
	adapterSequences,
	sliceNameSequences,
	Sequence as ISequence,
	Step as IStep,
	Trigger as ITrigger,
} from 'storeShared/sliceSequences'
import { StateLocal } from './rootReducerLocal'
import apiShared from './apiShared'

// Re-export types for handier imports
export type Sequence = ISequence
export type Step = IStep
export type Trigger = ITrigger

const selectors = adapterSequences.getSelectors<StateLocal>(
	state => apiShared.selector(state)[sliceNameSequences] as EntityState<Sequence>,
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
