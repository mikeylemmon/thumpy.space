import { combineReducers, PayloadAction } from '@reduxjs/toolkit'
import { ActionsObservable, StateObservable } from 'redux-observable'
import reducerShared, { stateInitialShared, StateShared } from 'storeShared/reducerShared'
// import thisClientReducer, { thisClientSliceName, thisClientStateInitial } from 'storeLocalClient/thisClientSlice'

const rootReducerLocal = combineReducers({
	shared: reducerShared,
	// [thisClientSliceName]: thisClientReducer,
})

export type StateLocal = {
	shared: StateShared
}
export type StateLocal$ = StateObservable<StateLocal>
export type Action$ = ActionsObservable<PayloadAction>

export const localRootStateInitial: StateLocal = {
	shared: stateInitialShared,
	// [thisClientSliceName]: thisClientStateInitial,
}
export const selectShared = (state: StateLocal): StateShared => state.shared

export default rootReducerLocal
