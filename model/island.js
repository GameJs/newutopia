var gamejs = require('gamejs');
var accessors = require('gamejs/utils/objects').accessors;
var objects = require('gamejs/utils/objects');

var UNIT_TYPES = require('./unit').TYPES;
var Unit = require('./unit').Unit;

// FIXME multiple map super not working
var mapCells = require('../maps/map02').cells;

var DIRS = [
   [-1,-1],
   [1,1],
   [-1,1],
   [1,-1]
   [-1,0],
   [0,-1],
   [1,0],
   [0,1],
];


exports.Island = Island;

/**
 * Island
 */
function Island() {

   /**
    * step month
    */
   this.nextMonth = function() {
      var result = {remove: []};
      var oldCount = this.populationCount;
      this.populationCount += parseInt((oldCount / 100) * this.census.birthRate, 10);
      this.populationCount -= parseInt((oldCount / 100) * this.census.deathRate, 10);

      // kill crop after a while
      this.units = this.units.filter(function(u) {
         u.age++;
         if (u.type === 'crop' && u.age > 25 + (10 * Math.random())) {
            result.remove.push(u);
            return false;
         }
         return true;
      });
      return result;
   };

   /**
    * step year
    */
   this.nextYear = function() {
      // TODO influence of rebels! either less gold or less produtivity or so?
      this.goldCount += parseInt((this.census.productivity  * this.count['factory']) + this.fishingCount +
         (this.census.productivity * (this.census.total / 600))
      );
      return;
   };

   /**
    * this.census = {};
    * birthrate, deathrate per 100 per month
    */
   function getCensus() {
      var total = self.populationCount;
      var unhappy = total - self.count['housing'] * 500 - self.count['school'] * 100;
      var hungry = total - (self.count['crop'] * 500) - (self.fishingCount * 500);
      var productivity = 4 + self.count['school'] + self.count['hospital'] * 2;
      var harmony = 3;
      if (unhappy > 0) harmony--;
      if (hungry > 0) harmony--;
      // TODO: productivity should influence harmony, but how?
      return {
         total: self.populationCount,
         birthRate: 3 + 2 * (self.count['hospital'] - self.count['factory']),
         deathRate: 3 + (hungry / 100) + (unhappy / 200),
         unhappy: unhappy,
         hungry: hungry,
         productivity: productivity,
         harmony: harmony
      }
   };

   /**
    * accessors
    */
   accessors(this, {
      census: {
         get: getCensus
      },
      count: {
         get: getCounts
      },
      dock: {
         get: function() {
            var possibleDocks = this.units.filter(typeFilterFn('dock'));
            return possibleDocks.length > 0 ? possibleDocks[0] : null;
         }
      }
   });

   this.serialize = function() {
      return {
         cells: this.cells
      };
   };

   this.dataSerialize = function() {
      return {
         harmony: this.census.harmony,
         gold: this.goldCount,
         population: this.populationCount
      }
   };

   /**
    * @returns a filter() function that filters on given 'type' property
    */
   function typeFilterFn(type) {
      return function(a) {
         return a.type === type;
      };
   };
   /**
    * this.count = {}
    */
   function getCounts() {
      var result = {};
      UNIT_TYPES.forEach(function(key) {
         result[key] = self.units.filter(typeFilterFn(key)).length;
      });
      return result;
   };

   /**
    * add unit
    */
   this.add = function(type, cell) {
      if (UNIT_TYPES.indexOf(type) == -1) {
         throw new Error('Island.add() unknown add type', type);
      }
      unit = new Unit({
         type: type,
         cell: cell,
         age: 0
      });
      this.units.push(unit);
      return {
         add: [unit],
         remove: [],
         move: [],
      };
   };

   /**
    * return random cell on island
    */
   this.randomCell = function() {
      var idx = parseInt(Math.random() * this.cells.length, 10);
      return this.cells[idx];
   };

   /**
    * @returns {Array} random path on island with len len and startpos pos
    */
   this.randomPath = function(pos, len) {
      var path = [pos];
      var dir = null;
      var i = 0;
      var newPos = null;
      while (i < 1000 && path.length < len) {
         i++;
         if (!dir || !this.cellCollide(newPos)) {
            dir = DIRS[parseInt(Math.random() * DIRS.length - 1, 10)];
            newPos = [
               pos[0] + dir[0],
               pos[1] + dir[1]
            ];
            continue;
         }
         path.push([newPos[0], newPos[1]]);
         pos = [newPos[0], newPos[1]];
         dir = null;
      };
      return path;
   };

   /**
    * @returns true if cell collides with this island
    */
   this.cellCollide = function(cell) {
      return this.cells.some(function(c) {
         return c[0] === cell[0] && c[1] === cell[1];
      });
   };

   var self = this;
   this.populationCount = 100;
   this.goldCount = 140;
   // HACK fishing count (they are units of world)
   this.fishingCount = 0;
   var dock = new Unit({type: 'dock', cell: [9, 8]});
   this.units = [dock];
   this.cells = mapCells
   return this;
};
