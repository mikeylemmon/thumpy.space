import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import reducerShared, { stateInitialShared, StateShared as IStateShared } from 'storeShared/reducerShared'

export const sliceNameShared = 'shared'

// Re-export types from storeShared for handier downstream imports
export type StateShared = IStateShared
export { stateInitialShared }

const sliceShared = createSlice({
	name: sliceNameShared,
	initialState: stateInitialShared,
	reducers: {
		// connected initializes the entire shared state
		connected: (state, action: PayloadAction<StateShared>) => action.payload,
	},
	// extraReducers passes all other actions on to the storeShared reducer
	extraReducers: builder => builder.addDefaultCase(reducerShared),
})

export const actionsShared = sliceShared.actions
export default sliceShared.reducer
