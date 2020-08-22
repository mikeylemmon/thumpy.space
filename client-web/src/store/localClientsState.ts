import { createSelector } from '@reduxjs/toolkit'
import { RootState } from './rootReducer'
import {
	localClientAdd,
	localClientsAdapter,
	localClientsSliceName,
	populatePort,
	LocalClient,
	LocalClientWithPort,
	LocalClientsState,
} from './localClientsSlice'

const selectors = localClientsAdapter.getSelectors<RootState>(state => state[localClientsSliceName])
const selectClients = selectors.selectAll
const selectClientsWithPort = createSelector<RootState, LocalClient[], Array<LocalClientWithPort>>(
	[selectClients],
	localClients => localClients.map(populatePort),
)

export default {
	select: selectClients,
	selectWithPort: selectClientsWithPort,
	add: localClientAdd,
}
