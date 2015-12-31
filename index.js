var config = require('./config');
var server = require("./modules/server");
app = server().run(config.port, config.secret, config.logConfiguration);
