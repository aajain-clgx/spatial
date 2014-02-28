// utils.js

'use strict';

/** 
* Returns a static object with various utility functions
* @class utils 
*/

function utils() {

  var _base64 = 'base64';
  var _that = {};

  /**
  * Makes Base64 string safe for URL
  * @param {String} base64Encoded Base64 encoded string
  * @return {String} Returns Base64 string safe for URL
  */

  _that.makeBase64Safe = function(base64Encoded) {
    return base64Encoded.replace('+', '-').replace('/','_');
  };

  /**
  * Gets Base64 string from URL safe Base64 string
  * @param {String} safeBase64Encoded URL safe base64 encoded string
  * @return {String} Returns raw Base64 string
  */

  _that.unsafeBase64 =  function(safeBase64Encoded) {
    return safeBase64Encoded.replace('-', '+').replace('_', '/');
  };

  /**
  * Returns a base64 encoding of a string with '+' replaced by '-' and '/' replaced by '_'.
  * @param {String} stringToEncode Raw string to be encoded
  * @return {String} Returns URL safe Base64 encoded string
  */
    
  _that.safelyUrlEncode64 = function(stringToEncode) {
    var base64Encoded = new Buffer(stringToEncode).toString(_base64);
    return this.makeBase64Safe(base64Encoded);
  };

  /**
  * Returns string from Base64 encoded string.
  * @param {String} stringToDecode Base64 URL safe string to be decoded
  * @return {String} Returns decoded raw string
  */

  _that.safelyUrlDecode64 =  function(stringToDecode) {
    var base64Encoded = this.unsafeBase64(stringToDecode);
    return new Buffer(base64Encoded, _base64).toString();
  };

  return _that;

}

module.exports = utils();
