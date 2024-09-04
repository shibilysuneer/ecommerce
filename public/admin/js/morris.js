 
!function($) {
  "use strict";

  var MorrisCharts = function() {};

  MorrisCharts.prototype.createDonutChart = function(element, data, colors) {
    Morris.Donut({
      element: element,
      data: data,
      resize: true,
      colors: colors,
      formatter : function (y, data) { 
        return '$' + y 
      }
    });
  },
  
  MorrisCharts.prototype.init = function() {

    var $donutData = [
        {label: "Loafer", value: 12},
        {label: "Sneakers", value: 30},
        {label: "Slippers", value: 20},
        {label: "Oxford shoe", value: 20},
        {label: "Sports shoes", value: 20}, 
        {label: "Boots", value: 20},
    ];
    this.createDonutChart('morris-donut-1', $donutData, ['#22C55E', '#2377FC', '#8F77F3', '#FFBA93', '#FFE99A', '#B0E7FF']);
  },

  $.MorrisCharts = new MorrisCharts, $.MorrisCharts.Constructor = MorrisCharts
}(window.jQuery),

function($) {
  "use strict";
  $.MorrisCharts.init();
}(window.jQuery);