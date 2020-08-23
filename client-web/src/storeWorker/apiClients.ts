import { createSelector } from '@reduxjs/toolkit'
import { StateShared } from 'storeShared/reducerShared'
import {
	actionsClients,
	adapterClients,
	sliceNameClients,
	populatePort,
	Client,
	ClientWithPort,
	StateClients,
} from 'storeShared/sliceClients'

const selectors = adapterClients.getSelectors<StateShared>(state => state[sliceNameClients])
const selectClients = selectors.selectAll
const selectClientsWithPort = createSelector<StateShared, Client[], Array<ClientWithPort>>(
	[selectClients],
	clients => clients.map(populatePort),
)

export default {
	select: selectClients,
	selectWithPort: selectClientsWithPort,
	newFromPort: actionsClients.newFromPort,
}
