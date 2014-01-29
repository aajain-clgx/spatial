// server.js
//
// Our spatial server

'use strict';

var restify = require('./lib/external/restify');
var Logger = require('./lib/common/logger');
var Utils = require('./lib/common/utils');

var server = restify.createServer();

var sendEchoInfo = function(request, response, next) {
  console.log('Received request');
  Logger.notice('Received request');
  response.send( { name : request.params.name });
  Logger.notice('Sent response');
  next();
};

var logListening = function() {
  var listening = Utils.formatString('%SERVER% listening at %URL%', [server.name, server.url]);
  Logger.notice(listening);
  console.log(listening);
};

server.get('/echo/:name', sendEchoInfo);

server.listen(8080, logListening);
