// client.js
//
// A simple test client for the echo server

var restify = require('./lib/external/restify');

var client = restify.createJsonClient({
  url: 'http://localhost:8080/echo/sourgrapes'
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
