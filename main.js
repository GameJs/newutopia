var gamejs = require('gamejs');
var objects = require('gamejs/utils/objects');

var BuildMenu = require('./view/buildmenu').BuildMenu;
var ShipMenu = require('./view/shipmenu').ShipMenu;
var ServerWorld = require('./model').World;
var ViewWorld = require('./view').World;
var UNIT_TYPES = require('./model/unit').TYPES;
var statlogger = require('./view/statlogger');
var Hud = require('./view/hud').Hud;

var screen = [
   832,
   480
];
var cellSize = [32, 32];
var worldSize = [
   Math.floor(screen[0] / cellSize[0]),
   Math.floor(screen[1] / cellSize[1])
];

// disable normal browser mouse select
function disableMouseSelect() {
   // no text select on drag
   document.body.style.webkitUserSelect = 'none';
   // non right clickery
   document.body.oncontextmenu = function() { return false; };
}

var imgsPreload = [];
UNIT_TYPES.forEach(function(type) {
   imgsPreload.push('images/client/' + type + '.png');
});
['population', 'gold', 'harmony1', 'harmony2', 'harmony3', 'map02'].forEach(function(t) {
   imgsPreload.push('images/client/' + t + '.png');
});

['impactfall', 'impactwood01', 'sell_buy', 'rain_2', 'thunder_1_far', 'move_fail', 'move_okay'].forEach(function(s) {
   imgsPreload.push('sounds/client/' + s + '.ogg');
});

gamejs.preload(imgsPreload);
gamejs.ready(main);

function main() {

   disableMouseSelect();

   function handleEvent(event) {
      if (event.type === gamejs.event.MOUSE_UP &&
            event.button === 0) {
         var cell = viewWorld.viewToCell(event.pos);
         if (viewWorld.isIsland(cell)) {
            buildMenu.show(cell, event.pos);
         }
         if (viewWorld.isOwnShip(cell)) {
            shipMenu.show(cell);
         }
      }
   };

   var lastIsVisible = 0;
   function tick(msDuration) {

      if (shipMenu.isVisible()) {
         shipMenu.update(msDuration);
      } else if (buildMenu.isVisible())  {
         lastIsVisible = Date.now();
      } else if (Date.now() - lastIsVisible < 400) {
         // danger stupid, throwing away events
         gamejs.event.get().forEach(function() {});
      } else {
         gamejs.event.get().forEach(handleEvent);
      };


      // TODO verify orders serverside
      // in an intermediat 'Controller' class, that will
      // be the actions on serverside.
      // TODO
      // money dealing on server-side & clientside
      buildMenu.getOrders().forEach(function(order) {
         gamejs.debug('build order, sending ', JSON.stringify(order));
         var changeset = serverWorld.add(order.type, 0, order.cell);
         if (changeset === null) {
            // not enough money
         } else {
            // FIXME need to get island data because money changed
            changeset.island = serverWorld.dataSerialize(0);
            gamejs.debug('build order, changeset ', JSON.stringify(changeset));
            viewWorld.patch(changeset);
            hud.patch(changeset);
            buildSound().play();
         }
      });

      shipMenu.getOrders().forEach(function(order) {
         gamejs.debug('move order, sending', JSON.stringify(order));
         serverWorld.setPath(order.unitId, order.path);
      });

      var changeset = serverWorld.update(msDuration);
      // DEBUG
      //if (changeset.add.length || changeset.remove.length || changeset.move.length ||
      //      objects.keys(changeset.island).length) {
      //   gamejs.debug('tick, changeset', JSON.stringify(changeset));
      //}
      // DEBUG end
      viewWorld.patch(changeset);
      hud.patch(changeset);
      display.clear();
      viewWorld.draw(display);
      hud.draw(display);
      shipMenu.draw(display);
      return;
   };
   var display = gamejs.display.setMode(screen);
   // DEBUG
   //window.statlogger = statlogger;
   //window.display = display;
   //   return;
   // DEBUG END

   gamejs.setLogLevel('debug');
   gamejs.debug('WorldSize: ', worldSize);
   var serverWorld = new ServerWorld(worldSize);

   var worldDump = serverWorld.serialize();
   var viewWorld = new ViewWorld(worldSize, cellSize, worldDump);

   var islandData = serverWorld.dataSerialize(0);

   var hud = new Hud(islandData);
   var buildMenu = new BuildMenu();
   var shipMenu = new ShipMenu(viewWorld);

   var buildSound = function() { return new gamejs.mixer.Sound('sounds/client/impactfall.ogg'); };
   gamejs.time.fpsCallback(tick, this, 15);
};
