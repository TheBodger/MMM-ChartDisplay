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
		setrules: [{						//an array of rules to be applied to each incoming set
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
													

		},
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

	getStringTimeDifference: function (ageinmilliseconds) {
		
		var diffSecs = Math.round(ageinmilliseconds / 1000);

		if (diffSecs < 60) { //seconds
			return diffSecs + "s";
		}
		if (diffSecs < (60 * 60)) {//seconds * minutes
			var diffMins = Math.ceil(diffSecs / 60);
			return diffMins + "m";
		}
		if (diffSecs < (60 * 60 * 24)) {//seconds * minutes * hours
			var diffHours = Math.ceil(diffSecs / (60 * 60));
			return diffHours + "h";
		}
		if (diffSecs < (60 * 60 * 24 * 7)) {//seconds * minutes * hours * days
			var diffDays = Math.ceil(diffSecs / (60 * 60 * 24));
			return diffDays + "d";
		}
		if (diffSecs < (60 * 60 * 24 * 30 )) {//seconds * minutes * hours * days in week
			var diffWeeks = Math.ceil(diffSecs / (60 * 60 * 24 * 30));
			return diffWeeks + "w";
		}
		if (diffSecs < (60 * 60 * 24 * 365)) {//seconds * minutes * hours * days in year
			var diffMonths = Math.ceil(diffSecs / (60 * 60 * 24 * 365));
			return diffMonths + "m";
		}
		if (diffSecs >= (60 * 60 * 24 * 366)) {//seconds * minutes * hours * days in year
			var diffYears = Math.ceil(diffSecs / (60 * 60 * 24 * 365));
			return diffYears + "y";
		}
	},

	socketNotificationReceived: function(notification, payload) {
		Log.log(this.identifier + "hello, received a socket notification @ " +  this.showElapsed() + " " + notification + " - Payload: " + payload);

		var self = this;

	},

	// Override dom generator.
	getDom: function () {
		Log.log(this.identifier + " Hello from getdom @" + this.showElapsed());
		var wrapper = document.createElement("div");
		//wrapper.innerHTML = this.buildwrapper();
		return wrapper;
	},

	buildwrapper: function () {
		var trext = "Hello Neil";

		return trext;

	},

	sendNotificationToNodeHelper: function (notification, payload) {
		this.sendSocketNotification(notification, payload);
	},

});

