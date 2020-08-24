import { FeedbackDelay, Frequency, Sampler, Sequence as ToneSequence, Transport } from 'tone'
import { from as from$ } from 'rxjs'
import {
	catchError,
	distinctUntilChanged,
	filter,
	groupBy,
	ignoreElements,
	map,
	mergeMap,
	tap,
} from 'rxjs/operators'
import { combineEpics, Epic } from 'redux-observable'
import { Action$, StateLocal$ } from './rootReducerLocal'
import apiClock from './apiClock'
import apiSequences, { Step } from './apiSequences'
import apiThisClient from './apiThisClient'

function epicStartStop(action$: Action$, state$: StateLocal$) {
	return state$.pipe(
		map(state => apiClock.paused.select(state)),
		distinctUntilChanged(),
		tap(paused => {
			console.log('[epicStartStop]', paused ? 'stop' : 'start')
			paused ? Transport.stop() : Transport.start()
		}),
		ignoreElements(),
	)
}

function epicSequences(action$: Action$, state$: StateLocal$) {
	return state$.pipe(
		filter(state => apiThisClient.isAudioPlayer.select(state)),
		map(state => apiSequences.selectAll(state)),
		distinctUntilChanged(),
		mergeMap(seqs => from$(seqs)), // split into separate events for each seq
		groupBy(seq => seq.id), // split into separate streams for each seq
		mergeMap(seq$ => {
			console.log('[epicSequences]', 'New sequence pipe')
			const delay = new FeedbackDelay('8n.', 0.5).toDestination()
			// const synth = new MembraneSynth({
			// 	octaves: 4,
			// 	pitchDecay: 0.1,
			// 	oscillator: { type: 'triangle' },
			// }).connect(delay)
			const synth = new Sampler({
				urls: {
					A1: 'A1.mp3',
					A2: 'A2.mp3',
				},
				baseUrl: 'https://tonejs.github.io/audio/casio/',
			}).connect(delay)
			const tick = (time: number, step: Step) => {
				for (const trig of step.triggers) {
					synth.triggerAttackRelease(Frequency(trig.freq, trig.unit).toFrequency(), trig.dur, time)
				}
			}
			let sequencer = new ToneSequence(tick, [], '8n').start(0)

			let first = true
			return seq$.pipe(
				// foreach seq
				distinctUntilChanged(),
				tap(seq => {
					console.log('[epicSequences]', seq)
					if (first) {
						first = false
					}
					sequencer.events = seq.steps
				}),
				ignoreElements(),
			)
		}),
		ignoreElements(),
	)
}

export default function createRootEpic(): Epic {
	console.log('[createRootEpic] Initializing epics')
	const epics: Epic[] = [epicStartStop, epicSequences]
	// Wrap the epics with a global error handler that catches uncaught errors
	return (action$: Action$, store$: StateLocal$, deps: any) =>
		combineEpics(...epics)(action$, store$, deps).pipe(
			// rootEpic(action$, store$, deps).pipe(
			catchError((err, source) => {
				console.error('Uncaught error in epics:', err)
				return source
			}),
		)
}
