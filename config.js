// config.js
//
// Configuration file for spatial

var os = require('os');
var config = {}
var LoggingLevels = require('./libs/logginglevels');

config.appName = 'spatial';
config.machineName = os.hostname();
config.logger = {
  logFilePath : 'f:\\logs\\spatial.txt',
  fileLevel : LoggingLevels.ERROR,
  emailLevel : LoggingLevels.ERROR
};

module.exports = config;
