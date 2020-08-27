import { combineReducers, PayloadAction } from '@reduxjs/toolkit'
import { ActionsObservable, StateObservable } from 'redux-observable'
import reducerClock, { sliceNameClock, stateInitialClock } from 'storeShared/sliceClock'
import reducerClients, { sliceNameClients, stateInitialClients } from 'storeShared/sliceClients'
import reducerInstruments, { sliceNameInstruments, stateInitialInstruments } from './sliceInstruments'
import reducerSequences, { sliceNameSequences, stateInitialSequences } from './sliceSequences'

const reducerShared = combineReducers({
	[sliceNameClock]: reducerClock,
	[sliceNameClients]: reducerClients,
	[sliceNameInstruments]: reducerInstruments,
	[sliceNameSequences]: reducerSequences,
})

export type StateShared = ReturnType<typeof reducerShared>
export type StateShared$ = StateObservable<StateShared>
export type Action$ = ActionsObservable<PayloadAction>

export const stateInitialShared: StateShared = {
	[sliceNameClock]: stateInitialClock,
	[sliceNameClients]: stateInitialClients,
	[sliceNameInstruments]: stateInitialInstruments,
	[sliceNameSequences]: stateInitialSequences,
}

export default reducerShared
