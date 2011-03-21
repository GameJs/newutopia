var gamejs = require('gamejs');
var objects = require('gamejs/utils/objects');
var UNIT_TYPES = require('./model/unit').TYPES;
exports.World = World;

function addClickHandler(elementId, fn) {
   document.getElementById(elementId).addEventListener('click', fn, false);
};

function World(worldSize, cellSize, worldDump) {

   this.draw = function(display) {
      display.blit(background);
      var rect = new gamejs.Rect([0,0], this.getCellSize());
      var pos;
      // sort rain stuff on top
      units = units.sort(function(a, b) {
         if (['storm', 'rain', 'hurrican'].indexOf(a.type) > -1) return 1;
         return -1;
      });
      units.forEach(function(u) {
         pos = cellToView(u.cell);
         rect.left = pos[0];
         rect.top = pos[1];
         display.blit(u.image, rect);
      });
      /// TODO
      // draw timeline & year changes animation

   };

   this.getCellSize = function() {
      return cellSize;
   };

   var self = this;
   this.patch = function(changeset) {
      changeset.add.forEach(function(u) {
         if (u.type === 'hurrican') {
            self.hurricanSound.play();
         }
         units.push({
            id: u.id,
            image: UNIT_IMAGES[u.type],
            cell: u.cell,
            type: u.type
         });
      }, this);
      if (changeset.remove) {
         units = units.filter(function(unit) {
            var doRemove = changeset.remove.some(function(u) {
               return u.id === unit.id;
            });
            if (['fort', 'factory', 'housing', 'crop', 'school', 'hospital', 'dock',
               'fishing', 'patrol'].indexOf(unit.type) > -1 &&
               doRemove) {
               self.removeSound.play();
            }
            return !doRemove;
         }, this);
      }
      changeset.move.forEach(function(u) {
         units.some(function(unit) {
            if (unit.id === u.id) {
               unit.cell = u.cell;
               var pmFn = postMove[unit.type];
               if (pmFn) pmFn(unit);
               return true;
            }
            return false;
         });
      });
      return;
   };

   function getUnit(cell) {
      var us = units.filter(function(u) {
         return u.id === cell[id] && u.id !== notId;
      });
      var result = us.length > 0 ? us[0] : null;
   };

   var self = this;
   var postMove = {
      rain: function(r) {
         var crop = self.getCropAt(r.cell);
         if (crop) {
            self.rainSound.play();
         }
      }

   };

   /**
    * @returns true if cell collides with an island
    */
   var isIsland = this.isIsland = function(cell) {
      return islands.some(function(i) {
         return i.cells.some(function(c) {
            return c[0] === cell[0] && c[1] === cell[1];
         });
      });
   };

   this.isOwnShip = function(cell) {
      return units.some(function(u) {
         return u.cell[0] === cell[0] &&
                  u.cell[1] === cell[1] &&
                     ['fishing', 'patrol'].indexOf(u.type) > -1;
      });
   };

   this.getCropAt = function(cell) {
      var crop = null;
      units.some(function(u) {
         if (u.cell[0] === cell[0] &&
                  u.cell[1] === cell[1] &&
                     ['crop'].indexOf(u.type) > -1) {

            crop = u;
         }
      });
      return crop;
   };

   this.getShipAt = function(cell) {
      var ship = null;
      units.some(function(u) {
         if (u.cell[0] === cell[0] &&
                  u.cell[1] === cell[1] &&
                     ['fishing', 'patrol'].indexOf(u.type) > -1) {

            ship = u;
         }
      });
      return ship;
   };

   this.viewToCell = function(pos) {
      return [
         parseInt(pos[0] / cellSize[0], 10),
         parseInt(pos[1] / cellSize[1], 10)
      ];
   };

   var DIRS = [
      //[-1,-1],
      //[1,1],
      //[-1,1],
      //[1,-1]
      [-1,0],
      [0,-1],
      [1,0],
      [0,1],
   ];
   /**
    * aStarMap interface for astar searchs
    * @see {gamejs/pathfinding/astar}
    */
   this.aStarMap = {
      actualDistance: function(a,b) {
         return Math.pow(Math.abs(a[0]-b[0]),2) + Math.pow(Math.abs(a[1]-b[1]),2);
      },
      adjacent: function(cell) {
         var adjs = [];
         DIRS.forEach(function(d) {
            var n = [
               cell[0] + d[0],
               cell[1] + d[1]
            ];
            if (!isIsland(n) && n[0] >= 0 && n[1] >= 0 && n[0] < worldSize[0] && n[1] < worldSize[1]) {
               adjs.push(n);
            }
         });
         return adjs;
      },
      estimatedDistance: function(a,b) {
         return Math.pow(Math.abs(a[0]-b[0]),2) + Math.pow(Math.abs(a[1]-b[1]),2);
      }
   };


   cellToView = this.cellToView = function(cell) {
      return [cell[0] * cellSize[0], cell[1] * cellSize[1]];
   };

   var UNIT_IMAGES = {};
   UNIT_TYPES.forEach(function(type) {
      UNIT_IMAGES[type] = gamejs.image.load('images/client/' + type + '.png');
   });

   var months = worldDump.months;
   var islands = worldDump.islands;
   var units = worldDump.units.map(function(u) {
      return {
            image: UNIT_IMAGES[u.type],
            cell: u.cell
         };
   });
   var background = gamejs.image.load('images/client/map02.png');

   objects.accessors(this, {
      removeSound: {get: function() { return (new gamejs.mixer.Sound('sounds/client/impactwood01.ogg')); } },
      rainSound: {get: function() { return (new gamejs.mixer.Sound('sounds/client/rain_2.ogg')); } },
      hurricanSound: {get: function() { return (new gamejs.mixer.Sound('sounds/client/thunder_1_far.ogg')); } },
   });

   return this;
};
