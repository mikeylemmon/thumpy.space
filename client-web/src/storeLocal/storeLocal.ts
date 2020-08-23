// Inspired by https://github.com/burakcan/redux-shared-worker/blob/master/src/wire.js
import {
	configureStore,
	createAction,
	getDefaultMiddleware,
	EnhancedStore,
	PayloadAction,
} from '@reduxjs/toolkit'
import { createEpicMiddleware } from 'redux-observable'
import { proxyMsg, WorkerMsg, WorkerMsgKind } from 'storeShared/apiWorker'
import { StateShared } from 'storeShared/reducerShared'
import rootReducerLocal, { localRootStateInitial, StateLocal } from './rootReducerLocal'
import createRootEpic from './rootEpicLocal'

// syncedStore connects to the shared store worker and receives up-to-date app
// state as it's first message from the worker. Instead of handling dispatched
// actions directly, the synced store forwards actions to the worker and only
// applies the actions once they are received back as messages from the worker.
// In addition to locally dispatched actions, the worker sends actions from
// other clients, keeping state in sync across all windows/tabs.
//
// The worker argument is expected to be a SharedWorker, it's an "any" because
// typescript doesn't have support for SharedWorker.
const syncedStore = (worker: any): EnhancedStore => {
	const epicMiddleware = createEpicMiddleware()
	const setRootState = createAction<StateShared>('setRootState')
	type SetRootState = PayloadAction<StateShared>
	const store = configureStore({
		reducer: (
			state: StateLocal = localRootStateInitial,
			action: PayloadAction | SetRootState,
		): StateLocal => {
			switch (action.type) {
				case setRootState.type:
					return { shared: (action as SetRootState).payload }
				default:
					return rootReducerLocal(state, action)
			}
		},
		middleware: [...getDefaultMiddleware(), epicMiddleware],
	})

	// Handle messages from the worker
	worker.port.onmessage = (event: MessageEvent) => {
		const msg = event.data as WorkerMsg
		switch (msg.kind) {
			case WorkerMsgKind.Connected:
				// This is the first message sent by the worker.  It contains the app's
				// StateShared, which is used to initialize the local syncedStore's state.
				// It also contains the LocalClient object for this client, which is
				// used to initialize the local epics
				console.log('[syncedStore] Connected to the shared storeWorker')
				store.dispatch(setRootState(msg.data.rootState))
				epicMiddleware.run(createRootEpic(msg.data.localClient))
				return
			case WorkerMsgKind.Action:
				// Send the embedded action to the reducer to update app state
				store.dispatch(msg.data.action)
				return
			default:
				console.error('[syncedStore] Received an unsupported message', event.data)
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
					worker.port.postMessage(proxyMsg.action(action))
				}
			}
			// everything else is handled locally
			return target[name]
		},
	})
}
export default syncedStore
