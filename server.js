// server.js
//
// Our spatial server
//
// Todo:
//
// 1. Merge with Authentication scheme
// 2. Merge with restify errors


'use strict';

var restify = require('./lib/external/restify');
var Utils = require('util');
var config = require('../config.js');
var userlib = require('./lib/common/userlib.js');
var Exception = require('./lib/common/exception.js');
var status = require('./lib/common/status.js');
var logger = config.logger;
var userlib = userlib(config);

// SERVER INIT

var server = restify.createServer({name: config.appName});
server.use(restify.queryParser());
server.use(restify.gzipResponse());


// PRIVATE HELPER FUNCTIONS

var getElapsedTime = function(timeEnd){
  return Number(timeEnd[0]+timeEnd[1]*1.0e-9).toFixed(3);
};


var handleError = function(err,response){

  // All exception that we "throw" are of type defined in exception.js
  // All exception defined by us have an ENUM for status
  // If case it is unhandled error, we set status to SERVER_ERROR
  
  if(err){
    response.send({
      status : err.status || status.SERVER_ERROR.toString(),
      message: err.message,
      result : {}
    });
  }
};

// API FUNCTIONS

var getPermissions = function(request, response, next){
 
  var startTime = process.hrtime();
  var queryParams = request.query;
  var callId = logger.getId();

  logger.verbose(Utils.format("%d getPermissions(publickey=%s) entry", callId, request.params.publickey));

  userlib.getAuthToken(request.params.publickey, function(err, permissions){
    if(err){
      handleError(err, response);
    }else{
      response.send({
        status: 'OK',
        message:'',
        result: permissions
      });
    }

    var endTime = process.hrtime(startTime);
    logger.verbose(Utils.format("%d getPermissions() elapsed=%ds", callId, getElapsedTime(endTime)));  

    return next();
  });
};

var getAccountInfo = function(request, response, next){
  var startTime = process.hrtime();
  var queryParams = request.query;
  var callId = logger.getId();
 
  logger.verbose(Utils.format("%d getAccountInfo(publickey=%s) entry", callId, request.params.publickey));

  userlib.getAccountInfo(request.params.publickey, function(err, info){
    if(err){
      handleError(err, response);
    }else{
      response.send({
        status: 'OK',
        message:'',
        result: info
      });
    }

    var endTime = process.hrtime(startTime);
    logger.verbose(Utils.format("%d getAccountInfo() elapsed=%ds", callId, getElapsedTime(endTime)));  

    return next();
  });

};


// ROUTE
server.get('/v1/permissions/:publickey', getPermissions);
server.get('/v1/info/:publickey', getAccountInfo);


// SERVER LAUNCH

server.listen(config.serverPort, function(){
  var listenStr = Utils.format('%s listening at %s', server.name, server.url);
  logger.notice(listenStr);
});
