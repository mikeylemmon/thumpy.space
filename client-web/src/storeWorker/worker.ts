// Inspired by https://github.com/burakcan/redux-shared-worker/blob/master/src/wire.worker.js
import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit'
import { createEpicMiddleware } from 'redux-observable'
import rootReducer from 'store/rootReducer'
import localClients from 'store/localClientsState'
import { workerMsgConnected, ProxyMsg, ProxyMsgKind } from 'store/workerAPI'
import rootEpic from './workerEpics'

const epicMiddleware = createEpicMiddleware()
const store = configureStore({
	reducer: rootReducer,
	middleware: [...getDefaultMiddleware(), epicMiddleware],
})

function handleMessage(event: MessageEvent) {
	const msg = event.data as ProxyMsg
	switch (msg.kind) {
		case ProxyMsgKind.Action:
			store.dispatch(msg.data.action)
			return
		default:
			console.error('[handleMessage] Received an unsupported message', event.data)
			return
	}
}

function handleConnect(event: MessageEvent) {
	const port = event.ports[0]
	const actionAddLC = localClients.add(port)
	const lc = actionAddLC.payload
	port.postMessage(workerMsgConnected(lc, store.getState())) // tell the client which client it is
	store.dispatch(actionAddLC) // add client to the store
	port.onmessage = handleMessage // set the port's message handler
}

function run() {
	const ctx = self as any
	if (!ctx || !('onconnect' in ctx)) {
		console.error(`Can't find "onconnect", is this a SharedWorker context?`, ctx)
		return
	}
	console.log('[run] Running thump worker')

	epicMiddleware.run(rootEpic)

	let connID = 0
	ctx.onconnect = handleConnect
}

run()
