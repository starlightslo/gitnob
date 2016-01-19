'use strict'

var bcrypt = require('bcryptjs')
var jwt = require('jsonwebtoken')
var TOKEN_EXPRIED = 60 * 60 * 30

var UserModule = require('../modules/user')

var user = function(req, res, next) {
	var userData = req.session.userData
	delete userData.password
	
	req.log.info({
		catalog: 'User',
		action: 'User',
		req: userData,
		result: userData
	})
	res.json(userData)
	res.end()
	return
}

var isLogin = function(req, res, next) {
	var token = req.session.token
	if (token) {
		// verifies secret and checks exp
		jwt.verify(token, req.app.get('superSecret'), function(err, userData) {
			if (err) {
				req.log.info({
					catalog: 'User',
					action: 'isLogin',
					req: token,
					result: err
				})
				res.status(403).send('Access Denied')
				res.end()
				return
			} else {
				// Update userData from database
				var User = UserModule.init(req.db, req.app.settings.config.database.type, req.app.settings.user)
				User.isUserExisting(userData.username).then(function(result) {
					req.session.userData = result.data
					req.log.info({
						catalog: 'User',
						action: 'isLogin',
						req: token,
						result: req.session.userData
					})

					// Should denied the user type with < 0
					if (req.session.userData.type <= UserModule.USER_TYPE_BLOCK) {
						res.status(403).send('Access Denied')
						res.end()
						return
					}

					// processing the length of ssh key
					for (var i in req.session.userData.sshKeyList) {
						if (req.session.userData.sshKeyList[i].key.length > 64) {
							req.session.userData.sshKeyList[i].key = req.session.userData.sshKeyList[i].key.substring(0,64)
						}
					}
					
					next()
				}, function(err) {
					req.log.info({
						catalog: 'User',
						action: 'isLogin',
						req: token,
						result: UserModule.USER_NOT_FOUND
					})
					res.status(403).send(UserModule.USER_NOT_FOUND.result)
					res.end()
					return
				})
			}
		})
	} else {
		req.log.info({
			catalog: 'User',
			action: 'isLogin',
			req: token,
			result: 'No user token.'
		})
		res.status(403).send('Access Denied')
		res.end()
		return
	}
}

