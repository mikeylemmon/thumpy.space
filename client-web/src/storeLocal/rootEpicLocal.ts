import { FeedbackDelay, Frequency, MembraneSynth, Sampler, Sequence as ToneSequence, Transport } from 'tone'
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
import apiSequences, { StateSequence, Step } from './apiSequences'
import apiInstruments from './apiInstruments'
import apiThisClient from './apiThisClient'
import Engine from 'engine/Engine'

function epicStartStop(_unused: Action$, state$: StateLocal$) {
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

const delay = new FeedbackDelay('8n.', 0.5).toDestination()
const synth1 = new Sampler({
	urls: {
		A1: 'A1.mp3',
		A2: 'A2.mp3',
	},
	baseUrl: 'https://tonejs.github.io/audio/casio/',
}).connect(delay)
const synth2 = new MembraneSynth({
	octaves: 3,
	pitchDecay: 0.07,
	oscillator: { type: 'triangle' },
}).connect(delay)

const engine = new Engine()
console.log('[rootEpicLocal] engine:', engine)

function epicSequences(_unused: Action$, state$: StateLocal$) {
	return state$.pipe(
		// TODO: replace isAudioPlayer filter with block that includes teardown on !paused -> paused
		filter(state => apiThisClient.isAudioPlayer.select(state)),
		map(state => apiSequences.selectAll(state)),
		distinctUntilChanged(),
		mergeMap(seqs => from$(seqs)), // split into separate events for each seq
		groupBy(seq => seq.id), // split into separate streams for each seq
		mergeMap(seq$ => {
			console.log('[epicSequences]', 'New sequence pipe')
			type TickEvent = {
				seq: StateSequence
				step: Step
			}
			const tick = (time: number, tickEvt: TickEvent) => {
				const { seq, step } = tickEvt
				for (const trig of step.triggers) {
					const ss = seq.id === 'seq-1' ? synth1 : synth2
					ss.triggerAttackRelease(Frequency(trig.freq, trig.unit).toFrequency(), trig.dur, time)
					// for (const oo of seq.outputs) {
					// 	instruments[oo.instrumentId].trigger(oo.inputId, trig)
					// }
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
					sequencer.events = seq.steps.map(step => ({
						seq,
						step,
					}))
					engine.updateSequence(seq)
				}),
				ignoreElements(),
			)
		}),
		ignoreElements(),
	)
}

function epicInstruments(_unused: Action$, state$: StateLocal$) {
	return state$.pipe(
		// TODO: replace isAudioPlayer filter with block that includes teardown on !paused -> paused
		filter(state => apiThisClient.isAudioPlayer.select(state)),
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
	const epics: Epic[] = [epicStartStop, epicInstruments, epicSequences]
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
