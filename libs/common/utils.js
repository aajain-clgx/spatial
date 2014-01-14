// utils.js
//
// Utility functions for spatial.

var utils = function() {

  return  {

    // Returns the result of replacing the string '%FOO% %BAR% %BAZ%' with
    // the strings in the items list. It doesn't care what's between the 
    // percent symbols--we recommend you put something informative in there 
    // to explain what should be substituted.
    //
    // As an additional goodie, if we find strings of the form '#FOO#', we
    // replace them with '%FOO%'. (We could do lookbehinds, but it makes
    // the resulting regular expression nasty-looking. If we ever need to 
    // do multiply nested calls to formatString, we can revisit the issue.) 
    formatString: function(template, items) {
      if (!template || !items || items.length == 0) {
        throw new Error('Template string and items cannot be empty');
      }
      var reg = new RegExp('\%[A-Z0-9]+\%', 'g');
      var matchItems = template.match(reg);
      if (!matchItems) {
        throw new Error(
          'Template \'' + template + '\' is incorrectly formatted');
      }
      console.log(template);
      if (matchItems.length !== items.length) {
        throw new Error(
          'The number of slots in the template does not match the number ' +
          'of items to fill it.');
      }
      var result = template.replace(matchItems[0], items[0]);
      for (var i = 1; i < items.length; i++) {
        result = result.replace(matchItems[i], items[i]);
      }
      var formatter = new RegExp('\#(.*?)\#', 'g');
      return result.replace(formatter, '%' + '$1' + '%')
    }
  };
}();

module.exports = utils;
