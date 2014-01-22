// authenticator.js
//
// Implements the HMAC signing algorithm our clients must use to
// sign their requests, and validates requests from clients by 
// signing their requests and comparing them to the signatures 
// they provide.

var Crypto = require('crypto');
var Url = require('url');
var Utils = require('./utils');

function Authenticator() {

  var _signatureRegExp = new RegExp('&{0,1}signature=[^&]+');
  var _signatureReplaceRegExp = new RegExp('&{0,1}signature=');
  var _timestampRegExp = new RegExp('&{0,1}timestamp=[0-9]+');
  var _algorithm = 'sha1';
  var _encoding = 'base64';

  var getTimestamp = function(urlString) {
    var timestamp = null;
    var tsRegex = new RegExp(_timestampRegExp);
    var timestampMatch = urlString.match(tsRegex);
    if (timestampMatch) {
      timestamp = timestampMatch.toString().split('=')[1];
    }
    return timestamp;
  };

  this.saltKey = function(salt, key) {
    // create the salted key used to sign the urlString
    var sha1 = Crypto.createHash(_algorithm);
    sha1.setEncoding(_encoding);
    sha1.write(key + salt);
    sha1.end();
    return sha1.read();
  };

  this.cleanUrl = function(requestUrl) {
    return requestUrl.replace(_timestampRegExp, '').replace(_signatureRegExp, '');
  };

  // Returns the requestUrl appended with the timestamp and signature.
  this.getSignatureForRequest = function(requestUrl, saltedKey) {
    var hmac = Crypto.createHmac(_algorithm, saltedKey);
    var url = Url.parse(requestUrl);
    var signable = url.pathname;
    hmac.setEncoding(_encoding);
    hmac.write(signable);
    hmac.end();

    // the hmac stream returns a standard base64 encoding
    // that we neet to make safe for putting into a url
    return Utils.safelyUrlEncode64(hmac.read());
  };

  // Creates a signature from the signature-truncated requestUrl, the salt,
  // and the privateKey. Returns true if the signature is identical to 
  // that retrieved from the original requestUrl.
  this.validateRequest = function(urlString, salt, privateKey) {

    // This function has four stages.
    //   1. Validate parameters.
    //   2. Verify that the request has a signature.
    //   3. Verify that the request has a valid timestamp.
    //   4. Check the signature against one created from the urlString, the
    //      timestamp, and the salted key.
 
    var parametersValid = true;
    var signatureFound = true;
    var timestampValid = true;
    var requestValid = false;

    var matchForSignature = null;
    var timestamp = null;

    // verify parameters
    if (!salt || !privateKey || !urlString) {
      parametersValid = false;
    }
    if (parametersValid) {

      // create the signature and compare to the extracted signature
      matchForSignature = urlString.match(_signatureRegExp);

      // reject the absence of a signature
      if (!matchForSignature) {
        signatureFound = false;
      }
    }

    // verify the timestamp
    if (signatureFound) {

      // create a Date from the timestamp (understood as seconds since Epoch)
      timestamp = getTimestamp(urlString);
      var requestDate = new Date(0);
      requestDate.setUTCSeconds(timestamp);

      // reject invalid timestamps, including those more than an hour earlier 
      // than now
      var nowUTCHours = new Date().getUTCHours();
      var requestUTCHours = requestDate.getUTCHours();
      var diff = nowUTCHours - requestUTCHours;
      if (diff < 0 || diff > 1) {
        timestampValid = false;
      }
    }

    // check the signature
    if (timestampValid) {
      // create the salted key used to sign the urlString
      var saltedKey = this.saltKey(salt, privateKey);
      var signature = matchForSignature.toString().split(_signatureReplaceRegExp)[1];
      var url = Url.parse(urlString);
      var urlPath = url.path.replace(_signatureRegExp, '');
      var freshSignature = this.getSignatureForRequest(urlPath, saltedKey);
      requestValid = freshSignature === signature;
    }
    return requestValid;
  };
}

module.exports = new Authenticator();
