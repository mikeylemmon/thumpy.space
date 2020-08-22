import { createAction, createEntityAdapter, createSlice, EntityState } from '@reduxjs/toolkit'

export const localClientsSliceName = 'localClients'

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

export const localClientsAdapter = createEntityAdapter<LocalClient>()
export const localClientsStateInitial = localClientsAdapter.getInitialState()
export const localClientsSlice = createSlice({
	name: localClientsSliceName,
	initialState: localClientsStateInitial,
	reducers: {
		addOne: localClientsAdapter.addOne,
	},
})

// localClientAdd takes a port and returns an action to add
// a corresponding localClient to the store
export const localClientAdd = createAction(localClientsSlice.actions.addOne.type, (port: MessagePort) => {
	const lc = ports.newLocalClient(port)
	console.log('[localClients] New local client', lc)
	return { payload: lc }
})

export type LocalClientsState = EntityState<LocalClient>

export default localClientsSlice.reducer
