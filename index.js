var config = require('./config');
var server = require("./modules/server");

app = server().run(config.port, config.secret, config.logConfiguration);
app.set('config', config);

// Init Database
if (config.database.type == 'txt') {
	require('./modules/txtDB').init(config.database.path, config.database.name);
}

// Routers
var dbRouter = require('./routes/db');
var gitRouter = require('./routes/git');
var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');

// Git
app.get('/api/git/repository', [dbRouter.init, userRouter.isLogin, gitRouter.list]);
app.get('/api/git/repository/:repository', [dbRouter.init, userRouter.isLogin, gitRouter.get]);
app.get('/api/git/repository/:repository/collaborator', [dbRouter.init, userRouter.isLogin, gitRouter.listCollaborator]);
app.put('/api/git/repository/:repository/collaborator', [dbRouter.init, userRouter.isLogin, gitRouter.addCollaborator]);
app.delete('/api/git/repository/:repository/collaborator', [dbRouter.init, userRouter.isLogin, gitRouter.deleteCollaborator]);
app.get('/api/git/repository/:repository/:ref/:head/:branch', [dbRouter.init, userRouter.isLogin, gitRouter.get]);
app.put('/api/git/repository/create', [dbRouter.init, userRouter.isLogin, gitRouter.create]);
app.delete('/api/git/repository/destroy', [dbRouter.init, userRouter.isLogin, gitRouter.destroy]);

// User
app.post('/api/user/signup', [dbRouter.init, userRouter.signup]);
app.post('/api/user/signin', [dbRouter.init, userRouter.signin]);
app.post('/api/user/logout', [userRouter.logout]);

// Admin
app.get('/api/admin/git/repository', [dbRouter.init, userRouter.isLogin, adminRouter.checkAdminPermission, adminRouter.listRepository]);
app.get('/api/admin/user', [dbRouter.init, userRouter.isLogin, adminRouter.checkAdminPermission, adminRouter.listUser]);
app.put('/api/admin/user', [dbRouter.init, userRouter.isLogin, adminRouter.checkAdminPermission, adminRouter.addUser]);
app.delete('/api/admin/user', [dbRouter.init, userRouter.isLogin, adminRouter.checkAdminPermission, adminRouter.deleteUser]);
app.put('/api/user/ssh_key', [dbRouter.init, userRouter.isLogin, adminRouter.checkAdminPermission, userRouter.addSshKey])
app.delete('/api/user/ssh_key', [dbRouter.init, userRouter.isLogin, adminRouter.checkAdminPermission, userRouter.deleteSshKey])

