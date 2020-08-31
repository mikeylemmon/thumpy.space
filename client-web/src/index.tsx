import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import { Provider } from 'react-redux'
import storeLocal from 'storeLocal/storeLocal'
import 'index.css'

const render = () => {
	const App = require('app/App').default

	ReactDOM.render(
		<Provider store={storeLocal}>
			<Router>
				<Switch>
					<Route exact path='/:subengine/:instrumentId' component={App} />
					<Route component={App} />
				</Switch>
			</Router>
		</Provider>,
		document.getElementById('root'),
	)
}

render()

if (process.env.NODE_ENV === 'development' && module.hot) {
	module.hot.accept('./app/App', render)
}
