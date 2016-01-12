'use strict'

var bcrypt = require('bcryptjs')
var fs = require('fs')
var path = require('path')
var Promise = require('bluebird')

var UserModule = require('./user');

var db = function(dbPath, dbName) {
	var db = path.join(dbPath, dbName)
	return {
		read: function() {
			var deferred = Promise.defer()
			fs.readFile(db, 'utf8', function (err, data) {
				if (err) {
					return deferred.reject(err)
				} else {
					return deferred.resolve(JSON.parse(data))
				}
			})
			return deferred.promise
		},
		write: function(data) {
			var deferred = Promise.defer()
			fs.writeFile(db, data, function (err) {
				if (err) {
					return deferred.reject(err)
				} else {
					return deferred.resolve('ok')
				}
			})
			return deferred.promise
		}
	}
}

var IsJsonString = function(data) {
	if (/^[\],:{}\s]*$/.test(data.replace(/\\["\\\/bfnrtu]/g, '@').
		replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
		replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
		return true
	}else{
		return false
	}
}

module.exports.connect = function(dbPath, dbName) {
	return new db(dbPath, dbName)
}

module.exports.init = function(dbPath, dbName) {
	// Init data for the first admin user
	var initData = {
		userList: [{
			username: 'admin',
			password: bcrypt.hashSync('admin'),
			repositoryList: [],
			collaborateRepositoryList: [],
			sshKeyList: [],
			type: UserModule.USER_TYPE_ADMIN
		}],
		repositoryList: []
	}

	// Database path
	var database = path.join(dbPath, dbName)

	// Check db is existing or not
	if (!fs.existsSync(dbPath)){
		fs.mkdirSync(dbPath)
	}

	// Check db file is existing or not
	if (!fs.existsSync(database)){
		fs.writeFileSync(database, JSON.stringify(initData))
	}

	// Check data format
	try {
		var data = fs.readFileSync(database, 'utf8')
		if (data.length <= 0 || !IsJsonString(data)) {
			fs.writeFileSync(database, JSON.stringify(initData))
		}
	} catch (err) {
		fs.writeFileSync(database, JSON.stringify(initData))
	}
}
