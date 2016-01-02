var fs = require('fs');
var path = require('path');
var GitModule = require('../modules/git');
var UserModule = require('../modules/user');

var create = function(req, res, next) {
	var repositoryName = req.body.name;
	if (!repositoryName) {
		req.log.info({
			catalog: 'Git',
			action: 'Create',
			req: {
				userData: userData,
				repositoryName: repositoryName
			},
			result: 'Missing repositoryName'
		});
		res.status(400).send('Bad Request');
		return;
	}

	// Generating the repository path and check is the repository existing or not
	var repositoryPath = path.join(app.settings.config.gitPath, repositoryName);
	if (fs.existsSync(repositoryPath)){
		req.log.error({
			catalog: 'Git',
			action: 'Create',
			req: {
				userData: userData,
				repositoryName: repositoryName
			},
			error: 'There have a repository with same name.'
		});
		res.status(500).send('There have a repository with same name.');
		return;
	}

	// Creates an empty Git repository
	GitModule.init(userData.username, repositoryPath, repositoryName, db, app.settings.config.database.type).then(function(result) {
		req.log.info({
			catalog: 'Git',
			action: 'Create',
			req: {
				userData: userData,
				repositoryName: repositoryName
			},
			result: result
		});
		res.json(result);
		res.end();
		return;
	}, function(err) {
		req.log.error({
			catalog: 'Git',
			action: 'Create',
			req: {
				userData: userData,
				repositoryName: repositoryName
			},
			error: err
		});
		res.status(500).send('Server Error: ' + err);
		return;
	});
};

var destroy = function(req, res, next) {
	var repositoryName = req.body.name;
	if (!repositoryName) {
		req.log.info({
			catalog: 'Git',
			action: 'Destory',
			req: {
				userData: userData,
				repositoryName: repositoryName
			},
			result: 'Missing repositoryName'
		});
		res.status(400).send('Bad Request');
		return;
	}

	// Generating the repository path and check is the repository existing or not
	var repositoryPath = path.join(app.settings.config.gitPath, repositoryName);
	if (!fs.existsSync(repositoryPath)){
		req.log.error({
			catalog: 'Git',
			action: 'Destory',
			req: {
				userData: userData,
				repositoryName: repositoryName
			},
			error: 'No repository.'
		});
		res.status(500).send('No repository.');
		return;
	}

	// Check permission
	if (userData.repositoryList.indexOf(repository) < 0) {
		req.log.info({
			catalog: 'Git',
			action: 'Destory',
			req: {
				userData: userData,
				repositoryName: repositoryName
			},
			result: 'No Permission.'
		});
		res.status(403).send('No Permission');
		return;
	}

	// Creates an empty Git repository
	GitModule.destroy(userData.username, repositoryPath, repositoryName, db, app.settings.config.database.type).then(function(result) {
		req.log.info({
			catalog: 'Git',
			action: 'Destory',
			req: {
				userData: userData,
				repositoryName: repositoryName
			},
			result: result
		});
		res.json(result);
		res.end();
		return;
	}, function(err) {
		req.log.error({
			catalog: 'Git',
			action: 'Destory',
			req: {
				userData: userData,
				repositoryName: repositoryName
			},
			error: err
		});
		res.status(500).send('Server Error: ' + err);
		return;
	});
};

var get = function(req, res, next) {
	var repository = req.params.repository;
	var ref = req.params.ref;
	var head = req.params.head;
	var branch = req.params.branch;
	if (ref && head && branch) {
		branch = ref + '/' + head + '/' + branch;
	}
	var repositoryPath = path.join(app.settings.config.gitPath, repository);

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
		});
		res.status(403).send('No Permission');
		return;
	}

	var repo = null;
	var branchList = [];
	var tagList = [];
	var defaultBranch = '';

	// List all repositores
	GitModule.open(repositoryPath).then(function(repository) {
		this.repo = repository;
		// Get all branch
		return GitModule.listBranch(repository);
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
		});
		res.status(500).send('Server Error: ' + err);
		return;
	})

	// Result of branch
	.then(function(branchArray) {
		if (!branchArray) return;
		branchList = branchArray;
		return GitModule.listTag(this.repo);
	})

	// Result of tag
	.then(function(tagArray) {
		if (!tagArray) return;
		tagList = tagArray;
		return this.repo.getCurrentBranch();
	})

	// Result of current branch
	.then(function(reference) {
		if (!reference) return;
		defaultBranch = reference.name();
		if (branch) {
			// Use branch of user's selected
			return GitModule.listCommit(this.repo, branch);
		} else {
			// Use default branch
			return GitModule.listCommit(this.repo, defaultBranch);
		}
	})

	// Result of commits
	.then(function(commits) {
		if (!commits) return;
		var commitList = [];
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
			});
		}
		return commitList;
	}, function(err) {
		return [];
	})

	// End of process
	.then(function(commitList) {
		if (!commitList) return;
		// Set response data to client
		var resp = {
			code: 200,
			result: 'OK',
			data: {
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
		});
		res.json(resp);
		res.end();
		return;
	});
};

var list = function(req, res, next) {
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
	});
	res.json(resp);
	res.end();
	return;
}

var addCollaborator = function(req, res, next) {
	var collaboratorName = req.body.username;
	var repository = req.params.repository;
	var repositoryPath = path.join(app.settings.config.gitPath, repository);

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
		});
		res.status(403).send('No Permission');
		return;
	}

	// Check collaborator name
	GitModule.addCollaborator(repository, collaboratorName).then(function(result) {
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
		});
		res.json(result);
		res.end();
		return;
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
		});
		res.status(500).send('Server Error: ' + err);
		return;
	});
};

var deleteCollaborator = function(req, res, next) {
	var collaboratorName = req.body.username;
	var repository = req.params.repository;
	var repositoryPath = path.join(app.settings.config.gitPath, repository);

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
		});
		res.status(403).send('No Permission');
		return;
	}

	// Check collaborator name
	GitModule.deleteCollaborator(repository, collaboratorName).then(function(result) {
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
		});
		res.json(result);
		res.end();
		return;
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
		});
		res.status(500).send('Server Error: ' + err);
		return;
	});
};

module.exports = {
	create: create,
	destroy: destroy,
	list: list,
	get: get,
	addCollaborator: addCollaborator,
	deleteCollaborator: deleteCollaborator
}