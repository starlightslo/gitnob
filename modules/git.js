var Promise = require('bluebird');
var fs = require('fs');
var rimraf = require('rimraf')
var path = require('path');
var Git = require('nodegit');
var UserModule = require('./user');

// Response status
var GIT_OK = {code: 200, result: 'OK'};
var GIT_NO_PERMISSION = {code: 2000, result: 'No permission.'};

var init = function(username, repositoryPath, repositoryName, db, dbType) {
	var deferred = Promise.defer();
	Git.Repository.init(repositoryPath, 1).then(function(repository) {
		// Record the repository to the database
		if (dbType == 'txt') {
			// Read user data
			return db.read();
		} else {
			return deferred.reject('Not supported db type.');
		}
	}, function(err) {
		return deferred.reject(err);
	})

	// Read the data from db
	.then(function(data) {
		var userList = data.userList;
		for (var i in userList) {
			if (userList[i].username == username) {
				userList[i].repositoryList.push(repositoryName);
				// Store into database
				return db.write(JSON.stringify(data));
			}
		}
		return deferred.resolve(UserModule.USER_NOT_FOUND);
	}, function(err) {
		return deferred.reject(err);
	})

	// The result of write
	.then(function(result) {
		return deferred.resolve(GIT_OK);
	}, function(err) {
		return deferred.reject(err);
	});
	return deferred.promise;
}

var destroy = function(username, repositoryPath, repositoryName, db, dbType) {
	var deferred = Promise.defer();
	// Read user data
	db.read().then(function(data) {
		var userList = data.userList;
		for (var i in userList) {
			if (userList[i].username == username) {
				var index = userList[i].repositoryList.indexOf(repositoryName)
				if (index > -1) {
					userList[i].repositoryList.splice(index, 1);

					// Write back to database
					return db.write(JSON.stringify(data));
				} else {
					
					return deferred.resolve(GIT_NO_PERMISSION);
				}
			}
		}
		return deferred.resolve(UserModule.USER_NOT_FOUND);
	}, function(err) {
		return deferred.reject(err);
	})

	// The result of write
	.then(function(result) {
		// Delete repository directory
		return delRepo(repositoryPath);
	}, function(err) {
		return deferred.reject(err);
	})

	// The result of delete repository directory
	.then(function(result) {
		return deferred.resolve(GIT_OK);
	}, function(err) {
		return deferred.reject(err);
	});
	return deferred.promise;
}

var open = function(repositoryPath) {
	return Git.Repository.open(repositoryPath);
}

var listBranch = function(repo) {
	return repo.getReferenceNames(Git.Reference.TYPE.LISTALL);
}

var listTag = function(repo) {
	return Git.Tag.list(repo);
}

var listCommit = function(repo, branch) {
	var deferred = Promise.defer();
	getCommit(repo, branch).then(function(commit) {
		var eventEmitter = commit.history();
		eventEmitter.on('end', function(commits) {
			return deferred.resolve(commits);
		});
		eventEmitter.on('error', function(error) {
			return deferred.reject(err);
		});
		eventEmitter.start();
	}, function(err) {
		return deferred.reject(err);
	});
	return deferred.promise;
}

var getCommit = function(repo, branch) {
	return repo.getBranchCommit(branch);
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
				return deferred.resolve(repositoryList);
			}
		});
	}
	return deferred.promise;
}

var delRepo = function(repositoryPath) {
	var deferred = Promise.defer();
	rimraf(repositoryPath, function(err) {
		if (err) {
			return deferred.reject(err);
		} else {
			return deferred.resolve();
		}
	});
	return deferred.promise;
}

module.exports = {
	init: init,
	destroy: destroy,
	listRepo: listRepo,
	listBranch: listBranch,
	listTag: listTag,
	listCommit: listCommit,
	open: open
}