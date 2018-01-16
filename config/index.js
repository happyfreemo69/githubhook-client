var exports = module.exports;
exports.githubhookEndpoint = 'http://githubhook-usr.citylity.com/pushes';
exports.jenkinsEndpoint = 'http://reg.citylity.com';
exports.wsEndpoint = 'ws://githubhook-usr.citylity.com';
var priv = require('fs').existsSync(__dirname+'/privateConfig.js') && require(__dirname+'/privateConfig.js');
Object.assign(exports, priv)