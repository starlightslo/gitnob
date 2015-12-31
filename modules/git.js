var Promise = require('bluebird');
var fs = require('fs');
var path = require('path');
var Git = require('nodegit');

var open = function(repositoryPath) {
	return Git.Repository.open(repositoryPath);
}

var listBranch = function(repo) {
	return repo.getReferenceNames(Git.Reference.TYPE.LISTALL);
}

var listTag = function(repo) {
	return Git.Tag.list(repo);
}

var listRepo = function(rootPath) {
	var deferred = Promise.defer();
	var repositoryList = [];
	var repositories = fs.readdirSync(rootPath);
	var numOfRepositories = repositories.length;
	for (var i in repositories) {
		var repository = repositories[i];
		var repositoryPath = path.join(rootPath, repository);
		open(repositoryPath).then(function(repo) {
			var name = repo.path().split("/");
			name = name[name.length-2];
			repositoryList.push(name);
		}, function(err) {
			// Ignore
		}).done(function() {
			numOfRepositories--;
			if (numOfRepositories == 0) {
				deferred.resolve(repositoryList);
			}
		});
	}
	return deferred.promise;
}

module.exports = {
	listRepo: listRepo,
	listBranch: listBranch,
	listTag: listTag,
	open: open
}