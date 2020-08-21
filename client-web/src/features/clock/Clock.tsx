import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import clock from 'store/clockState'
// import * as Tone from 'tone'
// let synth: Tone.Synth | null = null

const Clock: React.FC = () => {
	const dispatch = useDispatch()
	const paused = useSelector(clock.paused.selector)
	const togglePaused = () => {
		dispatch(clock.paused.toggle())
		// if (!synth) {
		// 	Tone.start()
		// 	const delay = new Tone.FeedbackDelay('8n.', 0.5).toDestination()
		// 	synth = new Tone.MembraneSynth({
		// 		octaves: 4,
		// 		pitchDecay: 0.1,
		// 	}).connect(delay)
		// }
		// synth.triggerAttackRelease('A1', '8n')
	}
	const txt = paused ? 'PLAY' : 'PAUSE'
	return (
		<div className='Clock'>
			<button
				onClick={togglePaused}
				style={{
					cursor: 'pointer',
					fontWeight: 'bold',
					padding: '5px',
				}}
			>
				{txt}
			</button>
		</div>
	)
}

export default Clock
