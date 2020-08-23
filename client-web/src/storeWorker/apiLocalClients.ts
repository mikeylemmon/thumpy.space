import { createSelector } from '@reduxjs/toolkit'
import { StateShared } from 'storeShared/reducerShared'
import {
	localClientAdd,
	adapterLocalClients,
	sliceNameLocalClients,
	populatePort,
	LocalClient,
	LocalClientWithPort,
	StateLocalClients,
} from 'storeShared/sliceLocalClients'

const selectors = adapterLocalClients.getSelectors<StateShared>(state => state[sliceNameLocalClients])
const selectClients = selectors.selectAll
const selectClientsWithPort = createSelector<StateShared, LocalClient[], Array<LocalClientWithPort>>(
	[selectClients],
	localClients => localClients.map(populatePort),
)

export default {
	select: selectClients,
	selectWithPort: selectClientsWithPort,
	add: localClientAdd,
}
