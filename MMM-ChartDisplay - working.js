/* global Module, MMM-ChartDisplay */

/* Magic Mirror
 * Module: MMM-ChartDisplay
 *
 * By Neil Scott
 * MIT Licensed.
 */

var startTime = new Date(); //use for getting elapsed times during debugging

var feedDisplayPayload = { consumerid: '', providerid: '', payload: '' };

Module.register("MMM-ChartDisplay", {

	// Default module config.
	// WARNING - added 2 layers of config, so make sure you have a display and an article section as parents to the settings
	//in config.js

	defaults: {
		text: "... loading",
		id: "MMCD1", // the unique id of this consumer
		setrules: [{						        //an array of rules to be applied to each incoming set
			setid: null,							//must match the setids used in the provider so it can tracks the different data
			filter: {

				"keepsubjects": null,				// an array of subjects only to keep, TODO both accept and reject
				"timestamp_min": null,				// the minimum item timestamp to keep TODO Range
				dropvalues: null,					// the minimum value to accept TODO = range

			},
			reformat: {
				"dropkey": null,					//array of item fields to drop
				"subjectAKA": null,					//rename the subject field name
				"valueAKA": null,					//rename the value field name
				"objectAKA": null,					//rename the object field name
				"timestampAKA": null,				//rename the timestamp field name
				"timestampformat": null,			//display the timestamp in this format (i.e. "YYYY-MM-DD")
			},
			grouping: {
				groupby: null,						//the field name to group the data together 
													//should use any reformatted name data (i.e. .subject or timestampformatted)
				action:null,						//the action to apply to any values within the group (sum,avg etc)
            }
		}],
		merge: {
			//add a template that represents the output format, includes types of enhanced set, set, item, combined subject
			//field names are standard / not the renamed ones // handle in the code
			outputsetid: null,						// the field name to be used as the setid, if null uses "1","2","3"
			//template will take form of "setid".fieldname (i.e. "births".subject )
			template: null							// TODO the output set template,
													// setid will be replaced with the setid of the incoming data to merge
													// a format "{'setid'.timestampformat:[{'setid'.subject,'setid'.value}]}"
													// example: {test.timstampformat:[{test.subject,test.value}]}

        },
        charttype: null,                            // the type of chart prewritten and stored in displaycharts.js
                                                    
	},

	start: function () {

		Log.log(this.name + ' is started!');

		//this.updateDom(speed)
		//speed Number - Optional.Animation speed in milliseconds.
		//Whenever your module need to be updated, call the updateDom(speed) method.

		var self = this;

		this.sendNotificationToNodeHelper("CONFIG", { moduleinstance: this.identifier, config: this.config });

		//now we wait for the providers to start ... providing

        this.sendNotificationToNodeHelper("STATUS", this.identifier);

        this.chartdata = null;

	},

	showElapsed: function () {
		endTime = new Date();
		var timeDiff = endTime - startTime; //in ms
		// strip the ms
		timeDiff /= 1000;

		// get seconds 
		var seconds = Math.round(timeDiff);
		return(" " + seconds + " seconds");
	},

	getScripts: function () {
		return [
			'moment.js',	// this file is available in the vendor folder, so it doesn't need to be available in the module folder.
			'vendor/node_modules/requirejs/require.js',
			'loadam4charts.js',
			//this.file("scripts/chart.js")
		]
	},

	//D:\Users\KCPFr\Source\Workspaces\NODEJS\MMDev\MagicMirror\node_modules\requirejs\require.js

	// Define required scripts.
	getStyles: function () {
		return [
		]
	},

	//TODO Setconfig proper merge!!

	notificationReceived: function (notification, payload, sender) {

		var self = this;

		if (sender) {
			Log.log(this.name + " received a module notification: " + notification + " from sender: " + sender.name);
		} else {
			Log.log(this.name + " received a system notification: " + notification);
		}

		if (notification == 'ALL_MODULES_STARTED') {
			//build my initial payload for any providers listening to me

			feedDisplayPayload.consumerid = this.config.id;
			feedDisplayPayload.payload = "";
			this.sendNotification('MMM-ChartDisplay_READY_FOR_ACTION', feedDisplayPayload);
			Log.log("ALL MODULES STARTED");
		}

		if (notification == 'CHART_PROVIDER_DATA') {
			//some one said they have data, it might be for me !
			
			if (payload.consumerid == this.config.id) {

				Log.log("Got some new data @ " + this.showElapsed());

				//send the data to the aggregator

				this.sendNotificationToNodeHelper("AGGREGATE_THIS", { moduleinstance: self.identifier, payload :payload});

			}
		}

	},

	socketNotificationReceived: function(notification, payload) {
		Log.log(this.identifier + "hello, received a socket notification @ " +  this.showElapsed() + " " + notification + " - Payload: " + payload);

		var self = this;

		this.chartdata = payload.payload.chartdata;

        this.updateDom();
        this.buildchart();

	},

	// Override dom generator.
	getDom: function () {
        Log.log(this.identifier + " Hello from getdom @" + this.showElapsed());

        //only define the wrapper once as the chart will do the business
        //inside it

        if (this.chartdata == null || document.getElementById('chartdiv') ==null) {

            var wrapper = document.createElement("div");
            wrapper.id = this.name + "_chart_div";

            var loadingdiv = document.createElement("div");
            loadingdiv.id = 'loadingdiv';
            loadingdiv.innerHTML = "Loading Data ....";

            var chartdiv = document.createElement("div");
            chartdiv.id = 'chartdiv';
            chartdiv.style.width = '900px';
            chartdiv.style.height = '400px';

            wrapper.appendChild (loadingdiv);
            wrapper.appendChild (chartdiv);
        }
        else {
            wrapper = document.getElementById(this.name + "_chart_div");
            document.getElementById('loadingdiv').innerHTML = '';
        }

		return wrapper;
	},

    buildchart: function () {

        var self = this;

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

        var allData = self.chartdata;

        chart.data = JSON.parse(JSON.stringify(allData[date.toISOString().slice(0, 10)]));
        categoryAxis.zoom({ start: 0, end: 1 / chart.data.length });

        series.events.on("inited", function () {
            setTimeout(function () {
                playButton.isActive = true; // this starts interval
            }, 1000)
        })

        });

	},

	sendNotificationToNodeHelper: function (notification, payload) {
		this.sendSocketNotification(notification, payload);
	},

});

