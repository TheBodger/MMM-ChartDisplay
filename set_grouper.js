//#### Set Joiner

const moduleruntime = new Date();

//Will merge multiple single items that are related at the subject level into as many sets as there are unique subjects

const fs = require("fs");
const moment = require("moment");

// get required structures

const structures = require("./structures.js");
const utilities = require("./common.js");
const JSONutils = new utilities.JSONutils();
const configutils = new utilities.configutils();

const defaults = {
    input: "./input.json",      // | No | The locator of the input JSON | any valid fs locator / HTTP | ./input.json
    setid: 'subject',           // | Yes | the key to use for the setid instead of the default 1, 2, 3, this key is automatically removed from the child items.if reformatted, then use this instead of raw | any valid key | `subject`
    subjectAKA: null,           // | No | rename the subject key to this value | any valid string | `null` - use subject
    objectAKA: null,            // | No | rename the object key to this value | any valid string | `null` - use object
    valueAKA: null,             // | No | rename the value key to this value | any valid string | `null` - use value
    dropkey: null,              // | No | exclude this key | any valid string | `null` - use value
    dropvalues: null,           // | No | dont include any item with a value lower than this, ignored if the value key isnt numeric | any valid number | `null` - ignore rule
    keepsubjects: null,          // | No | an array of subject entries to keep | any valid array of strings | `null` - ignore rule
    timestamp_reformat: null,   // | No | A timestamp to detail when the combined subject object was created, or when it first became valid | any valid timestamp(uses strict moment to validate) | the timestamp of running the module
    timestamp_min:null,         // | No | ignore any items older than this timestamp | any valid moment string format | `null` - ignore rule
    filename: null,             // | No | local file name(no paths) to save a serialised version of the extracted data as an array of items | any valid filename or not defined for no output.If not defined then the output is displayed to the console | none
    groupby: null               // | if not null, any items within a set that has the same key values (not the value) processed|`null` or `avg` or `sum`|`null`
}

// build the config

let config = configutils.setconfig(defaults, false);

//load the array of items

var inputjson = JSONutils.getJSON(config);

//process the items based on the config rules

// group all the items based on the subject field
// add items to the set
// loose object (if same as parent) and subject if rationalise is true, otherwise we get a fat file

// get a set structure for every subject we find

// too keep things a little quicker, we track the found setids in an array that we use a quick search to find if they exist
// and also we look for a change of setid to trigger the search / add 
// so if found, we know we have a set in the set array with this setid
// if not found then we have to create a new array entry and start populating it

var setidarray = []; // contains all the setids, after formatting
var setarray = [];
var prevsetid = null;
var currentidx = -1;
var setstructure = {};

for (itemidx = 0; itemidx < inputjson.length; itemidx++) {

    var subject = inputjson[itemidx].subject;
    var object = inputjson[itemidx].object;
    var value = inputjson[itemidx].value;
    var timestamp = inputjson[itemidx].timestamp;

    var item = {};

    //start building the output as soon as possible, using hand built stuff

    item['orig_timestamp'] = timestamp;

    if (config.timestamp_reformat != null) {
        timestamp = moment(timestamp).format(config.timestamp_reformat);
    } else {
        timestamp = moment(timestamp);
    }


    // "keepsubjects": [ "BR","CA","ES","FR","IN","IR","IT","MX","NL","PE","RU","SE","TR","UK","US","BE" ],
    item['timestamp'] = timestamp;

    var subjectname = 'subject';
    var objectname = 'object';
    var valuename = 'value';

    if (config.subjectAKA != null) { subjectname = config.subjectAKA; }
    if (config.objectAKA != null) { objectname = config.objectAKA; }
    if (config.valueAKA != null) { valuename = config.valueAKA; }

    item[subjectname] = subject;
    item[objectname] = object;
    item[valuename] = value;

    if (config.dropkey != null) { delete item[config.dropkey]; } //remove the unrequired key

    var setid = item[config.setid]; //build the setid after all rules have been applied

    var pushitem = true;

    if (config.keepsubjects != null) {
        if (config.keepsubjects.indexOf(subject) == -1) { pushitem = false;}
    }

    if (config.timestamp_min != null) {

        if (moment(item.orig_timestamp) < moment(config.timestamp_min)) {
            pushitem = false;
        }
    }

    if (setstructure[setid]== null && pushitem) { //dont send anything if this item is excluded by dates

        setstructure[setid] = [];
        setidarray.push(setid);
    }

    if (config.dropvalues != null) {
        if (!isNaN(parseFloat(item[valuename]))){
            if (config.dropvalues > parseFloat(item[valuename]) ) { pushitem = false;}
        }
    }

    if (pushitem) {
        delete item[config.setid]; //remove the setid from the item
        delete item['orig_timestamp'];
        setstructure[setid].push(item);
    }
}

// if we need to carry out a group by, we now go back through all the sets, merging identical items in each set, using the group by type,

if (config.groupby != null) {
    //`groupby`|No|if not null, any items within a set that has the same key values (not the value) processed|`null` or `avg` or `sum`|`null`

    //for each list item, look at all the array items

            //average or sum the value fields - use the renamed / reformatted key names



}

//now determine what to do next

  if (config.filename == null) {
      console.info(setstructure);
  }
  else {

    // write out to a file

      JSONutils.putJSON("./" + config.filename, setstructure);

      console.info(setstructure.length);

  }

