var crypto = require('crypto');
var UserModule = require('../modules/user');

var signup = function(req, res, next) {
	var username = req.body.username;
	var password = req.body.password;

	var userData = {
		username: username,
		password: crypto.createHash('md5').update(password).digest("hex"),
		sshKeyList: [],
		repositoryList: [],
		type: 0
	}
	var User = UserModule.init(db, app.settings.config.database.type);
	User.signup(userData).then(function(result) {
		var resp = result;
		req.log.info({
			catalog: 'User',
			action: 'Signup',
			req: userData,
			result: resp
		});
		res.json(resp);
		res.end();
		return;
	}, function(err) {
		req.log.error({
			catalog: 'User',
			action: 'Signup',
			req: userData,
			error: err
		});
		res.status(500).send('Server Error: ' + err);
		return;
	});
}

var signin = function(req, res, next) {
	var username = req.body.username;
	var password = req.body.password;

	var userData = {
		username: username,
		password: crypto.createHash('md5').update(password).digest("hex")
	}
	var User = UserModule.init(db, app.settings.config.database.type);
	User.signin(userData).then(function(result) {
		if (result.code == UserModule.USER_OK.code) {
			delete result.data.password;
			req.log.info({
				catalog: 'User',
				action: 'Signin',
				req: userData,
				result: result
			});
		} else {
			req.log.info({
				catalog: 'User',
				action: 'Signin',
				req: userData,
				result: result
			});
		}
		res.json(result);
		res.end();
		return;
	}, function(err) {
		req.log.error({
			catalog: 'User',
			action: 'Signin',
			req: userData,
			error: err
		});
		res.status(500).send('Server Error: ' + err);
		return;
	});
}

module.exports = {
	signup: signup,
	signin: signin
}