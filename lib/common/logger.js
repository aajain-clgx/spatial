// logger.js
//
// Logs to file, or to email.
// TBD: logging to email
//
// If we want to log to email, we'll have to Configure the mailer. This is
// a rough sketch of code for the mailing part of what we'd be doing:
//
// var nodemailer = require('c:\\nodejs\\node_modules\\nodemailer');
// var transport = nodemailer.createTransport('SMTP', {
//   host: 'smtp.corelogic.com',
//   secureConnection: false,
//   port: 25
// });
// var mailCallback = function(err, resp) { ... };
// var message = 'This is the message I am sending.';
// var mailOptions = {
//   from: 'logger@corelogic.cm',
//   to: 'bugfixer@corelogic.com',
//   subject: '[MACHINE/APP ERROR] username_MACHINE_APPNAME_CALLID ErrorMessage',
//   text: message
// };
// transport.sendMail(mailOptions, mailCallback);

var Config = require('../../config');
var FS = require('fs');
var Enum = require('../external/enum');
var Utils = require('./utils');
var NodeMailer = require('../external/nodemailer');
// this is a function, so that's how we'll name it
var dateFormat = require('../external/dateFormat');

function Logger() {

  /**
   * PRIVATE MEMBERS
   */

  // what we need for handling various severity levels
  var LoggingLevels = new Enum(['VERBOSE', 'NOTICE', 'WARNING', 'ERROR', 'OFF']);

  // Default values for key properties of the logger.
  var _logFilePath = '';
  var _appName = 'UNKNOWN';
  var _machineName = 'UNKNOWN';
  var _fileLevel = LoggingLevels.OFF;
  var _emailLevel = LoggingLevels.OFF;
  var _emailSender = 'NOBODY@NOWHERE.COM';
  var _emailRecipient = 'NOBODY@NOWHERE.COM';
  var _smtpServer = '';
  var _smtpPort = 25;

  // special-purpose parsing
  var parseLevel = function(enumString, defaultValue) {
    if (enumString) {
      var candidate = LoggingLevels.get(enumString);
      if (candidate) {
        return candidate;
      }
    }
    return defaultValue;
  };

  // Let's try to set values from our configuration file.
  if (Config) {
    if (Config.common.logger.logFilePath ) {
      _logFilePath = Config.common.logger.logFilePath;
    }
    if (Config.appName) {
      _appName = Config.appName; 
    }
    if (Config.machineName) {
      _machineName = Config.machineName;
    }
    _fileLevel = parseLevel(Config.common.logger.fileLevel, _fileLevel);
    _emailLevel = parseLevel(Config.common.logger.emailLevel, _emailLevel);
    if (Config.common.logger.emailSender) {
      _emailSender = Config.common.logger.emailSender;
    }
    if (Config.common.logger.emailRecipient) {
      _emailRecipient = Config.common.logger.emailRecipient;
    }
    if (Config.common.logger.smtpServer) {
      _smtpServer = Config.common.logger.smtpServer;
    }
  }

  var _messageTemplate = 
    Utils.formatString('#TIMESTAMP# [%MACHINE%/%APP%:#LOGLEVEL#] #MESSAGE#\n',
        [_machineName, _appName]);

  var _callIndexTemplate = 
    Utils.formatString('#USER#_%APP%_%MACHINE%_#ID#',
        [_appName, _machineName]);

  var _emailSubjectTemplate = Utils.formatString('[%MACHINE%/%APP%] #SUBJECT#', [_machineName, _appName]);

  // Because logging is always relative to an app, we'll define
  // a call identifier here and increment it.
  var _callIndex;

  var _transport = NodeMailer.createTransport('SMTP', {
    host : _smtpServer,
    secureConnection : false,
    port : _smtpPort
  });

  var getMailOptions = function(emailSubject, emailText) {
    return {
      from : _emailSender,
      to : _emailRecipient,
      subject : emailSubject,
      text : emailText
    };
  };

  /**
   * PRIVATE METHODS
   */

  var atLevel = function(logLevelToCheck, logLevel) {
    var isLoggable = !logLevelToCheck.is(LoggingLevels.OFF);
    if (isLoggable) {
      isLoggable = logLevelToCheck.value >= logLevel.value;
    }
    return isLoggable;
  };
  

  // We'll need a better error handler than this.
  var throwError = function(err) {
    if (err) {
      throw err;
    }
  };

  var writeToFileIf = function(logLevelToCheck, message, callback) {
    if (atLevel(logLevelToCheck, _fileLevel)) {
      FS.appendFile(_logFilePath, message, callback);
    }
  };

  var writeToEmailIf = function(logLevelToCheck, message, callback) {
    if (atLevel(logLevelToCheck, _emailLevel)) {
      var subjectText = message;
      if (message.length > 10) {
        subjectText = message.substring(10);
      }
      var subject = Utils.formatString(_emailSubjectTemplate, [subjectText]);
      var mailOptions = getMailOptions(subject, message);
      _transport.sendMail(mailOptions, callback);
    }
  };

  // The basic logging function.
  // 
  // We'll want to handle errors differently here, because
  // this call had better not break the application, and 
  // a failure to log to a file shouldn't prevent the 
  // attempt to log to email. But this ok for a first draft.
  var logIf = function(logLevelToCheck, message) {
    var now = dateFormat(new Date(), 'yyyy-mm-dd:hh:MM:ss:l');
    var fullMessage = 
      Utils.formatString(_messageTemplate, [now, logLevelToCheck, message]);
    writeToFileIf(logLevelToCheck, fullMessage, throwError);
    writeToEmailIf(logLevelToCheck, fullMessage, throwError);
  };

  /**
   * PUBLIC METHODS
   */

  this.verbose = function(message) {
    logIf(LoggingLevels.VERBOSE, message);
  };

  this.notice = function(message) {
    logIf(LoggingLevels.NOTICE, message);
  };

  this.warning = function(message) {
    logIf(LoggingLevels.WARNING, message);
  };

  this.error = function(message) {
    logIf(LoggingLevels.ERROR, message);
  };

  this.critical = function(message) {
    logIf(LoggingLevels.CRITICAL, message);
  };

  this.getCallId = function(username) {
    _callIndex++;
    var callId = Utils.formatString(_callIndexTemplate, 
      [username, _callIndex.toString(16)]);
    return callId;
  };
}


// So you can do this:
//
// var Logger = require('path-to-logger');
// var LoggingLevels = require('path-to-logginglevels');
// Logger.setFileLevel(LoggingLevels.WARNING);
module.exports = new Logger();
