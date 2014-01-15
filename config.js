// config.js
//
// Configuration file for spatial

var os = require('os');
var path = require('path');
var config = {}

config.root = path.dirname(require.main.filename); 
config.appName = 'spatial';
config.machineName = os.hostname();
config.common = {
  utilsPath : path.join(config.root,'libs/common/utils'),
  logger : {
    path : path.join(config.root, 'libs/common/logger'),
    logFilePath : 'f:\\logs\\spatial.txt',
    fileLevel : 'ERROR',
    emailLevel : 'ERROR'
  }
};
config.external = {
  dateFormatPath : path.join(config.root,'libs/external/dateformat'),
  enumPath : path.join(config.root, 'libs/external/enum')
};

module.exports = config;
