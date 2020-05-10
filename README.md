# MMM-ChartDisplay Module

This magic mirror module is the MMM-ChartDisplay module that is part of the MMM-Chartxxx and MMM-Feedxxx interrelated modules.

For an overview of how the similar Feed interrelated modules work read the https://github.com/TheBodger/MMM-FeedDisplay/blob/master/README.md.

This module receives feeds from providers, aggregates them and then formats them for passing to chart submodules which are displayed on the magic mirror. There can be multiple MMM-ChartDisplays active receiving feeds from 1 or many providers. Providers for the MMM-ChartDisplay have to be MMM-ChartProviders, however, some of these can in turn act as consumers to MMM-FeedProviders

### Example
![Example of MMM-ChartDisplay output](images/screenshot.png?raw=true "Example screenshot")

This example includes 4 ChartDisplay modules using example amcharts included with the MMM-ChartDisplay Module:

1) Top Left, tag_cloud
2) Top Right, rotating_globe
3) Bottom left, stock_comparing_values
4) Bottom right, simple_bar_chart

To provide data to these, there are 3 Chart Provider modules and one Feed Provider module:
1) Words + Feed provider RSS to obtain latest news feeds from CNN, SKY and BBC (input to word cloud)
2) JSON - gets EU daily coronavirus data (For bar chart and world map)
3) Finance - gets stocks for 3 companies and the Dow jones index

# Table of Contents

