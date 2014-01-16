// config.js
//
// Configuration file for spatial

var os = require('os');
var config = {};

config.appName = 'spatial';
config.machineName = os.hostname();
config.common = {
  logger : {
    logFilePath : 'f:\\logs\\spatial.txt',
    fileLevel : 'ERROR',
    emailLevel : 'ERROR',
    smtpServer : 'smtp.corelogic.com',
    emailSender : 'logger@corelogic.com',
    emailRecipient : 'avinueza@corelogic.com'
  }
};

module.exports = config;
