/* global Module, MMM-ChartDisplay */

/* Magic Mirror
 * Module: MMM-ChartDisplay
 *
 * By Neil Scott
 * MIT Licensed.
 */

//todo merge multiple feeds based on keys (i.e. a linq join - omg - data will be provided from a data provider picking up a local data feed)
//	#1 change the WHO coes from UK to GB etc / DONE
//  #2 add additional values into a set (i.e. setid:[{v1:1,v2:2v3:34,timestamp:blah}])
//  
//	will need the set rules to allow the merging process to largely raw data (retain the default sub,obj,val,tsmp) / rename fields
//  data may need to be sorted into an order first amd match on entry by entry 
//  add a multi key match option
//
//
//	will require that the 
//
//
//
//
//
//  merge template	= the setids, wait for every setid before releasing to main module
//					= merge rules, what is the merge key (setid.key) and the output data (setid. o/s/t/v)	
//					= new output data format, setid. and also use whatever renames were applied, up to getting config correct
//					= names have to be setid.name only way of differentiating the values
//
//					examples:
//
//
//				merge {
//					fileprocess: true/false					// if true will serialise all the data to disk and use file processing instead of in memory prior to building the ouput
//					input: [setids]							// list of the setids to monitor/store/process
//					sort: true/false						// use the matchkeys to sort each setid
//					casesensitive:true/false				//sorting and matching is sensitive/insensitive to case
//					matchkeys: [setid.key, setid.key,..]	// multiple key levels matching/sorting from left to right
//															// key is the AKA name of a field, the setid indicates the main match driver
//															// the key name must be the same across all sets to sort/match
//					output: [setid.field,setid.field,setid.field,..] // will produce a [setid.key:{setid.filed,etc,etc}]
//															// if left blank will copy over any field not present already in the ouput from the setid key/values
//					
//}


//
//template will take form of "setid".fieldname (i.e. "births".subject )
//template: null							// TODO the output set template,
			// setid will be replaced with the setid of the incoming data to merge
			// a format "{'setid'.timestampformat:[{'setid'.subject,'setid'.value}]}"
			// example: {test.timstampformat:[{test.subject,test.value}]}
//
//
//
//
//
//
//todo add calculation in join (i.e. sum deaths / population)
//todo always group and sum word input {setid:1,set:[{subject:uk,value:23},{subject:uk,value:233}]} merge and sum on uk
//	must be merged on the key value before



var startTime = new Date(); //use for getting elapsed times during debugging

var feedDisplayPayload = { consumerid: '', providerid: '', payload: '' };

