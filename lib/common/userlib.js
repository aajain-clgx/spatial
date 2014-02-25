// Userlib.js
// 
// Userlib returns an object with a collection of static functions that let you 
// query user property from their public key.
// For example,  you can authorize user, get account information or query usage. 
//
// Todo:
//
// 1. Create a cache object to prevent creation of permission object for every query
// 2. Test out datetime translation between MySql and Sqlite

"use strict";

var mysql = require('../external/mysql');
var sqlite3 = require('../external/sqlite3').verbose();
var async = require('../external/async');
var Exception = require('./exception.js');

var userlib = function(conf){
   
    // Private Variables 
    var _logger = conf.logger;   
    var _webusageConf = conf.webusagedb;
    var _initialized = false;

    var _sqlitedb = function(){  
      var createCmd = 'CREATE TABLE UserPermissions (UserID INTEGER PRIMARY KEY NOT NULL, ' + 
                      'Username  TEXT, UserType TEXT, PublicKey TEXT, PrivateKey TEXT, ExpirationDate INTEGER, Disabled INTEGER, ' + 
                      'PasswordChangeByDate INTEGER, LayerAccessList TEXT, FeatureAccessList TEXT, ' + 
                      'OperationAccessList TEXT, GDSAccessList TEXT, ' + 
                      'RasterAccessList TEXT,  DocAccessList TEXT, PageAccessList TEXT, AppAccessList TEXT)';
      var indexCmd = 'CREATE INDEX NameIndex on UserPermissions (UserName)';
      var indexIdCmd = 'CREATE INDEX IdIndex on UserPermissions (UserID)';
      var indexPublicKey = 'CREATE INDEX PubIndex on UserPermissions (PublicKey)';

      var db = new sqlite3.Database(':memory:');
      db.serialize(function(){
        db.run(createCmd);
        db.run(indexCmd);
        db.run(indexIdCmd);
        db.run(indexPublicKey);
      });

      return db;
    }();

    // PRIVATE Function
  
    function getPermissionFromMysql(callback){
      var connection = mysql.createConnection(_webusageConf);
      var mysqlQuery = 'SELECT UserID, Username, UserType, PublicKey, PrivateKey, ExpirationDate, Disabled, PasswordChangeByDate, ' + 
                       'LayerAccessList, FeatureAccessList, OperationAccessList, GDSAccessList, RasterAccessList, ' + 
                       'DocAccessList, PageAccessList, AppAccessList FROM userapipermissionsview';
      
      connection.query(mysqlQuery, function(err, rows){
        connection.end();
        if(err){
          return callback(new Exception.Mysql(err), null);
        }else{
          return callback(null, rows);
        }
      });
    }

    function updateCache(){
      getPermissionFromMysql(function(err, rows){
        if(err){
          _logger.error('Error from Mysql in updateCache(): ' + err);
        }else{
          async.forEach(rows, function(row, callback){
              _sqlitedb.serialize(function(){
                _sqlitedb.run('INSERT OR IGNORE INTO UserPermissions VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
                    [row.UserID, row.Username, row.UserType, row.PublicKey, row.PrivateKey, row.ExpirationDate, row.Disabled, 
                     row.PasswordChangeByDate, row.LayerAccessList, row.FeatureAccessList, row.OperationAccessList,
                     row.GDSAccessList, row.RasterAccessList, row.DocAccessList, row.PageAccessList, row.AppAccessList], 
                    function(err){
                      if(err){
                        callback(err);
                      }
                    });   
                _sqlitedb.run('UPDATE UserPermissions SET Username=?,UserType=?,PublicKey=?,PrivateKey=?,ExpirationDate=?, ' + 
                             'Disabled=?,PasswordChangeByDate=?,LayerAccessList=?,FeatureAccessList=?,OperationAccessList=?, ' + 
                             'GDSAccessList=?, RasterAccessList=?, DocAccessList=?, PageAccessList=?, AppAccessList=? WHERE UserID = ?',    
                             [row.Username, row.UserType, row.PublicKey, row.PrivateKey, row.ExpirationDate, row.Disabled, 
                              row.PasswordChangeByDate, row.LayerAccessList, row.FeatureAccessList, row.OperationAccessList,
                              row.GDSAccessList, row.RasterAccessList, row.DocAccessList, row.PageAccessList, row.AppAccessList, 
                              row.UserID],                  
                      function(err){
                        if(err){
                          callback(err);
                        }
                      }); 
              });                    
              callback(null);
            }, function(err){
                if(err){
                  _logger.error("Error inserting into sqlite from Mysql in updateCache(): " + err);
                }else{
                  _initialized = true;
                }
              });
        }
      });
    }

    function getObjectFromRow(row){
      return {
          UserID: row.UserID,
          Username: row.Username, 
          UserType: row.UserType, 
          ExpirationDate: row.ExpirationDate && new Date(row.ExpirationDate)|| '', 
          Disabled: Boolean(row.Disabled), 
          PasswordChangeByDate: row.PasswordChangeByDate,  
          LayerAccessList: (row.LayerAccessList && (row.LayerAccessList.split(',')).sort()) || [], 
          FeatureAccessList: (row.FeatureAccessList && (row.FeatureAccessList.split(',').sort())) || [], 
          OperationAccessList: (row.OperationAccessList && (row.OperationAccessList.split(',').sort())) || [], 
          GDSAccessList: (row.GDSAccessList && (row.GDSAccessList.split(',').sort()))|| [], 
          RasterAccessList: (row.RasterAccessList && (row.RasterAccessList.split(',').sort())) || [], 
          DocAccessList: (row.DocAccessList && (row.DocAccessList.split(',').sort()))|| [], 
          PageAccessList: (row.PageAccessList && (row.PageAccessList.split(',').sort()))||[], 
          AppAccessList: (row.AppAccessList && (row.AppAccessList.split(',').sort()))|| []
        
        };
    }


    // PUBLIC functions

    function getPermissions(publickey, callback){
        if(!_initialized){
       
          // Get rows directly from MySql, otherwise fetch it from local cache

          getPermissionFromMysql(function(err, rows){
            if(err){
              return callback(new Exception.Mysql(err), null);
            }else{
              var lookup={};
              for(var i=0; i < rows.length; i++){
                lookup[rows[i].PublicKey] = rows[i];
              }
              if(lookup[publickey] === undefined){
                return callback(new Exception.UserNotFound(publickey), null);
              }else{
                return callback(null, getObjectFromRow(lookup[publickey]));
              }
            }

          });
        }else{
          // Get it from Sqlite
          _sqlitedb.all("SELECT * from  UserPermissions where PublicKey = ?", publickey, function(err, rows){
            if(err){
              return callback(new Exception.Sqlite(err), null);
            }else{
              if(rows.length === 0){
                return callback(new Exception.UserNotFound(publickey), null);
              }else{
                return callback(null, getObjectFromRow(rows[0]));
              }                    
            }
            
          });
    
        }
      }             
      
    function getAccountInfo(publickey, callback){
      var connection = mysql.createConnection(_webusageConf);
      var mysqlQuery = 'CALL GetUserAccountInfoForNodeUser(?)'; 
      
      connection.query(mysqlQuery, [publickey],  function(err, rows){
        connection.end();
        if(err){
          return callback(new Exception.Mysql(err), null);
        }else{
          if(rows[0].length === 0){
            return callback(new Exception.UserNotFound(publickey), null);
          }else{
            return callback(null, rows[0]);
          }
        }
      });
    }


    // Before returning, setup timer for updating cache.
    // setup one timer to execute immediately, and one to execute at every interval

    setTimeout(updateCache, 0);
    setInterval(updateCache, conf.permissionsCacheTimeMS);

    // Return userlib object

    return {
      getAuthToken: getPermissions,
      getAccountInfo: getAccountInfo
        
    };
      

  };


module.exports = userlib;
    
// Testing code
//
//var conf = require('../../../config.js');
//var user = userlib(conf);
//user.getAuthToken('425032B8C0FB434992F69370FED9D071', function(err, permission){
//    console.log(permission);
//  });
//setTimeout(function(){
//user.getAuthToken('425032B8C0FB434992F69370FED9D071', function(err, permission){
//    console.log(permission);
//  });
//}, 50000);
//user.getAccountInfo('425032B8C0FB434992F69370FED9D071', function(err, info){
//  console.log('testing getAccountInfo');
//  console.log('info = ' + info);
//  console.log(err);
//});
