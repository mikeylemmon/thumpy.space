import { combineReducers, createAction, PayloadAction } from '@reduxjs/toolkit'
import clockReducer, { clockSliceName, clockStateInitial } from 'store/clockSlice'
import localClientsReducer, { localClientsSliceName, localClientsStateInitial } from 'store/localClientsSlice'

const rootReducer = combineReducers({
	[clockSliceName]: clockReducer,
	[localClientsSliceName]: localClientsReducer,
})

export type RootState = ReturnType<typeof rootReducer>

export const rootStateInitial: RootState = {
	[clockSliceName]: clockStateInitial,
	[localClientsSliceName]: localClientsStateInitial,
}

export const rootActions = {
	sync: createAction('root/sync', function prepare(rootState: RootState, action: PayloadAction) {
		return {
			payload: rootState,
			meta: { action },
		}
	}),
}

export default rootReducer
