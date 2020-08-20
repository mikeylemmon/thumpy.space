import { createSelector } from '@reduxjs/toolkit'
import { RootState } from 'app/rootReducer'
import { clockActions, ClockState } from './clockSlice'

const selectClock = (state: RootState) => state.clock
const selectPaused = createSelector<RootState, ClockState, boolean>(
	[selectClock],
	clock => clock.paused,
)

export default {
	select: selectClock,
	paused: {
		selector: selectPaused,
		set: clockActions.pausedSet,
		toggle: clockActions.pausedToggle,
	},
}
