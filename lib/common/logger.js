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

var fs = require('fs');
var path = require('path');
// this is the only relative path we need
var Config = require('../../config');
var DateFormat = require(Config.external.dateFormatPath);
var Enum = require(Config.external.enumPath);
var Utils = require(Config.common.utilsPath);

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
  }

  var _messageTemplate = 
    Utils.formatString('#TIMESTAMP# [%MACHINE%/%APP%:#LOGLEVEL#] #MESSAGE#\n',
        [_machineName, _appName]);

  var _callIndexTemplate = 
    Utils.formatString('#USER#_%APP%_%MACHINE%_#ID#',
        [_appName, _machineName]);

  // Because logging is always relative to an app, we'll define
  // a call identifier here and increment it.
  var _callIndex;


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
      fs.appendFile(_logFilePath, message, callback);
    }
  };

  // this is where we use the nodemailer functionality
  var writeToEmailIf = function(logLevelToCheck, message, callback) {
    if (atLevel(logLevelToCheck, _emailLevel)) {
      // insert email functionality here
    }
  }

  // The basic logging function.
  // 
  // We'll want to handle errors differently here, because
  // this call had better not break the application, and 
  // a failure to log to a file shouldn't prevent the 
  // attempt to log to email. But this ok for a first draft.
  var logIf = function(logLevelToCheck, message) {
    var now = DateFormat(new Date(), 'yyyy-mm-dd:hh:MM:ss:l');
    var fullMessage = 
      Utils.formatString(_messageTemplate, [now, logLevelToCheck, message]);
    writeToFileIf(logLevelToCheck, fullMessage, throwError);
    writeToEmailIf(logLevelToCheck, fullMessage, throwError);
  };

  /**
   * PUBLIC MEMBERS
   */

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
};


// So you can do this:
//
// var Logger = require('path-to-logger');
// var LoggingLevels = require('path-to-logginglevels');
// Logger.setFileLevel(LoggingLevels.WARNING);
module.exports = new Logger();
