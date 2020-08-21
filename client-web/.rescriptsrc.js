const { prependWebpackPlugin } = require('@rescripts/utilities')
const WorkerPlugin = require('worker-plugin')

module.exports = prependWebpackPlugin(
	new WorkerPlugin({
		sharedWorker: true,
		worker: false,
	}),
)
