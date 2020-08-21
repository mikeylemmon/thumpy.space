import { combineReducers, createAction, PayloadAction } from '@reduxjs/toolkit'
import clockReducer, { clockStateInitial } from 'features/clock/clockSlice'

const rootReducer = combineReducers({
	clock: clockReducer,
})

export type RootState = ReturnType<typeof rootReducer>

export const rootStateInitial: RootState = {
	clock: clockStateInitial,
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
