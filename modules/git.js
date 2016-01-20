'use strict'

const Promise = require('bluebird')
const fs = require('fs')
const rimraf = require('rimraf')
const path = require('path')
const execSync = require('child_process').execSync
const Git = require('nodegit')
const UserModule = require('./user')

// Response status
const GIT_OK = {code: 200, result: 'OK'}
const GIT_NO_PERMISSION = {code: 2000, result: 'No permission.'}
const GIT_INIT_WITH_SAME_NAME = {code: 2001, result: 'There have a repository with same name.'}
const GIT_ADD_SELF = {code: 2002, result: 'Can not add self.'}
const GIT_CREATE_ERROR = {code: 2100, result: 'Create repository failed.'}
const GIT_DELETE_ERROR = {code: 2101, result: 'Delete repository failed.'}
const GIT_CREATE_COLLABORATOR_ERROR = {code: 2200, result: 'Create collaborator failed.'}
const GIT_DELETE_COLLABORATOR_ERROR = {code: 2201, result: 'Delete collaborator failed.'}
const GIT_UNKNOW_ERROR = {code: 2999, result: 'Unknow git error.'}

var MyGit = function(db, dbType, runUser) {
	return {
		init: function(username, repositoryPath, repositoryName) {
			var deferred = Promise.defer()
			Git.Repository.init(repositoryPath, 1).then(function(repository) {
				// Create new group for repository
				const createGroupCommand = 'sudo groupadd ' + repositoryName
				const changeGroupCommand = 'sudo chown -R ' + runUser + ':' + repositoryName + ' ' + repositoryPath
				const changeFolderModeCommand = 'sudo find ' + repositoryPath + ' -type d -exec chmod 770 {} \\;'
				const changeFileModeCommand = 'sudo find ' + repositoryPath + ' -type f -exec chmod 760 {} \\;'
				try {
					let resp = execSync(createGroupCommand)
					resp = execSync(changeGroupCommand)
					resp = execSync(changeFolderModeCommand)
					resp = execSync(changeFileModeCommand)
				} catch (e) {
					return deferred.resolve(GIT_CREATE_ERROR)
				}

				// Record the repository to the database
				if (dbType == 'txt') {
					// Read user data
					return db.read()
				} else {
					return deferred.reject('Not supported db type.')
				}
			}, function(err) {
				return deferred.reject(err)
			})

			// Read the data from db
			.then(function(data) {
				var userList = data.userList
				for (let i in userList) {
					if (userList[i].username == username) {
						userList[i].repositoryList.push(repositoryName)

						// Add new group into the user
						const setGroupCommand = 'sudo usermod -a -G ' + repositoryName + ' ' + username
						try {
							let resp = execSync(setGroupCommand)
						} catch (e) {
							return deferred.resolve(GIT_CREATE_ERROR)
						}

						// Store into database
						return db.write(JSON.stringify(data))
					}
				}
				return deferred.resolve(UserModule.USER_NOT_FOUND)
			}, function(err) {
				return deferred.reject(err)
			})

			// The result of write
			.then(function(result) {
				return deferred.resolve(GIT_OK)
			}, function(err) {
				return deferred.reject(err)
			})
			return deferred.promise
		},
		destroy: function(repositoryPath, repositoryName) {
			var deferred = Promise.defer()
			var delRepo = this.delRepo
			// Read user data
			db.read().then(function(data) {
				var userList = data.userList
				for (var i in userList) {
					// Delete owner
					let index = userList[i].repositoryList.indexOf(repositoryName)
					if (index > -1) {
						userList[i].repositoryList.splice(index, 1)
					}

					// The collaborators also remove the repository
					index = userList[i].collaborateRepositoryList.indexOf(repositoryName)
					if (index >= 0) {
						userList[i].collaborateRepositoryList.splice(index, 1)
					}
				}

				// Write back to database
				return db.write(JSON.stringify(data))
			}, function(err) {
				return deferred.reject(err)
			})

			// The result of write
			.then(function(result) {
				// Delete repository directory
				return delRepo(repositoryPath)
			}, function(err) {
				return deferred.reject(err)
			})

			// The result of delete repository directory
			.then(function(result) {
				// Delete the group for repository
				const createGroupCommand = 'sudo delgroup ' + repositoryName
				try {
					let resp = execSync(createGroupCommand)
				} catch (e) {
					return deferred.resolve(GIT_DELETE_ERROR)
				}

				return deferred.resolve(GIT_OK)
			}, function(err) {
				return deferred.reject(err)
			})
			return deferred.promise
		},
		open: function(repositoryPath) {
			return Git.Repository.open(repositoryPath)
		},
		listBranch: function(repo) {
			return repo.getReferenceNames(Git.Reference.TYPE.LISTALL)
		},
		listTag: function(repo) {
			return Git.Tag.list(repo)
		},
		listCommit: function(repo, branch) {
			var deferred = Promise.defer()
			this.getCommit(repo, branch).then(function(commit) {
				var eventEmitter = commit.history()
				eventEmitter.on('end', function(commits) {
					return deferred.resolve(commits)
				})
				eventEmitter.on('error', function(error) {
					return deferred.reject(err)
				})
				eventEmitter.start()
			}, function(err) {
				return deferred.reject(err)
			})
			return deferred.promise
		},
		getCommit: function(repo, branch) {
			return repo.getBranchCommit(branch)
		},
		listRepo: function(rootPath) {
			var deferred = Promise.defer()
			var repositoryList = []
			var repositories = fs.readdirSync(rootPath)
			var numOfRepositories = repositories.length
			for (var i in repositories) {
				var repository = repositories[i]
				var repositoryPath = path.join(rootPath, repository)
				this.open(repositoryPath).then(function(repo) {
					var name = repo.path().split("/")
					name = name[name.length-2]
					repositoryList.push(name)
				}, function(err) {
					// Ignore
				}).done(function() {
					numOfRepositories--
					if (numOfRepositories == 0) {
						return deferred.resolve(repositoryList)
					}
				})
			}
			return deferred.promise
		},
		delRepo: function(repositoryPath) {
			var deferred = Promise.defer()
			rimraf(repositoryPath, function(err) {
				if (err) {
					return deferred.reject(err)
				} else {
					return deferred.resolve()
				}
			})
			return deferred.promise
		},
		addCollaborator: function(repository, collaboratorName) {
			var deferred = Promise.defer()

			if (dbType == 'txt') {
				// Read user data
				db.read().then(function(data) {
					var userList = data.userList
					for (var i in userList) {
						if (userList[i].username == collaboratorName) {
							userList[i].collaborateRepositoryList.push(repository)

							// Write back to database
							return db.write(JSON.stringify(data))
						}
					}
					return deferred.resolve(UserModule.USER_NOT_FOUND)
				}, function(err) {
					return deferred.reject(err)
				})

				// The result of write
				.then(function(result) {
					// Add the group of repository to collaborator
					const setGroupCommand = 'sudo usermod -a -G ' + repository + ' ' + collaboratorName
					try {
						let resp = execSync(setGroupCommand)
					} catch (e) {
						return deferred.resolve(GIT_CREATE_COLLABORATOR_ERROR)
					}

					return deferred.resolve(GIT_OK)
				}, function(err) {
					return deferred.reject(err)
				})
			}
			return deferred.promise
		},
		deleteCollaborator: function(repository, collaboratorName) {
			var deferred = Promise.defer()

			if (dbType == 'txt') {
				// Read user data
				db.read().then(function(data) {
					var userList = data.userList
					for (var i in userList) {
						if (userList[i].username == collaboratorName) {
							var index = userList[i].collaborateRepositoryList.indexOf(repository)
							if (index > -1) {
								userList[i].collaborateRepositoryList.splice(index, 1)
							}

							// Write back to database
							return db.write(JSON.stringify(data))
						}
					}
					return deferred.resolve(UserModule.USER_NOT_FOUND)
				}, function(err) {
					return deferred.reject(err)
				})

				// The result of write
				.then(function(result) {
					// Remove the group of repository
					const removeGroupCommand = 'sudo gpasswd -d ' + collaboratorName + ' ' + repository
					try {
						let resp = execSync(removeGroupCommand)
					} catch (e) {
						return deferred.resolve(GIT_DELETE_COLLABORATOR_ERROR)
					}

					return deferred.resolve(GIT_OK)
				}, function(err) {
					return deferred.reject(err)
				})
			}
			return deferred.promise
		},
		listCollaborator: function(repository) {
			var deferred = Promise.defer()

			if (dbType == 'txt') {
				// Read user data
				db.read().then(function(data) {
					var userList = data.userList
					var collaboratorList = []
					for (var i in userList) {
						var index = userList[i].collaborateRepositoryList.indexOf(repository)
						if (index > -1) {
							collaboratorList.push(userList[i].username)
						}
					}
					return deferred.resolve({
						code: GIT_OK.code,
						result: GIT_OK.result,
						data: collaboratorList
					})
				}, function(err) {
					return deferred.reject(err)
				})
			}
			return deferred.promise
		},
		getOwner: function(repository) {
			var deferred = Promise.defer()

			if (dbType == 'txt') {
				// Read user data
				db.read().then(function(data) {
					var userList = data.userList
					for (var i in userList) {
						if (userList[i].repositoryList.indexOf(repository) > -1) {
							return deferred.resolve({
								code: GIT_OK.code,
								result: GIT_OK.result,
								data: userList[i].username
							})
						}
					}
					return deferred.resolve({
						code: GIT_OK.code,
						result: GIT_OK.result,
						data: ''
					})
				}, function(err) {
					return deferred.reject(err)
				})
			}
			return deferred.promise
		},
		addOwner: function(repositoryPath, repository, username) {
			var deferred = Promise.defer()

			if (dbType == 'txt') {
				// Read user data
				db.read().then(function(data) {
					var userList = data.userList
					// Remove the existing owner
					for (var i in userList) {
						var index = userList[i].repositoryList.indexOf(repository)
						if (index > -1) {
							// Remove the group of repository
							const removeGroupCommand = 'sudo gpasswd -d ' + userList[i].username + ' ' + repository
							try {
								let resp = execSync(removeGroupCommand)
							} catch (e) {
								return deferred.resolve(GIT_UNKNOW_ERROR)
							}

							userList[i].repositoryList.splice(index, 1)
							break
						}
					}

					// Set new owner
					for (var i in userList) {
						if (userList[i].username == username) {
							userList[i].repositoryList.push(repository)

							// Store into database
							return db.write(JSON.stringify(data))
						}
					}
					return deferred.resolve(UserModule.USER_NOT_FOUND)
				}, function(err) {
					return deferred.reject(err)
				})

				// The result of write
				.then(function(result) {
					// Create new group for repository if not existing
					const checkGroupCommand = 'getent group ' + repository
					try {
						let checkResp = execSync(createGroupCommand)
						if (!checkResp || checkResp.length > 0) {
							const createGroupCommand = 'sudo groupadd ' + repository
							const changeGroupCommand = 'sudo chown -R ' + runUser + ':' + repository + ' ' + repositoryPath
							const changeFolderModeCommand = 'sudo find ' + repositoryPath + ' -type d -exec chmod 770 {} \\;'
							const changeFileModeCommand = 'sudo find ' + repositoryPath + ' -type f -exec chmod 760 {} \\;'
							let resp = execSync(createGroupCommand)
							resp = execSync(changeGroupCommand)
							resp = execSync(changeFolderModeCommand)
							resp = execSync(changeFileModeCommand)
						}
					} catch (e) {
						// ignore errors
					}

					// Add the group of repository
					const setGroupCommand = 'sudo usermod -a -G ' + repository + ' ' + username
					try {
						let resp = execSync(setGroupCommand)
					} catch (e) {
						return deferred.resolve(GIT_UNKNOW_ERROR)
					}

					return deferred.resolve(GIT_OK)
				}, function(err) {
					return deferred.reject(err)
				})
			}
			return deferred.promise
		}
	}
}

var init = function(db, dbType, runUser) {
	return new MyGit(db, dbType, runUser)
}

module.exports = {
	init: init,

	GIT_OK,
	GIT_NO_PERMISSION,
	GIT_INIT_WITH_SAME_NAME,
	GIT_ADD_SELF,
	GIT_CREATE_ERROR
}