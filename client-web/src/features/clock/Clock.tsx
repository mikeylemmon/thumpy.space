import * as Tone from 'tone'
import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import clock from 'storeLocal/apiClock'

const Clock: React.FC = () => {
	const dispatch = useDispatch()
	const togglePaused = () => {
		Tone.start()
		dispatch(clock.paused.toggle())
	}
	const paused = useSelector(clock.paused.selector)
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
