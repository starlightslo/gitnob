'use strict'

var bcrypt = require('bcryptjs')
var fs = require('fs')
var path = require('path')
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

var getUser = function(req, res, next) {
	var userData = req.session.userData
	var username = req.params.username

	var User = UserModule.init(req.db, req.app.settings.config.database.type)
	User.isUserExisting(username).then(function(result) {
		var resp = {
			code: UserModule.USER_OK.code,
			result: UserModule.USER_OK.result,
			data: result.data
		}

		// Delete password
		delete resp.data.password

		req.log.info({
			catalog: 'Admin',
			action: 'Get User',
			req: {
				userData: userData,
				username: username
			},
			result: resp
		})

		res.json(result)
		res.end()
		return
	}, function(err) {
		req.log.info({
			catalog: 'Admin',
			action: 'Get User',
			req: {
				userData: userData,
				username: username
			},
			result: UserModule.USER_NOT_FOUND
		})
		res.status(400).send(UserModule.USER_NOT_FOUND.result)
		res.end()
		return
	})
}

var deleteUser = function(req, res, next) {
	var userData = req.session.userData
	var username = req.params.username

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
				deleteUsername: username
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

var changePassword = function(req, res, next) {
	var userData = req.session.userData
	var username = req.params.username
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
			action: 'Change Password',
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

	var User = UserModule.init(req.db, req.app.settings.config.database.type)
	User.changePassword(username, bcrypt.hashSync(password)).then(function(result) {
		req.log.info({
			catalog: 'Admin',
			action: 'Change Password',
			req: {
				userData: userData,
				username: username,
				password: bcrypt.hashSync(password)
			},
			result: result
		})
		res.json(result)
		res.end()
		return
	}, function(err) {
		req.log.error({
			catalog: 'Admin',
			action: 'Change Password',
			req: {
				userData: userData,
				username: username,
				password: bcrypt.hashSync(password)
			},
			error: err
		})
		res.status(500).send('Server Error: ' + err)
		res.end()
		return
	})
}

var getRepository = function(req, res, next) {
	var userData = req.session.userData
	var repository = req.params.repository

	// Check value of input
	var err = ''
	if (!repository) {
		err = 'The input data is empty.'
	}

	// Check special characters
	var regularExpression = /^[a-zA-Z0-9_-]{1,}$/
	if(err.length == 0 && !regularExpression.test(repository)) {
		err = 'Should not contain special character.'
	}

	// Check error
	if (err.length > 0) {
		req.log.error({
			catalog: 'Admin',
			action: 'Get - Repository',
			req: {
				userData: userData,
				repository: repository
			},
			error: err
		})
		res.status(400).send(err)
		res.end()
		return
	}

	var ref = req.params.ref
	var head = req.params.head
	var branch = req.params.branch
	if (ref && head && branch) {
		branch = ref + '/' + head + '/' + branch
	}
	var repositoryPath = path.join(req.app.settings.config.gitPath, repository)
	var owner = ''
	var repo = null
	var branchList = []
	var tagList = []
	var defaultBranch = ''
	var collaboratorList = []

	// Get the owner of repository
	GitModule.getOwner(req.db, req.app.settings.config.database.type, repository).then(function(result) {
		owner = result.data
		return GitModule.listCollaborator(req.db, req.app.settings.config.database.type, repository)
	}, function(err) {
		req.log.error({
			catalog: 'Admin',
			action: 'Get - Repository',
			req: {
				userData: userData,
				repository: repository,
				branch: branch,
				repositoryPath: repositoryPath
			},
			error: err
		})
		res.status(500).send('Server Error: ' + err)
		return
	})

	// Get collaborator list
	.then(function(result) {
		collaboratorList = result.data
		return GitModule.open(repositoryPath)
	}, function(err) {
		req.log.error({
			catalog: 'Admin',
			action: 'Get - Repository',
			req: {
				userData: userData,
				repository: repository,
				branch: branch,
				repositoryPath: repositoryPath
			},
			error: err
		})
		res.status(500).send('Server Error: ' + err)
		return
	})

	// List all repositores
	.then(function(repository) {
		repo = repository
		// Get all branch
		return GitModule.listBranch(repository)
	}, function(err) {
		req.log.error({
			catalog: 'Admin',
			action: 'Get - Repository',
			req: {
				userData: userData,
				repository: repository,
				branch: branch,
				repositoryPath: repositoryPath
			},
			error: err
		})
		res.status(500).send('Server Error: ' + err)
		return
	})

	// Result of branch
	.then(function(branchArray) {
		if (!branchArray) return
		branchList = branchArray
		return GitModule.listTag(repo)
	})

	// Result of tag
	.then(function(tagArray) {
		if (!tagArray) return
		tagList = tagArray
		return repo.getCurrentBranch()
	})

	// Result of current branch
	.then(function(reference) {
		if (!reference) return
		defaultBranch = reference.name()
		if (branch) {
			// Use branch of user's selected
			return GitModule.listCommit(repo, branch)
		} else {
			// Use default branch
			return GitModule.listCommit(repo, defaultBranch)
		}
	})

	// Result of commits
	.then(function(commits) {
		if (!commits) return
		var commitList = []
		for (var i in commits) {
			commitList.push({
				id: commits[i].id().tostrS(),
				author: commits[i].author().toString(),
				committer: commits[i].committer().toString(),
				date: commits[i].date(),
				message: commits[i].message(),
				messageRaw: commits[i].messageRaw(),
				messageEncoding: commits[i].messageEncoding(),
				summary: commits[i].summary()
			})
		}
		return commitList
	}, function(err) {
		return []
	})

	// End of process
	.then(function(commitList) {
		if (!commitList) return
		// Set response data to client
		var resp = {
			code: 200,
			result: 'OK',
			data: {
				owner: owner,
				defaultBranch: defaultBranch,
				branchList: branchList,
				tagList: tagList,
				commitList: commitList,
				collaboratorList: collaboratorList
			}
		}
		req.log.info({
			catalog: 'Admin',
			action: 'Get - Repository',
			req: {
				userData: userData,
				repository: repository,
				branch: branch,
				repositoryPath: repositoryPath
			},
			result: resp
		})
		res.json(resp)
		res.end()
		return
	})
}

var addRepositoryOwner = function(req, res, next) {
	var userData = req.session.userData
	var repositoryName = req.params.repository
	var username = req.body.username

	// Check value of input
	var err = ''
	if (!username || !repositoryName) {
		err = 'The input data is empty.'
	}

	// Check special characters
	var regularExpression = /^[a-zA-Z0-9_-]{1,}$/
	if(err.length == 0 && !regularExpression.test(repositoryName)) {
		err = 'Should not contain special character.'
	}

	// Check error
	if (err.length > 0) {
		req.log.error({
			catalog: 'Admin',
			action: 'Add Repository Owner',
			req: {
				userData: userData,
				username: username,
				repositoryName: repositoryName
			},
			error: err
		})
		res.status(400).send(err)
		res.end()
		return
	}

	// Generating the repository path and check is the repository existing or not
	var repositoryPath = path.join(req.app.settings.config.gitPath, repositoryName)
	if (!fs.existsSync(repositoryPath)){
		req.log.error({
			catalog: 'Admin',
			action: 'Add Repository Owner',
			req: {
				userData: userData,
				username: username,
				repositoryName: repositoryName
			},
			error: 'No repository.'
		})
		res.status(500).send('No repository.')
		return
	}

	// Add repository owner
	GitModule.addOwner(req.db, req.app.settings.config.database.type, repositoryName, username).then(function(result) {
		req.log.info({
			catalog: 'Admin',
			action: 'Add Repository Owner',
			req: {
				userData: userData,
				username: username,
				repositoryName: repositoryName
			},
			result: result
		})
		res.json(result)
		res.end()
		return
	}, function(err) {
		req.log.error({
			catalog: 'Admin',
			action: 'Add Repository Owner',
			req: {
				userData: userData,
				username: username,
				repositoryName: repositoryName
			},
			error: err
		})
		res.status(500).send('Server Error: ' + err)
		return
	})
}

var destroyRepository = function(req, res, next) {
	var userData = req.session.userData
	var repositoryName = req.params.repository

	// Check value of input
	var err = ''
	if (!repositoryName) {
		err = 'The input data is empty.'
	}

	// Check special characters
	var regularExpression = /^[a-zA-Z0-9_-]{1,}$/
	if(err.length == 0 && !regularExpression.test(repositoryName)) {
		err = 'Should not contain special character.'
	}

	// Check error
	if (err.length > 0) {
		req.log.error({
			catalog: 'Admin',
			action: 'Destory Repository',
			req: {
				userData: userData,
				repositoryName: repositoryName
			},
			error: err
		})
		res.status(400).send(err)
		res.end()
		return
	}

	// Generating the repository path and check is the repository existing or not
	var repositoryPath = path.join(req.app.settings.config.gitPath, repositoryName)
	if (!fs.existsSync(repositoryPath)){
		req.log.error({
			catalog: 'Admin',
			action: 'Destory Repository',
			req: {
				userData: userData,
				repositoryName: repositoryName
			},
			error: 'No repository.'
		})
		res.status(500).send('No repository.')
		return
	}

	// Destory the repository
	GitModule.destroy(repositoryPath, repositoryName, req.db, req.app.settings.config.database.type).then(function(result) {
		req.log.info({
			catalog: 'Admin',
			action: 'Destory Repository',
			req: {
				userData: userData,
				repositoryName: repositoryName
			},
			result: result
		})
		res.json(result)
		res.end()
		return
	}, function(err) {
		req.log.error({
			catalog: 'Admin',
			action: 'Destory Repository',
			req: {
				userData: userData,
				repositoryName: repositoryName
			},
			error: err
		})
		res.status(500).send('Server Error: ' + err)
		return
	})
}

var addCollaborator = function(req, res, next) {
	var userData = req.session.userData
	var collaboratorName = req.body.username
	var repository = req.params.repository

	// Check value of input
	var err = ''
	if (!repository || !collaboratorName) {
		err = 'The input data is empty.'
	}

	// Check special characters
	var regularExpression = /^[a-zA-Z0-9_-]{1,}$/
	if(err.length == 0 && !regularExpression.test(repository)) {
		err = 'Should not contain special character.'
	}

	// Check error
	if (err.length > 0) {
		req.log.error({
			catalog: 'Admin',
			action: 'Add Collaborator',
			req: {
				userData: userData,
				repository: repository
			},
			error: err
		})
		res.status(400).send(err)
		res.end()
		return
	}

	var repositoryPath = path.join(req.app.settings.config.gitPath, repository)

	// Add collaborator
	GitModule.addCollaborator(req.db, req.app.settings.config.database.type, repository, collaboratorName).then(function(result) {
		req.log.info({
			catalog: 'Admin',
			action: 'Add Collaborator',
			req: {
				userData: userData,
				collaboratorName: collaboratorName,
				repository: repository,
				repositoryPath: repositoryPath
			},
			result: result
		})
		res.json(result)
		res.end()
		return
	}, function(err) {
		req.log.error({
			catalog: 'Admin',
			action: 'Add Collaborator',
			req: {
				userData: userData,
				collaboratorName: collaboratorName,
				repository: repository,
				repositoryPath: repositoryPath
			},
			error: err
		})
		res.status(500).send('Server Error: ' + err)
		return
	})
}

var deleteCollaborator = function(req, res, next) {
	var userData = req.session.userData
	var repository = req.params.repository
	var collaboratorName = req.params.collaborator
	var repositoryPath = path.join(req.app.settings.config.gitPath, repository)

	// Delete collaborator
	GitModule.deleteCollaborator(req.db, req.app.settings.config.database.type, repository, collaboratorName).then(function(result) {
		req.log.info({
			catalog: 'Admin',
			action: 'Delete Collaborator',
			req: {
				userData: userData,
				collaboratorName: collaboratorName,
				repository: repository,
				repositoryPath: repositoryPath
			},
			result: result
		})
		res.json(result)
		res.end()
		return
	}, function(err) {
		req.log.error({
			catalog: 'Admin',
			action: 'Delete Collaborator',
			req: {
				userData: userData,
				collaboratorName: collaboratorName,
				repository: repository,
				repositoryPath: repositoryPath
			},
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
	getRepository: getRepository,
	addRepositoryOwner: addRepositoryOwner,
	destroyRepository: destroyRepository,
	addCollaborator: addCollaborator,
	deleteCollaborator: deleteCollaborator,
	listUser: listUser,
	getUser: getUser,
	addUser: addUser,
	deleteUser: deleteUser,
	changePassword: changePassword
}