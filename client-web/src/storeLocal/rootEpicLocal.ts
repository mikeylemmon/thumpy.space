import { catchError } from 'rxjs/operators'
import { combineEpics, Epic } from 'redux-observable'
import { Action$, StateShared$ } from 'storeShared/reducerShared'
import { LocalClient } from 'storeShared/sliceLocalClients'
import createAudioPlayerEpic from './epicAudioPlayer'

export default function createRootEpic(thisClient: LocalClient): Epic {
	console.log('[createRootEpic] Initializing epics', thisClient)
	const epics: Epic[] = []
	if (thisClient.isAudioPlayer) {
		epics.push(createAudioPlayerEpic(thisClient))
	}
	// const rootEpic: Epic = combineEpics(...epics)
	// Wrap the epics with a global error handler that catches uncaught errors
	return (action$: Action$, store$: StateShared$, deps: any) =>
		combineEpics(...epics)(action$, store$, deps).pipe(
			// rootEpic(action$, store$, deps).pipe(
			catchError((err, source) => {
				console.error('Uncaught error in epics:', err)
				return source
			}),
		)
}
