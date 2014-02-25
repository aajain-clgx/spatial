// General object for throwing Exceptions
// Includes a Factory object inside to generate correct exception type


'use strict';

var status = require('./status.js');

// UserNotFound Error
// Descripton: Thrown if user is not found
// Severity: NonFatal

function UserNotFound(publicKey){
  this.status = status.ARGUMENTS_INVALID.toString();  
  this.name = 'UserNotFound';
  this.message = 'No user found with key: ' + publicKey;
}
UserNotFound.prototype = new Error();
UserNotFound.prototype.constructor = UserNotFound;

function Mysql(mysqlError){
  this.status = mysqlError.fatal ? status.SERVER_ERROR.toString(): status.ARGUMENTS_INVALID.toString();
  this.fatal = mysqlError.fatal;
  this.code = mysqlError.code;
  this.name = mysqlError.name;
  this.message = mysqlError.message;
}
Mysql.prototype = new Error();
Mysql.prototype.constructor = Mysql;

function Sqlite(err){
  this.status = status.SERVER_ERROR.toString();
  this.name = err.name;
  this.message = err.message;
}


var Exception = {
    UserNotFound: UserNotFound,
    Mysql: Mysql,
    Sqlite: Sqlite
  };

module.exports = Exception;
