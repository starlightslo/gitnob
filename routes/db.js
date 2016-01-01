
var init = function(req, res, next) {
	this.db = null;
	if (app.settings.config.database.type == 'txt') {
		req.log.info({
			catalog: 'Database',
			action: 'Init',
			req: app.settings.config.database,
			result: 'OK'
		});
		this.db = require('../modules/txtdb').connect(app.settings.config.database.path, app.settings.config.database.name);
	} else {
		req.log.info({
			catalog: 'Database',
			action: 'Init',
			req: app.settings.config.database,
			result: 'Not supported db type.'
		});
	}
	next();
}

module.exports = {
	init: init
}