// client.js
//
// A simple test client for the echo server

'use strict';

var restify = require('../spatial/lib/external/restify');
var config = require('../config.js');
var authenticator = require('../spatial/lib/common/authenticator.js');
var authenticator = authenticator(config);
var urllib = require('url');


var url = 'http://localhost:' + config.serverPort;

var client = restify.createJsonClient({
  url: url
});

var restCall = function() {
  var timestamp =  Math.round(Date.now()/1000);
  var tmpurl = url + '/v1/permissions/425032B8C0FB434992F69370FED9D071?timestamp=' + timestamp;
  var signature = authenticator.getSignatureForRequest(tmpurl, '4qgCyF0qQrdyj34/g+C7dGfjJ7A=');
  tmpurl = tmpurl + '&signature=' + signature;
  var urlPath = urllib.parse(tmpurl).path;

  client.get(urlPath, function(err, req, res, obj) {
    if (err) {
      console.log(err);
    }
    console.log(JSON.stringify(obj, null, 2));
  });
};

restCall();
restCall();
restCall();
