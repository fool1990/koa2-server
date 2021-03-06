/**
 * 开发者：yujintang
 * 开发时间: 2017/2/4
 */

const start_time = new Date();

const Koa = require('koa');
const https = require('https');
const session = require('koa-session-minimal');
const Router = require('koa-router');
const logger = require('koa-logger');
const body = require('koa-better-body');

const app = new Koa();
const router = new Router();

var config = require('./config');
var log = require('./init/log4js');
var mongo = require('./init/mongoose');
var redis = require('./init/redis');
var cfg_sys = config.system;
var auth_check = require('./middlewares/auth_check');
var obj_add = require('./middlewares/obj_add');
var ctx_body = require('./middlewares/ctx_body');

app.keys = [cfg_sys.cookieKey];
app.use(session(require('./init/session_rds').opt_rds));
app.use(body({
    IncomingForm: require('./init/formidable')
}));

app.use(obj_add);
app.use(ctx_body);

process.env.NODE_ENV !== 'real' && app.use(logger());

app.use(auth_check);
var index = require('./routes/index');
var auth = require('./routes/auth');
var api = require('./routes/api');
router.use('/', index.routes(), index.allowedMethods());
router.use('/auth', auth.routes(), auth.allowedMethods());
router.use('/api', api.routes(), api.allowedMethods());
app.use(router.routes());

app.listen(cfg_sys.port);
https.createServer(config.https, app.callback()).listen(12122);
log.system.info(((ms) => `Server startup in ${ms} ms, Address: http://localhost:${cfg_sys.port}`)(Date.now() - start_time));

//bind exception event to log
process.on('uncaughtException', function (e) {
    log.system.error('uncaughtException from process', e);
});
process.on('unhandledRejection', (e) => {
    log.system.warn('unhandledRejection from process', e);
});
process.on('rejectionHandled', (e) => {
    log.system.warn('rejectionHandled from process', e);
});

module.exports = app;

