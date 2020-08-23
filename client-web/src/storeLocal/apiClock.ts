import { createSelector } from '@reduxjs/toolkit'
import { actionsClock, StateClock } from 'storeShared/sliceClock'
import { StateShared } from 'storeShared/reducerShared'
import { selectShared, StateLocal } from './rootReducerLocal'

const selectClock = createSelector<StateLocal, StateShared, StateClock>(
	[selectShared],
	shared => shared.clock,
)
const selectPaused = createSelector<StateLocal, StateClock, boolean>([selectClock], clock => clock.paused)

export default {
	selector: selectClock,
	paused: {
		selector: selectPaused,
		set: actionsClock.pausedSet,
		toggle: actionsClock.pausedToggle,
	},
}
