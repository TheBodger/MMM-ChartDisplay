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

		//determine what the feedstorekey is

		var feedstorekey = payload.providerid;

		//now we add the provided feeds to the feedstorage
		//we support multiple sets of data in the feedsets area
		//assumption is that the provider will NOT send duplicate feeds so we just update them if already stored

		var feedsets = { '': { items: [] } };

		var feedstorage = {
			key: '', sortidx: -1, titles: [], sourcetitles: [], providers: [], sortkeys: [], feedsets: {}
		};

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

		for (var didx = 0; didx < payload.payload.length; didx++) {

			var setid = payload.payload[didx].setid;

			if (this.consumerstorage[moduleinstance].feedstorage[feedstorekey].feedsets[setid] == null) {

				this.consumerstorage[moduleinstance].feedstorage[feedstorekey].feedsets[setid] = { items: [], groupeditems: [] };

			}

			//now we have the feedstorage setup, we can process the items

			//find the set of rules that match the incoming data set setid

			var ruleset = this.consumerstorage[moduleinstance].config.setrules.find(item => {
				return item.setid == setid;
			})

			if (ruleset == null) { console.error("no valid rule set found in config"); return; }
			if (ruleset.filter == null) { console.error("no valid rule set found in config: filters"); return; }
			if (ruleset.reformat == null) { console.error("no valid rule set found in config : reformat"); return; }
			if (ruleset.grouping == null) { console.error("no valid rule set found in config : grouping"); return; }

			var filterrules = ruleset.filter;
			var reformatrules = ruleset.reformat;
			var groupingrules = ruleset.grouping;

			filterrules['filtervaluename'] = '';

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
				//this is only applied here if there is no group by rules
				//if there are group by rules then this applied as part of the group stage

				if (filterrules.dropvalues != null && groupingrules.groupby == null) {
					if (!isNaN(parseFloat(item.value))) {
						if (filterrules.dropvalues > parseFloat(item.value)) { keepitem = false; }
					}
				}

				if (keepitem) {

					//start storing and building the output as we are keeping this item

					newitem.subject = item.subject; newitem['subjectname'] = 'subject';
					newitem.object = item.object; newitem['objectname'] = 'object';
					newitem.value = item.value; newitem['valuename'] = 'value';
					newitem.timestamp = item.timestamp; newitem["timestampname"] = 'timestamp'; newitem["timestampformatted"] = item.timestamp;

					// ---------------------------- reformat/rename stage ----------------------------------

					//as we will be merging etc after this step then we have to keep the original 
					//names as well as the new names

					if (reformatrules.subjectAKA != null) { newitem.subjectname = reformatrules.subjectAKA; }
					if (reformatrules.valueAKA != null) { newitem.valuename = reformatrules.valueAKA; filterrules.filtervaluename = newitem.valuename; }
					if (reformatrules.timestampAKA != null) { newitem.timestampname = reformatrules.timestampAKA; }
					if (reformatrules.objectnameAKA != null) { newitem.objectname = reformatrules.objectnameAKA; }

					if (reformatrules.timestampformat != null) {
						newitem.timestampformat = moment(item.timestamp).format(reformatrules.timestampformat)
						if (reformatrules.timestampformat.toLowerCase() == "x") { newitem.timestampformat = parseInt(newitem.timestampformat) ;}
					}

					if (reformatrules.dropkey != null) { //this should be an array
						for (var didx = 0; didx < reformatrules.dropkey.length; didx++) {

							delete newitem[reformatrules.dropkey[didx]];
							delete newitem[reformatrules.dropkey[didx] + "name"];
							if (reformatrules.dropkey[didx] == "timestamp") { delete newitem[reformatrules.dropkey[didx] + "formatted"] }
						}
					}

					self.consumerstorage[moduleinstance].feedstorage[feedstorekey].feedsets[setid].items.push(newitem);

				}

			});

		}

		// -------------------------------------- aggregator reference stage ------------------------------------------

		//if a reference set is provided for any of the items (subject,object,value etc)
		//this is where we replace the incoming value with the reference value

		//any mismatching items will be dropped
		//any matching item's values will be replaced and the original information dropped

		//this can also be used to filter out items when they have a subject we are not interesedted in / or interested in

		//if mismatched console.info dropped item: because a mismatch occured on field: value:

		//TODO use self.consumerstorage[moduleinstance].feedstorage[feedstorekey].feedsets[setid].items


		// -------------------------------------- aggregator merge stage with template  ------------------------------------------

		//we have to group the data together now using the groupby key 
		//as the grouping 
		//and also prepare the data to be merged in the final step using the template

		if (groupingrules.groupby != null) { //if not set then we just process the items straight into the merge step

			//clear the grouping so we can start afresh

			self.consumerstorage[moduleinstance].feedstorage[feedstorekey].feedsets[setid].groupeditems = [];

			// see the file usingLinq.md

			//the following groupby also renames the fields so at the end of the group by everything is okdokey

			var keySelector = "{key : $." + groupingrules.groupby + "}"
			var elementSelector = '{';

			//use the first stored item as a list of all the data we need to keep after grouping

			var tempitem = self.consumerstorage[moduleinstance].feedstorage[feedstorekey].feedsets[setid].items[0];

			var ignorekeysstarting = "afngalkdhfgodhfgoadfg"; //random never to be matched string

			if (groupingrules.groupby.startsWith("timestamp")) { ignorekeysstarting = "timestamp" }

			for (var key in tempitem) {

				if (tempitem[key + "name"] != null && key != groupingrules.groupby && !key.startsWith(ignorekeysstarting)) {

					if (reformatrules.timestampformat != null && key == "timestamp") {
						elementSelector = elementSelector + tempitem[key + "name"] + ": $." + 'timestampformat' + ",";
					}
					else {
						elementSelector = elementSelector + tempitem[key + "name"] + ": $." + key + ",";
					}
				}
				
			}

			elementSelector = elementSelector + '}';

			var resultSelector = "{ key : $.key, values : $$.toArray() }"
			var compareSelector = "String($.key)"

			if (groupingrules.aggregate == null) {

				var groupeddata = linq.from(self.consumerstorage[moduleinstance].feedstorage[feedstorekey].feedsets[setid].items)
					.groupBy(
						keySelector,
						elementSelector,
						resultSelector,
						compareSelector
					)
					.toArray();
			}

			else {

				//use the defined valuename in the selection, as we can only aggregate on the value (even though a timestamp can be also aggregated)
				//if there is need to aggregate a timestamp then the value must equal the timestamp

				var resultSelector = "{ key : $.key, " + tempitem["valuename"] + " : $$." + groupingrules.aggregate + "('$.value') }"

				var groupeddata = linq.from(self.consumerstorage[moduleinstance].feedstorage[feedstorekey].feedsets[setid].items)
					.groupBy(
						keySelector,
						null,
						resultSelector,
						compareSelector
					)
					.toArray();
			}

			//// we now have all the data with the correct names, so we have to reverse back into the data
			//// to apply the drop values rules if it exists

			//post process into the grouped items array

			self.consumerstorage[moduleinstance].feedstorage[feedstorekey].feedsets[setid].groupeditems = groupeddata;

		}
		else {

			//we have to complete the rename and drop unwanted stuff here 

			self.consumerstorage[moduleinstance].feedstorage[feedstorekey].feedsets[setid].items.forEach(function (item) {

				var tempitem = {};

				for (var key in item) {
					if (item[key + "name"] != null) {
						if (reformatrules.timestampformat != null && key == "timestamp") {
							tempitem[item[key + "name"]] = item['timestampformat'];
						}
					else{
						tempitem[item[key + "name"]] = item[key];
						}
					}
				}

				self.consumerstorage[moduleinstance].feedstorage[feedstorekey].feedsets[setid].groupeditems.push(tempitem);
			});

		}

		// ----------------------------------- merge step -------------------------------------
		//TODO merge disparate data based on a template //may need to NOT lose the names until here so we can merge correctly
		// ------------------------------------------------------------------------------------

		var chartdata = {}; //ready to go for this particular chart requirement
		var groupdata = self.consumerstorage[moduleinstance].feedstorage[feedstorekey].feedsets[setid].groupeditems;

		if (groupingrules.groupby != null) {

			//if grouping by, we need to build a pseudo set: from multiple values in an array

			//for time being we drop any items in the array not matching the value filter rule
			//if all values are dropped from an item, then that item is dropped
			//be aware that some charts expect to see all possible values in each set, so this may negatively impact the chart appearance
			//be aware that the chartdata could be empty at the end of this!!

			if (groupingrules.aggregate == null) {

				for (var gidx = 0; gidx < groupdata.length; gidx++) {

					chartdata[groupdata[gidx].key] = [];

					var aidx = 0;
					groupdata[gidx].values.forEach(function (item) {

						if ((filterrules.dropvalues != null && item[filterrules.filtervaluename] > filterrules.dropvalues) || filterrules.dropvalues == null) {
							chartdata[groupdata[gidx].key][aidx] = item;
							aidx++;
						}
					});

					if (filterrules.dropvalues != null && chartdata[groupdata[gidx].key].length == 0) { delete chartdata[groupdata[gidx].key]; }

					if (filterrules.warnonarraysunequal && gidx > 0 && chartdata[groupdata[gidx].key].length != chartdata[groupdata[gidx - 1].key].length) {
						console.error("The output arrays are of uneven length");
                    }
				}

			}
			else {

				//if grouping by, we need to build a pseudo set: from a single value because we did an aggregate

				//for time being we will drop any values less than the filter, we use the 
				//filterrules.filtervaluename field key name
				//in this version as there will ever be one value, because we grouped and aggregated, we just ignore the item altogether

				for (var gidx = 0; gidx < groupdata.length; gidx++) {

					if ((filterrules.dropvalues != null && groupdata[gidx][filterrules.filtervaluename] > filterrules.dropvalues) || filterrules.dropvalues == null) {

						chartdata[groupdata[gidx].key] = [];
						chartdata[groupdata[gidx].key][0] = {};

						//as we have grouped by and aggregated the data is in a different format and we add each datapoint we find
						//into the array keyed on the key of that aggregated field

						for (var key in groupdata[gidx]) {
							if (key != 'key') {
								chartdata[groupdata[gidx].key][0][key] = groupdata[gidx][key];
							};
						}
					}
				}
			}

		}
		else {  // no grouping end up with simple array of items within a setid witch could be a stock name as part of an array of stocks

			chartdata[setid] = {items: groupdata};

        }

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