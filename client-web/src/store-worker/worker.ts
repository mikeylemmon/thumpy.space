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
import { catchError, ignoreElements, tap, withLatestFrom } from 'rxjs/operators'
import rootReducer, { rootActions, RootState } from 'app/rootReducer'
// import store from 'app/store'
import localClients from 'store/localClientsState'

type Action$ = ActionsObservable<PayloadAction>
type State$ = StateObservable<RootState>

const epicMiddleware = createEpicMiddleware()
const epicSync: Epic = (action$: Action$, state$: State$) =>
	action$.pipe(
		withLatestFrom(state$),
		tap(([action, state]) => {
			console.log('[sync]', action.type)
			for (const lc of localClients.selectWithPort(state)) {
				lc.port.postMessage(rootActions.sync(action, state))
			}
		}),
		// Now throw the stream away so we don't trigger more actions
		// and cause an endless feedback loop
		ignoreElements(),
	)

const epics: Epic = combineEpics(epicSync)
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
		action: typeof rootActions.sync
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

function handleConnect(event: MessageEvent) {
	const port = event.ports[0]
	store.dispatch(localClients.add(port)) // add new local client to the store
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
