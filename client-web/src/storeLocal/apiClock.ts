import { createSelector } from '@reduxjs/toolkit'
import { actionsClock, sliceNameClock, StateClock } from 'storeShared/sliceClock'
import { StateLocal } from './rootReducerLocal'
import apiShared, { StateShared } from './apiShared'

const selectClock = createSelector<StateLocal, StateShared, StateClock>(
	[apiShared.selector],
	shared => shared[sliceNameClock],
)
const selectPaused = createSelector<StateLocal, StateClock, boolean>([selectClock], clock => clock.paused)

export default {
	selector: selectClock,
	paused: {
		selector: selectPaused,
		toggle: actionsClock.pausedToggle,
	},
}
