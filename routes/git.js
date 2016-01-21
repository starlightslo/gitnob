'use strict'

var fs = require('fs')
var path = require('path')
var GitModule = require('../modules/git')
var UserModule = require('../modules/user')

var create = function(req, res, next) {
	var userData = req.session.userData
	var repositoryName = req.body.name

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
			catalog: 'Git',
			action: 'Create',
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
	if (fs.existsSync(repositoryPath)){
		req.log.error({
			catalog: 'Git',
			action: 'Create',
			req: {
				userData: userData,
				repositoryName: repositoryName
			},
			error: GitModule.GIT_INIT_WITH_SAME_NAME.result
		})
		res.json(GitModule.GIT_INIT_WITH_SAME_NAME)
		res.end()
		return
	}

	// Creates an empty Git repository
	var Git = GitModule.init(req.db, req.app.settings.config.database.type, req.app.settings.user)
	Git.init(userData.username, repositoryPath, repositoryName).then(function(result) {
		req.log.info({
			catalog: 'Git',
			action: 'Create',
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
			catalog: 'Git',
			action: 'Create',
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

var destroy = function(req, res, next) {
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
			catalog: 'Git',
			action: 'Destory',
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
			catalog: 'Git',
			action: 'Destory',
			req: {
				userData: userData,
				repositoryName: repositoryName
			},
			error: 'No repository.'
		})
		res.status(500).send('No repository.')
		return
	}

	// Check permission
	if (userData.repositoryList.indexOf(repositoryName) < 0) {
		req.log.info({
			catalog: 'Git',
			action: 'Destory',
			req: {
				userData: userData,
				repositoryName: repositoryName
			},
			result: 'No Permission.'
		})
		res.status(403).send('No Permission')
		return
	}

	// Destory the repository
	var Git = GitModule.init(req.db, req.app.settings.config.database.type, req.app.settings.user)
	Git.destroy(repositoryPath, repositoryName).then(function(result) {
		req.log.info({
			catalog: 'Git',
			action: 'Destory',
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
			catalog: 'Git',
			action: 'Destory',
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

var get = function(req, res, next) {
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
			catalog: 'Git',
			action: 'Get',
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
	var gitPath = req.app.settings.config.gitPath
	var repositoryPath = path.join(gitPath, repository)

	// Check permission
	if (userData.repositoryList.indexOf(repository) < 0) {
		req.log.info({
			catalog: 'Git',
			action: 'Get',
			req: {
				userData: userData,
				repository: repository,
				branch: branch,
				repositoryPath: repositoryPath
			},
			result: 'No Permission.'
		})
		res.status(403).send('No Permission')
		return
	}

	var repo = null
	var branchList = []
	var tagList = []
	var defaultBranch = ''

	// List all repositores
	var Git = GitModule.init(req.db, req.app.settings.config.database.type, req.app.settings.user)
	Git.open(repositoryPath).then(function(repository) {
		repo = repository
		// Get all branch
		return Git.listBranch(repository)
	}, function(err) {
		req.log.error({
			catalog: 'Git',
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
		return Git.listTag(repo)
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
			return Git.listCommit(repo, branch)
		} else {
			// Use default branch
			return Git.listCommit(repo, defaultBranch)
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
				gitPath: gitPath,
				defaultBranch: defaultBranch,
				branchList: branchList,
				tagList: tagList,
				commitList: commitList
			}
		}
		req.log.info({
			catalog: 'Git',
			action: 'Get',
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

var list = function(req, res, next) {
	var userData = req.session.userData
	var resp = {
		code: 200,
		result: 'OK',
		data: userData.repositoryList
	}
	req.log.info({
		catalog: 'Git',
		action: 'List',
		req: userData,
		result: resp
	})
	res.json(resp)
	res.end()
	return
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
			catalog: 'Git',
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

	// Check is self
	if (userData.username === collaboratorName) {
		let result = GitModule.GIT_ADD_SELF
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
	}

	// Check permission
	if (userData.repositoryList.indexOf(repository) < 0) {
		req.log.info({
			catalog: 'Git',
			action: 'Add Collaborator',
			req: {
				userData: userData,
				collaboratorName: collaboratorName,
				repository: repository,
				repositoryPath: repositoryPath
			},
			result: 'No Permission.'
		})
		res.status(403).send('No Permission')
		return
	}

	// Add collaborator
	var Git = GitModule.init(req.db, req.app.settings.config.database.type, req.app.settings.user)
	Git.addCollaborator(repository, collaboratorName).then(function(result) {
		req.log.info({
			catalog: 'Git',
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
			catalog: 'Git',
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

	// Check permission
	if (userData.repositoryList.indexOf(repository) < 0) {
		req.log.info({
			catalog: 'Git',
			action: 'Delete Collaborator',
			req: {
				userData: userData,
				collaboratorName: collaboratorName,
				repository: repository,
				repositoryPath: repositoryPath
			},
			result: 'No Permission.'
		})
		res.status(403).send('No Permission')
		return
	}

	// Delete collaborator
	var Git = GitModule.init(req.db, req.app.settings.config.database.type, req.app.settings.user)
	Git.deleteCollaborator(repository, collaboratorName).then(function(result) {
		req.log.info({
			catalog: 'Git',
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
			catalog: 'Git',
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

var listCollaborator = function(req, res, next) {
	var userData = req.session.userData
	var repository = req.params.repository
	var repositoryPath = path.join(req.app.settings.config.gitPath, repository)

	// Check permission
	if (userData.repositoryList.indexOf(repository) < 0) {
		req.log.info({
			catalog: 'Git',
			action: 'List Collaborator',
			req: {
				userData: userData,
				repository: repository,
				repositoryPath: repositoryPath
			},
			result: 'No Permission.'
		})
		res.status(403).send('No Permission')
		return
	}

	// Check collaborator name
	var Git = GitModule.init(req.db, req.app.settings.config.database.type, req.app.settings.user)
	Git.listCollaborator(repository).then(function(result) {
		req.log.info({
			catalog: 'Git',
			action: 'List Collaborator',
			req: {
				userData: userData,
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
			catalog: 'Git',
			action: 'List Collaborator',
			req: {
				userData: userData,
				repository: repository,
				repositoryPath: repositoryPath
			},
			error: err
		})
		res.status(500).send('Server Error: ' + err)
		return
	})
}

module.exports = {
	create: create,
	destroy: destroy,
	list: list,
	get: get,
	addCollaborator: addCollaborator,
	deleteCollaborator: deleteCollaborator,
	listCollaborator: listCollaborator
}