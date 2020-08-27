import { EntityState } from '@reduxjs/toolkit'
import {
	actionsInstruments,
	adapterInstruments,
	sliceNameInstruments,
	StateInstrument as IStateInstrument,
	StateInstrumentField as IStateInstrumentField,
	StateInstrumentInput as IStateInstrumentInput,
} from 'storeShared/sliceInstruments'
import { StateLocal } from './rootReducerLocal'
import apiShared from './apiShared'

// Re-export types for handier imports
export type StateInstrument = IStateInstrument
export type StateInstrumentField = IStateInstrumentField
export type StateInstrumentInput = IStateInstrumentInput

const selectors = adapterInstruments.getSelectors<StateLocal>(
	state => apiShared.selector(state)[sliceNameInstruments] as EntityState<StateInstrument>,
)

export default {
	selectAll: selectors.selectAll,
	selectById: selectors.selectById,
	addOne: actionsInstruments.addOne,
}
