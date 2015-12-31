module.exports = {
	'port': 8888,
	'secret': '1234567890abcdefghijklmnopqrstuvwxyz',
	'logConfiguration': {
		name: 'GitNob',
		streams: [{
			level: 'trace',
			path: 'logs/gitnob-trace.log'
		},{
			level: 'debug',
			stream: process.stdout
		},{
			level: 'info',
			path: 'logs/gitnob-info.log'
		},{
			level: 'warn',
			path: 'logs/gitnob-warn.log'
		},{
			level: 'error',
			path: 'logs/gitnob-error.log'
		},{
			level: 'fatal',
			path: 'logs/gitnob-fatal.log'
		}]
	}
}
