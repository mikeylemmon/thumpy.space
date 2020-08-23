import { combineReducers, PayloadAction } from '@reduxjs/toolkit'
import { ActionsObservable, StateObservable } from 'redux-observable'
import reducerClock, { sliceNameClock, stateInitialClock } from 'storeShared/sliceClock'
import reducerLocalClients, {
	sliceNameLocalClients,
	stateInitialLocalClients,
} from 'storeShared/sliceLocalClients'

const reducerShared = combineReducers({
	[sliceNameClock]: reducerClock,
	[sliceNameLocalClients]: reducerLocalClients,
})

export type StateShared = ReturnType<typeof reducerShared>
export type StateShared$ = StateObservable<StateShared>
export type Action$ = ActionsObservable<PayloadAction>

export const stateInitialShared: StateShared = {
	[sliceNameClock]: stateInitialClock,
	[sliceNameLocalClients]: stateInitialLocalClients,
}

export default reducerShared
