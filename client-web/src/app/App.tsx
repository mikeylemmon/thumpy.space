import React from 'react'
import Clock from 'components/Clock'
import SequenceList from 'components/sequence/SequenceList'

import './App.css'

const App: React.FC = () => {
	return (
		<div
			className='App'
			// style={{
			// 	backgroundColor: 'red',
			// }}
		>
			<h1>THUMP</h1>
			<Clock />
			<SequenceList />
		</div>
	)
}

export default App
