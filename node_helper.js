/* global Module, MMM-ChartDisplay */

/* Magic Mirror
 * Module: node_helper
 *
 * By Neil Scott
 * MIT Licensed.
 */

var NodeHelper = require("node_helper");

//this.name String The name of the module

//global Var

var moment = require("moment");
var linq = require("linq");

//pseudo structures for commonality across all modules
//obtained from a helper file of modules

var LOG = require('../MMM-FeedUtilities/LOG');
var RSS = require('../MMM-FeedUtilities/RSS');

// get required structures and utilities

const structures = require("../MMM-ChartUtilities/structures");
const utilities = require("../MMM-ChartUtilities/common");

const JSONutils = new utilities.JSONutils();
const configutils = new utilities.configutils();

module.exports = NodeHelper.create({

	start: function () {

		this.debug = true;

		console.log(this.name + ' is started!');
		this.consumerstorage = {}; // contains the config and feedstorage

		this.currentmoduleinstance = '';
		this.logger = {};

	},

	setconfig: function (aconfig) {

		var moduleinstance = aconfig.moduleinstance;
		var config = aconfig.config;

		//store a local copy so we dont have keep moving it about

		this.consumerstorage[moduleinstance] = { config: config, feedstorage: {} };

		//additional work to simplify the config for use in the module
	},

	processfeeds: function (newfeeds) {

		var self = this;

		var moduleinstance = newfeeds.moduleinstance; //needed so the correct module knows what to do with this data
		var payload = newfeeds.payload;

		//depending on the config options for this moduleinstance

		//if we are keeping the feeds separate, then we will have to use the provided feed title as a key into the feedstorage
		//otherwise we will use a key of "merged feed"

		//determine what the feedstorekey is

		var feedstorekey = payload.providerid;

		//now we add the provided feeds to the feedstorage
		//we support multiple sets of data in the feedsets area
		//assumption is that the provider will NOT send duplicate feeds so we just add them to the end

		var feedsets = {'': { items: [] } };

		var feedstorage = {
			key: '', sortidx: -1, titles: [], sourcetitles: [], providers: [], sortkeys: [], feedsets: {} };

		//we will need to store all the separate sets of data provided here/ TBD

		//Determine if we have an entry for the moduleinstance of the display module in feedstorage

		if (this.consumerstorage[moduleinstance].feedstorage[feedstorekey] == null) {

			feedstorage.key = feedstorekey;
			feedstorage.titles = [payload.title];				// add the first title we get, which will be many if this is a merged set of feeds
			feedstorage.sourcetitles = [payload.sourcetitle];	// add the first sourcetitle we get, which will be many if this is a merged set of feeds
			feedstorage.providers = [payload.providerid];		// add the first provider we get, whic will be many if there are multiple providers and merged

			this.consumerstorage[moduleinstance].feedstorage[feedstorekey] = feedstorage;
		}

		//determine if we have an entry for the data set(s) just received

		//feedstorage.feedsets[setkey] = { items: [] };

		//loop on sets first TBD

		for (var didx = 0; didx < payload.payload.length;didx++) {

			var setid = payload.payload[didx].setid; 

			if (this.consumerstorage[moduleinstance].feedstorage[feedstorekey].feedsets[setid] == null) {

				this.consumerstorage[moduleinstance].feedstorage[feedstorekey].feedsets[setid] = { items: [],groupeditems:[] };

			}

			//now we have the feedstorage setup, we can process the items

			//find the set of rules that match the incoming data set setid

			var ruleset = this.consumerstorage[moduleinstance].config.setrules.find(item => {
				return item.setid == setid;
			})

			if (ruleset == null) { console.error("no valid rule set found in config"); return; }	
			if (ruleset.filter == null) { console.error("no valid rule set found in config"); return; }	
			if (ruleset.reformat == null) { console.error("no valid rule set found in config"); return; }	
			if (ruleset.grouping == null) { console.error("no valid rule set found in config"); return; }	

			var filterrules = ruleset.filter;
			var reformatrules = ruleset.reformat;
			var groupingrules = ruleset.grouping;

			payload.payload[didx].itemarray.forEach(function (item) {

				// -------------------------filter stage -----------------------------------------------

				//check to see if we want to drop/keep this item because of a filter rule match

				var keepitem = true;
				var newitem = new structures.NDTFItem();

				// look to see if the subject matches the list of subjects required

				if (filterrules.keepsubjects != null) {
					if (filterrules.keepsubjects.indexOf(item.subject) == -1) { keepitem = false; }
				}

				// remove any items older than the min date

				if (filterrules.timestamp_min != null) {

					if (moment(item.timestamp) < moment(filterrules.timestamp_min)) {
						keepitem = false;
					}
				}

				//remove any items with a value less than this value

				if (filterrules.dropvalues != null) {
					if (!isNaN(parseFloat(item.value))) {
						if (filterrules.dropvalues > parseFloat(item.value)) { keepitem = false; }
					}
				}

				if (keepitem) {

					//start storing and building the output as we are keeping this item

					newitem.subject = item.subject; newitem['subjectname']= 'subject';
					newitem.object = item.object; newitem['objectname']= 'object';
					newitem.value = item.value; newitem['valuename'] = 'value';
					newitem.timestamp = item.timestamp; newitem["timestampname"] = 'timestamp'; newitem["timestampformatted"] = item.timestamp;

					// ---------------------------- reformat/rename stage ----------------------------------

					//as we will be merging etc after this step then we have to keep the original 
					//names as well as the new names

					if (reformatrules.subjectAKA != null) { newitem.subjectname = reformatrules.subjectAKA; }
					if (reformatrules.valueAKA != null) { newitem.valuename = reformatrules.valueAKA; }
					if (reformatrules.timestampAKA != null) { newitem.timestampname = reformatrules.timestampAKA; }
					if (reformatrules.objectnameAKA != null) { newitem.objectname = reformatrules.objectnameAKA; }

					if (reformatrules.timestampformat != null) { newitem.timestampformat = moment(item.timestamp).format(reformatrules.timestampformat)}

					if (reformatrules.dropkey != null) { //this should be an array
						for (var didx = 0; didx < reformatrules.dropkey.length; didx++) {

							delete newitem[reformatrules.dropkey[didx]];
							delete newitem[reformatrules.dropkey[didx] + "name"];
							if (reformatrules.dropkey[didx] == "timestamp") { delete newitem[reformatrules.dropkey[didx] + "formatted"]}
						}
					}

					self.consumerstorage[moduleinstance].feedstorage[feedstorekey].feedsets[setid].items.push(newitem);
				}

			});

		}

		console.error(self.consumerstorage[moduleinstance].feedstorage[feedstorekey].feedsets[setid].items);

		// -------------------------------------- aggregator sort stage ------------------------------------------


		// -------------------------------------- aggregator merge stage with template  ------------------------------------------

		//we have to group the data together now using the groupby key 
		//as the grouping 
		//and also prepare the data to be merged in the final step using the template

		if (groupingrules.groupby != null) { //if not set then we just process the items straight into the merge step

			//clear the grouping so we can start afresh

			self.consumerstorage[moduleinstance].feedstorage[feedstorekey].feedsets[setid].groupeditems = [];

			//use linq to get a nice group by set
			//build the query from the paramters

			// use fourth argument to groupBy (compareSelector)
			var teams = linq.from(self.consumerstorage[moduleinstance].feedstorage[feedstorekey].feedsets[setid].items)
				.groupBy(
					"$.timestampformat",
					"'{'+$.subjectname+':'+$.subject+','+$.valuename+':'+$.value+'}'",
					function (key, group) { return { s: key, o: group.toJoinedString(',') } },
					function (key) { return key.toString() }).toArray();

			//console.info(teams);

			//convert the result to json

			var t = JSON.stringify("[" + teams["o"] + "]");

			console.info(t);

			//post process into the grouped items array

		}
		else {
			self.consumerstorage[moduleinstance].feedstorage[feedstorekey].feedsets[setid].groupeditems = self.consumerstorage[moduleinstance].feedstorage[feedstorekey].feedsets[setid].items
		}

		// merge step



		var chartdata = {}; //ready to go for this particular chart requirement

		// -------------------------------------- aggregator send stage  ------------------------------------------

		this.sendNotificationToMasterModule("NEW_FEEDS_" + moduleinstance, { payload: { chartdata : chartdata} });

	},

	showstatus: function (moduleinstance) {
		//console.log("MMM Module: " + moduleinstance);
		console.log('============================ start of status ========================================');

		console.log('config for consumer: ' + moduleinstance);

		console.log(this.consumerstorage[moduleinstance].config);

		console.log('============================= end of status =========================================');

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

	stop: function () {
		console.log("Shutting down node_helper");
	},

	socketNotificationReceived: function (notification, payload) {
		//console.log(this.name + " NODE_HELPER received a socket notification: " + notification + " - Payload: " + payload);

		//we will receive a payload with the moduleinstance of the consumerid in it so we can store data and respond to the correct instance of
		//the caller - i think that this may be possible!!

		if (this.logger[payload.moduleinstance] == null) {

			this.logger[payload.moduleinstance] = LOG.createLogger("logfile_" + payload.moduleinstance + ".log", payload.moduleinstance);

		};

		this.currentmoduleinstance = payload.moduleinstance;

		switch (notification) {
			case "CONFIG": this.setconfig(payload); break;
			case "RESET": this.reset(payload); break;
			case "AGGREGATE_THIS":this.processfeeds(payload); break;
			case "STATUS": this.showstatus(payload); break;
		}
	},

	sendNotificationToMasterModule: function(stuff, stuff2){
		this.sendSocketNotification(stuff, stuff2);
	}

});