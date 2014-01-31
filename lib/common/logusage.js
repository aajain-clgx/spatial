<<<<<<< HEAD
"use strict";
var mysql = require('../external/mysql');
var async = require('../external/async');
var Exception = require("./exception.js");
=======
'use strict';
var mysql = require('mysql');
var async = require('async');
var Exception = require('./exception.js');
>>>>>>> e845e11649d1a2d692a33eb3253ac2ca7df398c3
              

var LogUsage = function (conf){

	// public members			
	this.connectionConf = conf.connectionConf;      

	// private members
	var cache = {machine:{}, users:{}, application:{}, operation:{}, datasource:{} };
	var that = this;
  var usageRecords = [];
  
  // set up timer function for MysqlInsert
  setInterval(InsertMysql, 2000);

	function getID(name, type, callback){
		var queryMap = {};

		switch(type){
			case 'user': 
        queryMap = {query:'CALL GetUserID(?);', cacheMap: cache.users};
				break;
			case 'application':
				queryMap = {query:'CALL GetApplicationID(?)', cacheMap:cache.application};
				break;
			case 'operation':
				queryMap = {query:'CALL GetOperationID(?)', cacheMap:cache.operation};
				break;
			case 'machine':
				queryMap = {query: 'CALL GetMachineID(?)', cacheMap: cache.machine};
				break;
			case 'datasource':
				queryMap = {query: 'CALL GetDataSourceID(?)', cacheMap: cache.datasource};
				break;
    }

		if(queryMap.cacheMap[name] === undefined){

			var connection = mysql.createConnection(that.connectionConf);

			connection.query(queryMap.query, [name], function(err, rows){				
					connection.end();
					if(err){
						return callback(Exception.Factory.getMysqlException(err), null);            
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
    if(usageRecords.length > 0){
      console.log('insde insertmysql');
      var connection = mysql.createConnection(that.connectionConf);
      var insertMysql = 'INSERT INTO `UsageLog`.`Log` (LogTime, UserID, MachineID, ApplicationID, ' +  
                        'OperationID, DataSourceID, OpCount, AvgExecTimeMS, IPAddress) VALUES ?'; 
      connection.query(insertMysql, [usageRecords], function(err){
        connection.end();
        if(err){
          console.log(Exception.Factory.getMysqlException(err));
        }else{
          usageRecords.length = 0;
        }
      });
    }    
  }
  

  this.RecordUsage = function(logtime, username, machine, application, operation, datasource, opcount, avgtimems, ipaddress){
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
                  if(err instanceof Exception.MySqlFatal){
                    console.log('fatal mysql exception , log to sqlite' + err);				
                  }else if (err instanceof Exception.MySqlNonFatal){
                    console.log('non fatal mysql exception, report to user' + err);
                  }			
								}else{
                  // Lets insert into array.
                  usageRecords.push([logtime, result[0], result[1], result[2], 
                    result[3], result[4], opcount, avgtimems, ipaddress]);
                  console.log(usageRecords);
								}
							}
        );
      };
};

module.exports = LogUsage;
