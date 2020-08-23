import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export const sliceNameClock = 'clock'

export type StateClock = {
	paused: boolean
}

export const stateInitialClock: StateClock = {
	paused: true,
}

const sliceClock = createSlice({
	name: sliceNameClock,
	initialState: stateInitialClock,
	reducers: {
		pausedSet(state, action: PayloadAction<boolean>) {
			state.paused = action.payload
		},
		pausedToggle(state) {
			state.paused = !state.paused
		},
	},
})

export const actionsClock = sliceClock.actions
export default sliceClock.reducer
