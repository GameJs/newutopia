var gamejs = require('gamejs');
var objects = require('gamejs/utils/objects');
var Island = require('./model/island').Island;
var MoveableUnit = require('./model/unit').MoveableUnit;

var MONTH_MS = 2000;

var DIRS = [
   [-1,-1],
   [1,1],
   [-1,1],
   [1,-1],
   [-1,0],
   [0,-1],
   [1,0],
   [0,1]
];
exports.World = World;

/**
 * World
 */
function World(size) {

   var islands = [];
   var units = [];
   var monthMs = 0;
   var months = 0;

   /**
    */
   this.update = function(msDuration) {
      monthMs += msDuration;

      var results = [];

      // year, month advance
      var monthChanged = false;
      var yearChanged = false;
      if (monthMs >= MONTH_MS) {
         months++;
         monthMs = 0;
         monthChanged = true;
         gamejs.debug('World.update: month', months);
         if (months && months % 12 === 0) {
            yearChanged = true;
         }
      }

      // create weather
      if (monthChanged && months && months % 5 === 0) {
         for (var i=0;i<3;i++) {
            results.push(this.add('weather'));
         }
      }
      // create pirates
      if (monthChanged && months && months % 8 === 0) {
         results.push(this.add('pirate'));
      }
      // create fish
      if (monthChanged && months && months % 6 === 0) {
         results.push(this.add('schoolfish'));
      }

      // if a unit moves, execute its postMove handler
      units.forEach(function(u) {
         var moved = u.update(msDuration);
         if (moved === true) {
            var res = postMove[u.type](u);
            results.push(res);
            results.push({
               move: [u],
            });
         } else if (moved === null) {
            killUnit(u);
            results.push({
               remove: [u],
            });
         }
      });

      // update island. some properties evolve per month, others per year
      islands.forEach(function(i, islandIdx) {
         if (monthChanged) {
            var res = i.nextMonth();
            results.push(res);

         };
         if (yearChanged) {
            var res = i.nextYear();
            results.push(res);
            if (i.census.unhappy > 0) {
               for (var j =0; j < parseInt( (i.census.unhappy - 250) / 150, 10); j++) {
                  results.push(this.add('rebel', islandIdx));
               }
            }
            // DEBUG
            gamejs.debug('World.update, island census', JSON.stringify(i.census));
         }
      }, this);

      // send island status
      if (monthChanged || yearChanged) {
         results.push({island:
            islands[0].dataSerialize()
         });
      }

      // merge results
      var finalResults = {
         months: months,
         add: [],
         remove: [],
         island: {},
         move: []
      };
      results.forEach(function(r) {
         if (r) {
            if (r.add) {
               finalResults.add = finalResults.add.concat(r.add);
            }

            if (r.remove) {
               finalResults.remove = finalResults.remove.concat(r.remove);
            }
            if (r.move) {
               finalResults.move = finalResults.move.concat(r.move);
            }
            if (r.island) {
               objects.keys(r.island).forEach(function(key) {
                  finalResults.island[key] = r.island[key];
               });
            }
         }
      })
      return finalResults;
   }; // end update

   /**
    * Add unit
    */
   this.add = function(type, islandIdx, cell) {
      var island = islands[islandIdx];

      var cost = {
            crop: 3,
            factory: 40,
            fishing: 25,
            fort: 50,
            hospital: 75,
            housing: 60,
            patrol: 40,
            school: 35
         }[type];

      if (island && cost) {
         if (cost > island.goldCount) {
            return null;
         }
         island.goldCount -= cost;
      }

      var unit = null;
      if (type === 'weather') {
         // random type
         // random speed
         // random path
         var rnd = Math.random();
         var realType = 'rain';
         if (rnd < 0.1) {
            realType = 'storm';
         } else if (rnd > 0.95) {
            realType = 'hurrican';
         }
         var speed = 2 + parseInt(Math.random() * 3, 10);
         unit = new MoveableUnit(realType, this.randomCell('weatherbottom'), speed);
         var pathLen = 8 + (Math.random() * 10);
         unit.path = this.randomPath(unit.cell, pathLen, true);
      } else if (type === 'schoolfish') {
         unit = new MoveableUnit(type, this.randomCell('top'), 5);
         unit.path = this.randomPath(unit.cell, 5);
      } else if (type === 'pirate') {
         unit = new MoveableUnit(type, this.randomCell('right'), 2);
         unit.path = this.randomPath(unit.cell, 12);
      } else if (type === 'rebel') {
         unit = new MoveableUnit(type, island.randomCell(), 10);
         unit.path = island.randomPath(unit.cell, 2);
      } else if (['fishing', 'patrol'].indexOf(type) > -1) {
         var speed = type === 'patrol' ? 0.8 : 1;
         unit = new MoveableUnit(type, island.dock.cell, speed);
         // HACK fishing count
         island.fishingCount += 1;
         unit.islandIdx = islandIdx;
      }
      var result = null;
      if (unit) {
         units.push(unit);
         result = {
            add: [unit],
            move: [],
            remove: []
         }
      } else {
         result = island.add(type, cell);
      }
      return result;
   };

   /**
    * setPath for unit
    */
   this.setPath = function(unitId, path) {
      var unit = getUnit(unitId);
      if (!unit) {
         throw new Error('no unit with id', unitId);
      }
      unit.setPath(path);
      return;
   };

   this.dataSerialize = function(homeIslandIdx) {
      return islands[homeIslandIdx].dataSerialize();
   };

   /**
    * create json-able dump of world status
    */
   this.serialize = function() {
      var unitDump = units.map(function(u) { return u.serialize(); });
      islands.forEach(function(i) {
         unitDump = unitDump.concat(i.units.map(function(u) {
            return u.serialize();
         }));
      });
      var islandDump = islands.map(function(i) { return i.serialize(); });
      return {
         months: months,
         units: unitDump,
         islands: islandDump,
      };
   };

   /**
    * post unit move handlers
    * called after that type of unit has moved, triggers model changes
    */
   var postMove = {
      rain: function(w) {
         var unit = getUnit(w.cell, w.id);
         if (!unit) return null;
         var result = {
            remove: []
         };
         if (unit.type === 'crop') {
            var island = getIsland(w.cell);
            island.goldCount += 1;
         }
         return result;
      },
      storm: function(w) {
         var unit = getUnit(w.cell, w.id);
         if (!unit) return null;
         var result = {
            remove: []
         };
         var island = getIsland(w.cell);
         // storm over crop
         // give gold OR destory
         if (unit.type === 'crop') {
            if (Math.random() < 0.25) {
               killUnit(unit);
               result.remove.push(unit);
            } else {
               island.goldCount += 1;
            }
         } else if (unit.type === 'fishing') {
            if (Math.random() < 0.5) {
               killUnit(unit);
               result.remove.push(unit);
            }
         } else if (unit) {
            if (Math.random() < 0.01) {
               killUnit(unit);
               result.remove.push(unit);
            }
         }
         return result;
      },
      hurrican: function(w) {
         var unit = getUnit(w.cell, w.id);
         if (!unit) return null;
         var result = {
            remove: []
         };
         // fishing boats: killed (unless anchored, then 2/3)
         // 2/3 chance to kill anything else
         if (unit.type === 'fishing') {
            killUnit(unit);
            result.remove.push(unit);
         } else if (unit) {
            if (Math.random() < 0.75) {
               killUnit(unit);
               result.remove.push(unit);
            }
         }
         return result;
      },
      rebel: function(r) {
         // if over island unit && no fort near -> kill building
         var unit = getUnit(r.cell, r.id);
         if (!unit) return null;

         var neighborForts = DIRS.map(function(d) {
            return [
               r.cell[0] + d[0],
               r.cell[1] + d[1]
            ];
         }).map(function(c) {
            return getUnit(c);
         }).filter(function(u) {
            return u && u.type === 'fort';
         });
         if (neighborForts.length > 0) return null;
         killUnit(unit);
         return {
            remove: unit
         }
      },
      pirate: function(p) {
         // pirate kills fishing boat
         var unit = getUnit(p.cell, p.id);
         if (!unit) return null;

         if (unit.type === 'fishing') {
            // HACK fishing count
            var island = islands[unit.islandIdx];
            island.fishingCount -= 1;
            killUnit(unit);
            return {
               remove: unit
            }
         } else if (unit.type === 'patrol') {
            killUnit(p);
            return {
               remove: p
            }
         }
         return null;
      },
      patrol: function(p) {
         // patrol kills pirate
         var unit = getUnit(p.cell, p.id);
         if (!unit) return null;

         if (unit.type === 'pirate') {
            killUnit(unit);
            return {
               remove: unit
            }
         }
         return null;
      },
      fishing: function(f) {
         // boat over school of fish -> extra gold
         var unit = getUnit(f.cell, f.id);
         if (!unit) return null;

         if (unit.type === 'schoolfish') {
            var island = islands[f.islandIdx];
            island.goldCount += 1;
            return {'island': island.dataSerialize()};
         }
         return null;
      },
      schoolfish: function(f) {
         // fish over boat -> extra gold
         var unit = getUnit(f.cell, f.id);
         if (!unit) return null;

         if (unit.type === 'fishing') {
            var island = islands[unit.islandIdx];
            island.goldCount += 1;
            return {'island': island.dataSerialize()};
         }
         return null;
      }

   };

   this.cellCollide = function(cell, noIslandCollide) {
      if (cell[0] < 0 || cell[0] > size[0] || cell[1] < 0 || cell[1] > size[1]) {
         return false;
      }
      if (noIslandCollide === true) return true;

      return !islands.some(function(i) {
         return i.cellCollide(cell);
      });
   };

   this.randomCell = function(area) {
      var cell = null;
      while (!cell || !this.cellCollide(cell)) {
         cell = [
            parseInt(Math.random() * size[0], 10),
            parseInt(Math.random() * size[1], 10)
         ];
         if (area === 'right') {
            cell[0] = size[0] - 1;
         } else if (area === 'top') {
            cell[1] = 0;
         } else if (area === 'bottom') {
            cell[1] = size[1] - 1;
         } else if (area === 'left') {
            cell[0] = 1;
         } else if (area === 'weatherbottom') {
            cell[0] = 3 + parseInt(Math.random() * size[0] / 3, 10);
            cell[1] = size[1] - 1;
         }
      }
      return cell;
   };

   this.randomPath = function(cell, len, noIslandCollide) {
      var len = len || 10;
      var path = [cell];
      var dir = null;
      var i = 0;
      var newCell = null;
      while (i < 1000 && path.length < len) {
         i++;
         var isOkayDirection = newCell && this.cellCollide(newCell, noIslandCollide);
         if (!dir || !isOkayDirection || path.indexOf(newCell) > -1) {
            if (!isOkayDirection) {
               dir = DIRS[parseInt(Math.random() * (DIRS.length - 2), 10)];
            }
            newCell = [
               cell[0] + dir[0],
               cell[1] + dir[1]
            ];
            continue;
         }
         path.push(newCell);
         cell = [newCell[0], newCell[1]];
      };
      return path;
   };

   /**
    * get unit by id or cell
    * will search world & all islands for that unit
    */
   function getUnit(id, notId) {
      if (typeof id === 'number') {
         var us = units.filter(function(u) {
            return u.id === id && u.id !== notId;
         });
         var result = us.length > 0 ? us[0] : null;
         if (!result) {
            islands.some(function(i) {
               return i.units.some(function(u) {
                  if (u.id === id && u.id !== notId) {
                     result = u;
                     return true;
                  }
                  return false;
               });
            });
         }
      } else if (id instanceof Array) {
         var us = units.filter(function(u) {
            return u.cell[0] === id[0] && u.cell[1] === id[1] && u.id !== notId;
         });
         var result = us.length > 0 ? us[0] : null;
         if (!result) {
            islands.some(function(i) {
               return i.units.some(function(u) {
                  if (u.cell[0] === id[0] && u.cell[1] === id[1] && u.id !== notId) {
                     result = u;
                     return true;
                  }
                  return false;
               });
            });
         }
      }
      return result;
   };

   function killUnit(unit) {
      var id = unit && unit.id;
      if (typeof id === 'number') {
         units = units.filter(function(u) {
            return u.id !== id;
         });
         // FIXME optimize, don't go through islands if above killed unit
         islands = islands.map(function(i) {
            i.units = i.units.filter(function(u) {
               return u.id !== id;
            });
            return i;
         });
      } else {
         throw Error('killUnit: must pass unit with .id property. id not number', id);
      }
   };


   /**
    * find island that holds cell if any
    */
   function getIsland(cell) {
      var island = null;
      islands.some(function(i) {
         return i.cells.some(function(c) {
            if (c[0] === cell[0] && c[1] === cell[1]) {
               island = i;
               return true;
            }
            return false;
         });
      });
      return island;
   };

   islands.push(new Island());
   return this;

};