Module.register("MMM-ChartDisplay", {

	// Default module config.
	// WARNING - added 2 layers of config, so make sure you have a display and an article section as parents to the settings
	//in config.js

	defaults: {
		text: "... loading",
		id: null, // the unique id of this consumer.ie MMCD1
		setrules: {						        //an array of rules to be applied to each incoming set
			setid: null,							//must match the setids used in the provider so it can tracks the different data
			filter: {
				keepsubjects: null,				// an array of subjects only to keep, TODO both accept and reject
				timestamp_min: null,				// "today" or must be in a valid moment.js format the minimum item timestamp to keep TODO Range
				dropvalues: null,					// the minimum value to accept TODO = range
				warnonarraysunequal: false,		// if arrays coming out of the merging etc are of unequal lengths, report the error to console
												//some charts need all items across a time period to be present to work properly

			},
			reformat: {
				dropkey: null,					//array of item fields to drop
				subjectAKA: null,				//rename the subject field name
				valueAKA: null,					//rename the value field name
				objectAKA: null,				//rename the object field name
				timestampAKA: null,				//rename the timestamp field name
				timestampformat: null,			//display the timestamp in this format (i.e. "YYYY-MM-DD") Supports all moment formats including x and X for unix timestamps//null leave as it comes
			},

			references: []						//array of references and the rules to apply them to this setid. not defaults as all entries must be entered in the config
				//input:null,						//local file name of the reference file / must be in NDTF standard
				//setmatchkey: null,				//the name of the key (subject,value,object,timestamp,timestampformat) to match on in the set data
				//refmatchkey: null,				//the name of the key to match from the reference data
				//setvalue: null,					//the name of the field (subject,value,object,timestamp,timestampformat) to replace in the set data
				//refvalue: null,					//the name of the field to use to replace from the referene data								
            ,

			//the input to some chart modules expects the data to be in format of:
			//			{seriesname:[{seriesvalues},{seriesvalues}]}
			//			for the race bar the seriesname should be a date, and then there will be an array of {subject:"subject name",value:amount}
			//			for the word cloud, the seriesname is the word, and there an array of the count of words {count:countofword},
			//			it is important to work backwards from the particular chart you are using to set the config so the correct format is arrived at
			//			by adding an aggregate, the number of items in the array will only be one, although inefficient, 
			//			it allows for the flexibility to support many chart types with only simple changes within the chart code to adjust the data 
			//			to fit that particular chart requirements
			grouping: {
				groupby: null,					//the field name to group the data together 
												//should use any reformatted name data (i.e. .subject or timestampformatted)
				action: null,					//the action to apply to any values within the group (sum,avg etc)
				aggregate: null,				//if grouping by, then aggregate the same values using this function null = just group and output values as an array
												//otherwise apply the aggregate function to obtain a single output value
				equalisearrays: false,			//merge previous entries to fill missing items across multiple entries in an array. 
												//requires the 1st entry to be complete
												//only available if warnonarraysunequal=true
												//only available if grouping data and not aggregating data
				resort: false,					//resorts the data prior to going into the equalisarrays step, sorts on the groupby field

			}
		},
		merge: {
			//add a template that represents the output format, includes types of enhanced set, set, item, combined subject
			//field names are standard / not the renamed ones // handle in the code
			outputsetid: null,						// the field name to be used as the setid, if null uses "1","2","3"
        	fileprocess: false,						// if true will serialise all the data to disk and use file processing instead of in memory prior to building the ouput
        	input: []	,							// list of the setids to monitor/store/process/merge
        	sort: true	,							// use the matchkeys to sort each setid
        	casesensitive:true	,					//sorting and matching is sensitive/insensitive to case
        	matchkeys: []	,						// multiple key levels matching from left to right (setid.key, setid.key,..)
        											// key is the AKA name of a field, the first one will provide the setid.key in the output
        											// the first key is king and everything must match that record by record or get discarded
        	output: null	,						// will produce a [setid.key:{setid.value,etc,etc}]
        											// if left blank will copy over any field not present already in the ouput from the setid key/values
        
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

	setConfig: function (config) {  //replace the standard to ensure feeds defaults are correctly set
		this.config = Object.assign({}, this.defaults, config);
		for (var jidx = 0; jidx < config.setrules.length; jidx++) {
			this.config.setrules[jidx] = Object.assign({}, this.defaults.setrules, config.setrules[jidx]);
			if (config.setrules[jidx].filter != null) {this.config.setrules[jidx].filter = Object.assign({}, this.defaults.setrules.filter, config.setrules[jidx].filter);}
			if (config.setrules[jidx].reformat != null) { this.config.setrules[jidx].reformat = Object.assign({}, this.defaults.setrules.reformat, config.setrules[jidx].reformat); }
			if (config.setrules[jidx].grouping != null) { this.config.setrules[jidx].grouping = Object.assign({}, this.defaults.setrules.grouping, config.setrules[jidx].grouping); }
			if (config.setrules[jidx].references != null) { //as this is an array we need to handle all array entries
				for (ridx = 0; ridx < config.setrules[jidx].references.length; ridx++) {
					this.config.setrules[jidx].references[ridx] = Object.assign({}, this.defaults.setrules.references, config.setrules[jidx].references[ridx]);
				}
			}
			
		}
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

			//console.log(payload.consumerid)
			//console.log(this.config.id)

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
		//for (var key in chartdata) { console.log(key);}
		console.log(this.identifier);

		displaycharts[this.config.charttype](chartdata, this.identifier + 'chartdiv');

	},

	sendNotificationToNodeHelper: function (notification, payload) {
		this.sendSocketNotification(notification, payload);
	},

});

