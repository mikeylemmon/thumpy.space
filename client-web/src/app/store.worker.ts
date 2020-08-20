// import { syncRoot } from './storeProxy'
// import store from './store'

// console.log('storeWorker started', store)

console.log('storeWorker started', this)

// const ctx = this as any
//
// function handleMessage(event: MessageEvent) {
// 	const { data, ports, ...rest } = event
// 	const { action } = data
// 	if (!action) {
// 		console.error('Received an unexpected message', event)
// 		return
// 	}
// 	console.log(`Received ${action.type}`, action.payload, rest, { numPorts: ports.length })
// 	store.dispatch(action)
// }
//
// if (!ctx || !('onconnect' in ctx)) {
// 	console.warn(`Can't find "onconnect", is this a SharedWorker context?`)
// 	console.warn(this)
// } else {
// 	console.log(`setting onconnect`)
// 	ctx.onconnect = (event: MessageEvent) => {
// 		console.log(`onconnect called`, event)
// 		const port = event.ports[0]
// 		port.onmessage = handleMessage
// 		store.subscribe(() => port.postMessage(syncRoot(store.getState())))
// 	}
// }

export default 'Im not a module'
