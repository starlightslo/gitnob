var config = require('./config');
var server = require("./modules/server");

app = server().run(config.port, config.secret, config.logConfiguration);
app.set('config', config);

// Routers
var gitRouter = require('./routes/git');

// Git
app.get('/api/git/repository', [gitRouter.list]);
