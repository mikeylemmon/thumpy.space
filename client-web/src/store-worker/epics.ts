// Inspired by https://github.com/burakcan/redux-shared-worker/blob/master/src/wire.worker.js
import { PayloadAction } from '@reduxjs/toolkit'
import { combineEpics, ActionsObservable, Epic, StateObservable } from 'redux-observable'
import { catchError, ignoreElements, tap, withLatestFrom } from 'rxjs/operators'
import { RootState } from 'app/rootReducer'
import localClients from 'store/localClientsState'
import { workerMsgSync } from 'store/workerAPI'

type Action$ = ActionsObservable<PayloadAction>
type State$ = StateObservable<RootState>

const epicSync: Epic = (action$: Action$, state$: State$) =>
	action$.pipe(
		withLatestFrom(state$),
		tap(([action, state]) => {
			console.log('[sync]', action.type)
			for (const lc of localClients.selectWithPort(state)) {
				lc.port.postMessage(workerMsgSync(action, state))
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

export default rootEpic
