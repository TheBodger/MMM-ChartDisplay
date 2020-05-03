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

		//now we add the provided feeds to the feedstorage
		//we support multiple sets of data in the feedsets area
		//assumption is that the provider will NOT send duplicate feeds so we just add them to the end

		var feedsets = {'': { items: [] } };

		var feedstorage = {
			key: '', sortidx: -1, titles: [], sourcetitles: [], providers: [], sortkeys: [], feedsets: {} };

		//we will need to store all the separate sets of data provided here/ TBD

		//loop on sets first TBD

		var setkey = payload.title; //will need to change to the item set key from the provider

		//Determine if we have an entry for the moduleinstance of the display module in feedstorage

		if (this.consumerstorage[moduleinstance].feedstorage[feedstorekey] == null) {

			var sortkeys = [];	// we only use it here, in the else we push direct to the main storage
			var sortidx = -1;	// we only use it here, in the else we use the one we store in main storage

			feedstorage.key = feedstorekey;
			feedstorage.titles = [payload.title];				// add the first title we get, which will be many if this is a merged set of feeds
			feedstorage.sourcetitles = [payload.sourcetitle];	// add the first sourcetitle we get, which will be many if this is a merged set of feeds
			feedstorage.providers = [payload.providerid];		// add the first provider we get, whic will be many if there are multiple providers and merged

			feedstorage.feedsets[setkey] = { items: [] };

			this.consumerstorage[moduleinstance].feedstorage[feedstorekey] = feedstorage;
		}

		//determine if we have an entry for the data set just received

		if (this.consumerstorage[moduleinstance].feedstorage[feedstorekey].feedsets[setkey] == null) {

			this.consumerstorage[moduleinstance].feedstorage[feedstorekey].feedsets[setkey] = { items: [] };

		}

		//now we have the feedstorage setup, we can process the items

		payload.payload.forEach(function (item) {

			// -------------------------filter stage -----------------------------------------------

			//check to see if we want to drop/keep this item because of a filter rule match

			var keepitem = false;

			if (keepitem) {

				// ---------------------------- reformat/rename stage ----------------------------------

				this.consumerstorage[moduleinstance].feedstorage[feedstorekey].feedsets[setkey].items.push(item);
			}

		});

		// -------------------------------------- aggregator sort stage ------------------------------------------


		// -------------------------------------- aggregator merge stage with template  ------------------------------------------


		// -------------------------------------- aggregator send stage  ------------------------------------------

		this.sendNotificationToMasterModule("NEW_FEEDS_" + moduleinstance, { payload: { titles: titles, articles: articles } });

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