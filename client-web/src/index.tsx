import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import storeProxy from './app/storeProxy'
import 'index.css'

const worker = new SharedWorker('./store-worker', {
	type: 'module',
	name: 'thump-worker',
})
const store = storeProxy(worker)

const render = () => {
	const App = require('./app/App').default

	ReactDOM.render(
		<Provider store={store}>
			<App />
		</Provider>,
		document.getElementById('root'),
	)
}

render()

if (process.env.NODE_ENV === 'development' && module.hot) {
	module.hot.accept('./app/App', render)
}
