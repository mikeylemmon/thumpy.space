import { createSlice, PayloadAction } from '@reduxjs/toolkit'

type ClockState = {
	paused: boolean
}

const initialState: ClockState = {
	paused: false,
}

const clockSlice = createSlice({
	name: 'clock',
	initialState,
	reducers: {
		setPaused(state, action: PayloadAction<boolean>) {
			state.paused = action.payload
		},
		togglePaused(state) {
			state.paused = !state.paused
		},
	},
})

export const { setPaused, togglePaused } = clockSlice.actions

// export const selectClock = state => state.clock
// export const selectPaused = createSelector(
// 	[selectClock],
// 	clock => clock.paused
// )

export default clockSlice.reducer
