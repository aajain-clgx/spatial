// server.js
//
// Our spatial server
//
// Todo:
//
// 1. Merge with restify errors
// 2. Add logging for errors with stack trace


'use strict';

var restify = require('./lib/external/restify');
var async = require('./lib/external/async');
var WebSocket = require('./lib/external/ws');
var Utils = require('util');
var config = require('../config.js');
var userlib = require('./lib/common/userlib.js');
var exception = require('./lib/common/exception.js');
var status = require('./lib/common/status.js');
var authenticator = require('./lib/common/authenticator.js');
var logger = config.logger;
var userlib = userlib(config);
var authenticator = authenticator(config);

// SERVER INIT

var server = restify.createServer({name: config.appName});
server.use(restify.queryParser());
server.use(restify.gzipResponse());

// PRIVATE HELPER FUNCTIONS

var getElapsedTime = function(timeEnd){
  return Number(timeEnd[0]+timeEnd[1]*1.0e-9).toFixed(3);
};

var findMissingParam = function(queryParams){
  var missing = [];

  if(!queryParams.timestamp){
    missing.push('timestamp');
  }
  if(!queryParams.signature){
    missing.push('signature');
  }
  
  return missing;
};



var handleAuthentication = function(request, callback){

 // Verify if parameters are present
 // Verify if it maches 

  var queryParams = request.query;
    
  if(!(queryParams.timestamp && queryParams.signature)){

    var missingParamStr = findMissingParam(queryParams).join(",");
    return callback(new exception.MissingParameter(missingParamStr), null);

  }else{
 
   // Get PrivateKey
    userlib.getPrivateKey(request.params.publickey, function(err, privatekey){
      if(err){
        return callback(err, null);
      }else{
        authenticator.validateRequest(request, privatekey, function(err, authenticated){
          if(err){
            return callback(err, null);
          }else{
            return callback(null, authenticated);
          }
        });
      }
    });
  }
};

var handleError = function(err, callID, funcName, response){

  // All exception that we "throw" are of type defined in exception.js
  // All our exception are derived from Error
  // All exception defined by us have an ENUM for status
  // If case it is unhandled error, we set status to SERVER_ERROR
  
  if(err){
    response.send({
      status : err.status || status.SERVER_ERROR.toString(),
      message: err.message,
      result : {}
    });
    
    logger.error(Utils.format('%s ERROR in %s() with Exception=%s', callID, funcName, err.name), err);
  }
};

// API FUNCTIONS

var getPermissions = function(request, response, next){
  var startTime = process.hrtime();
  var callId = logger.getId();

  logger.verbose(Utils.format("%d getPermissions(publickey=%s) entry", callId, request.params.publickey));

  async.series({
    auth: function(callback){
            handleAuthentication(request, callback);
          },
    action: function(callback){
              userlib.getAuthToken(request.params.publickey, function(err, permissions){
                if(err){
                  return callback(err, null);
                }else{
                  return callback(null, {
                    status: 'OK',
                    message:'',
                    result: permissions
                  });
                }
              });   
            }
  },
  function(err, results){
    if(err){
      handleError(err, callId, "getPermissions", response);
    }else{
      response.send(results.action);
    }
    
    var endTime = process.hrtime(startTime);
    logger.verbose(Utils.format("%d getPermissions() elapsed=%ds", callId, getElapsedTime(endTime))); 

    return next();      
  });
};

var getAccountInfo = function(request, response, next){
  var startTime = process.hrtime();
  var callId = logger.getId();
 
  logger.verbose(Utils.format("%d getAccountInfo(publickey=%s) entry", callId, request.params.publickey));

  async.series({
    auth: function(callback){ 
            handleAuthentication(request, callback); 
          },
    action: function(callback){
              userlib.getAccountInfo(request.params.publickey, function(err, info){
                if(err){
                  return callback(err, null);
                }else{
                  return callback(null, {
                    status: 'OK',
                    message:'',
                    result: info
                  });
                }
              });   
            }
  },
  function(err, results){
    if(err){
      handleError(err, callId, "getAccountInfo", response);
    }else{
      response.send(results.action);
    }

    var endTime = process.hrtime(startTime);
    logger.verbose(Utils.format("%d getAccountInfo() elapsed=%ds", callId, getElapsedTime(endTime))); 

    return next();      
  });
};

var query = function(request, response, next){
  var startTime = process.hrtime();
  var callId = logger.getId();
 
  logger.verbose(Utils.format("%d query(publickey=%s,lat=%s,lon=%s,layer=%s) entry",
                              callId, 
                              request.params.publickey,
                              request.params.lat,
                              request.params.lon,
                              request.params.layer
                ));
  async.series({
    auth: function(callback){ 
            handleAuthentication(request, callback); 
          },
    action: function(callback){
        var ws = new WebSocket(config.socketserver);
        ws.on('open', function(){
            ws.send(JSON.stringify({Operation: 'query', lat: request.params.lat, lon: request.params.lon, layer: request.params.layer}),
                     function(err){
                        if(err){
                          return callback(err, null);
                        }
                      });
          });

        ws.on('message', function(data){
          ws.close();
          return callback(null, data);
        });
      }
  },
  function(err, results){
    if(err){
      handleError(err, callId, "query", response);
    }else{
      response.send(JSON.parse(results.action));
    }

    var endTime = process.hrtime(startTime);
    logger.verbose(Utils.format("%d query() elapsed=%ds", callId, getElapsedTime(endTime))); 

    return next();          
  }
  );
};

var bestGeocode = function(request, response, next){
  var startTime = process.hrtime();
  var callId = logger.getId();
 
  logger.verbose(Utils.format("%d bestGeocode(publickey=%s,addressLine=%s,cityLine=%s) entry",
                              callId, 
                              request.params.publickey,
                              request.params.addressline,
                              request.params.cityline
                ));
  async.series({
    auth: function(callback){ 
            handleAuthentication(request, callback); 
          },
    action: function(callback){
        var ws = new WebSocket(config.socketserver);
        ws.on('open', function(){
            ws.send(JSON.stringify({Operation: 'geocode', AddressLine: request.params.addressline, CityLine: request.params.cityline}),
                     function(err){
                        if(err){
                          return callback(err, null);
                        }
                      });
          });

        ws.on('message', function(data){
          ws.close();
          return callback(null, data);
        });
      }
  },
  function(err, results){
    if(err){
      handleError(err, callId, "bestGeocode", response);
    }else{
      response.send(JSON.parse(results.action));
    }

    var endTime = process.hrtime(startTime);
    logger.verbose(Utils.format("%d bestGeocode() elapsed=%ds", callId, getElapsedTime(endTime))); 

    return next();          
  }
  );
};

// ROUTE
server.get('/v1/permissions/:publickey', getPermissions);
server.get('/v1/info/:publickey', getAccountInfo);
server.get('/v1/geocode/:publickey', bestGeocode);
server.get('/v1/query/:publickey', query)


// SERVER LAUNCH

server.listen(config.serverPort, function(){
  var listenStr = Utils.format('%s listening at %s', server.name, server.url);
  logger.notice(listenStr);
});
