// authenticator.js
//
// Implements the HMAC signing algorithm our clients must use to
// sign their requests, and validates requests from clients by 
// signing their requests and comparing them to the signatures 
// they provide.

'use strict';

var Crypto = require('crypto');
var Url = require('url');
var Utils = require('./utils');
var exception = require('./exception.js');

function Authenticator(conf) {

  var _sigRegExp = new RegExp('&{0,1}signature=[^&]+');
  var _sigReplaceRegExp = new RegExp('&{0,1}signature=');
  var _tsRegExp = new RegExp('&{0,1}timestamp=[0-9]+');
  var _algorithm = 'sha1';
  var _encoding = 'base64';
  var _salt = conf.salt;
  var _that = {};


  var getTimestamp = function(urlString) {
    var timestamp = null;
    var tsRegex = new RegExp(_tsRegExp);
    var timestampMatch = urlString.match(tsRegex);
    if (timestampMatch) {
      timestamp = timestampMatch.toString().split('=')[1];
    }
    return timestamp;
  };

  // Returns the base64-encoded sha1 hash of the concatenation of
  // the specified key with the specified salt.
  _that.saltKey = function(key, salt) {
    var sha1 = Crypto.createHash(_algorithm);
    sha1.setEncoding(_encoding);
    sha1.write(key + salt);
    sha1.end();
    return sha1.read();
  };

  // A utility function removing the timestamp and signature from a request.
  _that.cleanUrl = function(requestUrl) {
    return requestUrl.replace(_tsRegExp, '').replace(_sigRegExp, '');
  };

  // Retrieves the required information from the request url, signs it with
  // the salted private key, and returns the result.
  _that.getSignatureForRequest = function(requestUrl, saltedKey) {
    var hmac = Crypto.createHmac(_algorithm, saltedKey);
    var url = Url.parse(requestUrl);
    var signable = url.path;
    hmac.setEncoding(_encoding);
    hmac.write(signable);
    hmac.end();

    // the hmac stream returns a standard base64 encoding
    // that we neet to make safe for putting into a url
    return Utils.safelyUrlEncode64(hmac.read());
  };

  // Validates the signature generated from the required portion of the
  // request url, the specified private key, and the specified salt is 
  // identical to that retrieved from the original request url.
  
  _that.validateRequest = function(request, privateKey, callback) {

    // This function has four stages.
    //   1. Verify that the request has a valid timestamp.
    //   2. Check the signature against one created from the urlString, the
    //      timestamp, and the salted key.
 
    var timestampValid = false;
    var requestValid = false;
    var timestamp = null;

    timestamp = getTimestamp(request.url);
    if (timestamp) {
      var now = Math.round(Date.now()/1000);
      var diff = now - parseInt(timestamp);
      // reject requests later than now (BAD) or more than ten minutes old 
      timestampValid = (0 <= diff && diff <= 600);

      if(!timestampValid){
        return callback(new exception.InvalidTimestamp(), null);
      }
    }
    
    // create the salted key used to sign the urlString
    var saltedKey = this.saltKey(privateKey, _salt);
    var url = Url.parse(request.url);
    var urlPath = url.path.replace(_sigRegExp, '');
    var freshSignature = this.getSignatureForRequest(urlPath, saltedKey);
    requestValid = freshSignature === request.query.signature;
    if(!requestValid){
      return callback(new exception.SignatureMismatch(), null);
    }else{
      return callback(null, true);
    }
  };

  return _that;
}

module.exports = Authenticator;
