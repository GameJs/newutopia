/**
 * @fileoverview ringo build script; turns tmx data into a json file
 */
var {read, write} = require('fs');

var mapId = '02';

var lines = read('map' + mapId +'.tmx').split('\n');
var mapStartIdx = -1;
var out = [];

lines.forEach(function(l, idx) {
   if (l === '</data>') {
      mapStartIdx = -1;
   };
   if (mapStartIdx > -1) {
      var cols = l.split(',');
      cols.forEach(function(value, cidx) {
         if (value === '1') {
            out.push([cidx, idx - mapStartIdx]);
         }
      });
   };
   if (l === '  <data encoding="csv">') {
      mapStartIdx = idx+1;
   }
});

write('maps/map' + mapId + '.js', 'exports.cells = ' + out.toSource() + ';');
