// logginglevels.js
//
// A special enumeration for the logger

var Enum = require('../external/enum');

// OFF is highest--this looks funny, but simplifies coding
var LoggingLevels = new Enum(['VERBOSE', 'NOTICE', 'WARNING', 'ERROR', 'CRITICAL', 'OFF']);

module.exports = LoggingLevels;