1. [Dependencies](#Dependencies)
2. [Installation](#Installation)
2. [Using the module](#Using_the_module)
2. [Configuration Options](#Configuration_Options)
2. [Additional Notes](#Additional_Notes)
(see notes on available charts)
2. [Detailed Article config options](#Detailed_Article_config_options)
2. [MMM-Feedxxx overview](#MMM-Feedxxx_overview)
2. [Thoughts on the design](#thoughts_on_design)
2. [Creating new providers](#Creating_new_providers)

### Dependencies

Before installing this module, use https://github.com/TheBodger/MMM-ChartUtilities to setup the MMM-Charts... dependencies and  install all modules 
If you are planning to use MMM-FeedProvider modules as well, go to https://github.com/TheBodger/MMM-FeedUtilities and install all modules

The charts are produced using AMCHARTS.

	The use of AMCHARTS is restricted by license:

		### License
			If you don't have a commercial license, the use of this software is covered by
			a freeware license. Refer to included LICENSE file. The license is also
			[available online](https://github.com/amcharts/amcharts4/blob/master/dist/script/LICENSE).

	

	Download the standalone javscript version here: https://www.amcharts.com/download/

	Don't use NPM installation as this doesn't work with this MMM module

	It must be extracted into a new MMM-ChartDisplay/amcharts4 folder

		download and extract the amcharts v4 standalone javascript files (core, fonts and geodata) into this and sub directories:

		/MagicMirror/modules/MMM-ChartDisplay/amcharts4
		/MagicMirror/modules/MMM-ChartDisplay/amcharts4/fonts
		/MagicMirror/modules/MMM-ChartDisplay/amcharts4/geodata

	To enable AMCHARTS to work within the client side module, requirejs is required.

	run the install inside the /MagicMirror/vendor directory 

		npm install requirejs

	The following node modules are also required: 

	```
	moment
	isprofanity //will be used in the future
	linq (make sure you get the version referenced here: https://github.com/mihaifm/linq)

	```

## Standalone Installation
To install the module, use your terminal to:
1. Navigate to your MagicMirror's modules folder. If you are using the default installation directory, use the command:<br />`cd ~/MagicMirror/modules`
2. Clone the module:<br />`git clone https://github.com/TheBodger/MMM-ChartDisplay`

## Using_the_module

The sets of data provided to the ChartDisplay module are always in the NDTF standard. Details can be found in the MMM-ChartUtilies module's readme.

This standard ensures that providers and consumers can work together. The standard is an array of JSON objects, each object taking the format of:

```
{subject:'subject value',object:'object name',value:data value,timestamp;timestamp}
```
example:
```
{subject:'Great Britain',object:'Has population of',value:66873421,timestamp:'Sun May 10 2020 08:57:03 GMT+0100 (British Summer Time)'}
```

### MagicMirror² Configuration

To use this module, add the following configuration block to the modules array in the config file

```js
		{
			module: "MMM-ChartDisplay",
			position: "wherever",
			config: {
				id: "consumer id matching the consumer id in the provider",
				setrules: [{						
					setid: "set id matching that in the provider",				
					filter: {
						},
					reformat: {
					},
					grouping: {
					},
				}],
				merge: {
				},
				charttype:'chart name defined in displaycharts.js example charts' 
			}
		},

```

### Configuration_Options

Most of these options are used in the large example configuration file included  [example.config.js](https://github.com/TheBodger/MMM-ChartDisplay/blob/master/example.config.js) that created the example screen shot above and can be used for helping understand the various options.

| Option                  | Details
|------------------------ |--------------
| `text`                | *Optional* - Will be displayed on the magic mirror until the first feed has been received and prepared for display <br><br> **Possible values:** Any string.<br> **Default value:** '... loading'
| `id`         | *Required* - The unique ID of this consumer module. This ID must match exactly (CaSe) the consumerids in the provider modules. <br><br> **Possible values:** any unique string<br> **Default value:** none
| `setrules`            |*Required* - contains an array of all the config options required during aggregation of each incoming set of data, the Minimum entry is the setid
| `setid`            |*Required* - The setid identifies a set of data from a provider. Each set of data can be used on its own in a chart, or merged with other sets<br><br> **Possible values:** any unique string<br> **Default value:** none
| `filter`            |*Optional* - contains an set of filter rules that will reduce the data within this set.
| `keepsubjects`            |*Optional* - An array of subjects to keep, all other data in the set without these subjects will be dropped<br><br> **Possible values:** an array of unique strings or values<br> **Default value:** none
| `timestamp_min`            |*Optional* - The minimum item timestamp to keep<br><br> **Possible values:** a valid (moment.js) date / time<br> **Default value:** none
| `warnonarraysunequal`            |*Optional* - Will post an error if true when the output arrays of values are unequal. Certain charts require all arrays of data to be equal. (see notes on available charts)<br><br> **Possible values:** true or false<br> **Default value:** false
| `dropvalues`            |*Optional* - The minimum value to keep. Only works if the set data value is numeric<br><br> **Possible values:** any numeric value<br> **Default value:** none
| `reformat`            |*Optional* - contains an set of reformat rules that will change the data within each data set item.
| `dropkey`            |*Optional* - An array of item fields to drop<br><br> **Possible values:** subject,object,value,timestamp<br> **Default value:** none
| `subjectAKA`            |*Optional* - A replacement name for the subject, most charts expect no changes to the name<br><br> **Possible values:** Any valid string unique within the data set item<br> **Default value:** none
| `valueAKA`            |*Optional* - A replacement name for the value, most charts expect no changes to the name<br><br> **Possible values:** Any valid string unique within the data set item<br> **Default value:** none
| `objectAKA`            |*Optional* - A replacement name for the object, most charts expect no changes to the name<br><br> **Possible values:** Any valid string unique within the data set item<br> **Default value:** none
| `timestampAKA`            |*Optional* - A replacement name for the timestamp, most charts expect no changes to the name<br><br> **Possible values:** Any valid string unique within the data set item<br> **Default value:** none
| `timestampformat`            |*Optional* - Convert the timestamp value into this format (i.e. "YYYY-MM-DD") Supports all moment formats including x and X for unix timestamps. amcharts dates are best in the x unix timestamp format<br><br> **Possible values:** Any valid string supported by moments.js<br> **Default value:** none
| `references`            |*Optional* - Contains an array of sets of reference rules that will enable the use of a reference file to change values within each item data set. The item data set and reference file are matched on a pair of key values, and the value replaced with the named value from the file. if a match cant be made, then that item is dropped. If a reference entry is required, then all values must be populated. An example referecne file is included, countries.json, that was pulled from https://datahub.io/core/country-codes which has many available reference datasets.
| `input`            |*Required* - The name of the file including relative path from the /MagicMirror folder that contains the reference information in a JSON format, <br><br> **Possible values:** Any valid string containg the realtive address of a reference file<br> **Default value:** none
| `setmatchkey`            |*Required* - The name of the key (subject,value,object,timestamp,timestampformat) whose value will be used to match on the reference file keys<br><br> **Possible values:** Any valid field name<br> **Default value:** none
| `refmatchkey`            |*Required* - The name of the key in the reference file whose value will used to match with the item data set key<br><br> **Possible values:** Any valid field name<br> **Default value:** none
| `setvalue`            |*Required* - The name of the key (subject,value,object,timestamp,timestampformat) whose value will be replaced with the reference value<br><br> **Possible values:** Any valid field name<br> **Default value:** none
| `refvalue`            |*Required* - The name of the key  in the reference file whose value will used to replace the value in the item data set<br><br> **Possible values:** Any valid field name<br> **Default value:** none
| `grouping`            |*Optional* - Contains a set of grouping rules that will group the individual items into a group of arrays based on a common key. Whilst grouping, an aggregate function can be applied to the value in the item sets. Different grouping options shopuld be used to meet the requirements of the various charts.
| `groupby`            |*Optional* - The name of the key in the item data set that the data will be grouped by ((subject,value,object,timestamp,timestampformat))<br><br> **Possible values:** Any valid item key name name<br> **Default value:** none
| `aggregate`            |*Optional* - The name of the key in the item data set that the data will be grouped by ((subject,value,object,timestamp,timestampformat))<br><br> **Possible values:** Any valid item key name name<br> **Default value:** none
| `equalisearrays`            |*Optional* - Will merge missing entries in the grouped by array so each array contains the same key entries. Merging will simply take whatever value is available in the array that isnt missing the value. This requires that the incoming item data sets for the first grouped by key value contains all available keys. Options is only available if grouping data and not aggregating data<br><br> **Possible values:** true or false<br> **Default value:** false
| `merge`            |*Optional* - Contains a set of merging rules that will be applied to the output to determine what each set of arrays are keyed on or in future to add additional dataset values to the output data set
| `outputsetid`            |*Optional* - The name of the key field whose value will be used as a setid for the data to be passed to the charts.<br><br> **Possible values:** Any valid item key name name or null - null adds a unique setid starting at a value of 1<br> **Default value:** none
| `charttype`            |*Required* - The name of the example chart provided to display. See available chart types for more details of available charts. (subject,value,object,timestamp,timestampformat) whose value will be used to match on the reference file keys<br><br> **Possible values:** Any existing chart name in displaycharts.js<br> **Default value:** none


### Additional_Notes

There are some options in the code marked as TODO. ignore these.

The config id must match between providers and consumers. Being a case sensitive environment extra care is needed here.<BR>
The config setrules setid must match a setid from a provider.<BR>
If using keepsubjects, make sure the correct value is added to the subject field sent by the relevant MMM-ChartProvider module<BR>


### Available_Charts_Usage

<pre>
the input to some chart modules expects the data to be in format of:
	{seriesname:[{seriesvalues},{seriesvalues}]}
	for the race bar the seriesname should be a date, and then there will be an array of {subject:"subject name",value:amount}. The arrays must be the same length, contain the same subjects and be sorted intot he same order; otherwise the chart wont work correctly.<BR>
	for the word cloud, the seriesname is the word, and then an array of the count of words {count:countofword},			</pre>
<BR>			
The included file, displaycharts.js contains a number of amchart example charts amended to work within a browser / electron / node.js environment such as found in magic mirror. To enable amcharts, the loadam4charts.js is included in this module. 

#### loadam4charts.js

Amcharts comes with a large number of modules and datasets. To make any of these available, it needs to be included within this script. The script has all necessary modules and datasets included to support all the example charts.

#### displaycharts.js

Each example chart is included as a discrete function within a JSON object called displaycharts.

To add a new chart, copy an existing chart, rename it, replace the body of the original chart function with the new chart details. Determine the best way to present the data to the chart.data or the series set. Look at the existing charts to see how different charts have different data requirements and how they are catered for. Add any additional amcharts modules or datasets required at the top of the function. if using an amcharts module, dataset, theme etc that isnt in loadam4charts.js, add it in the same format as existing entries.

For all other things amchart, check out their great documentation.

##### Example charts

//tag_cloud: creates a word cloud depending on the word and word count in the data. Words can be clicked on to open a web page built from the word and a URL within this code.<BR><BR>
//rotating_globe: creates a world map that rotates, can be dragged and zoomed. will take the first entry in a grouped by data series and use the array of country code/value to populate country specific circles sized based on the value.<BR><BR>
//bar_chart_race: creates an animated daily bar chart that shows the position of a subject relative to the others in each data set. Currently wont work if the rotating globe is included in the same display. See elsewere about this charts very specific data requirements<BR><BR>
//simple_bar_chart: creates a barchart of subject values. it is an example of creating a bespoke theme to adjust global display settings and use of an amchart colour theme. This pair of themes combined is a good basis for all MM charts<BR><BR>
//simple_line_chart: creates a simple line chart<BR><BR>
//stock_comparing_values: creates a multiline graph of stock values across a time period, displaying the values as a percentage of the initial value. A good method of comparing the movement of stocks.<BR><BR>

#### flow within the display module showing when the variosu stages occur

receive data from a chart provider in NDTF
<pre>
pass to aggregator (node helper)
	-filter out/in specific items of data
	-|rename data entities as required
	 |reformat data entities as required
	 -apply reference data
	 -carry out aggregate, grouping, sorting etc
	-|merge together different data within the payload TODO
	 |use template to merge data, template will refer to reformatted/ renamed items entities TODO
	-carry out data validation and output set building
	-send all aggregated data to the display module for consumption by a specific chart
</pre>
#### Display config options:

Additional display options and chart types and options are being added all the time.

This is a WIP; changes are being made all the time to improve the compatibility across the modules. Please refresh this and the MMM-ChartUtilities modules with a `git pull` in the relevant modules folders.

#### Creating_new_providers

With the existing providers, there are different ways of obtaining and formatting data into the standard NDTF data required by the MMM-ChartDisplay module, look at each to determine if any match your specific requirement.

To create a new provider consider the following:

1. copy any of the existing GitHub provider repositories with all the files: main module and node_helper, etc
2. rename it externally and internally so it has a meaningful name
3. the main module should need few if any changes
4. the node_helper is where most of the work is done, with the new processing within the `fetchfeed` section. all other sections should be ok as they are. But there may be the odd tweak here and there. if you find yourself changing acres of code, then you are probably best building a module outside of this pattern.
5. when completed, use the readme.md from any of the providers as it has a relatively readable format, and much of it is reusable.
6. test test test, and finally publish to GIT with all the relevant information updated in all the files
7. best of luck and thanks if you actually read to this point
8. P.s. let me know if you actually create a new provider using a new pull request.

## the end
