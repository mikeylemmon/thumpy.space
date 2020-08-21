// Inspired by https://github.com/burakcan/redux-shared-worker/blob/master/src/wire.worker.js
import { configureStore, createAction, getDefaultMiddleware, Action, PayloadAction } from '@reduxjs/toolkit'
import {
	combineEpics,
	createEpicMiddleware,
	ActionsObservable,
	Epic,
	StateObservable,
} from 'redux-observable'
import { Observable } from 'rxjs'
import { catchError, ignoreElements, tap } from 'rxjs/operators'
import rootReducer, { rootActions, RootState } from 'app/rootReducer'
// import store from 'app/store'
import localClients from 'store/localClientsState'
const { sync } = rootActions

type Action$ = ActionsObservable<Action<any>>
type State$ = StateObservable<void>

const epicMiddleware = createEpicMiddleware()
const epicLogAction: Epic = (action$: Action$, state$: State$) =>
	action$.pipe(
		tap(action => console.log('[epicLogAction]', action.type)),
		// tap(action => {
		// 	throw new Error('hi')
		// }),
		ignoreElements(), // don't emit any actions
	)
const epics: Epic = combineEpics(epicLogAction)
// rootEpic wraps the epics with global error handler that catches uncaught errors
const rootEpic: Epic = (action$: Action$, store$: State$, deps: any) =>
	epics(action$, store$, deps).pipe(
		catchError((err, source) => {
			console.error('Uncaught error in epics:', err)
			return source
		}),
	)

const store = configureStore({
	reducer: rootReducer,
	middleware: [...getDefaultMiddleware(), epicMiddleware],
})

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

let connID = 0
function handleConnect(event: MessageEvent) {
	const id = connID++
	console.log(`Client ${id} connected`)
	const port = event.ports[0]
	store.dispatch(localClients.add(port))
	// TODO: refactor to redux-observables to provide triggering action along with sync payload
	port.onmessage = handleMessage
	store.subscribe(() => {
		port.postMessage(sync(store.getState(), createAction('root/null')()))
	})
}

function run() {
	const ctx = self as any
	if (!ctx || !('onconnect' in ctx)) {
		console.error(`Can't find "onconnect", is this a SharedWorker context?`, ctx)
		return
	}
	console.log('Running thump worker')

	epicMiddleware.run(rootEpic)

	let connID = 0
	ctx.onconnect = handleConnect
}

run()
