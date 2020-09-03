import { start as startTone } from 'tone'
import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import apiClock from 'storeLocal/apiClock'

const Clock: React.FC = () => {
	const dispatch = useDispatch()
	const togglePaused = () => {
		startTone() // called here because tone must be started directly from user input
		dispatch(apiClock.paused.toggle())
	}
	const paused = useSelector(apiClock.paused.select)
	const txt = paused ? 'PLAY' : 'STOP'
	return (
		<div
			style={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				backgroundColor: '#222',
			}}
		>
			<button
				onClick={togglePaused}
				style={{
					cursor: 'pointer',
					fontWeight: 'bold',
					fontSize: '0.8rem',
					padding: '1.0rem',
					margin: '0.5rem',
					backgroundColor: '#ccc',
					borderRadius: '1rem',
				}}
			>
				{txt}
			</button>
			<a
				href='/docs/index.html'
				style={{
					position: 'absolute',
					right: '20px',
					bottom: '25px',
					color: 'white',
					textDecoration: 'underline',
				}}
			>
				Docs
			</a>
		</div>
	)
}

export default Clock
