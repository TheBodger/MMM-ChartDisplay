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
const mergutils = new utilities.mergeutils();

var commonutils = require('../MMM-FeedUtilities/utilities');

const JSONutils = new utilities.JSONutils();
const configutils = new utilities.configutils();


module.exports = NodeHelper.create({

	start: function () {

		this.debug = false;

		console.log(this.name + ' is started!');
		this.consumerstorage = {}; // contains the config and feedstorage

		this.currentmoduleinstance = '';
		this.logger = {};

	},

	setconfig: function (aconfig) {

		var moduleinstance = aconfig.moduleinstance;
		var config = aconfig.config;

		for (var jidx = 0; jidx < config.setrules.length; jidx++) {
			if (config.setrules[jidx].filter != null) {
				config.setrules[jidx].filter.timestamp_min = commonutils.calcTimestamp(config.setrules[jidx].filter.timestamp_min);
			}
		}
		//store a local copy so we dont have keep moving it about

		this.consumerstorage[moduleinstance] = { config: config, feedstorage: {} };

		//init the mergutils utilities in case we are about to start merging data

		mergutils.init(aconfig.config.merge);

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
			feedstorage.providers = [payload.providerid];		// add the first provider we get, which will be many if there are multiple providers and merged

			this.consumerstorage[moduleinstance].feedstorage[feedstorekey] = feedstorage;
		}

		//determine if we have an entry for the data set(s) just received

		//feedstorage.feedsets[setkey] = { items: [] };

		//loop on sets first TBD

		for (var didx = 0; didx < payload.payload.length; didx++) {

			var setid = payload.payload[didx].setid;

			if (this.consumerstorage[moduleinstance].feedstorage[feedstorekey].feedsets[setid] == null) {

				this.consumerstorage[moduleinstance].feedstorage[feedstorekey].feedsets[setid] = { baseitems: [], groupeditems: [] };

			}

			//now we have the feedstorage setup, we can process the items

			//find the set of rules that match the incoming data set setid

			var ruleset = this.consumerstorage[moduleinstance].config.setrules.find(item => {
				return item.setid == setid;
			})

			if (ruleset == null) {
				console.error("no valid rule set found in config"); return;
			}

			//each of the ruleset headings must be present somewhere (defaults or config) but can be empty

			if (ruleset.filter == null) { console.error("no valid rule set found in config: filters"); return; }
			if (ruleset.reformat == null) { console.error("no valid rule set found in config : reformat"); return; }
			if (ruleset.grouping == null) { console.error("no valid rule set found in config : grouping"); return; }
			if (ruleset.references == null) { console.error("no valid rule set found in config : references"); return; }

			var filterrules = ruleset.filter;
			var reformatrules = ruleset.reformat;
			var groupingrules = ruleset.grouping;
			var referencerules = ruleset.references;

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
				//if there are group by rules then this is applied as part of the group stage

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

					// start determining which keyvaluesnames will end up in the array to be equalised, only allowed when grouping none aggregating
					// dont add value as we dont equalise arrays on the value
					if (groupingrules.equalisearrays && groupingrules.groupby != null && groupingrules.aggregate == null) {

						if (groupingrules.groupby = 'timestampformat') { //special case for grouping on timestamp
							groupingrules['equalisearraykeys'] = [newitem.subjectname, 'timestampformat', newitem.objectname];
						}
						else {
							groupingrules['equalisearraykeys'] = [newitem.subjectname, newitem.timestampname, newitem.objectname];
						}
					}

					if (reformatrules.timestampformat != null) {
						newitem.timestampformat = moment(item.timestamp).format(reformatrules.timestampformat)
						if (reformatrules.timestampformat.toLowerCase() == "x") { newitem.timestampformat = parseInt(newitem.timestampformat); }
					}

					if (reformatrules.dropkey != null) { //this should be an array
						for (var didx = 0; didx < reformatrules.dropkey.length; didx++) {

							if (groupingrules['equalisearraykeys'] != null) {
								groupingrules['equalisearraykeys'] = groupingrules['equalisearraykeys'].filter(function (e) { return e !== newitem[reformatrules.dropkey[didx] + "name"] });
							}

							delete newitem[reformatrules.dropkey[didx]];
							delete newitem[reformatrules.dropkey[didx] + "name"];

							if (reformatrules.dropkey[didx] == "timestamp") { delete newitem[reformatrules.dropkey[didx] + "formatted"] }
						}
					}

					self.consumerstorage[moduleinstance].feedstorage[feedstorekey].feedsets[setid].baseitems.push(newitem);

				}

			});

		}

		// -------------------------------------- aggregator reference stage ------------------------------------------

		//check there is something worthwhile to do before we get the data, all reference rulesets must be complete entered
		//if a rules set is valid we load the data here to minimise the data transfers

		var processreferences = true;

		if (referencerules.length == 0) {
			processreferences = false;
		}
		else {
			referencerules.forEach(function (reference, index) {

				if (reference.input == null || reference.setmatchkey == null || reference.refmatchkey == null || reference.setvalue == null || reference.refvalue == null) {
					console.error("reference not valid, missing a value: exit processing of this set", JSON.stringify(reference));
					processreferences = false;
				}
				else {

					var input = JSONutils.getJSON({ useHTTP: false, input: reference.input });

					if (input == null) {
						console.error("Input file missing - exiting processing this set");
					}
					else {
						referencerules[index]['referencedata'] = input;

					}
				}
			})
		}
		//this is a cludge, we deep clone baseitems to a new temporary array of items and then continue

		var items = JSON.parse(JSON.stringify(self.consumerstorage[moduleinstance].feedstorage[feedstorekey].feedsets[setid].baseitems));

		//as we can be deleting items from the array we have to process it in reverse so the idx value is always valid

		if (processreferences) {
			for (var idx = items.length - 1; idx > -1; idx--) {

				referencerules.forEach(function (reference) {

					//now apply the ruleset in the reference to the current item, 

					var item = items[idx];

					var refvalue = reference.referencedata.find(key =>
						key[reference.refmatchkey] == item[reference.setmatchkey])[reference.refvalue];

					if (refvalue == null) { //cant find a match between the two so rules say we delete this item !!
						delete items[idx];
					}
					else { //we got a match so update the item and replace it in the array

						item[reference.setvalue] = refvalue;
						items[idx] = item;

					}

				})
			}
		}

		// -------------------------------------- aggregator merge stage with template  ------------------------------------------
		// if merging is to take place, then each set is stored here until all sets have been received
		// how the hell do we know ? , because the config tells us the setids to look for
		// phew

		var chartdata = {}; //ready to go for this particular chart requirement

		if (this.consumerstorage[moduleinstance].config.merge.input != null) {

			//we have to complete the rename and drop unwanted stuff here 

			var tempitems = [];

			items.forEach(function (item) {

				var tempitem = {};

				for (var key in item) {
					if (item[key + "name"] != null) {
						if (reformatrules.timestampformat != null && key == "timestamp") {
							tempitem[item[key + "name"]] = item['timestampformat'];
						}
						else {
							tempitem[item[key + "name"]] = item[key];
						}
					}
				}

				tempitems.push(tempitem);
			});

			items = [];

			mergutils.storeset(setid, tempitems);

			if (mergutils.storedsetids().length == this.consumerstorage[moduleinstance].config.merge.input.length) {

				console.log(mergutils.mergesets());

				//chartdata[setid] = { items: mergutils.mergesets() };

				this.sendNotificationToMasterModule("NEW_FEEDS_" + moduleinstance, { payload: { chartdata: mergutils.mergesets()} });
			}
		}

		else

		{
			//not merging do all the not merging stuff


			// -----------------------------------------------------------------------------------------------------------------------

			//we have to group the data together now using the groupby key 
			//as the grouping 


			if (groupingrules.groupby != null) { //if not set then we just process the items straight into the merge step

				//clear the grouping so we can start afresh

				self.consumerstorage[moduleinstance].feedstorage[feedstorekey].feedsets[setid].groupeditems = [];

				// see the file usingLinq.md

				//the following groupby also renames the fields so at the end of the group by everything is okdokey

				//remove the groupby from the list of equalisers
				//which of course might be timestampformat; 

				if (groupingrules['equalisearraykeys'] != null) {
					groupingrules['equalisearraykeys'] = groupingrules['equalisearraykeys'].filter(function (e) { return e !== groupingrules.groupby });
				}

				//hopefully we are now at only one entry in the equaliser set.

				var keySelector = "{key : $." + groupingrules.groupby + "}"
				var elementSelector = '{';

				//use the first stored item as a list of all the data we need to keep after grouping

				var tempitem = items[0];

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

					var groupeddata = linq.from(items)
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

					var groupeddata = linq.from(items)
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

				items.forEach(function (item) {

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

			var groupdata = self.consumerstorage[moduleinstance].feedstorage[feedstorekey].feedsets[setid].groupeditems;

			if (groupingrules.groupby != null) {

				//if grouping by, we need to build a pseudo set: from multiple values in an array

				//before we start we can resort the results so far so that we can control the data going into the array equaliser step

				if (groupingrules.resort) {

					groupdata.sort
						(function (a, b) {
							var x = a["key"]
							var y = b["key"]
							if (x < y) { return -1; }
							if (x > y) { return 1; }
							return 0;
						}); 


				}

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

						if (filterrules.dropvalues != null && chartdata[groupdata[gidx].key].length == 0) {
							delete chartdata[groupdata[gidx].key];
						}

						if (filterrules.warnonarraysunequal && gidx > 0 && chartdata[groupdata[gidx].key].length != chartdata[groupdata[gidx - 1].key].length) {

							console.error("The output arrays are of different length");
							if (gidx == 1 && chartdata[groupdata[gidx].key].length > chartdata[groupdata[gidx - 1].key].length) {
								console.error("The first entry in the array is not complete", groupdata[gidx - 1].key,JSON.stringify(chartdata[groupdata[gidx - 1].key]));
							}

							//try to equalise the array entries because of the mismatch
							//the equaliser array contains the key value to match the array entries on
							//if more that one key is present then we have to abort the try

							if (groupingrules['equalisearraykeys'] != null) {
								if (groupingrules['equalisearraykeys'].length > 1) {
									console.error("Multiple entries in the equaliser set, only works when one is present");
								}
							else { // merge the missing entries from the longer set to the shorter set //assumes that the first set is complete

								var arrayOne = chartdata[groupdata[gidx].key];
								var arrayTwo = chartdata[groupdata[gidx - 1].key];
								var matchingkeyname = groupingrules['equalisearraykeys'][0];

								const results1 = arrayOne.filter(({ [matchingkeyname]: id1 }) => !arrayTwo.some(({ [matchingkeyname]: id2 }) => id2 === id1));
								const results2 = arrayTwo.filter(({ [matchingkeyname]: id1 }) => !arrayOne.some(({ [matchingkeyname]: id2 }) => id2 === id1));

								chartdata[groupdata[gidx].key] = [...arrayOne, ...results2];
								chartdata[groupdata[gidx - 1].key] = [...arrayTwo, ...results1];

								console.info("Found the Differences" + JSON.stringify(results1) + " missing from previous entry and this is missing from the current entry" + JSON.stringify(results2));

								//TODO we probably need the sort to occur just before the chartdata is sent so that all data sets are in the same order
								//this sort assumes that all unchanged arrays are in ascending key order
								//and finally need to sort the arrays so they are all in the same order!!
								//we have to do it here as there can be retrospectives changes to array entries

								//here sort the arrays depending on any changes found

									if (results2.length > 0) {

										chartdata[groupdata[gidx].key].sort
											(function (a, b) {
												//var x = a.type.toLowerCase();
												//var y = b.type.toLowerCase();
												var x = a[matchingkeyname]
												var y = b[matchingkeyname]
												if (x < y) { return -1; }
												if (x > y) { return 1; }
												return 0;
											}); 
									}

									if (results1.length > 0) {
										chartdata[groupdata[gidx - 1].key].sort
											(function (a, b) {
												//var x = a.type.toLowerCase();
												//var y = b.type.toLowerCase();
												var x = a[matchingkeyname]
												var y = b[matchingkeyname]
												if (x < y) { return -1; }
												if (x > y) { return 1; }
												return 0;
											});
									}
									//console.info("Resorted arrays");
								}
							}
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

			this.sendNotificationToMasterModule("NEW_FEEDS_" + moduleinstance, { payload: { chartdata: chartdata } });

			if (this.consumerstorage[moduleinstance].config.filename != null) { //store the data to disk
				JSONutils.putJSON("./" + this.consumerstorage[moduleinstance].config.filename, chartdata);
			}
		}

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