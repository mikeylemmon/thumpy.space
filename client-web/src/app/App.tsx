import React from 'react'
import Clock from 'components/Clock'
import SequenceList from 'components/sequences/SequenceList'
import InstrumentList from 'components/instruments/InstrumentList'
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
	// console.log('[App]', { subengine, instrumentId })
	const children = [<Clock key='clock' />]
	if (subengine === 'video' && instrumentId) {
		children.unshift(<VideoOutput key='video-output' instId={instrumentId} />)
	} else {
		children.unshift(<SequenceList key='sequences' />, <InstrumentList key='instruments' />)
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
