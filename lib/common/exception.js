// General object for throwing Exceptions
// Includes a Factory object inside to generate correct exception type


'use strict';

var Exception = {

	MySqlFatal : function(mysqlError){
    this.code = mysqlError.code;
    this.isFatal = mysqlError.fatal;
    this.message = mysqlError.message;
    this.fileName = mysqlError.fileName;
    this.lineNumber = mysqlError.lineNumber;
  },

	MySqlNonFatal: function(mysqlError){
    this.code = mysqlError.code;
    this.isFatal = mysqlError.fatal;
    this.message = mysqlError.message;
    this.fileName = mysqlError.fileName;
    this.lineNumber = mysqlError.lineNumber;
	},

	Factory : {
		getMysqlException : function(mysqlError){
        return mysqlError.fatal ? new Exception.MySqlFatal(mysqlError): new Exception.MySqlNonFatal(mysqlError);
      }
  }
};

module.exports = Exception;
