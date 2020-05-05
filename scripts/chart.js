require([
    'amcharts4/core',
    'amcharts4/charts',
    'amcharts4/themes/animated'
], function (am4core, am4charts, am4themes_animated) {

    am4core.useTheme(am4themes_animated);

    // Create chart instance
    var chart = am4core.create("chartdiv", am4charts.PieChart);

    // Add data
    chart.data = [{
    "country": "Lithuania",
    "litres": 501.9
    }, {
    "country": "Czech Republic",
    "litres": 301.9
    }, {
    "country": "Ireland",
    "litres": 201.1
    }, {
    "country": "Germany",
    "litres": 165.8
    }, {
    "country": "Australia",
    "litres": 139.9
    }, {
    "country": "Austria",
    "litres": 128.3
    }, {
    "country": "UK",
    "litres": 99
    }, {
    "country": "Belgium",
    "litres": 60
    }, {
    "country": "The Netherlands",
    "litres": 50
    }];

    // Add and configure Series
    var pieSeries = chart.series.push(new am4charts.PieSeries());
    pieSeries.dataFields.value = "litres";
    pieSeries.dataFields.category = "country";

    // Add export
    chart.exporting.menu = new am4core.ExportMenu();

});