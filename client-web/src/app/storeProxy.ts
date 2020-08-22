// Inspired by https://github.com/burakcan/redux-shared-worker/blob/master/src/wire.js
import { configureStore, EnhancedStore, PayloadAction } from '@reduxjs/toolkit'
import { rootStateInitial, RootState, SyncPayloadAction } from './rootReducer'

// A store proxy is a minimal redux store that forwards all dispatches to a
// worker, and receives all state updates from that worker. Worker is expected
// to be a SharedWorker (it's an "any" because typescript doesn't have support
// for SharedWorker)
const storeProxy = (worker: any): EnhancedStore => {
	const store = configureStore({
		reducer: (state: RootState = rootStateInitial, action: SyncPayloadAction) => {
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
	worker.port.onmessage = (e: MessageEvent) => store.dispatch(e.data)

	return new Proxy(store, {
		get: (target: any, name: string) => {
			if (name === 'dispatch') {
				// dispatches are sent to the worker, with the expectation that the worker
				// will send the action back with the updated rootState in the action's metadata
				return (action: PayloadAction) => {
					worker.port.postMessage({ action })
				}
			}
			// everything else is handled locally
			return target[name]
		},
	})
}
export default storeProxy
