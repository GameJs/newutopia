function $(id) {
   return document.getElementById(id);
}

exports.BuildMenu = function() {
   var orders = [];
   var buildCell = null;

   this.show = function(cell, pos) {
      buildCell = cell;
      // FIXME ugly
      // delay show on ipad so the event opening it does not propagate to the
      // build menu
      if (navigator.userAgent.indexOf('iPad') > -1) {
         setTimeout(function() {
            $('buildoverlay').style.display = 'block';
         }, 300);
      } else {
            $('buildoverlay').style.display = 'block';
      }
   };
   this.hide = function(cell, pos) {
      $('buildoverlay').style.display = 'none';
   };
   this.isVisible = function() {
      return $('buildoverlay').style.display != 'none';
   };
   this.getOrders = function() {
      try {
         return orders;
      } finally {
         orders = [];
      }
   };

   function onButtonClick(event) {
      var type = this.id.substring(5);
      orders.push({
         type: type,
         cell: buildCell
      });
      self.hide();
      return false;
   };

   function onCancel(event) {
      self.hide();
      return false;
   };

   var self = this;
   var buttons = document.getElementsByClassName('unit-build-button');
   Array.prototype.forEach.apply(buttons, [function(b) {
      b.addEventListener('click', onButtonClick, false);
   }]);

   document.getElementById('buildoverlay').addEventListener('click', onCancel, false);

   return this;
};
