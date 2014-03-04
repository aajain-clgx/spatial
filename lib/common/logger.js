// logger.js

'use strict';

var FS = require('fs');
var Enum = require('../external/enum');
var Utils = require('util');
var NodeMailer = require('../external/nodemailer');
var dateFormat = require('../external/dateformat');


var Logger = function(config) {

   //PRIVATE MEMBERS
  
  // what we need for handling various severity levels
  var LoggingLevels = new Enum(['VERBOSE', 'NOTICE', 'WARNING', 'ERROR', 'OFF']);
  var _callIndex = 0;
  var _appName = config.appName || 'UNKNOWN'; 
  var _machineName = config.machineName || 'UNKNOWN';

  // Configuration settings from config object

  var _logFilePath = config.logsettings.logFilePath || '';
  var _level = {
    file:  LoggingLevels.get(config.logsettings.fileLevel) || LoggingLevels.OFF,
    email:  LoggingLevels.get(config.logsettings.emailLevel) || LoggingLevels.OFF
  };
  var _email = {
      Sender: config.logsettings.emailSender || 'NOBODY@NOWHERE.COM',
      Recipient : config.logsettings.emailRecipient || 'NOBODY@NOWHERE.COM',
      Server : config.logsettings.smtpServer || '',
      SmtpPort : 25
    };

  // Message Templates

  var _messageTemplate = '%s [%s/%s:%s] %s\n';
  var _callIndexTemplate = '%s_%s_%s_%d';
  var _emailSubjectTemplate = Utils.format('[%s/%s] %s'); 

  // Init Email settings

  var _transport = NodeMailer.createTransport('SMTP', {
    host : _email.Server,
    secureConnection : false,
    port : _email.SmtpPort
  });

  
  //PRIVATE METHODS
  
  var getMailOptions = function(emailSubject, emailText) {
    return {
      from : _email.Sender,
      to : _email.Recipient,
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
  
  var throwError = function(err) {
    if(err){
      console.log("CRITICAL ERROR in Logger: " + err);
    }
  };

  var writeToFileIf = function(logLevelToCheck, message, errorHandler) {
    if (atLevel(logLevelToCheck, _level.file)) {
      FS.appendFile(_logFilePath, message, errorHandler);
    }
  };

  var writeToEmailIf = function(logLevelToCheck, message, errorHandler) {
    if (atLevel(logLevelToCheck, _level.email)) {
      var subjectText = message;
      if (message.length > 10) {
        subjectText = message.substring(10);
      }
      var subject = Utils.format(_emailSubjectTemplate, _machineName, _appName, subjectText);
      var mailOptions = getMailOptions(subject, message);
      _transport.sendMail(mailOptions, errorHandler);
    }
  };

  var logIf = function(logLevelToCheck, message, error) {
    var now = dateFormat(new Date(), 'yyyy-mm-dd:hh:MM:ss:l');
    var fullMessage = 
      Utils.format(_messageTemplate, now, _machineName, _appName, logLevelToCheck, message);
    if(error){
      fullMessage += 'Error Name: ' + error.name + '\n';
      fullMessage += 'Error Message: ' + error.message + '\n';
      fullMessage += 'Error stack: ' + error.stack + '\n'; 
    }

    writeToFileIf(logLevelToCheck, fullMessage, throwError);
    writeToEmailIf(logLevelToCheck, fullMessage, throwError);
  };

  // PUBLIC METHODS

  /**
  * Record message into the log at VERBOSE level
  * @method verbose 
  * @param message message to be recorded into log
  * @param error Optional Javascript error to be recorded into log
  */

  this.verbose = function(message, error) {
    logIf(LoggingLevels.VERBOSE, message, error);
  };

  /**
  * Record message into the log at NOTICE level
  * @method verbose 
  * @param message message to be recorded into log
  * @param error Optional Javascript error to be recorded into log
  */
  
  this.notice = function(message,error) {
    logIf(LoggingLevels.NOTICE, message,error);
  };

  /**
  * Record message into the log at WARNING level
  * @method verbose 
  * @param message message to be recorded into log
  * @param error Optional Javascript error to be recorded into log
  */

  this.warning = function(message,error) {
    logIf(LoggingLevels.WARNING, message,error);
  };

  /**
  * Record message into the log at ERROR level
  * @method verbose 
  * @param message message to be recorded into log
  * @param error Optional Javascript error to be recorded into log
  */

  this.error = function(message,error) {
    logIf(LoggingLevels.ERROR, message,error);
  };

  /**
  * Record message into the log at CRITICAL level
  * @method verbose 
  * @param message message to be recorded into log
  * @param error Optional Javascript error to be recorded into log
  */

  this.critical = function(message,error) {
    logIf(LoggingLevels.CRITICAL, message,error);
  };

  /**
  * Generates a unique id for an individual call to spatial server.
  * This callID is used to track the entry, exit and error recording during any one call
  *
  * @method getID
  * @return {Number} returns a unique incremented number 
  */

  this.getId = function(){
    _callIndex++;
    return _callIndex;
  };

  /**
  * Generates a unique CallID string for an individual call to spatial server.
  * This callID is used to track the entry, exit and error recording during any one call
  *
  * @method getID
  * @param username username to be used as part of 
  * @return {String} returns a unique callID  
  */
  this.getCallId = function(username) {
    _callIndex++;
    var callId = Utils.format(_callIndexTemplate, 
      username,_appName, _machineName,  _callIndex.toString(16));
    return callId;
  };

};

module.exports = Logger;
