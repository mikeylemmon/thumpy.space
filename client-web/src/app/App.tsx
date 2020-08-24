import React from 'react'
import Clock from 'components/Clock'
import SequenceList from 'components/sequence/SequenceList'

import './App.css'

const App: React.FC = () => {
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
			<SequenceList />
			<Clock />
		</div>
	)
}

export default App
