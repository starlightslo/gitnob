'use strict'

const bcrypt = require('bcryptjs')
const Promise = require('bluebird')
const fs = require('fs')
const execSync = require('child_process').execSync

// Response status
const USER_OK = {code: 200, result: 'OK'}
const USER_EXISTING = {code: 1000, result: 'User already existing.'}
const USER_NOT_FOUND = {code: 1001, result: 'User not found.'}
const USER_WITH_INVALIDE_PASSWORD = {code: 1002, result: 'User with invalide password.'}
const USER_HAS_SAME_KEY_NAME = {code: 1003, result: 'There is a key with the same name.'}
const USER_CREATE_ERROR = {code: 1100, result: 'Create user failed.'}
const USER_DELETE_ERROR = {code: 1101, result: 'Delete user failed.'}
const USER_SSH_CREATE_ERROR = {code: 1110, result: 'Create user ssh failed.'}
const USER_SSH_DELETE_ERROR = {code: 1111, result: 'Delete user ssh failed.'}

// User Type
const USER_TYPE_BLOCK = -1;
const USER_TYPE_NEED_TO_SET_PASSWORD = 0;
const USER_TYPE_NORMAL = 1;
const USER_TYPE_ADMIN = 9;

const PREFIX_PERMISSION_STR = 'no-port-forwarding,no-agent-forwarding,no-X11-forwarding,no-pty,command="git-shell -c \\"$SSH_ORIGINAL_COMMAND\\"" '

