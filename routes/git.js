var fs = require('fs');
var path = require('path');

var list = function(req, res, next) {
	var repositoryList = getGitRepository(app.settings.config.gitPath);
	var resp = {
		code: 200,
		result: 'OK',
		data: repositoryList
	}
	res.json(resp);
	res.end();
	next();
};

// Get all git repository
function getGitRepository(gitPath) {
	var repositoryList = [];
	var repositories = fs.readdirSync(gitPath);
	for (var i in repositories) {
		var repository = repositories[i];
		var repositoryPath = path.join(gitPath, repository, '.git');
		if (fs.existsSync(repositoryPath)) {
			repositoryList.push(repository);
		}
	}
	return repositoryList;
}

module.exports = {
	list: list
}