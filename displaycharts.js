//contains all the prewritten code to display the charts
//each chart is standalone, and will have data provided to it through the variable this.chartdata.
//copied from the examples in amcharts4/examples/javascript

//Foo = {
//    bar: function () {
//        alert("baz");
//    }
//}

displaycharts = {

    bar_chart_race: function (chartdata) {

        require([
            'amcharts4/core',
            'amcharts4/charts',
            'amcharts4/themes/animated'
        ], function (am4core, am4charts, am4themes_animated) {

            am4core.useTheme(am4themes_animated)

            var chart = am4core.create("chartdiv", am4charts.XYChart);
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
    line_chart_race: function (chartdata) { }
}