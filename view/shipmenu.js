var gamejs = require('gamejs');
var objects = require('gamejs/utils/objects');

var findRoute = require('gamejs/pathfinding/astar').findRoute;

exports.ShipMenu = function(world, cellCursor) {

   var visible = false;
   var ship = null;
   var orders = [];

   var self = this;
   // FIXME bug re-defined here and in main.js
   var cellSize = [32,32];
   function handleEvent(event) {
      if (event.type === gamejs.event.MOUSE_UP) {
         var target = world.eventPosToCell(event.pos);
         var route = null;
         try {
            route = findRoute(world.aStarMap, ship.cell, target, 900);
         } catch (e) {
            self.moveFailSound.play();
            gamejs.debug('route exception ', e);
         }
         if (route !== null) {
            var path = [route.point];
            var nextNode = null;
            while (nextNode = route.from) {
               path.unshift(nextNode.point);
               route = route.from;
            }
            orders.push({
               unitId: ship.id,
               path: path
            });
            self.moveSound.play();
         }
         visible = false;
         ship = null;
      } else if (event.type === gamejs.event.MOUSE_MOTION) {
         cellCursor.left = event.pos[0] - (event.pos[0] % cellSize[0]);
         cellCursor.top = event.pos[1] - (event.pos[1] % cellSize[1]);
      };
   };

   this.getOrders = function() {
      return orders.splice(0, orders.length);
   };

   this.update = function(msDuration) {
      gamejs.event.get().forEach(handleEvent);
      return;
   };

   this.draw = function(display) {
      if (!this.isVisible()) return;

      var pos = world.cellToView(ship.cell);
      var rect = new gamejs.Rect(pos, world.getCellSize());
      gamejs.draw.rect(display, '#ff0000', rect, 5);
   };


   this.show = function(cell) {
      visible = true;
      ship = world.getShipAt(cell);
   };

   this.isVisible = function() {
      return visible;
   };

   objects.accessors(this, {
      moveSound: {get: function() { return (new gamejs.mixer.Sound('sounds/client/move_okay.ogg')); } },
      moveFailSound: {get:  function() { return (new gamejs.mixer.Sound('sounds/client/move_fail.ogg')); } },
   });

   return this;

};
