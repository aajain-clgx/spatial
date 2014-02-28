// clientlib.js

'use strict';
var url = require('url');
var crypto = require('crypto');

function clientlib(privatekey, serviceBaseURL){

  var serviceUrl = url.parse(serviceBaseURL);
  var _sigRegExp = new RegExp('&{0,1}signature=[^&]+');
  var _tsRegExp = new RegExp('&{0,1}timestamp=[0-9]+');
  var _algorithm = 'sha1';
  var _encoding = 'base64';
  
  return{

    getPathWithSignature: function(urlPath){
    
      var baseURL = serviceUrl.protocol + '//' + serviceUrl.host; 
      var path = urlPath.replace(_tsRegExp, '').replace(_sigRegExp, '');
      var timestamp = Math.round(Date.now()/1000);
      var fullURL;
      
      // Get clean URL 
      if(path.indexOf('/') !== 0){
        fullURL = baseURL + '/' + path;
      }else{
        fullURL = baseURL + path;
      }
  
      // Append TimeStamp
      if(fullURL.indexOf('?') === -1){
        fullURL = fullURL + '?timestamp=' + timestamp;
      }else{
        fullURL = fullURL + '&timestamp=' + timestamp;
      }

      // Append Signature
      var hmac =crypto.createHmac(_algorithm, privatekey);
      var fullURLObj = url.parse(fullURL);
      var signable = fullURLObj.path;
      hmac.setEncoding(_encoding);
      hmac.write(signable);
      hmac.end();
      
      var base64Encoded = new Buffer(hmac.read()).toString(_encoding);
      var signature = base64Encoded.replace('+', '-').replace('/','_');
      
      fullURL = fullURL + "&signature=" + signature;

      return url.parse(fullURL);
    }
  };
}

module.exports = clientlib;

