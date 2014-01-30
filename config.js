// config.js
//
// Configuration file for spatial

'use strict';

var os = require('os');
var config = {
  appName : 'spatial',
  machineName : os.hostname(),
  logFilePath : 'f:\\logs\\spatial.txt',
  fileLevel : 'NOTICE',
  emailLevel : 'ERROR',
  smtpServer : 'smtp.corelogic.com',
  emailSender : 'logger@corelogic.com',
  emailRecipient : 'avinueza@corelogic.com'
};

module.exports = config;
