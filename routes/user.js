var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var TOKEN_EXPRIED = 60 * 60 * 30;

var UserModule = require('../modules/user');

var isLogin = function(req, res, next) {
	var token = req.session.token;
	if (token) {
		// verifies secret and checks exp
		jwt.verify(token, app.get('superSecret'), function(err, userData) {
			if (err) {
				req.log.info({
					catalog: 'User',
					action: 'isLogin',
					req: token,
					result: err
				});
				res.status(403).send('Access Denied');
				res.end();
				return;
			} else {
				req.log.info({
					catalog: 'User',
					action: 'isLogin',
					req: token,
					result: {
						username: userData.username
					}
				});

				// Should denied the user type with < 0
				if (userData.type < 0) {
					res.status(403).send('Access Denied');
					res.end();
					return;
				}
				this.userData = userData;
			}
			next();
		});
	} else {
		req.log.info({
			catalog: 'User',
			action: 'isLogin',
			req: token,
			result: 'No user token.'
		});
		res.status(403).send('Access Denied');
		res.end();
		return;
	}
}

var signup = function(req, res, next) {
	var username = req.body.username;
	var password = req.body.password;

	var userData = {
		username: username,
		password: crypto.createHash('md5').update(password).digest("hex"),
		sshKeyList: [],
		repositoryList: [],
		collaborateRepositoryList: [],
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

var logout = function(req, res, next) {
	var token = req.session.token;
	if (token) {
		// verifies secret and checks exp
		jwt.verify(token, app.get('superSecret'), function(err, userData) {
			if (err) {
				req.log.info({
					catalog: 'User',
					action: 'Logout',
					req: token,
					result: err
				});
			} else {
				req.log.info({
					catalog: 'User',
					action: 'Logout',
					req: token,
					result: {
						username: userData.username
					}
				});
			}
			req.session.token = null;
			res.json(UserModule.USER_OK);
			res.end();
			return;
		});
	} else {
		req.log.info({
			catalog: 'User',
			action: 'Logout',
			req: token,
			result: 'No user token.'
		});
		res.json(UserModule.USER_OK);
		res.end();
		return;
	}
}

module.exports = {
	signup: signup,
	signin: signin,
	logout: logout,
	isLogin: isLogin
}