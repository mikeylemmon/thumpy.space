import { combineReducers } from '@reduxjs/toolkit'
import clockReducer, { clockStateInitial } from 'features/clock/clockSlice'

const rootReducer = combineReducers({
	clock: clockReducer,
})

export type RootState = ReturnType<typeof rootReducer>

export const rootStateInitial: RootState = {
	clock: clockStateInitial,
}

export default rootReducer
