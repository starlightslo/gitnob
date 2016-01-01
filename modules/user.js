var crypto = require('crypto');
var Promise = require('bluebird');

// Response status
var USER_OK = {code: 200, result: 'OK'};
var USER_EXISTING = {code: 1000, result: 'User already existing.'};
var USER_NOT_FOUND = {code: 1001, result: 'User not found.'};
var USER_WITH_INVALIDE_PASSWORD = {code: 1002, result: 'User with invalide password.'};


var User = function(db, dbType) {
	return {
		signup: function(userData) {
			var deferred = Promise.defer();
			this.isUserExisting(userData.username).then(function(result) {
				if (result.existing) {
					// Username already existing
					return deferred.resolve(USER_EXISTING);
				} else {
					if (dbType == 'txt') {
						// Insert new user
						result.data.userList.push(userData);
						// Write to database
						return db.write(JSON.stringify(result.data));
					} else {
						// Not supported db.
						return deferred.reject('Not supported db type.');
					}
				}
			}, function(err) {
				return deferred.reject(err);
			}).then(function(result) {
				// Create user in system
				/* =======================
				            TODO
				   ======================= */
				return deferred.resolve(USER_OK);
			}, function(err) {
				return deferred.reject(err);
			});
			return deferred.promise;
		},
		signin: function(userData) {
			var deferred = Promise.defer();
			this.isUserExisting(userData.username).then(function(result) {
				if (result.existing) {
					var user = result.data;
					// Check password
					if (userData.password === user.password) {
						return deferred.resolve({
							code: USER_OK.code,
							result: USER_OK.result,
							data: user
						});
					} else {
						return deferred.resolve(USER_WITH_INVALIDE_PASSWORD);
					}
				} else {
					// User not found
					return deferred.resolve(USER_NOT_FOUND);
				}
			}, function(err) {
				return deferred.reject(err);
			});
			return deferred.promise;
		},
		isUserExisting: function(username) {
			var deferred = Promise.defer();
			if (dbType == 'txt') {
				db.read().then(function(data) {
					var userList = data.userList;
					for (var i in userList) {
						if (userList[i].username == username) {
							deferred.resolve({existing: true, data: userList[i]});
							break;
						}
					}
					return deferred.resolve({existing: false, data: data});
				}, function(err) {
					return deferred.reject(err);
				});
			}
			return deferred.promise;
		},
		addSshKey: function(username, sshKey) {
			var deferred = Promise.defer();
			var isUserExisting = this.isUserExisting;
			if (dbType == 'txt') {
				db.read().then(function(data) {
					var userList = data.userList;
					for (var i in userList) {
						if (userList[i].username == username) {
							var index = userList[i].sshKeyList.indexOf(sshKey)
							if (index > -1) {
								return 'ok';
							} else {
								userList[i].sshKeyList.push(sshKey);
								return db.write(JSON.stringify(data));
							}
						}
					}
					return deferred.resolve(USER_NOT_FOUND);
				}, function(err) {
					return deferred.reject(err);
				})

				// The result of write
				.then(function(result) {
					return isUserExisting(username);
				}, function(err) {
					return deferred.reject(err);
				})

				// The result of user
				.then(function(result) {
					if (result.existing) {
						delete result.data.password;
						
						return deferred.resolve({
							code: USER_OK.code,
							result: USER_OK.result,
							data: result.data
						});
					} else {
						// User not found
						return deferred.resolve(USER_NOT_FOUND);
					}
				}, function(err) {
					return deferred.reject(err);
				})
			}
			return deferred.promise;
		}
	}
}

var init = function(db, dbType) {
	return new User(db, dbType);
}


module.exports = {
	init: init,
	USER_OK: USER_OK,
	USER_EXISTING: USER_EXISTING,
	USER_NOT_FOUND: USER_NOT_FOUND,
	USER_WITH_INVALIDE_PASSWORD: USER_WITH_INVALIDE_PASSWORD
}