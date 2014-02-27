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

// MissingParameter Error
// Description: Thrown if a URL query string parameter is missing
// Severity: NonFatal

function MissingParameter(parameter){
  this.status = status.ARGUMENTS_INVALID.toString();
  this.name = 'ParametersMissing';
  this.message = 'Could not find paramters:"' + parameter + '" in URL';
}

MissingParameter.prototype = new Error();
MissingParameter.prototype.constructor = MissingParameter;

// InvalidParameter Error
// Description: Thrown if the URL query string parameter does not meet exected type
// Severity: NonFatal

function InvalidParameter(parameter){
  this.status = status.ARGUMENTS_INVALID.toString();
  this.name='InvalidArgument';
  this.message = 'Value of the parameter:"' + parameter + '" is invalid';
}
InvalidParameter.prototype = new Error();
InvalidParameter.prototype.constructor = InvalidParameter;

// InvalidTimestamp Error
// Description: Thrown if the timestamp paramter is more than 10 minutes old
// Severity: NonFatal

function InvalidTimestamp(){
  this.status = status.ARGUMENTS_INVALID.toString();
  this.name='InvalidTimestamp';
  this.message = 'The request is more than 10 minute old';
}

InvalidTimestamp.prototype = new Error();
InvalidTimestamp.prototype.constructor = InvalidTimestamp;


// SignatureMismatch
// Description: Thrown if the signature does not match with computed signature
// 

function SignatureMismatch(){
  this.status = status.ARGUMENTS_INVALID.toString();
  this.name='SignatureMimatch';
  this.message = 'The signature of the request cannot be verified. Either you have invalid key or your request has been tampered with.';
}

SignatureMismatch.prototype = new Error();
SignatureMismatch.prototype.constructor = SignatureMismatch;


// Mysql Error
// Description: Thrown by Mysql-node when encountering exception with MySql
// Severity: Depends on fatal parameter

function Mysql(mysqlError){
  this.status = mysqlError.fatal ? status.SERVER_ERROR.toString(): status.ARGUMENTS_INVALID.toString();
  this.fatal = mysqlError.fatal;
  this.code = mysqlError.code;
  this.name = mysqlError.name;
  this.message = mysqlError.message;
}
Mysql.prototype = new Error();
Mysql.prototype.constructor = Mysql;


// Sqlite Error
// Description: Thrown when interacting with local Sqlite cache for Mysql
// Severity: Fatal, affects user functionality

function Sqlite(err){
  this.status = status.SERVER_ERROR.toString();
  this.name = err.name;
  this.message = err.message;
}
Sqlite.prototype = new Error();
Sqlite.prototype.constructor = Sqlite;

var Exception = {
    UserNotFound: UserNotFound,
    MissingParameter: MissingParameter,
    InvalidTimestamp: InvalidTimestamp,
    SignatureMismatch: SignatureMismatch,
    InvalidParameter: InvalidParameter,
    Mysql: Mysql,
    Sqlite: Sqlite
  };

module.exports = Exception;
