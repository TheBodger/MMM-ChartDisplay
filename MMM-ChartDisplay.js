/* global Module, MMM-ChartDisplay */

/* Magic Mirror
 * Module: MMM-ChartDisplay
 *
 * By Neil Scott
 * MIT Licensed.
 */

//todo merge multiple feeds based on keys (i.e. a linq join - omg - data will be provided from a data provider picking up a locaol data fgeed)
//	#1 change the WHO coes from UK to GB etc
//  #2 add additional values into a set (i.e. setid:[{v1:1,v2:2v3:34,timestamp:blah}])
//
//todo add group by type (sum,avg etc)
//todo add calculation in join (i.e. sum deaths / population)
//todo always group and sum word input {setid:1,set:[{subject:uk,value:23},{subject:uk,value:233}]} merge and sum on uk
//	mist be merged on the key value before


//CONFIG MERGE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!


var startTime = new Date(); //use for getting elapsed times during debugging

var feedDisplayPayload = { consumerid: '', providerid: '', payload: '' };

Module.register("MMM-ChartDisplay", {

	// Default module config.
	// WARNING - added 2 layers of config, so make sure you have a display and an article section as parents to the settings
	//in config.js

	defaults: {
		//text: "... loading",
		text:"CONFIG MERGE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!",
		id: "MMCD1", // the unique id of this consumer
		setrules: [{						        //an array of rules to be applied to each incoming set
			setid: null,							//must match the setids used in the provider so it can tracks the different data
			filter: {
				keepsubjects: null,				// an array of subjects only to keep, TODO both accept and reject
				timestamp_min: null,				// the minimum item timestamp to keep TODO Range
				dropvalues: null,					// the minimum value to accept TODO = range
				warnonarraysunequal:true,		// if arrays coming out of the merging etc are of unequal lengths, error to console

			},
			reformat: {
				dropkey: null,					//array of item fields to drop
				subjectAKA: null,					//rename the subject field name
				valueAKA: null,					//rename the value field name
				objectAKA: null,					//rename the object field name
				timestampAKA: null,				//rename the timestamp field name
				timestampformat: null,			//display the timestamp in this format (i.e. "YYYY-MM-DD") Supports all moment formats including x and X for unix timestamps//null leave as it comes
			},

			//the input to some chart modules expects the data to be in format of:
			//			{seriesname:[{seriesvalues},{seriesvalues}]}
			//			for the race bar the seriesname should be a date, and then there will be an array of {subject:"subject name",value:amount}
			//			for the word cloud, the seriesname is the word, and there an array of the count of words {count:countofword},
			//			it is important to work backwards from the particular chart you are using to set the config so the correct format is arrived at
			//			by adding an aggregate, the number of items in the array will only be one, although ineffecient, it allows for the flexibility to support many chart types with only simple changes within the chart code to adjust the data to fit that particular chart requirements
			grouping: {
				groupby: null,					//the field name to group the data together 
												//should use any reformatted name data (i.e. .subject or timestampformatted)
				action: null,					//the action to apply to any values within the group (sum,avg etc)
				aggregate: null,				//if grouping by, then aggregate the same values using this function null = just group and output values as an array
												//otherwise apply the aggregate function to obtain a single output value
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
		return (" " + seconds + " seconds");
	},

	getScripts: function () {
		return [
			'moment.js',	// this file is available in the vendor folder, so it doesn't need to be available in the module folder.
			'vendor/node_modules/requirejs/require.js',
			'loadam4charts.js',
			'displaycharts.js',
		]
	},

	// Define required scripts.
	getStyles: function () {
		return [
		]
	},

	//TODO Setconfig proper merge!!

	notificationReceived: function (notification, payload, sender) {

		var self = this;

		if (sender) {
			Log.log(self.identifier + " " + this.name + " received a module notification: " + notification + " from sender: " + sender.name);
		} else {
			Log.log(self.identifier + " " + this.name + " received a system notification: " + notification);
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

			console.log(payload.consumerid)
			console.log(this.config.id)

			if (payload.consumerid == this.config.id) {

				Log.log("Got some new data @ " + this.showElapsed());

				//send the data to the aggregator

				this.sendNotificationToNodeHelper("AGGREGATE_THIS", { moduleinstance: self.identifier, payload: payload });

			}
		}

	},

	socketNotificationReceived: function (notification, payload) {
		var self = this;

		Log.log(self.identifier + " " + this.identifier + "hello, received a socket notification @ " + this.showElapsed() + " " + notification + " - Payload: " + payload);

		if (notification == "NEW_FEEDS_" + this.identifier) {
			if (payload.payload.chartdata != null) {
				this.updateDom();
				this.buildchart(payload.payload.chartdata);
			}
		else {
			console.error("No chartData provided - no call to chart build made")
			}
		}
	},

	// Override dom generator.
	getDom: function () {
		Log.log(this.identifier + " Hello from getdom @" + this.showElapsed());

		//only define the wrapper once as the chart will do the business
		//inside it

		if (document.getElementById(this.identifier + 'chartdiv') == null) {

			var wrapper = document.createElement("div");
			wrapper.id = this.identifier + "_chartdisplay_div";

			var loadingdiv = document.createElement("div");
			loadingdiv.id = this.identifier + 'loadingdiv';
			loadingdiv.innerHTML = "Loading Data ....";

			var chartdiv = document.createElement("div");
			chartdiv.id = this.identifier + 'chartdiv';
			chartdiv.style.width = '40vw';
			chartdiv.style.height = '400px';

			wrapper.appendChild(loadingdiv);
			wrapper.appendChild(chartdiv);
		}
		else {
			wrapper = document.getElementById(this.identifier + "_chartdisplay_div");
			document.getElementById(this.identifier + 'loadingdiv').innerHTML = '';
		}

		return wrapper;
	},

	buildchart: function (chartdata) {

		console.log(this.config.charttype);
		for (var key in chartdata) { console.log(key);}
		console.log(this.identifier);

		displaycharts[this.config.charttype](chartdata, this.identifier + 'chartdiv');

	},

	sendNotificationToNodeHelper: function (notification, payload) {
		this.sendSocketNotification(notification, payload);
	},

});