var User = function(db, dbType, runUser) {
	return {
		signup: function(userData) {
			var deferred = Promise.defer()
			this.isUserExisting(userData.username).then(function(result) {
				if (result.existing) {
					// Username already existing
					return deferred.resolve(USER_EXISTING)
				} else {
					// Create user in system
					const command = 'sudo useradd -g ' + runUser + ' -G ' + runUser + ' -b /home/ -m ' + userData.username
					try {
						const resp = execSync(command)
					} catch (e) {
						return deferred.resolve(USER_CREATE_ERROR)
					}

					// Create .ssh folder and auth file
					const createFolderCommand = 'sudo mkdir /home/' + userData.username + '/.ssh'
					const createSSHAuthFileCommand = 'sudo touch /home/' + userData.username + '/.ssh/authorized_keys'
					const changeOwnerCommand = 'sudo chown -R ' + userData.username + ':' + runUser + ' /home/' + userData.username + '/.ssh'
					const changeFolderModeCommand = 'sudo chmod -R 700 /home/' + userData.username + '/.ssh'
					const changeFileModeCommand = 'sudo chmod -R 600 /home/' + userData.username + '/.ssh/authorized_keys'
					try {
						let resp = execSync(createFolderCommand)
						resp = execSync(createSSHAuthFileCommand)
						resp = execSync(changeOwnerCommand)
						resp = execSync(changeFolderModeCommand)
						resp = execSync(changeFileModeCommand)
					} catch (e) {
						return deferred.resolve(USER_CREATE_ERROR)
					}

					// Starting to write into database
					if (dbType == 'txt') {
						// Insert new user
						result.data.userList.push(userData)
						// Write to database
						return db.write(JSON.stringify(result.data))
					} else {
						// Not supported db.
						return deferred.reject('Not supported db type.')
					}
				}
			}, function(err) {
				return deferred.reject(err)
			}).then(function(result) {
				return deferred.resolve(USER_OK)
			}, function(err) {
				return deferred.reject(err)
			})
			return deferred.promise
		},
		signin: function(userData) {
			var deferred = Promise.defer()
			this.isUserExisting(userData.username).then(function(result) {
				if (result.existing) {
					var user = result.data
					// Check password
					if (bcrypt.compareSync(userData.password, user.password)) {
						return deferred.resolve({
							code: USER_OK.code,
							result: USER_OK.result,
							data: user
						})
					} else {
						return deferred.resolve(USER_WITH_INVALIDE_PASSWORD)
					}
				} else {
					// User not found
					return deferred.resolve(USER_NOT_FOUND)
				}
			}, function(err) {
				return deferred.reject(err)
			})
			return deferred.promise
		},
		checkPassword: function(username, password) {
			var deferred = Promise.defer()
			if (dbType == 'txt') {
				db.read().then(function(data) {
					var userList = data.userList
					for (var i in userList) {
						if (userList[i].username == username) {
							// Check password
							if (bcrypt.compareSync(password, userList[i].password)) {
								return deferred.resolve(USER_OK)
							} else {
								return deferred.resolve(USER_WITH_INVALIDE_PASSWORD)
							}
						}
					}
					return deferred.resolve(USER_NOT_FOUND)
				}, function(err) {
					return deferred.reject(err)
				})
			}
			return deferred.promise
		},
		changePassword: function(username, newPassword) {
			var deferred = Promise.defer()
			if (dbType == 'txt') {
				db.read().then(function(data) {
					var userList = data.userList
					for (var i in userList) {
						if (userList[i].username == username) {
							// Change to the new password
							userList[i].password = newPassword

							// Write back to database
							return db.write(JSON.stringify(data))
						}
					}
					return deferred.resolve(USER_NOT_FOUND)
				}, function(err) {
					return deferred.reject(err)
				})

				// The result of write
				.then(function(result) {
					return deferred.resolve(USER_OK)
				}, function(err) {
					return deferred.reject(err)
				})
			}
			return deferred.promise
		},
		deleteUser: function(username) {
			var deferred = Promise.defer();
			if (dbType == 'txt') {
				db.read().then(function(data) {
					var userList = data.userList;
					for (var i in userList) {
						if (userList[i].username == username) {
							userList.splice(i, 1);
							return db.write(JSON.stringify(data));
						}
					}
					return deferred.resolve(USER_NOT_FOUND);
				}, function(err) {
					return deferred.reject(err);
				})

				// The result of write
				.then(function(result) {
					// Delete user and folder
					const deleteUserCommand = 'sudo deluser ' + username
					const deleteFolderCommand = 'sudo rm -rf /home/' + username
					try {
						let resp = execSync(deleteUserCommand)
						resp = execSync(deleteFolderCommand)
					} catch (e) {
						return deferred.resolve(USER_DELETE_ERROR)
					}

					return deferred.resolve(USER_OK);
				}, function(err) {
					return deferred.reject(err);
				})
			}
			return deferred.promise;
		},
		isUserExisting: function(username) {
			var deferred = Promise.defer()
			if (dbType == 'txt') {
				db.read().then(function(data) {
					var userList = data.userList
					for (var i in userList) {
						if (userList[i].username == username) {
							// processing the length of ssh key
							for (var j in userList[i].sshKeyList) {
								if (userList[i].sshKeyList[j].key.length > 64) {
									userList[i].sshKeyList[j].key = userList[i].sshKeyList[j].key.substring(0,64)
								}
							}

							deferred.resolve({existing: true, data: userList[i]})
							break
						}
					}
					return deferred.resolve({existing: false, data: data})
				}, function(err) {
					return deferred.reject(err)
				})
			}
			return deferred.promise
		},
		list: function() {
			var deferred = Promise.defer();
			if (dbType == 'txt') {
				db.read().then(function(data) {
					var userList = data.userList;
					for (var i in userList) {
						delete userList[i].password;

						// processing the length of ssh key
						for (var j in userList[i].sshKeyList) {
							if (userList[i].sshKeyList[j].key.length > 64) {
								userList[i].sshKeyList[j].key = userList[i].sshKeyList[j].key.substring(0,64)
							}
						}
					}
					return deferred.resolve({
						code: USER_OK.code,
						result: USER_OK.result,
						data: data.userList
					});
				}, function(err) {
					return deferred.reject(err);
				});
			}
			return deferred.promise;
		},
		addSshKey: function(username, sshKey, keyName) {
			var deferred = Promise.defer()
			var isUserExisting = this.isUserExisting
			if (dbType == 'txt') {
				db.read().then(function(data) {
					var userList = data.userList
					for (var i in userList) {
						if (userList[i].username == username) {
							for (var j in userList[i].sshKeyList) {
								if (userList[i].sshKeyList[j].name === keyName) {
									return deferred.resolve(USER_HAS_SAME_KEY_NAME)
								}
							}
							userList[i].sshKeyList.push({
								key: sshKey,
								name: keyName
							})

							// Change the permission of authorized_keys
							const changeFolderModeCommand = 'sudo chmod -R 770 /home/' + username + '/.ssh'
							const changeFileModeCommand = 'sudo chmod -R 670 /home/' + username + '/.ssh/authorized_keys'
							try {
								let resp = execSync(changeFolderModeCommand)
								resp = execSync(changeFileModeCommand)
							} catch (e) {
								return deferred.resolve(USER_SSH_CREATE_ERROR)
							}

							// Writing ssh keys into authorized_keys
							const authorizedKeysFile = '/home/' + username + '/.ssh/authorized_keys'
							let keysData = ''
							for (let j in userList[i].sshKeyList) {
								keysData = keysData + PREFIX_PERMISSION_STR + userList[i].sshKeyList[j].key.toString() + '\n'
							}
							fs.writeFile(authorizedKeysFile, keysData, function (err) {
								if (err) {
									return deferred.reject(err)
								}

								// Change the permission back
								const changeBackFolderModeCommand = 'sudo chmod -R 700 /home/' + username + '/.ssh'
								const changeBackFileModeCommand = 'sudo chmod -R 600 /home/' + username + '/.ssh/authorized_keys'
								try {
									let resp = execSync(changeBackFolderModeCommand)
									resp = execSync(changeBackFileModeCommand)
								} catch (e) {
									return deferred.resolve(USER_SSH_CREATE_ERROR)
								}
							})

							// Write back to database
							return db.write(JSON.stringify(data))
						}
					}
					return deferred.resolve(USER_NOT_FOUND)
				}, function(err) {
					return deferred.reject(err)
				})

				// The result of write
				.then(function(result) {
					return isUserExisting(username)
				}, function(err) {
					return deferred.reject(err)
				})

				// The result of user
				.then(function(result) {
					if (result.existing) {
						var userData = result.data
						delete userData.password
						return deferred.resolve({
							code: USER_OK.code,
							result: USER_OK.result,
							data: userData
						})
					} else {
						// User not found
						return deferred.resolve(USER_NOT_FOUND)
					}
				}, function(err) {
					return deferred.reject(err)
				})
			}
			return deferred.promise
		},
		deleteSshKey: function(username, keyName) {
			var deferred = Promise.defer()
			var isUserExisting = this.isUserExisting
			if (dbType == 'txt') {
				db.read().then(function(data) {
					var userList = data.userList
					for (var i in userList) {
						if (userList[i].username == username) {
							for (var j in userList[i].sshKeyList) {
								if (userList[i].sshKeyList[j].name === keyName) {
									userList[i].sshKeyList.splice(j, 1)
								}
							}

							// Change the permission of authorized_keys
							const changeFolderModeCommand = 'sudo chmod -R 770 /home/' + username + '/.ssh'
							const changeFileModeCommand = 'sudo chmod -R 670 /home/' + username + '/.ssh/authorized_keys'
							try {
								let resp = execSync(changeFolderModeCommand)
								resp = execSync(changeFileModeCommand)
							} catch (e) {
								return deferred.resolve(USER_SSH_DELETE_ERROR)
							}

							// Writing ssh keys into authorized_keys
							const authorizedKeysFile = '/home/' + username + '/.ssh/authorized_keys'
							let keysData = ''
							for (let j in userList[i].sshKeyList) {
								keysData = keysData + PREFIX_PERMISSION_STR + userList[i].sshKeyList[j].key.toString() + '\n'
							}
							fs.writeFile(authorizedKeysFile, keysData, function (err) {
								if (err) {
									return deferred.reject(err)
								}


								// Change the permission back
								const changeBackFolderModeCommand = 'sudo chmod -R 700 /home/' + username + '/.ssh'
								const changeBackFileModeCommand = 'sudo chmod -R 600 /home/' + username + '/.ssh/authorized_keys'
								try {
									let resp = execSync(changeBackFolderModeCommand)
									resp = execSync(changeBackFileModeCommand)
								} catch (e) {
									return deferred.resolve(USER_SSH_DELETE_ERROR)
								}
							})

							return db.write(JSON.stringify(data))
						}
					}
					return deferred.resolve(USER_NOT_FOUND)
				}, function(err) {
					return deferred.reject(err)
				})

				// The result of write
				.then(function(result) {
					return isUserExisting(username)
				}, function(err) {
					return deferred.reject(err)
				})

				// The result of user
				.then(function(result) {
					if (result.existing) {
						var userData = result.data
						delete userData.password
						return deferred.resolve({
							code: USER_OK.code,
							result: USER_OK.result,
							data: userData
						})
					} else {
						// User not found
						return deferred.resolve(USER_NOT_FOUND)
					}
				}, function(err) {
					return deferred.reject(err)
				})
			}
			return deferred.promise
		}
	}
}

var init = function(db, dbType, runUser) {
	return new User(db, dbType, runUser)
}


module.exports = {
	init: init,
	USER_OK: USER_OK,
	USER_EXISTING: USER_EXISTING,
	USER_NOT_FOUND: USER_NOT_FOUND,
	USER_WITH_INVALIDE_PASSWORD: USER_WITH_INVALIDE_PASSWORD,

	USER_TYPE_BLOCK,
	USER_TYPE_NEED_TO_SET_PASSWORD,
	USER_TYPE_NORMAL,
	USER_TYPE_ADMIN
}