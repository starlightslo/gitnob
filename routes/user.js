var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var TOKEN_EXPRIED = 60 * 60 * 30;

var UserModule = require('../modules/user');

var user = function(req, res, next) {
	req.log.info({
		catalog: 'User',
		action: 'User',
		req: userData,
		result: userData
	});
	console.log(userData.username);
	res.json(userData);
	res.end();
	return;
}

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
				// Update userData from database
				var User = UserModule.init(db, app.settings.config.database.type);
				User.isUserExisting(userData.username).then(function(result) {
				this.userData = result.data;
					req.log.info({
						catalog: 'User',
						action: 'isLogin',
						req: token,
						result: this.userData
					});

					// Should denied the user type with < 0
					if (this.userData.type < 0) {
						res.status(403).send('Access Denied');
						res.end();
						return;
					}
					
					next();
				}, function(err) {
					req.log.info({
						catalog: 'User',
						action: 'isLogin',
						req: token,
						result: UserModule.USER_NOT_FOUND
					});
					res.status(403).send(UserModule.USER_NOT_FOUND.result);
					res.end();
					return;
				});
			}
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

	// Check value of input
	/* =======================
	          TODO
	======================= */

	var userData = {
		username: username,
		password: bcrypt.hashSync(password),
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
		result['data'] = userData;
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

	// Check value of input
	/* =======================
	          TODO
	======================= */

	var userData = {
		username: username,
		password: password
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

var changePassword = function(req, res, next) {
	var password = req.body.password;
	var newPassword = req.body.newPassword;

	// Check value of input
	/* =======================
	          TODO
	======================= */

	var passwordData = {
		username: userData.username,
		password: password,
		newPassword: bcrypt.hashSync(newPassword)
	}
	var User = UserModule.init(db, app.settings.config.database.type);
	User.changePassword(passwordData).then(function(result) {
		req.log.info({
			catalog: 'User',
			action: 'Change Password',
			req: {
				userData: userData,
				passwordData: passwordData
			},
			result: result
		});
		res.json(result);
		res.end();
		return;
	}, function(err) {
		req.log.error({
			catalog: 'User',
			action: 'Change Password',
			req: {
				userData: userData,
				passwordData: passwordData
			},
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

var addSshKey = function(req, res, next) {
	var sshKey = req.body.sshKey;
	var keyName = req.body.keyName;

	// Check value of input
	/* =======================
	          TODO
	======================= */

	var User = UserModule.init(db, app.settings.config.database.type);
	User.addSshKey(userData.username, sshKey, keyName).then(function(result) {
		req.log.info({
			catalog: 'User',
			action: 'Add SSH Key',
			req: {
				userData: userData,
				sshKey: sshKey,
				keyName: keyName
			},
			result: result
		});
		res.json(result);
		res.end();
		return;
	}, function(err) {
		req.log.error({
			catalog: 'User',
			action: 'Add SSH Key',
			req: {
				userData: userData,
				sshKey: sshKey,
				keyName: keyName
			},
			error: err
		});
		res.status(500).send('Server Error: ' + err);
		return;
	});
}

var deleteSshKey = function(req, res, next) {
	var keyName = req.params.name;

	// Check value of input
	/* =======================
	          TODO
	======================= */

	var User = UserModule.init(db, app.settings.config.database.type);
	User.deleteSshKey(userData.username, keyName).then(function(result) {
		req.log.info({
			catalog: 'User',
			action: 'Delete SSH Key',
			req: {
				userData: userData,
				sshKey: sshKey,
				keyName: keyName
			},
			result: result
		});
		res.json(result);
		res.end();
		return;
	}, function(err) {
		req.log.error({
			catalog: 'User',
			action: 'Delete SSH Key',
			req: {
				userData: userData,
				sshKey: sshKey,
				keyName: keyName
			},
			error: err
		});
		res.status(500).send('Server Error: ' + err);
		return;
	});
}

module.exports = {
	user: user,
	signup: signup,
	signin: signin,
	logout: logout,
	changePassword: changePassword,
	isLogin: isLogin,
	addSshKey: addSshKey,
	deleteSshKey: deleteSshKey
}