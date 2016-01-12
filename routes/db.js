'use strict'

var init = function(req, res, next) {
	req.db = null;
	if (req.app.settings.config.database.type == 'txt') {
		req.log.info({
			catalog: 'Database',
			action: 'Init',
			req: req.app.settings.config.database,
			result: 'OK'
		})
		req.db = require('../modules/txtdb').connect(req.app.settings.config.database.path, req.app.settings.config.database.name)
	} else {
		req.log.info({
			catalog: 'Database',
			action: 'Init',
			req: this.app.settings.config.database,
			result: 'Not supported db type.'
		})
	}
	next()
}

module.exports = {
	init: init
}