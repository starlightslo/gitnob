var GitModule = require('../modules/git');
var UserModule = require('../modules/user');

var BLOCK_PERMISSION = -1;
var NORMAL_PERMISSION = 0;
var ADMIN_PERMISSION = 9;

var listRepository = function(req, res, next) {
	// List all repositories
	GitModule.listRepo(app.settings.config.gitPath).then(function(result) {
		var resp = {
			code: 200,
			result: 'OK',
			data: result
		}
		req.log.info({
			catalog: 'Admin',
			action: 'List Repository',
			req: userData,
			result: resp
		});
		res.json(resp);
		res.end();
		return;
	}, function(err) {
		req.log.error({
			catalog: 'Admin',
			action: 'List Repository',
			req: userData,
			error: err
		});
		res.status(500).send('Server Error: ' + err);
		return;
	});
};

var listUser = function(req, res, next) {
	// List all repositories
	var User = UserModule.init(db, app.settings.config.database.type);
	User.list().then(function(result) {
		req.log.info({
			catalog: 'Admin',
			action: 'List User',
			req: userData,
			result: result
		});
		res.json(result);
		res.end();
		return;
	}, function(err) {
		req.log.error({
			catalog: 'Admin',
			action: 'List User',
			req: userData,
			error: err
		});
		res.status(500).send('Server Error: ' + err);
		return;
	});
};

var checkAdminPermission = function(req, res, next) {
	// Check permission
	if (userData.type < ADMIN_PERMISSION) {
		req.log.info({
			catalog: 'Admin',
			action: 'Check Admin Permission',
			req: userData,
			result: 'No Permission.'
		});
		res.status(403).send('No Permission');
		return;
	}
	next();
}


module.exports = {
	checkAdminPermission: checkAdminPermission,
	listRepository: listRepository,
	listUser: listUser
}