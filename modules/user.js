'use strict'

var bcrypt = require('bcryptjs')
var Promise = require('bluebird')

// Response status
var USER_OK = {code: 200, result: 'OK'}
var USER_EXISTING = {code: 1000, result: 'User already existing.'}
var USER_NOT_FOUND = {code: 1001, result: 'User not found.'}
var USER_WITH_INVALIDE_PASSWORD = {code: 1002, result: 'User with invalide password.'}
var USER_HAS_SAME_KEY_NAME = {code: 1003, result: 'There is a key with the same name.'}

// User Type
var USER_TYPE_BLOCK = -1;
var USER_TYPE_NEED_TO_SET_PASSWORD = 0;
var USER_TYPE_NORMAL = 1;
var USER_TYPE_ADMIN = 9;

var User = function(db, dbType) {
	return {
		signup: function(userData) {
			var deferred = Promise.defer()
			this.isUserExisting(userData.username).then(function(result) {
				if (result.existing) {
					// Username already existing
					return deferred.resolve(USER_EXISTING)
				} else {
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
				// Create user in system
				/* =======================
				            TODO
				   ======================= */
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
						// processing the length of ssh key
						for (var i in userData.sshKeyList) {
							if (userData.sshKeyList[i].key.length > 64) {
								userData.sshKeyList[i].key = userData.sshKeyList[i].key.substring(0,64)
							}
						}

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
						// processing the length of ssh key
						for (var i in userData.sshKeyList) {
							if (userData.sshKeyList[i].key.length > 64) {
								userData.sshKeyList[i].key = userData.sshKeyList[i].key.substring(0,64)
							}
						}

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

var init = function(db, dbType) {
	return new User(db, dbType)
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