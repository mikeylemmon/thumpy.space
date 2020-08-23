import * as Tone from 'tone'
import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import apiClock from 'storeLocal/apiClock'

const Clock: React.FC = () => {
	const dispatch = useDispatch()
	const togglePaused = () => {
		Tone.start()
		dispatch(apiClock.paused.toggle())
	}
	const paused = useSelector(apiClock.paused.selector)
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
