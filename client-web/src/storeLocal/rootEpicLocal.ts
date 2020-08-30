import { from as from$ } from 'rxjs'
import { catchError, distinctUntilChanged, groupBy, ignoreElements, map, mergeMap, tap } from 'rxjs/operators'
import { combineEpics, Epic } from 'redux-observable'
import { Action$, StateLocal$ } from './rootReducerLocal'
import apiClock from './apiClock'
import apiSequences from './apiSequences'
import apiInstruments from './apiInstruments'
import apiThisClient from './apiThisClient'
import engine from 'engine/Engine'

console.log('[rootEpicLocal] engine:', engine)

function epicIsAudioPlayer(_unused: Action$, state$: StateLocal$) {
	return state$.pipe(
		map(state => apiThisClient.isAudioPlayer.select(state)),
		distinctUntilChanged(),
		tap(isAudioPlayer => engine.updateIsAudioPlayer(isAudioPlayer)),
		ignoreElements(),
	)
}

function epicStartStop(_unused: Action$, state$: StateLocal$) {
	return state$.pipe(
		map(state => apiClock.paused.select(state)),
		distinctUntilChanged(),
		tap(paused => engine.updatePaused(paused)),
		ignoreElements(),
	)
}

function epicSequences(_unused: Action$, state$: StateLocal$) {
	return state$.pipe(
		map(state => apiSequences.selectAll(state)),
		distinctUntilChanged(),
		mergeMap(seqs => from$(seqs)), // split into separate events for each seq
		groupBy(seq => seq.id), // split into separate streams for each seq
		mergeMap(seq$ =>
			seq$.pipe(
				// foreach seq
				distinctUntilChanged(),
				tap(seq => engine.updateSequence(seq)),
				ignoreElements(),
			),
		),
		ignoreElements(),
	)
}

function epicInstruments(_unused: Action$, state$: StateLocal$) {
	return state$.pipe(
		// TODO: replace isAudioPlayer filter with block that includes teardown on !paused -> paused
		map(state => apiInstruments.selectAll(state)),
		distinctUntilChanged(),
		mergeMap(insts => from$(insts)), // split into separate events for each inst
		groupBy(inst => inst.id), // split into separate streams for each inst
		mergeMap(inst$ => {
			console.log('[epicInstruments] New instrument pipe')
			return inst$.pipe(
				// foreach inst
				distinctUntilChanged(),
				tap(inst => {
					console.log('[epicInstruments] Instrument has changed', inst)
					engine.updateInstrument(inst)
				}),
				ignoreElements(),
			)
		}),
		ignoreElements(),
	)
}

export default function createRootEpic(): Epic {
	console.log('[createRootEpic] Initializing epics')
	const epics: Epic[] = [epicIsAudioPlayer, epicStartStop, epicInstruments, epicSequences]
	// Wrap the epics with a global error handler that catches uncaught errors
	return (action$: Action$, store$: StateLocal$, deps: any) =>
		combineEpics(...epics)(action$, store$, deps).pipe(
			catchError((err, source) => {
				console.error('Uncaught error in epics:', err)
				return source
			}),
		)
}
