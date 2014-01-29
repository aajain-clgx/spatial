// utils.js
//
// Utility functions for spatial.

'use strict';

function Utils() {

  var _base64 = 'base64';

  // Returns the result of replacing the string '%FOO% %BAR% %BAZ%' with
  // the strings in the items list. It doesn't care what's between the 
  // percent symbols--we recommend you put something informative in there 
  // to explain what should be substituted.
  //
  // As an additional goodie, if we find strings of the form '#FOO#', we
  // replace them with '%FOO%'. (We could do lookbehinds, but it makes
  // the resulting regular expression nasty-looking. If we ever need to 
  // do multiply nested calls to formatString, we can revisit the issue.) 
  this.formatString = function(template, items) {
    if (!template || !items || items.length === 0) {
      throw new Error('Template string and items cannot be empty');
    }
    var reg = new RegExp('%[A-Z0-9]+%', 'g');
    var matchItems = template.match(reg);
    if (!matchItems) {
      throw new Error(
        'Template \'' + template + '\' is incorrectly formatted');
    }
    if (matchItems.length !== items.length) {
      throw new Error(
        'The number of slots in the template does not match the number ' +
        'of items to fill it.');
    }
    var result = template.replace(matchItems[0], items[0]);
    for (var i = 1; i < items.length; i++) {
      result = result.replace(matchItems[i], items[i]);
    }
    var formatter = new RegExp('#(.*?)#', 'g');
    return result.replace(formatter, '%' + '$1' + '%');
  };

  this.makeBase64Safe = function(base64Encoded) {
    return base64Encoded.replace('+', '-').replace('/','_');
  };

  this.unsafeBase64 = function(safeBase64Encoded) {
    return safeBase64Encoded.replace('-', '+').replace('_', '/');
  };

  // Returns a base64 encoding of a string with '+' replaced by '-' and '/'
  // replaced by '_'.
  this.safelyUrlEncode64 = function(stringToEncode) {
    var base64Encoded = new Buffer(stringToEncode).toString(_base64);
    return this.makeBase64Safe(base64Encoded);
  };

  // Returns a decoded string from one encoded using the algorithm 
  // implemented by the safelyUrlEncode64 function.
  this.safelyUrlDecode64 = function(stringToDecode) {
    var base64Encoded = this.unsafeBase64(stringToDecode);
    return new Buffer(base64Encoded, _base64).toString();
  };
}

module.exports = new Utils();
