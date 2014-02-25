// logger.js
//
// Logs to file, or to email.
// TBD: logging to email

'use strict';

var FS = require('fs');
var Enum = require('../external/enum');
var Utils = require('./utils');
var NodeMailer = require('../external/nodemailer');
// this is a function, so that's how we'll name it
var dateFormat = require('../external/dateformat');

var Logger = function(config) {

  /**
   * PRIVATE MEMBERS
   */

  // what we need for handling various severity levels
  var LoggingLevels = new Enum(['VERBOSE', 'NOTICE', 'WARNING', 'ERROR', 'OFF']);

  // Default values for key properties of the logger.
  var _smtpPort = 25;

  // Let's try to set values from our configuration file.
  var _logFilePath = config.logsettings.logFilePath || '';
  var _appName = config.appName || 'UNKNOWN'; 
  var _machineName = config.machineName || 'UNKNOWN';
  var  _fileLevel = LoggingLevels.get(config.logsettings.fileLevel) || LoggingLevels.OFF;
  var _emailLevel = LoggingLevels.get(config.logsettings.emailLevel) || LoggingLevels.OFF;
  var _emailSender = config.logsettings.emailSender || 'NOBODY@NOWHERE.COM';
  var _emailRecipient = config.logsettings.emailRecipient || 'NOBODY@NOWHERE.COM';
  var _smtpServer = config.logsettings.smtpServer || '';

  var _messageTemplate = 
    Utils.formatString('#TIMESTAMP# [%MACHINE%/%APP%:#LOGLEVEL#] #MESSAGE#\n',
        [_machineName, _appName]);

  var _callIndexTemplate = 
    Utils.formatString('#USER#_%APP%_%MACHINE%_#ID#',
        [_appName, _machineName]);

  var _emailSubjectTemplate = Utils.formatString('[%MACHINE%/%APP%] #SUBJECT#', [_machineName, _appName]);

  // Because logging is always relative to an app, we'll define
  // a call identifier here and increment it.
  var _callIndex = 0;

  var _transport = NodeMailer.createTransport('SMTP', {
    host : _smtpServer,
    secureConnection : false,
    port : _smtpPort
  });

  /**
   * PRIVATE METHODS
   */

  var getMailOptions = function(emailSubject, emailText) {
    return {
      from : _emailSender,
      to : _emailRecipient,
      subject : emailSubject,
      text : emailText
    };
  };

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

  var writeToFileIf = function(logLevelToCheck, message, errorHandler) {
    if (atLevel(logLevelToCheck, _fileLevel)) {
      FS.appendFile(_logFilePath, message, errorHandler);
    }
  };

  var writeToEmailIf = function(logLevelToCheck, message, errorHandler) {
    if (atLevel(logLevelToCheck, _emailLevel)) {
      var subjectText = message;
      if (message.length > 10) {
        subjectText = message.substring(10);
      }
      var subject = Utils.formatString(_emailSubjectTemplate, [subjectText]);
      var mailOptions = getMailOptions(subject, message);
      _transport.sendMail(mailOptions, errorHandler);
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

  this.getId = function(){
    _callIndex++;
    return _callIndex;
  };
};


// So you can do this:
//
// var Logger = new require('path-to-logger')(config);
module.exports = Logger;
