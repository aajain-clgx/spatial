// status.js
//
// Defines Server Response status code

'use strict';

var Enum = require('../external/enum');

module.exports = new Enum(['OK', 'AUTHENTICATION_FAILURE', 'ARGUMENTS_INVALID', 'SERVER_ERROR']);
