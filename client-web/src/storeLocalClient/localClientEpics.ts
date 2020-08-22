import { catchError } from 'rxjs/operators'
import { combineEpics, Epic } from 'redux-observable'
import { Action$, State$ } from 'store/rootReducer'
import { LocalClient } from 'store/localClientsSlice'
import createAudioPlayerEpic from './audioPlayerEpic'

export default function createRootEpic(thisClient: LocalClient): Epic {
	console.log('[createRootEpic] Initializing epics', thisClient)
	const epics: Epic[] = []
	if (thisClient.isAudioPlayer) {
		epics.push(createAudioPlayerEpic(thisClient))
	}
	// const rootEpic: Epic = combineEpics(...epics)
	// Wrap the epics with a global error handler that catches uncaught errors
	return (action$: Action$, store$: State$, deps: any) =>
		combineEpics(...epics)(action$, store$, deps).pipe(
			// rootEpic(action$, store$, deps).pipe(
			catchError((err, source) => {
				console.error('Uncaught error in epics:', err)
				return source
			}),
		)
}