var signup = function(req, res, next) {
	var username = req.body.username
	var password = req.body.password

	// Check value of input
	var err = ''
	if (!username || !password) {
		err = 'The input data is empty.'
	}

	// Check length
	var minNumOfChars = 6
	if (err.length == 0 && username.length < minNumOfChars) {
		err = 'The username must be at least 6 characters.'
	}
	if (err.length == 0 && password.length < minNumOfChars) {
		err = 'The password must be at least 6 characters.'
	}

	// Check special characters
	var regularExpression = /^[a-zA-Z0-9!@#$%^&*]{6,16}$/
	if(err.length == 0 && !regularExpression.test(password)) {
		err = 'The password should not contain some special character.'
	}

	// Check error
	if (err.length > 0) {
		req.log.error({
			catalog: 'User',
			action: 'Signup',
			req: {
				username: username,
				password: password
			},
			error: err
		})
		res.status(400).send(err)
		res.end()
		return
	}

	var userData = {
		username: username,
		password: bcrypt.hashSync(password),
		sshKeyList: [],
		repositoryList: [],
		collaborateRepositoryList: [],
		type: UserModule.USER_TYPE_NORMAL
	}
	var User = UserModule.init(req.db, req.app.settings.config.database.type, req.app.settings.user)
	User.signup(userData).then(function(result) {
		delete userData.password

		// Create user token
		var token = jwt.sign(userData, req.app.get('superSecret'), {
			expiresIn: TOKEN_EXPRIED
		})
		req.session.token = token

		req.log.info({
			catalog: 'User',
			action: 'Signup',
			req: userData,
			result: result
		})
		result['data'] = userData
		res.json(result)
		res.end()
		return
	}, function(err) {
		req.log.error({
			catalog: 'User',
			action: 'Signup',
			req: userData,
			error: err
		})
		res.status(500).send('Server Error: ' + err)
		res.end()
		return
	})
}

var signin = function(req, res, next) {
	var username = req.body.username
	var password = req.body.password

	// Check value of input
	var err = ''
	if (!username || !password) {
		err = 'The input data is empty.'
	}

	// Check special characters
	var regularExpression = /^[a-zA-Z0-9!@#$%^&*]/
	if(err.length == 0 && !regularExpression.test(password)) {
		err = 'The password should not contain some special character.'
	}

	// Check error
	if (err.length > 0) {
		req.log.error({
			catalog: 'User',
			action: 'Signin',
			req: {
				username: username,
				password: password
			},
			error: err
		})
		res.status(400).send(err)
		res.end()
		return
	}

	var userData = {
		username: username,
		password: password
	}
	var User = UserModule.init(req.db, req.app.settings.config.database.type, req.app.settings.user)
	User.signin(userData).then(function(result) {
		if (result.code == UserModule.USER_OK.code) {
			userData = result.data
			delete userData.password

			// Create user token
			var token = jwt.sign(userData, req.app.get('superSecret'), {
				expiresIn: TOKEN_EXPRIED
			})
			req.session.token = token

			req.log.info({
				catalog: 'User',
				action: 'Signin',
				req: userData,
				result: result
			})
		} else {
			req.session.token = null

			req.log.info({
				catalog: 'User',
				action: 'Signin',
				req: userData,
				result: result
			})
		}
		res.json(result)
		res.end()
		return
	}, function(err) {
		req.log.error({
			catalog: 'User',
			action: 'Signin',
			req: userData,
			error: err
		})
		res.status(500).send('Server Error: ' + err)
		res.end()
		return
	})
}

var changePassword = function(req, res, next) {
	var userData = req.session.userData
	var password = req.body.password
	var newPassword = req.body.newPassword

	// Check value of input
	var err = ''
	if (!password || !newPassword) {
		err = 'The input data is empty.'
	}

	// Check length
	var minNumOfChars = 6
	if (err.length == 0 && newPassword.length < minNumOfChars) {
		err = 'The password must be at least 6 characters.'
	}

	// Check special characters
	var regularExpression = /^[a-zA-Z0-9!@#$%^&*]{6,16}$/
	if(err.length == 0 && !regularExpression.test(password)) {
		err = 'The password should not contain some special character.'
	}
	if(err.length == 0 && !regularExpression.test(newPassword)) {
		err = 'The password should not contain some special character.'
	}

	// Check error
	if (err.length > 0) {
		req.log.error({
			catalog: 'User',
			action: 'Change Password',
			req: {
				userData: userData,
				password: password,
				newPassword: newPassword
			},
			error: err
		})
		res.status(400).send(err)
		res.end()
		return
	}

	// Check Password
	var User = UserModule.init(req.db, req.app.settings.config.database.type, req.app.settings.user)
	User.checkPassword(userData.username, password).then(function(result) {
		if (result.code == UserModule.USER_OK.code) {
			return User.changePassword(userData.username, bcrypt.hashSync(newPassword))
		} else {
			req.log.info({
				catalog: 'User',
				action: 'Change Password',
				req: {
					userData: userData,
					password: bcrypt.hashSync(password),
					newPassword: bcrypt.hashSync(newPassword)
				},
				result: result
			})
			res.json(result)
			res.end()
			return
		}
	}, function(err) {
		req.log.error({
			catalog: 'User',
			action: 'Change Password',
			req: {
				userData: userData,
				password: bcrypt.hashSync(password),
				newPassword: bcrypt.hashSync(newPassword)
			},
			error: err
		})
		res.status(500).send('Server Error: ' + err)
		res.end()
		return
	})

	// The result of change password
	.then(function(result) {
		req.log.info({
			catalog: 'User',
			action: 'Change Password',
			req: {
				userData: userData,
				password: bcrypt.hashSync(password),
				newPassword: bcrypt.hashSync(newPassword)
			},
			result: result
		})
		res.json(result)
		res.end()
		return
	}, function(err) {
		req.log.error({
			catalog: 'User',
			action: 'Change Password',
			req: {
				userData: userData,
				password: bcrypt.hashSync(password),
				newPassword: bcrypt.hashSync(newPassword)
			},
			error: err
		})
		res.status(500).send('Server Error: ' + err)
		res.end()
		return
	})
}

var logout = function(req, res, next) {
	var userData = req.session.userData
	var token = req.session.token
	if (token) {
		// verifies secret and checks exp
		jwt.verify(token, req.app.get('superSecret'), function(err, userData) {
			if (err) {
				req.log.info({
					catalog: 'User',
					action: 'Logout',
					req: token,
					result: err
				})
			} else {
				req.log.info({
					catalog: 'User',
					action: 'Logout',
					req: token,
					result: {
						username: userData.username
					}
				})
			}
			req.session.token = null
			res.json(UserModule.USER_OK)
			res.end()
			return
		})
	} else {
		req.log.info({
			catalog: 'User',
			action: 'Logout',
			req: token,
			result: 'No user token.'
		})
		res.json(UserModule.USER_OK)
		res.end()
		return
	}
}

var addSshKey = function(req, res, next) {
	var userData = req.session.userData
	var sshKey = req.body.sshKey
	var keyName = req.body.keyName

	// Check value of input
	var err = ''
	if (!sshKey || !keyName) {
		err = 'The input data is empty.'
	}

	// Check special characters
	var regularExpression = /^[a-zA-Z0-9_-]{1,16}$/
	var sshRegularExpression = /ssh-rsa AAAA[0-9A-Za-z+/]+[=]{0,3} ([^@]+@[^@]+)/
	if(err.length == 0 && !regularExpression.test(keyName)) {
		err = 'Key name can not contain special character.'
	}
	if(err.length == 0 && !sshRegularExpression.test(sshKey)) {
		err = 'SSH key format error.'
	}

	// Check error
	if (err.length > 0) {
		req.log.error({
			catalog: 'User',
			action: 'Add SSH Key',
			req: {
				sshKey: sshKey,
				keyName: keyName
			},
			error: err
		})
		res.status(400).send(err)
		res.end()
		return
	}

	var User = UserModule.init(req.db, req.app.settings.config.database.type, req.app.settings.user)
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
		})
		res.json(result)
		res.end()
		return
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
		})
		res.status(500).send('Server Error: ' + err)
		res.end()
		return
	})
}

var deleteSshKey = function(req, res, next) {
	var userData = req.session.userData
	var keyName = req.params.name

	// Check value of input
	var err = ''
	if (!keyName) {
		err = 'The input data is empty.'
	}

	// Check special characters
	var regularExpression = /^[a-zA-Z0-9_-]{1,16}$/
	if(err.length == 0 && !regularExpression.test(keyName)) {
		err = 'Key name can not contain special character.'
	}

	// Check error
	if (err.length > 0) {
		req.log.error({
			catalog: 'User',
			action: 'Delete SSH Key',
			req: {
				keyName: keyName
			},
			error: err
		})
		res.status(400).send(err)
		res.end()
		return
	}

	var User = UserModule.init(req.db, req.app.settings.config.database.type, req.app.settings.user)
	User.deleteSshKey(userData.username, keyName).then(function(result) {
		req.log.info({
			catalog: 'User',
			action: 'Delete SSH Key',
			req: {
				userData: userData,
				keyName: keyName
			},
			result: result
		})
		res.json(result)
		res.end()
		return
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
		})
		res.status(500).send('Server Error: ' + err)
		res.end()
		return
	})
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