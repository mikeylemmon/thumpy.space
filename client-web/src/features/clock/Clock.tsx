import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { togglePaused } from './clockSlice'
import { RootState } from 'app/rootReducer'

const Clock: React.FC = () => {
	const dispatch = useDispatch()
	const { paused } = useSelector((state: RootState) => state.clock)
	const togPause = () => dispatch(togglePaused())
	const txt = paused ? 'PLAY' : 'PAUSE'
	return (
		<div className='Clock'>
			<button
				onClick={togPause}
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
