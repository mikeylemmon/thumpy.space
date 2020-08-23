import { createAction, createEntityAdapter, createSlice, EntityState } from '@reduxjs/toolkit'

export const sliceNameLocalClients = 'localClients'

export type LocalClient = {
	id: number
	isAudioPlayer: boolean
}
export type LocalClientWithPort = LocalClient & {
	port: MessagePort
}

// Ports maps LocalClients to SharedWorker MessagePorts
class Ports {
	_ports: { [key: number]: MessagePort } = {}
	newLocalClient(port: MessagePort): LocalClient {
		const id = Object.keys(this._ports).length
		this._ports[id] = port
		return {
			id: id,
			isAudioPlayer: id === 0, // only the first localClient should play audio
		}
	}
	getPort(lc: LocalClient): MessagePort {
		return this._ports[lc.id]
	}
}
const ports = new Ports()

// populatePort takes a LocalClient and adds its corresponding port
export const populatePort = (lc: LocalClient): LocalClientWithPort => {
	return { ...lc, port: ports.getPort(lc) }
}

export const adapterLocalClients = createEntityAdapter<LocalClient>()
export const stateInitialLocalClients = adapterLocalClients.getInitialState()
const sliceLocalClients = createSlice({
	name: sliceNameLocalClients,
	initialState: stateInitialLocalClients,
	reducers: {
		addOne: adapterLocalClients.addOne,
	},
})

// localClientAdd takes a port and returns an action to add
// a corresponding localClient to the store
export const localClientAdd = createAction(sliceLocalClients.actions.addOne.type, (port: MessagePort) => {
	const lc = ports.newLocalClient(port)
	console.log('[localClients] New local client', lc)
	return { payload: lc }
})

export type StateLocalClients = EntityState<LocalClient>

export default sliceLocalClients.reducer
