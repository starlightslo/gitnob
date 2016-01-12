'use strict'

var config = require('./config')
var server = require("./modules/server")

var app = server().run(config.port, config.secret, config.logConfiguration)
app.set('config', config)

// Init Database
if (config.database.type == 'txt') {
	require('./modules/txtDB').init(config.database.path, config.database.name)
}

// Routers
var dbRouter = require('./routes/db')
var gitRouter = require('./routes/git')
var userRouter = require('./routes/user')

// Git
app.get('/api/git/repository', [dbRouter.init, userRouter.isLogin, gitRouter.list])
app.get('/api/git/repository/:repository', [dbRouter.init, userRouter.isLogin, gitRouter.get])
app.get('/api/git/repository/:repository/collaborator', [dbRouter.init, userRouter.isLogin, gitRouter.listCollaborator])
app.put('/api/git/repository/:repository/collaborator', [dbRouter.init, userRouter.isLogin, gitRouter.addCollaborator])
app.delete('/api/git/repository/:repository/collaborator/:collaborator', [dbRouter.init, userRouter.isLogin, gitRouter.deleteCollaborator])
app.get('/api/git/repository/:repository/:ref/:head/:branch', [dbRouter.init, userRouter.isLogin, gitRouter.get])
app.put('/api/git/repository/create', [dbRouter.init, userRouter.isLogin, gitRouter.create])
app.delete('/api/git/repository/:repository', [dbRouter.init, userRouter.isLogin, gitRouter.destroy])

// User
app.get('/api/user', [dbRouter.init, userRouter.isLogin, userRouter.user])
app.post('/api/user/signup', [dbRouter.init, userRouter.signup])
app.post('/api/user/signin', [dbRouter.init, userRouter.signin])
app.post('/api/user/logout', [userRouter.logout])
app.post('/api/user/change_password', [dbRouter.init, userRouter.isLogin, userRouter.changePassword])
app.put('/api/user/ssh_key', [dbRouter.init, userRouter.isLogin, userRouter.addSshKey])
app.delete('/api/user/ssh_key/:name', [dbRouter.init, userRouter.isLogin, userRouter.deleteSshKey])
