var fs = require('fs');
var path = require('path');
var git = require('../modules/git');

var create = function(req, res, next) {
	var repositoryName = req.body.name;
	if (!repositoryName) {
		req.log.info({
			catalog: 'Git',
			action: 'Create',
			req: repositoryName,
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
			req: repositoryName,
			error: 'There have a repository with same name.'
		});
		res.status(500).send('There have a repository with same name.');
		return;
	}

	// Creates an empty Git repository
	git.init(userData.username, repositoryPath, repositoryName, db, app.settings.config.database.type).then(function(result) {
		req.log.info({
			catalog: 'Git',
			action: 'Create',
			req: repositoryName,
			result: result
		});
		res.json(result);
		res.end();
		return;
	}, function(err) {
		req.log.error({
			catalog: 'Git',
			action: 'Create',
			req: repositoryName,
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
			req: repositoryName,
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
			req: repositoryName,
			error: 'No repository.'
		});
		res.status(500).send('No repository.');
		return;
	}

	// Creates an empty Git repository
	git.destroy(userData.username, repositoryPath, repositoryName, db, app.settings.config.database.type).then(function(result) {
		req.log.info({
			catalog: 'Git',
			action: 'Destory',
			req: repositoryName,
			result: result
		});
		res.json(result);
		res.end();
		return;
	}, function(err) {
		req.log.error({
			catalog: 'Git',
			action: 'Destory',
			req: repositoryName,
			error: err
		});
		res.status(500).send('Server Error: ' + err);
		return;
	});
};

var get = function(req, res, next) {
	var repository = req.params.repository;
	var repositoryPath = path.join(app.settings.config.gitPath, repository);
	git.open(repositoryPath).then(function(repository) {
		var featureSwitch = {
			branch: false,
			tag: false
		}
		var branchList = [];
		var tagList = [];
		var defaultBranch = '';
		var commitList = [];
		// Get branch
		git.listBranch(repository).then(function(branchArray) {
			branchList = branchArray;
			return git.listTag(repository);
		})
		// Get Tag
		.then(function(tagArray) {
			tagList = tagArray;
			return repository.getCurrentBranch();
		})
		// Get Default branch
		.then(function(reference) {
			defaultBranch = reference.name();
			return git.listCommit(repository, defaultBranch);
		})
		// Get commit
		.then(function(commits) {
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
		}, function(err) {
			req.log.error({
				catalog: 'Git',
				action: 'Get',
				req: {
					repository: repository,
					repositoryPath: repositoryPath
				},
				error: err
			});
			res.status(500).send('Server Error: ' + err);
			return;
		})
		.done(function() {
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
					repository: repository,
					repositoryPath: repositoryPath
				},
				result: resp
			});
			res.json(resp);
			res.end();
			return;
		});
	}, function(err) {
		req.log.error({
			catalog: 'Git',
			action: 'Get',
			req: {
				repository: repository,
				repositoryPath: repositoryPath
			},
			error: err
		});
		res.status(500).send('Server Error: ' + err);
		return;
	});
};

var list = function(req, res, next) {
	git.listRepo(app.settings.config.gitPath).then(function(result) {
		var resp = {
			code: 200,
			result: 'OK',
			data: result
		}
		req.log.info({
			catalog: 'Git',
			action: 'List',
			req: null,
			result: resp
		});
		res.json(resp);
		res.end();
		return;
	}, function(err) {
		req.log.error({
			catalog: 'Git',
			action: 'List',
			req: null,
			error: err
		});
		res.status(500).send('Server Error: ' + err);
		return;
	});
}

module.exports = {
	create: create,
	destroy: destroy,
	list: list,
	get: get
}