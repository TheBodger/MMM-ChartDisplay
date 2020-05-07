//contains all the prewritten code to display the charts
//each chart is standalone, and will have data provided to it through the variable this.chartdata.
//copied from the examples in amcharts4/examples/javascript


displaycharts = {

    bar_chart_race: function (chartdata, divid) {

        require([
            'amcharts4/core',
            'amcharts4/charts',
            'amcharts4/themes/animated'
        ], function (am4core, am4charts, am4themes_animated) {

            am4core.useTheme(am4themes_animated)

            var chart = am4core.create(divid, am4charts.XYChart);
            chart.padding(10, 10, 10, 10);

            chart.numberFormatter.bigNumberPrefixes = [
                { "number": 1e+3, "suffix": "K" },
                { "number": 1e+6, "suffix": "M" },
                { "number": 1e+9, "suffix": "B" }
            ];

            var label = chart.plotContainer.createChild(am4core.Label);
            label.x = am4core.percent(97);
            label.y = am4core.percent(95);
            label.horizontalCenter = "right";
            label.verticalCenter = "middle";
            label.dx = -15;
            label.fontSize = 20;
            label.fill = am4core.color("rgb(255, 0, 0)");

            var playButton = chart.plotContainer.createChild(am4core.PlayButton);
            playButton.x = am4core.percent(97);
            playButton.y = am4core.percent(95);
            playButton.verticalCenter = "middle";
            playButton.events.on("toggled", function (event) {
                if (event.target.isActive) {
                    play();
                }
                else {
                    stop();
                }
            })

            var stepDuration = 1000;

            var categoryAxis = chart.yAxes.push(new am4charts.CategoryAxis());
            categoryAxis.renderer.grid.template.location = 0;
            categoryAxis.dataFields.category = "Country";
            categoryAxis.renderer.minGridDistance = 1;
            categoryAxis.renderer.inversed = true;
            categoryAxis.renderer.grid.template.disabled = true;
            categoryAxis.renderer.labels.template.fill = am4core.color("#f2f2f2");
            categoryAxis.fontSize = "12pt";

            var valueAxis = chart.xAxes.push(new am4charts.ValueAxis());
            valueAxis.min = 0;
            valueAxis.rangeChangeEasing = am4core.ease.linear;
            valueAxis.rangeChangeDuration = stepDuration;
            valueAxis.extraMax = 0.1;
            valueAxis.renderer.labels.template.fill = am4core.color("#f2f2f2")
            valueAxis.fontSize = "12pt";

            var series = chart.series.push(new am4charts.ColumnSeries());
            series.dataFields.categoryY = "Country";
            series.dataFields.valueX = "Deaths";
            series.tooltipText = "{valueX.value}"
            series.columns.template.strokeOpacity = 0;
            series.columns.template.column.cornerRadiusBottomRight = 5;
            series.columns.template.column.cornerRadiusTopRight = 5;
            series.interpolationDuration = stepDuration;
            series.interpolationEasing = am4core.ease.linear;

            var labelBullet = series.bullets.push(new am4charts.LabelBullet())
            labelBullet.label.horizontalCenter = "right";
            labelBullet.label.text = "{values.valueX.workingValue.formatNumber('#.0as')}";
            labelBullet.label.textAlign = "end";
            labelBullet.label.dx = -10;
            labelBullet.fontSize = "12pt";

            chart.zoomOutButton.disabled = true;

            // as by default columns of the same series are of the same color, we add adapter which takes colors from chart.colors color set
            series.columns.template.adapter.add("fill", function (fill, target) {
                return chart.colors.getIndex(target.dataItem.index);
            });

            var date = new Date("2020-03-11");
            var startDate = date;
            var endDate = new Date()
            label.text = date.toISOString().slice(0, 10);

            var interval;

            function play() {
                interval = setInterval(function () {
                    nextdate();
                }, stepDuration)
                nextdate();
            }

            function stop() {
                if (interval) {
                    clearInterval(interval);
                }
            }

            function nextdate() {

                date = new Date(date.getTime() + (24 * 60 * 60 * 1000))

                if (date > endDate) {
                    date = startDate;
                }

                var newData = allData[date.toISOString().slice(0, 10)];
                var itemsWithNonZero = 0;
                for (var i = 0; i < chart.data.length; i++) {
                    chart.data[i].Deaths = newData[i].Deaths;
                    if (chart.data[i].Deaths > 0) {
                        itemsWithNonZero++;
                    }
                }

                if (date == startDate) {
                    series.interpolationDuration = stepDuration / 4;
                    valueAxis.rangeChangeDuration = stepDuration / 4;
                }
                else {
                    series.interpolationDuration = stepDuration;
                    valueAxis.rangeChangeDuration = stepDuration;
                }

                chart.invalidateRawData();

                label.text = date.toISOString().slice(0, 10);

                categoryAxis.zoom({ start: 0, end: itemsWithNonZero / categoryAxis.dataItems.length });
            }

            categoryAxis.sortBySeries = series;

            var allData = chartdata;

            chart.data = JSON.parse(JSON.stringify(allData[date.toISOString().slice(0, 10)]));
            categoryAxis.zoom({ start: 0, end: 1 / chart.data.length });

            series.events.on("inited", function () {
                setTimeout(function () {
                    playButton.isActive = true; // this starts interval
                }, 1000)
            })

        });

    },
    stock_comparing_values: function (chartdata, divid) {

        require([
            'amcharts4/core',
            'amcharts4/charts',
            'amcharts4/themes/animated'
        ], function (am4core, am4charts, am4themes_animated) {

                am4core.useTheme(am4themes_animated)

                var chart = am4core.create(divid, am4charts.XYChart);
                chart.padding(0, 15, 0, 15);
                chart.colors.step = 3;

                // the following line makes value axes to be arranged vertically.
                chart.leftAxesContainer.layout = "vertical";

                // uncomment this line if you want to change order of axes
                //chart.bottomAxesContainer.reverseOrder = true;

                var dateAxis = chart.xAxes.push(new am4charts.DateAxis());
                dateAxis.renderer.grid.template.location = 0;
                dateAxis.renderer.ticks.template.length = 8;
                dateAxis.renderer.ticks.template.strokeOpacity = 0.1;
                dateAxis.renderer.grid.template.disabled = true;
                dateAxis.renderer.ticks.template.disabled = false;
                dateAxis.renderer.ticks.template.strokeOpacity = 0.2;
                dateAxis.renderer.minLabelPosition = 0.01;
                dateAxis.renderer.maxLabelPosition = 0.99;
                dateAxis.keepSelection = true;

                dateAxis.renderer.line.stroke = am4core.color("#f1f2f3");
                dateAxis.renderer.labels.template.fill = am4core.color("#f1f2f3");
                dateAxis.renderer.grid.template.stroke = am4core.color("#c1c2c3");
                dateAxis.renderer.labels.template.fontSize = 14;

                dateAxis.groupData = true;
                dateAxis.minZoomCount = 5;

                dateAxis.tooltip.fontSize = 12;
                dateAxis.tooltip.color = am4core.color("#c1c2c3");
                dateAxis.tooltip.background.fill = am4core.color("rgba(255, 255, 255, 0.1)");

                // these two lines makes the axis to be initially zoomed-in
                // dateAxis.start = 0.7;
                // dateAxis.keepSelection = true;

                var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
                valueAxis.tooltip.disabled = true;
                valueAxis.zIndex = 1;
                valueAxis.renderer.baseGrid.disabled = true;
                // height of axis
                valueAxis.height = am4core.percent(65);

                valueAxis.renderer.gridContainer.background.fill = am4core.color("#000000");
                valueAxis.renderer.gridContainer.background.fillOpacity = 0.05;
                valueAxis.renderer.inside = true;
                valueAxis.renderer.labels.template.verticalCenter = "bottom";
                valueAxis.renderer.labels.template.padding(2, 2, 2, 2);

                //valueAxis.renderer.maxLabelPosition = 0.95;
                valueAxis.renderer.fontSize = 14

                valueAxis.renderer.labels.template.fill = am4core.color("#f1f2f3");
                valueAxis.renderer.grid.template.stroke = am4core.color("#c1c2c3");
                valueAxis.renderer.line.stroke = am4core.color("#f1f2f3");

                valueAxis.renderer.labels.template.fontSize = 14;

                var series = {};
                var series1 = null;

                for (var seriesdata in chartdata) {

                    series[seriesdata] = chart.series.push(new am4charts.LineSeries());
                    series[seriesdata].data = chartdata[seriesdata];
                    series[seriesdata].dataFields.dateX = "date";
                    series[seriesdata].dataFields.valueY = "value";
                    series[seriesdata].name = seriesdata;
                    series[seriesdata].dataFields.valueYShow = "changePercent";
                    series[seriesdata].tooltipText = "{name}: {valueY.changePercent.formatNumber('[#0c0]+#.00|[#c00]#.##|0')}%";
                    series[seriesdata].tooltip.getFillFromObject = false;
                    series[seriesdata].tooltip.getStrokeFromObject = true;
                    series[seriesdata].tooltip.background.fill = am4core.color("#fff");
                    series[seriesdata].tooltip.background.strokeWidth = 2;
                    series[seriesdata].tooltip.label.fill = series[seriesdata].stroke;
                    series[seriesdata].tooltip.fontSize = 12;
                    //series[seriesdata].tooltip.animationEasing = 1;//1/2 second
                    //series[seriesdata].tooltip.animationDuration = 1;

                    series[seriesdata].tooltip.label.fill = series[seriesdata].stroke;

                    if (series1 == null) {series1 = seriesdata;}

                }

                var valueAxis2 = chart.yAxes.push(new am4charts.ValueAxis());
                valueAxis2.tooltip.disabled = true;
                // height of axis
                valueAxis2.height = am4core.percent(35);
                valueAxis2.zIndex = 3
                // this makes gap between panels
                valueAxis2.marginTop = 30;
                valueAxis2.renderer.baseGrid.disabled = true;
                valueAxis2.renderer.inside = true;
                valueAxis2.renderer.labels.template.verticalCenter = "bottom";
                valueAxis2.renderer.labels.template.padding(2, 2, 2, 2);
                //valueAxis.renderer.maxLabelPosition = 0.95;
                valueAxis2.renderer.fontSize = 14;

                valueAxis2.renderer.gridContainer.background.fill = am4core.color("#000000");
                valueAxis2.renderer.gridContainer.background.fillOpacity = 0.05;

                valueAxis2.renderer.labels.template.fill = am4core.color("#f1f2f3");
                valueAxis2.renderer.grid.template.stroke = am4core.color("#c1c2c3");
                valueAxis2.renderer.line.stroke = am4core.color("#f1f2f3");

                valueAxis2.renderer.labels.template.fontSize = 14;

                //var volumeSeries = chart.series.push(new am4charts.StepLineSeries());
                //volumeSeries.fillOpacity = 1;
                //volumeSeries.fill = series[series1].stroke;
                //volumeSeries.stroke = series[series1].stroke;
                //volumeSeries.dataFields.dateX = "date";
                //volumeSeries.dataFields.valueY = "value"//"quantity";
                //volumeSeries.yAxis = valueAxis2;
                //volumeSeries.tooltipText = "Volume: {valueY.value}";
                //volumeSeries.name = "Series 2";
                //// volume should be summed
                //volumeSeries.groupFields.valueY = "sum";
                //volumeSeries.tooltip.label.fill = volumeSeries.stroke;

                chart.cursor = new am4charts.XYCursor();
                chart.fontSize = 14;

                var scrollbarX = new am4charts.XYChartScrollbar();
                scrollbarX.series.push(series[series1]);
                scrollbarX.marginBottom = 20;

                scrollbarX.height = 50;

                var sbSeries = scrollbarX.scrollbarChart.series.getIndex(0);
                sbSeries.dataFields.valueYShow = undefined;
                chart.scrollbarX = scrollbarX;

                chart.legend = new am4charts.Legend();
                chart.legend.labels.template.text = "[normal {color}]{name}[/]";
                chart.legend.labels.template.fontSize = 14;

        });
    },
    simple_line_chart: function (chartdata, divid) {

        require([
            'amcharts4/core',
            'amcharts4/charts',
            'amcharts4/themes/animated'
        ], function (am4core, am4charts, am4themes_animated) {
            am4core.useTheme(am4themes_animated);

            var chart = am4core.create(divid, am4charts.XYChart);
                chart.paddingRight = 20;

            var dateAxis = chart.xAxes.push(new am4charts.DateAxis());
                dateAxis.tooltip.disabled = true;
                dateAxis.renderer.line.stroke = am4core.color("#f1f2f3");
                dateAxis.renderer.labels.template.fill = am4core.color("#f1f2f3");
                dateAxis.renderer.grid.template.stroke = am4core.color("#c1c2c3");
                dateAxis.renderer.labels.template.fontSize = 14;
                dateAxis.renderer.line.strokeOpacity = 1;
                dateAxis.renderer.line.strokeWidth = 2;
                dateAxis.renderer.grid.template.strokeOpacity = 1;

                dateAxis.renderer.grid.template.strokeWidth = 0.5;

                //dateAxis.baseInterval = { "timeUnit": "minute", "count": 5 };

                //dateAxis.groupData = true;

            var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
                valueAxis.tooltip.disabled = true;
                valueAxis.renderer.minWidth = 35;
                
                
                valueAxis.renderer.line.strokeOpacity = 1;
                valueAxis.renderer.line.strokeWidth = 2;
                valueAxis.renderer.grid.template.strokeOpacity = 1;
                
                valueAxis.renderer.grid.template.strokeWidth = 1;
                valueAxis.renderer.labels.template.fontSize = 14;
                valueAxis.renderer.labels.template.fill = am4core.color("#f1f2f3");
                valueAxis.renderer.grid.template.stroke = am4core.color("#c1c2c3");
                valueAxis.renderer.line.stroke = am4core.color("#f1f2f3");

            // create a line series for each set of data received

             var series = {};

             for (var seriesdata in chartdata) {

                 series[seriesdata] = chart.series.push(new am4charts.LineSeries());
                 series[seriesdata].data = chartdata[seriesdata];
                 series[seriesdata].dataFields.dateX = "date";
                 series[seriesdata].dataFields.valueY = "value";
                 series[seriesdata].name = seriesdata;
                 console.log(series[seriesdata].dataItems);
                }

            chart.legend = new am4charts.Legend();
            chart.legend.labels.template.text = "[normal {color}]{name}[/]";

                //chart.cursor = new am4charts.XYCursor();
                //chart.cursor.snapToSeries = series;
                //chart.cursor.xAxis = dateAxis;

                //var scrollbarX = new am4charts.XYChartScrollbar();
                //scrollbarX.series.push(['tjx']);
                //scrollbarX.maxHeight = "20px"
                //chart.scrollbarX = scrollbarX;
                //chart.scrollbarX.background.fill = am4core.color("#dc67ab");
                //chart.scrollbarX.background.fillOpacity = 0.2;
                //chart.scrollbarX.maxHeight = "20px"

        });
    }
}