import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import storeLocal from 'storeLocal/storeLocal'
import 'index.css'

const render = () => {
	const App = require('app/App').default

	ReactDOM.render(
		<Provider store={storeLocal}>
			<App />
		</Provider>,
		document.getElementById('root'),
	)
}

render()

if (process.env.NODE_ENV === 'development' && module.hot) {
	module.hot.accept('./app/App', render)
}
