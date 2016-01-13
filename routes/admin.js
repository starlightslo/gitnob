'use strict'

var bcrypt = require('bcryptjs')
var GitModule = require('../modules/git')
var UserModule = require('../modules/user')

var listRepository = function(req, res, next) {
	var userData = req.session.userData

	// List all repositories
	GitModule.listRepo(req.app.settings.config.gitPath).then(function(result) {
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
		})
		res.json(resp)
		res.end()
		return
	}, function(err) {
		req.log.error({
			catalog: 'Admin',
			action: 'List Repository',
			req: userData,
			error: err
		})
		res.status(500).send('Server Error: ' + err)
		return
	})
}

var listUser = function(req, res, next) {
	var userData = req.session.userData

	// List all repositories
	var User = UserModule.init(req.db, req.app.settings.config.database.type)
	User.list().then(function(result) {
		req.log.info({
			catalog: 'Admin',
			action: 'List User',
			req: userData,
			result: result
		})
		res.json(result)
		res.end()
		return
	}, function(err) {
		req.log.error({
			catalog: 'Admin',
			action: 'List User',
			req: userData,
			error: err
		})
		res.status(500).send('Server Error: ' + err)
		return
	})
}

var addUser = function(req, res, next) {
	var userData = req.session.userData
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
			catalog: 'Admin',
			action: 'Add User',
			req: {
				userData: userData,
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
	var User = UserModule.init(req.db, req.app.settings.config.database.type)
	User.signup(userData).then(function(result) {
		if (result.code == UserModule.USER_OK.code) {
			return User.list()
		} else {
			req.log.info({
				catalog: 'Admin',
				action: 'Add User',
				req: userData,
				result: result
			})
			res.json(result)
			res.end()
			return
		}
	}, function(err) {
		req.log.error({
			catalog: 'Admin',
			action: 'Add User',
			req: userData,
			error: err
		})
		res.status(500).send('Server Error: ' + err)
		return
	})

	// Result of list user
	.then(function(result) {
		req.log.info({
			catalog: 'Admin',
			action: 'Add User',
			req: userData,
			result: result
		})
		res.json(result)
		res.end()
		return
	}, function(err) {
		req.log.error({
			catalog: 'Admin',
			action: 'Add User',
			req: userData,
			error: err
		})
		res.status(500).send('Server Error: ' + err)
		return
	})
}

var deleteUser = function(req, res, next) {
	var userData = req.session.userData
	var username = req.body.username

	// Check value of input
	var err = ''
	if (!username) {
		err = 'The input data is empty.'
	}

	// Check error
	if (err.length > 0) {
		req.log.error({
			catalog: 'Admin',
			action: 'Delete User',
			req: {
				userData: userData,
				username: username,
				password: password
			},
			error: err
		})
		res.status(400).send(err)
		res.end()
		return
	}

	// List all repositories
	var User = UserModule.init(req.db, req.app.settings.config.database.type)
	User.deleteUser(username).then(function(result) {
		if (result.code == UserModule.USER_OK.code) {
			return User.list()
		} else {
			req.log.info({
				catalog: 'Admin',
				action: 'Delete User',
				req: {
					userData: userData,
					deleteUsername: username
				},
				result: result
			})
			res.json(result)
			res.end()
			return
		}
	}, function(err) {
		req.log.error({
			catalog: 'Admin',
			action: 'Delete User',
			req: {
				userData: userData,
				deleteUsername: username
			},
			error: err
		})
		res.status(500).send('Server Error: ' + err)
		return
	})

	// Result of list user
	.then(function(result) {
		req.log.info({
			catalog: 'Admin',
			action: 'Delete User',
			req: userData,
			result: result
		})
		res.json(result)
		res.end()
		return
	}, function(err) {
		req.log.error({
			catalog: 'Admin',
			action: 'Delete User',
			req: userData,
			error: err
		})
		res.status(500).send('Server Error: ' + err)
		return
	})
}

var checkAdminPermission = function(req, res, next) {
	var userData = req.session.userData

	// Check permission
	if (userData.type < UserModule.USER_TYPE_ADMIN) {
		req.log.info({
			catalog: 'Admin',
			action: 'Check Admin Permission',
			req: userData,
			result: 'No Permission.'
		})
		res.status(403).send('No Permission')
		return
	}
	next()
}


module.exports = {
	checkAdminPermission: checkAdminPermission,
	listRepository: listRepository,
	listUser: listUser,
	addUser: addUser,
	deleteUser: deleteUser
}