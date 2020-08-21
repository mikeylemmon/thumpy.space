// Inspired by https://github.com/burakcan/redux-shared-worker/blob/master/src/wire.worker.js
import { PayloadAction } from '@reduxjs/toolkit'
import { rootActions } from 'app/rootReducer'
import store from 'app/store'
const { sync } = rootActions

export type StoreWorkerAPI = {
	req: {
		action: PayloadAction
	}
	resp: {
		action: typeof sync
	}
}

function handleMessage(event: MessageEvent) {
	const { data, ports, ...rest } = event
	const { action } = data
	if (!action) {
		console.error('Received an unexpected message', event)
		return
	}
	console.log(`Received ${action.type}`, action.payload, rest, { numPorts: ports.length })
	store.dispatch(action)
}

function run() {
	const ctx = self as any

	if (!ctx || !('onconnect' in ctx)) {
		console.error(`Can't find "onconnect", is this a SharedWorker context?`, ctx)
		return
	}

	console.log('Running thump worker')

	let connID = 0
	ctx.onconnect = (event: MessageEvent) => {
		const id = connID++
		console.log(`Client ${id} connected`)
		const port = event.ports[0]
		port.onmessage = handleMessage
		store.subscribe(() => {
			port.postMessage(sync(store.getState()))
		})
	}
}

run()
