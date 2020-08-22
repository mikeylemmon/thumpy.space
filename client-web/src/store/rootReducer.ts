import { combineReducers, PayloadAction } from '@reduxjs/toolkit'
import { ActionsObservable, StateObservable } from 'redux-observable'
import clockReducer, { clockSliceName, clockStateInitial } from 'store/clockSlice'
import localClientsReducer, { localClientsSliceName, localClientsStateInitial } from 'store/localClientsSlice'

const rootReducer = combineReducers({
	[clockSliceName]: clockReducer,
	[localClientsSliceName]: localClientsReducer,
})

export type RootState = ReturnType<typeof rootReducer>
export type State$ = StateObservable<RootState>
export type Action$ = ActionsObservable<PayloadAction>

export const rootStateInitial: RootState = {
	[clockSliceName]: clockStateInitial,
	[localClientsSliceName]: localClientsStateInitial,
}

export default rootReducer
