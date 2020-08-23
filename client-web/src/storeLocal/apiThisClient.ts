import { createSelector } from '@reduxjs/toolkit'
import { StateLocal } from './rootReducerLocal'
import { actionsThisClient, sliceNameThisClient, StateThisClient } from './sliceThisClient'

const selectThisClient = (state: StateLocal): StateThisClient => state[sliceNameThisClient]
const selectIsAudioPlayer = createSelector<StateLocal, StateThisClient, boolean>(
	[selectThisClient],
	thisClient => thisClient.isAudioPlayer,
)

export default {
	select: selectThisClient,
	update: actionsThisClient.update,
	isAudioPlayer: {
		select: selectIsAudioPlayer,
	},
}
