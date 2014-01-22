// authenticatorTest.js
// var Url = require('url');

var Authenticator = require('../lib/common/authenticator');

var simpleSigningTest = function() {
  var request = 'http://www.gisportal.com/api/spatial/location?address=123+main+' + 
    'st+boulder+co+80302&clientkey=abcdefgh';

  var privateKey = '0';
  var salt = 'foo';

  var saltedKey = Authenticator.saltKey(salt, privateKey);

  // sign the request in the approved manner
  var timestamp = Math.round(Date.now()/1000);
  request = request + '&timestamp=' + timestamp;
  var signature = Authenticator.getSignatureForRequest(request, saltedKey);
  var signedRequest = request + '&signature=' + signature;

  if (!Authenticator.validateRequest(signedRequest, salt, privateKey)) {
    console.log('simpleSigningTest failed. Signature = ' + signature + 
      ', request = ' + signedRequest);
  }
};


// this is the only test so far
simpleSigningTest();
