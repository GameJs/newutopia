var uniques = {
   idx: 0
};

// FIXME sync on multi-threaded serverside
var idGen = function() {
   uniques.idx += 1;
   return uniques.idx;
};


// exports
exports.MoveableUnit = MoveableUnit;
exports.Unit = Unit;
exports.TYPES = ['fort', 'factory', 'housing', 'crop', 'school', 'hospital', 'dock',
               'fishing', 'patrol',
               'rebel', 'schoolfish', 'pirate',
               'rain', 'storm', 'hurrican'];

/**
 * Unit
 */
function Unit(opts) {

   this.serialize = function() {
      return {
         id: this.id,
         cell: this.cell,
         type: this.type
      }
   };
   for (var key in opts) {
      this[key] = opts[key];
   }
   this.id = idGen();
   return this;
}

/**
 * MoveableUnit
 * the higher speed value, the lower !
 */
var UNIT_MOVE_MS = 1000;

function MoveableUnit(type, cell, speed) {
   var revert = false;
   this.update = function(msDuration) {
      if (this.path == null) return false;

      moveMs += msDuration;
      if (moveMs > this.speed * UNIT_MOVE_MS) {
         if (this.path && this.path.length && ((revert && moveIdx <= 0) || (!revert && moveIdx >= this.path.length-1))) {
            if (['fishing', 'patrol'].indexOf(this.type) > -1) {
               return false;
            } else if (!revert && ['schoolfish', 'pirate'].indexOf(this.type) > -1) {
               revert = true;
               return false;
            }
            return null;
         }
         moveMs = 0;
         if (revert) {
            moveIdx--;
         } else {
            moveIdx++;
         }
         this.cell = this.path[moveIdx];
         return true;
      }
      return false;
   };

   this.serialize = function() {
      return {
         id: this.id,
         cell: this.cell,
         type: this.type,
         path: this.path,
         speed: this.speed,
         pathProgress: moveIdx / (this.path.length - 1)
      }
   };

   this.setPath = function(path) {
      this.path = path;
      moveIdx = 0;
      moveMs = 0;
   };

   this.speed = speed || 1;
   var moveMs = 0;
   var moveIdx = 0;
   this.cell = cell;
   this.type = type;
   this.path = null;
   this.id = idGen();
   return this;
};
