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
export type StateInstrumentSlice = EntityState<StateInstrument>

const selectSlice = (state: StateLocal) =>
	apiShared.selector(state)[sliceNameInstruments] as StateInstrumentSlice

const selectors = adapterInstruments.getSelectors<StateLocal>(selectSlice)

export default {
	slice: {
		select: selectSlice,
		selectors: adapterInstruments.getSelectors(),
	},
	selectAll: selectors.selectAll,
	selectById: selectors.selectById,
	addOne: actionsInstruments.addOne,
}
