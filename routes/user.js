var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var TOKEN_EXPRIED = 60 * 60 * 30;

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
		delete userData.password;

		// Create user token
		var token = jwt.sign(userData, app.get('superSecret'), {
			expiresIn: TOKEN_EXPRIED
		});
		req.session.token = token;

		req.log.info({
			catalog: 'User',
			action: 'Signup',
			req: userData,
			result: result
		});
		res.json(result);
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
			userData = result.data;
			delete userData.password;

			// Create user token
			var token = jwt.sign(userData, app.get('superSecret'), {
				expiresIn: TOKEN_EXPRIED
			});
			req.session.token = token;

			req.log.info({
				catalog: 'User',
				action: 'Signin',
				req: userData,
				result: result
			});
		} else {
			req.session.token = null;
			
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