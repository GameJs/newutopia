var gamejs = require('gamejs');
var objects = require('gamejs/utils/objects');

/**
 * display pop count, gold count, harmony
 *
 * TODO
 * bubble icons in this file?
 */

exports.Hud = function(islandData) {

   var data = islandData || {};

   this.patch = function(changeset) {
      changeset.island && objects.keys(changeset.island).forEach(function(key) {
         var oldValue = data[key];
         var newValue = changeset.island[key];
         if (oldValue !== newValue) {
            if (key === 'gold') {
               this.moneySound.play();
            }
         };
         data[key] = newValue;
      }, this);
   }

   this.draw = function(display) {
      var rd = display.rect;

      // gold
      var rg = goldImg.rect;
      var goldSrf = indicatorFont.render(data.gold, '#f3cd27');
      var rect = new gamejs.Rect([
         rd.width - rg.width - goldSrf.rect.width - 5,
         rd.height - rg.height
      ]);
      display.blit(goldSrf, rect);
      rect.moveIp(goldSrf.rect.width + 2, -5);
      display.blit(goldImg, rect);

      // population
      var rp = popImg.rect;
      var popSrf = indicatorFont.render(data.population);
      rect = new gamejs.Rect([
         rd.width - rp.width - popSrf.rect.width - 5,
         rect.top - rp.height - 5
      ]);
      display.blit(popSrf, rect);
      rect.moveIp(popSrf.rect.width + 2, -5);
      display.blit(popImg, rect);

      // harmony
      var harmonyImg = harmonyImgs[data.harmony - 1];
      var rh = harmonyImg.rect;
      rect = new gamejs.Rect([
         rd.width - rh.width - 5,
         rect.top - rh.height - 5
      ]);
      display.blit(harmonyImg, rect);

   }

   var goldImg = gamejs.image.load('images/client/gold.png');
   var popImg = gamejs.image.load('images/client/population.png');
   var harmonyImgs = [];
   [1,2,3].forEach(function(i) {
      harmonyImgs.push(gamejs.image.load('images/client/harmony' + i + '.png'));
   });
   var indicatorFont = new gamejs.font.Font('40px MedievalSharp, arial, serif');
   objects.accessors(this, {
      moneySound: {get: function() { return (new gamejs.mixer.Sound('sounds/client/sell_buy.ogg')); } },
   });
   return this;
};
