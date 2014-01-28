// authenticatorTest.js
// var Url = require('url');

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
  var requestUrl = 'http://www.gisportal.com/api/spatial/location?address=123+main+' + 
    'st+boulder+co+80302&clientkey=abcdefgh&timestamp=' + timestamp.toString();
  for (var i = 0; i < keyMap.length; i++) {
    var signature = Authenticator.getSignatureForRequest(requestUrl, keyMap[i].salted);
    var signedRequest = requestUrl + '&signature=' + signature;
    var valid = Authenticator.validateRequest(signedRequest, salt, keyMap[i].unsalted);
    test.ok(valid, 'Expected validly signed request url');
  }
  test.done();
};

// Authenticator.validateRequest invalidates bad timestamps

// Authenticator.validateRequest invalidates incorrect signatures

// Authenticator.validateRequest invalidates changed urls


