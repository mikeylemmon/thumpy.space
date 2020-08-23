// Inspired by https://github.com/burakcan/redux-shared-worker/blob/master/src/wire.worker.js
import { PayloadAction } from '@reduxjs/toolkit'
import { combineEpics, ActionsObservable, Epic, StateObservable } from 'redux-observable'
import { catchError, ignoreElements, tap, withLatestFrom } from 'rxjs/operators'
import { StateShared, Action$, StateShared$ } from 'storeShared/reducerShared'
import { workerMsg } from 'storeShared/apiWorker'
import localClients from './apiLocalClients'

const epicForwardAction: Epic = (action$: Action$, state$: StateShared$) =>
	action$.pipe(
		withLatestFrom(state$),
		tap(([action, state]) => {
			console.log('[epicFowardAction]', action.type)
			for (const lc of localClients.selectWithPort(state)) {
				lc.port.postMessage(workerMsg.action(action))
			}
		}),
		// Now throw the stream away so we don't trigger more actions
		// and cause an endless feedback loop
		ignoreElements(),
	)
const epics: Epic = combineEpics(epicForwardAction)

// rootEpic wraps the epics with a global error handler that catches uncaught errors
const rootEpic: Epic = (action$: Action$, store$: StateShared$, deps: any) =>
	epics(action$, store$, deps).pipe(
		catchError((err, source) => {
			console.error('Uncaught error in epics:', err)
			return source
		}),
	)

export default rootEpic
