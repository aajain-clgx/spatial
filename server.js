// server.js
//
// Our spatial server

'use strict';

var restify = require('./lib/external/restify');
var Logger = require('./lib/common/logger');
var Utils = require('./lib/common/utils');
var config = require('../config.js');

var server = restify.createServer();
var logger = new Logger(config.logger);

var sendEchoInfo = function(request, response, next) {
  console.log('Received request');
  logger.notice('Received request');
  response.send( { name : request.params.name });
  logger.notice('Sent response');
  next();
};

var logListening = function() {
  var listening = Utils.formatString('%SERVER% listening at %URL%', [server.name, server.url]);
  logger.notice(listening);
  console.log(listening);
};

server.get('/echo/:name', sendEchoInfo);

server.listen(config.serverPort, logListening);
