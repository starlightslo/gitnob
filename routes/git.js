var path = require('path');
var git = require('../modules/git');

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
		// Get branch
		git.listBranch(repository).then(function(branchArray) {
			branchList = branchArray;
			console.log(branchList);
			return git.listTag(repository);
		})
		// Get Tag
		.then(function(tagArray) {
			tagList = tagArray;
			console.log(tagList);
		})
		.done(function() {
			var resp = {
				code: 200,
				result: 'OK',
				data: {
					branchList: branchList,
					tagList: tagList
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
			next();
		});
	}, function(err) {
		req.log.error('Error: ' + err);
		res.status(500).send('Server Error: ' + err);
		next();
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
		next();
	}, function(err) {
		req.log.error('Error: ' + err);
		res.status(500).send('Server Error: ' + err);
		next();
	});
}

module.exports = {
	list: list,
	get: get
}