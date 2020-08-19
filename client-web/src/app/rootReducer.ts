import { combineReducers } from '@reduxjs/toolkit'
import clockReducer from 'features/clock/clockSlice'

const rootReducer = combineReducers({
	clock: clockReducer,
})

export type RootState = ReturnType<typeof rootReducer>

export default rootReducer
