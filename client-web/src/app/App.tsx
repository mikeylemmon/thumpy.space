import React from 'react'
import Clock from 'features/clock/Clock'

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
			<p>thump thump thump thump</p>
			<p>thump thump thump thump</p>
			<p>thump thump thump thump</p>
		</div>
	)
}

export default App
