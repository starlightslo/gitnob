var crypto = require('crypto');
var Promise = require('bluebird');

// Response status
var USER_EXISTING = {code: 1000, result: 'User already existing.'};


var User = function(db, dbType) {
	return {
		signup: function(userData) {
			var deferred = Promise.defer();
			this.isUserExisting(userData.username).then(function(result) {
				if (result.existing) {
					// Username already existing
					return deferred.resolve({
						code: USER_EXISTING.code,
						result: USER_EXISTING.result
					});
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
				return deferred.resolve({
					code: 200,
					result: 'OK'
				});
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
							deferred.resolve({existing: true});
							break;
						}
					}
					deferred.resolve({existing: false, data: data});
				}, function(err) {
					deferred.reject(err);
				});
			}
			return deferred.promise;
		}
	}
}

module.exports.init = function(db, dbType) {
	return new User(db, dbType);
}
