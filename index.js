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
var adminRouter = require('./routes/admin')

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

// Admin
app.get('/api/admin/git/repository', [dbRouter.init, userRouter.isLogin, adminRouter.checkAdminPermission, adminRouter.listRepository])
app.get('/api/admin/git/repository/:repository', [dbRouter.init, userRouter.isLogin, adminRouter.checkAdminPermission, adminRouter.getRepository])
app.get('/api/admin/git/repository/:repository/:ref/:head/:branch', [dbRouter.init, userRouter.isLogin, adminRouter.checkAdminPermission, adminRouter.getRepository])
app.put('/api/admin/git/repository/:repository/owner', [dbRouter.init, userRouter.isLogin, adminRouter.checkAdminPermission, adminRouter.addRepositoryOwner])
app.delete('/api/admin/git/repository/:repository', [dbRouter.init, userRouter.isLogin, adminRouter.destroyRepository])
app.get('/api/admin/user', [dbRouter.init, userRouter.isLogin, adminRouter.checkAdminPermission, adminRouter.listUser])
app.get('/api/admin/user/:username', [dbRouter.init, userRouter.isLogin, adminRouter.checkAdminPermission, adminRouter.getUser])
app.put('/api/admin/user', [dbRouter.init, userRouter.isLogin, adminRouter.checkAdminPermission, adminRouter.addUser])
app.post('/api/admin/user/:username/change_password', [dbRouter.init, userRouter.isLogin, adminRouter.checkAdminPermission, adminRouter.changePassword])
app.delete('/api/admin/user/:username', [dbRouter.init, userRouter.isLogin, adminRouter.checkAdminPermission, adminRouter.deleteUser])
