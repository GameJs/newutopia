function $(id) {
   return document.getElementById(id);
}

exports.MainMenu = function() {
   var orders = [];
   var displayBackToGame = true;

   this.show = function(backToGame) {
      if (backToGame === false) {
         $('close-menu-button').style.display = 'none';
      }
      $('menuoverlay').style.display = 'block';
      $('canvascontainer').style.display = 'none';
      $('utopia-instructions').style.display = 'none';
   };
   this.hide = function() {
      $('menuoverlay').style.display = 'none';
      $('canvascontainer').style.display = 'block';
      $('utopia-instructions').style.display = 'none';
   };
   this.isVisible = function() {
      return $('menuoverlay').style.display != 'none';
   };

   function onButtonClick(event) {
      var rounds = this.id.substring(7);
      if (rounds === 'freeplay') {
         rounds = 0;
      } else {
         rounds = parseInt(rounds, 10);
      }
      document.location.hash = "#" + rounds;
      document.location.reload();
      return false;
   };

   function onHelpClick(event) {
      $('utopia-instructions').style.display = $('utopia-instructions').style.display === 'block' ? 'none' : 'block';
      event.stopPropagation();
      event.preventDefault();
      return false;

   };

   this.reset = function() {
      document.location.hash = "";
   };

   function onCancel(event) {
      self.hide();
      return false;
   };

   var self = this;
   var buttons = document.getElementsByClassName('rounds-select-button');
   Array.prototype.forEach.apply(buttons, [function(b) {
      b.addEventListener('click', onButtonClick, false);
   }]);

   $('menuoverlay').addEventListener('click', onCancel, false);

   $('utopia-pitch').addEventListener('click', onHelpClick, false);
   $('utopia-instructions').addEventListener('click', onHelpClick, false);
   return this;
};
