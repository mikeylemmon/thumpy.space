import React from 'react'
import Clock from 'components/Clock'
import SequenceList from 'components/sequences/SequenceList'
import VideoOutput from 'components/VideoOutput'

import './App.css'

type OwnProps = {
	match: {
		params: {
			subengine: string
			instrumentId: string
		}
	}
}

const App: React.FC<OwnProps> = ({
	match: {
		params: { subengine, instrumentId },
	},
}) => {
	console.log('[App]', { subengine, instrumentId })
	const children = [<Clock />]
	if (subengine === 'video' && instrumentId) {
		children.unshift(<VideoOutput instId={instrumentId} />)
	} else {
		children.unshift(<SequenceList />)
	}
	return (
		<div
			className='App'
			style={{
				display: 'flex',
				flexDirection: 'column',
				position: 'absolute',
				backgroundColor: '#383838',
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
			}}
		>
			{children}
		</div>
	)
}

export default App
