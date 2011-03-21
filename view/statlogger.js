var gamejs = require('gamejs');

exports.StatLogger = StatLogger;

exports.test = function() {
   var s = new StatLogger();
   s.record({harmony: 3, gold: 1, population: 1});
   s.record({harmony: 3, gold: 1, population: 2});
   s.record({harmony: 3, gold: 1, population: 3});
   s.record({harmony: 3, gold: 2, population: 3});
   s.record({harmony: 3, gold: 3, population: 4});
   s.record({harmony: 2, gold: 3, population: 5});
   s.record({harmony: 2, gold: 2, population: 5});
   s.record({harmony: 3, gold: 3, population: 8});
   s.record({harmony: 3, gold: 5, population: 10});
   s.record({harmony: 1, gold: 6, population: 15});
   s.record({harmony: 2, gold: 8, population: 18});
   s.record({harmony: 3, gold: 4, population: 22});
   return s;
};

function StatLogger() {
   var monthlyStats = [];
   
   var KEYS = ['harmony', 'gold', 'population'];
   
   this.record = function(changeset) {
      var monthStats = {
         months: changeset.months
      };
      KEYS.forEach(function(key) {
         monthStats[key] = changeset[key];
      });
      monthlyStats.push(monthStats);
   };
   
   this.draw = function(display) {
      // TODO: draw last known status: harmony, gold & population
   };
   
   this.endOfYearReport = function() {
      // TODO:
      // return a surface with graph for harmony, gold & population
      // for last 20 rounds
      var HEIGHT = 400;
      var WIDTH = 10;
      var COUNT = 20;
      var SPACING = 5;
      
      var stats = monthlyStats.slice(-COUNT);
      var values = {};
      KEYS.forEach(function(key) {
         var maxValue = Math.max.apply(this, stats.map(function(s) { return s[key]; }));
         var factor = (HEIGHT / maxValue);
         values[key] = stats.map(function(s) {
            return s[key] * factor;
         });
      });
      
      var surfaces = {};
      KEYS.forEach(function(key) {
         var srf = new gamejs.Surface([WIDTH * COUNT + (SPACING * (COUNT-1)), SPACING * 2 + HEIGHT]);
         var x = SPACING;
         values[key].forEach(function(val) {
            var top = [x, srf.rect.height - SPACING];
            var bottom = [x, srf.rect.height - SPACING - val];
            gamejs.draw.line(srf, '#ff0000', top, bottom, WIDTH);
            console.log(top, bottom);
            x += WIDTH + SPACING;
         });
         surfaces[key] = srf;
      });
      return surfaces;
   };
   
   return this;
};
