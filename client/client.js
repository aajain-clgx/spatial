// client.js
//
// A simple test client for the echo server

'use strict';

var restify = require('../spatial/lib/external/restify');
var config = require('../config.js');

var client = restify.createJsonClient({
  url: 'http://localhost:' + config.serverPort + '/echo/sourgrapes'
});
var restCall = function() {
  client.get('', function(err, req, res, obj) {
    if (err) {
      console.log(err);
    }
    console.log(JSON.stringify(obj, null, 2));
  });
};

restCall();
restCall();
restCall();
