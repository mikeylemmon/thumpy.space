import { createAction, createEntityAdapter, createSlice, EntityState } from '@reduxjs/toolkit'

export const sliceNameClients = 'clients'

export type Client = {
	id: number
	isAudioPlayer: boolean
}
export type ClientWithPort = Client & {
	port: MessagePort
}

// Ports maps Clients to SharedWorker MessagePorts
class Ports {
	_ports: { [key: number]: MessagePort } = {}
	newClient(port: MessagePort): Client {
		const id = Object.keys(this._ports).length
		this._ports[id] = port
		return {
			id: id,
			isAudioPlayer: id === 0, // only the first client should play audio
		}
	}
	getPort(client: Client): MessagePort {
		return this._ports[client.id]
	}
}
const ports = new Ports()

// populatePort takes a Client and adds its corresponding port
export const populatePort = (client: Client): ClientWithPort => {
	return { ...client, port: ports.getPort(client) }
}

export const adapterClients = createEntityAdapter<Client>()
export const stateInitialClients = adapterClients.getInitialState()
const sliceClients = createSlice({
	name: sliceNameClients,
	initialState: stateInitialClients,
	reducers: {
		addOne: adapterClients.addOne,
	},
})

// clientAdd takes a port and returns an action to add
// a corresponding client to the store
export const actionNewFromPort = createAction(sliceClients.actions.addOne.type, (port: MessagePort) => {
	const client = ports.newClient(port)
	console.log('[clients] New local client from port', client)
	return { payload: client }
})

export type StateClients = EntityState<Client>

export const actionsClients = {
	...sliceClients.actions,
	newFromPort: actionNewFromPort,
}

export default sliceClients.reducer
