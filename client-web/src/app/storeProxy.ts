import { configureStore, createAction, createReducer, EnhancedStore, PayloadAction } from '@reduxjs/toolkit'
import { RootState, rootStateInitial } from './rootReducer'

export const syncRoot = createAction<RootState>('@@storeProxy/syncRoot')

// A store proxy is a minimal redux store that forwards all dispatches to a
// worker, and receives all state updates from that worker. Worker is expected
// to be a SharedWorker (it's an "any" because typescript doesn't have support
// for SharedWorker)
const storeProxy = (worker: any): EnhancedStore => {
	const store = configureStore({
		reducer: createReducer(rootStateInitial, {
			[syncRoot.type]: (state, action: PayloadAction<RootState>) => action.payload,
		}),
	})

	worker.port.onmessage = (e: MessageEvent) => store.dispatch(e.data)

	return new Proxy(store, {
		get: (target: any, name: string) => {
			if (name === 'dispatch') {
				// dispatches are sent to the worker, with the expectation that the worker
				// will respond with a syncRoot message after the action has been applied
				return (action: PayloadAction) => worker.port.postMessage({ action })
			}
			// everything else is handled locally
			return target[name]
		},
	})
}
export default storeProxy
