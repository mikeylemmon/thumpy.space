import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Client } from 'storeShared/sliceClients'

export const sliceNameThisClient = 'thisClient'

export type StateThisClient = Client
export const stateInitialThisClient: StateThisClient = {
	id: -1,
	isAudioPlayer: false,
}

const sliceThisClient = createSlice({
	name: sliceNameThisClient,
	initialState: stateInitialThisClient,
	reducers: {
		update: (state, action: PayloadAction<Client>) => action.payload,
	},
})

export const actionsThisClient = sliceThisClient.actions
export default sliceThisClient.reducer
