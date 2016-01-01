var crypto = require('crypto');

var signup = function(req, res, next) {
	var username = req.body.username;
	var password = req.body.password;

	var userData = {
		username: username,
		password: crypto.createHash('md5').update(password).digest("hex"),
		sshKeyList: [],
		repositoryList: [],
		type: 0
	}
	var User = require('../modules/user').init(db, app.settings.config.database.type);
	User.signup(userData).then(function(result) {
		var resp = result;
		req.log.info({
			catalog: 'User',
			action: 'Signup',
			req: userData,
			result: resp
		});
		res.json(resp);
		res.end();
		next();
	}, function(err) {
		req.log.error({
			catalog: 'User',
			action: 'Signup',
			req: userData,
			error: err
		});
		res.status(500).send('Server Error: ' + err);
		next();
	});
}

module.exports = {
	signup: signup
}