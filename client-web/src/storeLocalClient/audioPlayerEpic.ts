// import * as Tone from 'tone'
import { distinctUntilChanged, ignoreElements, map, tap } from 'rxjs/operators'
import { Epic } from 'redux-observable'
import { Action$, State$ } from 'store/rootReducer'
import clock from 'store/clockState'
import { LocalClient } from 'store/localClientsSlice'

// type AudioState = {
// 	instruments: Tone.IInstrument[]
// }
// const audioState = { instruments: [] }

export default (thisClient: LocalClient): Epic => (action$: Action$, state$: State$) => {
	return state$.pipe(
		map(state => clock.selector(state)),
		distinctUntilChanged(),
		tap(clockState => {
			console.log('[audioPlayerEpic]', clockState)
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
