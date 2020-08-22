import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import clock from 'store/clockState'

const Clock: React.FC = () => {
	const dispatch = useDispatch()
	const togglePaused = () => {
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
