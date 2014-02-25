//Logusage.js
//
// Insert usage records into usagelog db async.

"use strict";

var mysql = require('../external/mysql');
var async = require('../external/async');
var Exception = require("./exception.js");

var LogUsage = function (conf){

	// PRIVATE members
	var _cache = { machine:{}, users:{}, application:{}, operation:{}, datasource:{} };
  var _usageRecords = [];
  var _logger = conf.logger;  

  // PRIVATE functions
  
	function getID(name, type, callback){
		var queryMap = {};

		switch(type){
			case 'user': 
        queryMap = {query:'CALL GetUserID(?);', cacheMap: _cache.users};
				break;
			case 'application':
				queryMap = {query:'CALL GetApplicationID(?)', cacheMap:_cache.application};
				break;
			case 'operation':
				queryMap = {query:'CALL GetOperationID(?)', cacheMap:_cache.operation};
				break;
			case 'machine':
				queryMap = {query: 'CALL GetMachineID(?)', cacheMap: _cache.machine};
				break;
			case 'datasource':
				queryMap = {query: 'CALL GetDataSourceID(?)', cacheMap: _cache.datasource};
				break;
    }

		if(queryMap.cacheMap[name] === undefined){

			var connection = mysql.createConnection(conf.usagedb);

			connection.query(queryMap.query, [name], function(err, rows){				
				connection.end();
				if(err){
					return callback(new Exception.Mysql(err), null);            
				}

        var rowResult = rows[0][0];
        var fieldName = Object.getOwnPropertyNames(rowResult)[0];
				var id = rowResult[fieldName];
				queryMap.cacheMap[name] = id;
				return callback(null, id);					
			});
		}
		else{
			process.nextTick(function(){
        callback(null, queryMap.cacheMap[name]);
      });
		}

	}

  function InsertMysql(){
    // Insert the data from usageRecords into MySql 
    if(_usageRecords.length > 0){
      _logger.verbose('Inserting usagelog.log records. Counts = ' + _usageRecords.length);
      var connection = mysql.createConnection(conf.usagedb);
      var insertMysql = 'INSERT INTO `UsageLog`.`Log` (LogTime, UserID, MachineID, ApplicationID, ' +  
                        'OperationID, DataSourceID, OpCount, AvgExecTimeMS, IPAddress) VALUES ?'; 
      connection.query(insertMysql, [_usageRecords], function(err){
        connection.end();
        if(err){
          _logger.error('Error inserting usagelog.log records: ' + err);              
        }else{
          _usageRecords.length = 0;
        }
      });
    }    
  }
  
  // set up timer function for MysqlInsert
  setInterval(InsertMysql, conf.usageInsertTimeMS);

  // PUBLIC Object

  return{

    recordUsage : function(logtime, username, machine, application, operation, datasource, 
                           opcount, avgtimems, ipaddress){
        datasource.sort();
        // Get values of all IDs
        async.parallel([
          function(callback){ getID(username, 'user', callback);},
          function(callback){getID(machine, 'machine', callback);},
          function(callback){getID(application, 'application', callback);},
          function(callback){getID(operation, 'operation', callback);},
          function(callback){getID(datasource.join('|'), 'datasource', callback);}
				], function(err, result){
                if(err){
                  if(err instanceof Exception.MySql){
                    if(err.fatal){
                      _logger.error('Fatal mysql exception: '  + err);				
                    }else{
                      _logger.verbose('Non fatal mysql exception:' + err);
                    }
                  }			
								}else{
                  // Lets insert into array.
                  _usageRecords.push([logtime, result[0], result[1], result[2], 
                    result[3], result[4], opcount, avgtimems, ipaddress]);
								}
							}
        );
      }
  };
};

module.exports = LogUsage;
