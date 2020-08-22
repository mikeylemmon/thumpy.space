import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export const clockSliceName = 'clock'

export type ClockState = {
	paused: boolean
}

export const clockStateInitial: ClockState = {
	paused: false,
}

const clockSlice = createSlice({
	name: clockSliceName,
	initialState: clockStateInitial,
	reducers: {
		pausedSet(state, action: PayloadAction<boolean>) {
			state.paused = action.payload
		},
		pausedToggle(state) {
			state.paused = !state.paused
			console.log('toggled!', state.paused)
		},
	},
})

export const clockActions = clockSlice.actions
export default clockSlice.reducer
