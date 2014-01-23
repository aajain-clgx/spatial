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

  // Retrieves the required information from the request url, signs it with
  // the salted private key, and returns the result.
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

  // Creates a signature from the required portion of the request url and the
  // salted private key (created from the supplied salt and unsalted key). 
  // Returns true if the signature is identical to that retrieved from the 
  // original request url.
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

    // validate parameters
    if (!salt || !privateKey || !urlString) {
      parametersValid = false;
    }

    // verify that the request has a signature
    if (parametersValid) {

      matchForSignature = urlString.match(_signatureRegExp);

      if (!matchForSignature) {
        signatureFound = false;
      }
    }

    // verify that the request has a valid timestamp
    if (signatureFound) {
      timestamp = getTimestamp(urlString);
      if (!timestamp) {
        timestampValid = false;
      } else {
        var now = Math.round(Date.now()/1000);
        var diff = now - parseInt(timestamp);
        // reject requests later than now (BAD) or more than ten minutes old 
        timestampValid = (0 <= diff && diff <= 600);
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
