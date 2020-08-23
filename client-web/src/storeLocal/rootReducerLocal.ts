import { combineReducers, PayloadAction } from '@reduxjs/toolkit'
import { ActionsObservable, StateObservable } from 'redux-observable'
import reducerShared, { sliceNameShared, stateInitialShared, StateShared } from './sliceShared'
import reducerThisClient, { sliceNameThisClient, stateInitialThisClient } from './sliceThisClient'

const rootReducerLocal = combineReducers({
	[sliceNameShared]: reducerShared,
	[sliceNameThisClient]: reducerThisClient,
})

export type StateLocal = ReturnType<typeof rootReducerLocal>
export type StateLocal$ = StateObservable<StateLocal>
export type Action$ = ActionsObservable<PayloadAction>

export const localRootStateInitial: StateLocal = {
	[sliceNameShared]: stateInitialShared,
	[sliceNameThisClient]: stateInitialThisClient,
}
export const selectShared = (state: StateLocal): StateShared => state[sliceNameShared]

export default rootReducerLocal
