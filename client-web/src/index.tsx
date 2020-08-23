import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import storeLocal from 'storeLocal/storeLocal'
import 'index.css'

// storeWorker is shared across all open windows/tabs and manages the app's state
const storeWorker = new SharedWorker('storeWorker/worker', {
	type: 'module',
	name: 'thump-worker',
})
// store provides a redux interface to the shared app state as if it was local
const store = storeLocal(storeWorker)

const render = () => {
	const App = require('app/App').default

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
