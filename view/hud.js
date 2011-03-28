var gamejs = require('gamejs');
var objects = require('gamejs/utils/objects');

/**
 * display pop count, gold count, harmony
 *
 * TODO
 * bubble icons in this file?
 */

exports.Hud = function(months, islandData) {

   var data = islandData || {};
   var months = months;
   var logView = document.getElementById('logoverlay');
   function clog(text) {
      var line = document.createElement('li');
      var y = Math.floor(months / 12) + 1;
      line.appendChild(document.createTextNode(y + ' AD, ' + text));
      logView.insertBefore(line, logView.firstChild);
      return;
   };

   this.patch = function(changeset) {
      if (changeset.messages) {
         changeset.messages.forEach(clog);
      };

      if (changeset.months) {
         months = changeset.months;
      }
      changeset.island && objects.keys(changeset.island).forEach(function(key) {
         var oldValue = data[key];
         var newValue = changeset.island[key];
         var delta = (newValue - oldValue);
         if (delta && delta > 0 &&  key === 'gold') {
               //var logMsg = 'Earned ' + Math.abs(delta) + ' gold bar' + ((delta > 1) ? 's' : '');
               //clog(logMsg);
              this.moneySound.play();
        }

         data[key] = changeset.island[key];
      }, this);

      changeset.add && changeset.add.forEach(function(a) {
         if (['hurrican'].indexOf(a.type) > -1) {
            clog('Hurricane warning');
         }
      });

   }

   this.draw = function(display) {
      var rd = display.rect;

      // FIXME write generic code to layout this structure: [[srf,srf],[srf,srf],[srf,srf]]
      // gold
      var rg = goldImg.rect;
      var goldSrf = indicatorFont.render(data.gold, '#f3cd27');
      var rect = new gamejs.Rect([
         rd.width - rg.width - goldSrf.rect.width - 5,
         rd.height - rg.height - 70
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

      // year counter
      var ry = yearImg.rect;
      var yearSrf = indicatorFont.render(Math.floor(months / 12));
      rect = new gamejs.Rect([
         rd.width - ry.width - yearSrf.rect.width - 5,
         rect.top - ry.height - 5
      ]);
      display.blit(yearSrf, rect);
      rect.moveIp(yearSrf.rect.width + 2, -5);
      display.blit(yearImg, rect);

      // harmony
      var harmonyImg = harmonyImgs[data.harmony];
      var rh = harmonyImg.rect;
      rect = new gamejs.Rect([
         rd.width - rh.width - 5,
         rect.top - rh.height - 5
      ]);
      display.blit(harmonyImg, rect);

   }

   var goldImg = gamejs.image.load('images/client/gold.png');
   var popImg = gamejs.image.load('images/client/population.png');
   var yearImg = gamejs.image.load('images/client/year.png');
   var harmonyImgs = [];
   [1,2,3].forEach(function(i) {
      harmonyImgs.push(gamejs.image.load('images/client/harmony' + i + '.png'));
   });
   var indicatorFont = new gamejs.font.Font("40px 'MedievalSharp', sans-serif");
   objects.accessors(this, {
      moneySound: {get: function() { return (new gamejs.mixer.Sound('sounds/client/sell_buy.ogg')); } },
   });
   return this;
};
