// Inspired by https://github.com/burakcan/redux-shared-worker/blob/master/src/wire.js
import { configureStore, EnhancedStore, PayloadAction } from '@reduxjs/toolkit'
import { rootStateInitial, RootState } from './rootReducer'
import { LocalClient } from 'store/localClientsSlice'
import { Subject } from 'rxjs'
import { proxyMsgAction, SyncAction, WorkerMsg, WorkerMsgKind } from 'store/workerAPI'

export const thisClient$ = new Subject<LocalClient>()

// A store proxy is a minimal redux store that forwards all dispatches to a
// worker, and receives all state updates from that worker. Worker is expected
// to be a SharedWorker (it's an "any" because typescript doesn't have support
// for SharedWorker)
const storeProxy = (worker: any): EnhancedStore => {
	const store = configureStore({
		reducer: (state: RootState = rootStateInitial, action: SyncAction) => {
			if (action.type.match(/^@@/)) {
				return state // @@ actions are internal to redux
			}
			// All actions come from the shared store-worker with the root state embedded
			// in the meta field, so we use that rootState to override the current state
			const { meta } = action
			const { rootState, sync } = meta || {}
			if (!sync) {
				throw new Error(`storeProxy received an invalid action: ${JSON.stringify(action)}`)
			}
			return rootState
		},
	})

	// Dispatch any messages we receive from the worker to the above store
	worker.port.onmessage = (e: MessageEvent) => {
		const msg = e.data as WorkerMsg
		console.log('[storeProxy] Received a message', msg)
		switch (msg.kind) {
			case WorkerMsgKind.Connected:
				// This is the first message sent by the worker. It contains the LocalClient
				// object for this client, which is added to the "thisClient$" stream so
				// that the audioPlayer epic can activate if this client is designated as
				// the audio player
				thisClient$.next(msg.data.localClient)
				return
			case WorkerMsgKind.Sync:
				store.dispatch(msg.data.action)
				return
			default:
				console.error('[storeProxy] Received an unsupported message', e.data)
		}
	}

	return new Proxy(store, {
		get: (target: any, name: string) => {
			if (name === 'dispatch') {
				// dispatches are sent to the worker, with the expectation that the worker
				// will send the action back with the updated rootState in the action's metadata
				return (action: PayloadAction) => {
					worker.port.postMessage(proxyMsgAction(action))
				}
			}
			// everything else is handled locally
			return target[name]
		},
	})
}
export default storeProxy
