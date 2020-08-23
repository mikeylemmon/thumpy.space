// import * as Tone from 'tone'
import { FeedbackDelay, MembraneSynth } from 'tone'
import { distinctUntilChanged, filter, ignoreElements, map, tap } from 'rxjs/operators'
import { Epic } from 'redux-observable'
import { Client } from 'storeShared/sliceClients'
import apiClock from './apiClock'
import { Action$, StateLocal$ } from './rootReducerLocal'

// type AudioState = {
// 	instruments: Tone.IInstrument[]
// }
// const audioState = { instruments: [] }
const delay = new FeedbackDelay('8n.', 0.5).toDestination()
const synth = new MembraneSynth({
	octaves: 4,
	pitchDecay: 0.1,
	oscillator: { type: 'triangle' },
}).connect(delay)

export default (thisClient: Client): Epic => (action$: Action$, state$: StateLocal$) => {
	return state$.pipe(
		filter(() => thisClient.isAudioPlayer),
		map(state => apiClock.selector(state)),
		distinctUntilChanged(),
		tap(clockState => {
			console.log('[audioPlayerEpic]', clockState)
			if (!clockState.paused) {
				console.log('[audioPlayerEpic] Playing synth')
				synth.triggerAttackRelease('A1', '4n')
			}
		}),
		// Now throw the stream away so we don't trigger more actions
		// and cause an endless feedback loop
		ignoreElements(),
	)
}

// let synth: Tone.Synth | null = null

// if (!synth) {
// 	Tone.start()
// 	const delay = new Tone.FeedbackDelay('8n.', 0.5).toDestination()
// 	synth = new Tone.MembraneSynth({
// 		octaves: 4,
// 		pitchDecay: 0.1,
// 	}).connect(delay)
// }
// synth.triggerAttackRelease('A1', '8n')
