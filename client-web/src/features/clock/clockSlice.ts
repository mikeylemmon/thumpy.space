import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type ClockState = {
	paused: boolean
}

const initialState: ClockState = {
	paused: false,
}

const clockSlice = createSlice({
	name: 'clock',
	initialState,
	reducers: {
		pausedSet(state, action: PayloadAction<boolean>) {
			state.paused = action.payload
		},
		pausedToggle(state) {
			state.paused = !state.paused
		},
	},
})

export const clockActions = clockSlice.actions
export default clockSlice.reducer
