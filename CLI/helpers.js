/**
* @module helpers
*/
var fs = require('fs');
var yaml = require('../node_modules/js-yaml');

/**
* Function that reads the lifter.yml file
* @function
* @memberof module:helpers
* 
*/

exports.readYAML = function() {
  var content = fs.readFileSync('lifter.yml', {encoding: 'utf-8'});
  return yaml.safeLoad(content);
}