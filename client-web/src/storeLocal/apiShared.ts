import { actionsShared, sliceNameShared, StateShared as IStateShared } from './sliceShared'
import { StateLocal } from './rootReducerLocal'

// Re-export type for handier downstream imports
export type StateShared = IStateShared

export const selectShared = (state: StateLocal): StateShared => state[sliceNameShared]

export default {
	selector: selectShared,
	connected: actionsShared.connected,
}
