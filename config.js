var path = require('path')

module.exports = {
	port: 8888,
	secret: '1234567890abcdefghijklmnopqrstuvwxyz',
	gitPath: '/Users/Tony/Documents/Dropbox/',
	database: {
		type: 'txt',
		path: path.join(__dirname, 'db'),
		name: 'db.txt'
	},
	logConfiguration: {
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
