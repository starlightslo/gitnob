'use strict'

module.exports = function() {
	return {
		run: function(port, secret, logConfiguration) {
			var express = require('express')
			var session = require('express-session')
			var app = express()
			var bodyParser = require('body-parser')
			var uuid = require('uuid')
			var bunyan = require('bunyan')
			if (logConfiguration) {
				var log = bunyan.createLogger(logConfiguration)
			} else {
				var log = bunyan.createLogger({
					name: 'myApp',
					streams: [{
						level: 'trace',
						stream: process.stdout
					},{
						level: 'debug',
						stream: process.stdout
					},{
						level: 'info',
						stream: process.stdout
					},{
						level: 'warn',
						stream: process.stdout
					},{
						level: 'error',
						stream: process.stdout
					},{
						level: 'fatal',
						stream: process.stdout
					}]
				})
			}

			// Logger
			app.use(function(req, res, next) {
				req.log = log.child({uuid: uuid()})
				next()
			})

			// Set session
			//app.use(express.cookieParser())
			app.use(session({secret: secret}))

			// Set secret
			app.set('superSecret', secret)

			// Set static route
			app.use(express.static('website'))

			// Raw body parser
			var rawBodyParser = function(req, res, next) {
				var contentType = req.headers['content-type'] || '', mime = contentType.split('')[0]
				if ((mime == 'text/plain')) {
					req.rawBody = ''
					req.on('data', function(chunk) {
						req.rawBody += chunk
					})

					req.on('end', function() {
						next()
					})
				} else {
					return next()
				}
			}

			// Handle body
			app.use(rawBodyParser)
			app.use(bodyParser.urlencoded({ extended: false }))
			app.use(bodyParser.json())

			app.listen(port)
			log.info('Running Website on port: ' + port)
			return app
		}
	}
}
