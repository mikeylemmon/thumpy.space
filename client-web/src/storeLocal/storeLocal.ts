// storeLocal connects to the shared store worker and receives up-to-date app
// state as it's first message from the worker. Instead of handling dispatched
// actions directly, the synced store forwards actions to the worker and only
// applies the actions once they are received back as messages from the worker.
// In addition to locally dispatched actions, the worker sends actions from
// other clients, keeping state in sync across all windows/tabs.
//
// Inspired by https://github.com/burakcan/redux-shared-worker/blob/master/src/wire.js
import { configureStore, getDefaultMiddleware, EnhancedStore, PayloadAction } from '@reduxjs/toolkit'
import { createEpicMiddleware } from 'redux-observable'
import { proxyMsg, WorkerMsg, WorkerMsgKind } from 'storeShared/apiWorker'
import rootReducerLocal from './rootReducerLocal'
import createRootEpic from './rootEpicLocal'
import apiThisClient, { StateThisClient } from './apiThisClient'
// import apiSequences from './apiSequences'
import apiShared from './apiShared'

const epicMiddleware = createEpicMiddleware()

function initStore(store: EnhancedStore, thisClient: StateThisClient) {
	store.dispatch(apiThisClient.update(thisClient))
	epicMiddleware.run(createRootEpic())
	return store
}

function connectToSharedStore(store: EnhancedStore): EnhancedStore {
	// storeWorker is shared across all open windows/tabs and manages the app's state
	const storeWorker = new SharedWorker('storeWorker/worker', {
		type: 'module',
		name: 'thump-worker',
	})

	if (!storeWorker) {
		console.warn(
			'Unable to connect to shared store worker, continuing with multi-tab/window support disabled',
		)
		return initStore(store, {
			id: -1,
			isAudioPlayer: true,
		})
	}

	// Handle messages from the worker
	storeWorker.port.onmessage = (event: MessageEvent) => {
		const msg = event.data as WorkerMsg
		switch (msg.kind) {
			case WorkerMsgKind.Connected:
				// This is the first message sent by the worker.  It contains the app's
				// StateShared, which is used to initialize the local storeLocal's state.
				// It also contains the Client object for this client, which is
				// used to initialize the local epics
				console.log('[storeLocal] Connected to the shared storeWorker')
				store.dispatch(apiShared.connected(msg.data.stateShared))
				initStore(store, msg.data.client)
				return
			case WorkerMsgKind.Action:
				// Send the embedded action to the reducer to update app state
				store.dispatch(msg.data.action)
				return
			default:
				console.error('[storeLocal] Received an unsupported message', event.data)
				return
		}
	}

	// Proxy wraps the redux store and intercepts calls to "dispatch", forwarding
	// them to the store-worker instead of handling them locally
	return new Proxy(store, {
		get: (target: any, name: string) => {
			if (name === 'dispatch') {
				// dispatches are sent to the worker, with the expectation that the worker
				// will send the action back
				return (action: PayloadAction) => {
					// switch (action.type) {
					// 	// Blacklist certain actions from posting to the shared store
					// 	case apiSequences.currentStep.set.type:
					// 		return target.dispatch(action)
					// }
					storeWorker.port.postMessage(proxyMsg.action(action))
				}
			}
			// everything else is handled locally
			return target[name]
		},
	})
}

const store = configureStore({
	reducer: rootReducerLocal,
	middleware: [...getDefaultMiddleware(), epicMiddleware],
})

const storeLocal = connectToSharedStore(store)

export default storeLocal
