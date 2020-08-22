import { combineReducers, PayloadAction } from '@reduxjs/toolkit'
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

export type SyncMeta = { sync: boolean; rootState: RootState }
export type SyncPayloadAction = PayloadAction<any, string, SyncMeta>
export const rootActions = {
	sync: (action: PayloadAction, rootState: RootState): SyncPayloadAction => {
		return {
			...action,
			meta: {
				sync: true,
				rootState,
			},
		}
	},
}

export default rootReducer
