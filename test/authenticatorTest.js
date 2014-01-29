// authenticatorTest.js
// var Url = require('url');

'use strict';

var Authenticator = require('../lib/common/authenticator');

var salt = '0123456789abcdef';

// a list pairing unsalted keys with their salted versions, 
// using the sha1 algorithm and a base64 encoding
var keyMap = [
  {
    unsalted: 'hnnbjll3di',
    salted: 'eGPBEA7/JidftCpl56VJSqTFWq8=' 
  },
  {
    unsalted: 'guf0tfbt9',
    salted: 'j4zl5REcHD2PynjjKTeNMA3fXAc=' 
  },
  {
    unsalted: '9rre6fxbt9',
    salted: 'wxhqON1lJlpBLykJaXCVGnzBN+U=' 
  },
  {
    unsalted: '28v276i529',
    salted: '3abJKCZ2+iYYYWGKrWjGmruGypg=' 
  },
  {
    unsalted: 'tjik65hfr',
    salted: 'uAYpfCY9ScTiVLyBA1yTdO4zIm0=' 
  },
  {
    unsalted: 'jux2m7k3xr',
    salted: '4qgCyF0qQrdyj34/g+C7dGfjJ7A=' 
  },
  {
    unsalted: 'jsjrybvs4i',
    salted: 'bVis8HPWaP3mEi48PMLa4PW+3To=' 
  },
  {
    unsalted: 'gkvcgnwmi',
    salted: '0RKx/suYxhsyZx0ZMSyrUrbYr7U=' 
  },
  {
    unsalted: 'cdtxa8aor',
    salted: '9/lxXmk5ycuD0Vt8dyLPcQxi93k=' 
  },
  {
    unsalted: 'p1cibpgb9',
    salted: 'DnmfyScJXcfV06vc28k+52Nvz/c='
  }
];

var requestUrlNeedingTimestamp = 
  'http://www.gisportal.com/api/spatial/location?address=123+main+' + 
    'st+boulder+co+80302&clientkey=abcdefgh&timestamp=';

var signRequest = function(requestUrl, timestamp, saltedKey) {
  var signable = Authenticator.cleanUrl(requestUrl);
  var signature = Authenticator.getSignatureForRequest(requestUrl, saltedKey);
  return signable + '&timestamp=' + timestamp + '&signature=' + signature;
};

// Authenticator.saltKey generates correctly salted key
exports.saltKey = function(test) {

  for (var i = 0; i < keyMap.length; i++) {
    test.equal(keyMap[i].salted, Authenticator.saltKey(keyMap[i].unsalted, salt));
  }
  test.done();
};

// Authenticator.getSignatureForRequest generates valid signature
// Authenticator.validateRequest validates correct signatures
exports.getSignatureForRequest = function(test) {
  var timestamp = Math.round(Date.now()/1000);
  var latest = timestamp - 600;
  var requestUrl = requestUrlNeedingTimestamp + timestamp.toString();
  var latestRequestUrl = requestUrlNeedingTimestamp + latest.toString();
  for (var i = 0; i < keyMap.length; i++) {
    var signature = Authenticator.getSignatureForRequest(requestUrl, keyMap[i].salted);
    var signedRequest = requestUrl + '&signature=' + signature;
    var latestSignedRequest = latestRequestUrl + '&signature=' + signature;
    var valid = Authenticator.validateRequest(signedRequest, salt, keyMap[i].unsalted);
    test.ok(valid, 'Expected validly signed request url');
    valid = Authenticator.validateRequest(latestSignedRequest, salt, keyMap[i].unsalted);
    test.ok(valid, 'Expected validly signed request url');
  }
  test.done();
};

// Authenticator.validateRequest invalidates bad timestamps
exports.validateRequestBadTimestamp = function(test) {
  var earlier = Math.round(Date.now()/1000) - 601;
  var later = Math.round(Date.now()/1000) + 1;
  var requestUrl = requestUrlNeedingTimestamp + earlier;
  for (var i = 0; i < keyMap.length; i++) {
    var earlierSignedRequest = signRequest(requestUrl, earlier, keyMap[i].salted);
    var earlierValid = Authenticator.validateRequest(earlierSignedRequest, salt, keyMap[i].unsalted);
    test.ok(!earlierValid, 'Expected invalid request');
    var laterSignedRequest = signRequest(requestUrl, later, keyMap[i].salted);
    var laterValid = Authenticator.validateRequest(laterSignedRequest, salt, keyMap[i].unsalted);
    test.ok(!laterValid, 'Expected invalid request');
  }
  test.done();
};

// Authenticator.validateRequest invalidates incorrect signatures
exports.validateRequestBadSignature = function(test) {
  var requestUrl = requestUrlNeedingTimestamp + Math.round(Date.now()/1000).toString();
  for (var i = 0; i < keyMap.length; i++) {
    var shortSignature = Authenticator.getSignatureForRequest(requestUrl, keyMap[i].salted).substring(1);
    var shortSignedRequest = requestUrl + '&signature=' + shortSignature;
    var valid = Authenticator.validateRequest(shortSignedRequest, salt, keyMap[i].unsalted);
    var emptySignedRequest = requestUrl + '&signature=';
    valid = Authenticator.validateRequest(emptySignedRequest, salt, keyMap[i].unsalted);
    var longSignature = Authenticator.getSignatureForRequest(requestUrl, keyMap[i].salted) + '===';
    var longSignedRequest = requestUrl + '&signature=' + longSignature;
    valid = Authenticator.validateRequest(longSignedRequest, salt, keyMap[i].unsalted);
    test.ok(!valid, 'Expected invalidly signed request url');
  }
  test.done();
};
