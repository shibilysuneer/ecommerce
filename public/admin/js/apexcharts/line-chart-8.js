(function ($) {
  
    var tfLineChart = (function () {
  
      var chartBar = function () {
      
        var options = {
            series: [{
            name: 'Profit',
            data: [81, 121, 40, 52, 164, 113, 26, 68, 164, 113,]
          }, {
            name: 'Revenue',
            data: [135, 182, 76, 112, 199, 168, 49, 120, 164, 113,]
          }],
            chart: {
            type: 'bar',
            height: 520,
            toolbar: {
              show: false,
            },
          },
          plotOptions: {
            bar: {
              horizontal: false,
              columnWidth: '10px',
              endingShape: 'rounded'
            },
          },
          dataLabels: {
            enabled: false
          },
          legend: {
            show: false,
          },
          colors: ['#2377FC33', '#2377FC'],
          stroke: {
            show: false,
          },
          xaxis: {
            labels: {
              style: {
                colors: '#95989D',
              },
            },
            categories: ['Jan' , 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
          },
          yaxis: {
            show: false,
          },
          fill: {
            opacity: 1
          },
          tooltip: {
            y: {
              formatter: function (val) {
                return "$ " + val + " thousands"
              }
            }
          }
        };

        chart = new ApexCharts(
          document.querySelector("#line-chart-8"),
          options
        );
        if ($("#line-chart-8").length > 0) {
          chart.render();
        }
      };
  
      /* Function ============ */
      return {
        init: function () {},
  
        load: function () {
          chartBar();
        },
        resize: function () {},
      };
    })();
  
    jQuery(document).ready(function () {});
  
    jQuery(window).on("load", function () {
      tfLineChart.load();
    });
  
    jQuery(window).on("resize", function () {});
})(jQuery);

// (function ($) {
//     var chart;

//     // Function to initialize the chart with dynamic dates and totals
//     var chartBar = function (dates, totals) {
//         var options = {
//             series: [{
//                 name: 'Total',
//                 data: totals  // Data for totals
//             }],
//             chart: {
//                 type: 'line',  // You can also keep it as 'bar' if you prefer bar chart
//                 height: 520,
//                 toolbar: {
//                     show: false,
//                 },
//             },
//             xaxis: {
//                 categories: dates,  // Dates for x-axis
//                 labels: {
//                     style: {
//                         colors: '#95989D',
//                     },
//                 },
//             },
//             yaxis: {
//                 labels: {
//                     formatter: function (val) {
//                         return "$ " + val + " thousands";  // Formatting the y-axis values
//                     }
//                 }
//             },
//             dataLabels: {
//                 enabled: false
//             },
//             colors: ['#2377FC'],
//             stroke: {
//                 curve: 'smooth',  // Smooth line for line chart
//             },
//             fill: {
//                 opacity: 1
//             },
//             tooltip: {
//                 x: {
//                     format: 'dd MMM yyyy'  // Format tooltip to show dates properly
//                 },
//                 y: {
//                     formatter: function (val) {
//                         return  val + " thousands";
//                     }
//                 }
//             }
//         };

//         // Render chart
//         if (chart) {
//             chart.updateOptions(options);
//         } else {
//             chart = new ApexCharts(document.querySelector("#line-chart-8"), options);
//             chart.render();
//         }
//     };

//     // Function to update chart data based on selected filter
//     function updateChart(filter) {
//         var dates, totals;

//         // Customize the data based on the filter
//         switch (filter) {
//             case 'weekly':
//                 dates = ['2024-10-01', '2024-10-02', '2024-10-03', '2024-10-04', '2024-10-05', '2024-10-06', '2024-10-07'];
//                 totals = [50, 60, 70, 80, 90, 100, 110];
//                 break;
//             case 'lastweek':
//                 dates = ['2024-09-24', '2024-09-25', '2024-09-26', '2024-09-27', '2024-09-28', '2024-09-29', '2024-09-30'];
//                 totals = [40, 50, 60, 70, 80, 90, 100];
//                 break;
//             case 'monthly':
//                 dates = ['2024-10-01', '2024-10-02', '2024-10-03', '2024-10-04', '2024-10-05', '2024-10-06', '2024-10-07', '2024-10-08', '2024-10-09', '2024-10-10'];
//                 totals = [500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400];
//                 break;
//             case 'yearly':
//                 dates = ['2024-01-01', '2024-02-01', '2024-03-01', '2024-04-01', '2024-05-01', '2024-06-01', '2024-07-01', '2024-08-01', '2024-09-01', '2024-10-01'];
//                 totals = [5000, 6000, 7000, 8000, 9000, 10000, 11000, 12000, 13000, 14000];
//                 break;
//             default:
//                 dates = [];
//                 totals = [];
//         }

//         // Update the chart with the new data
//         chartBar(dates, totals);
//     }

//     // Load the initial chart
//     $(document).ready(function () {
//         updateChart('monthly');  // Default chart on load
//     });

// })(jQuery);
