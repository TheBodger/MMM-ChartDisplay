# MMM-ChartDisplay
Generic Magic mirror module to display data from Chart data

The module works along the same lines as the FeedDisplay module, in that all data received from providers is sent to the aggregator, which in tern, send all aggregated data to the be formated for display

In the Feeddisplay, the formatting function has some simple filter rules that will include or exclude some parts of the data, however, all itesm recevied will be displayed in some way or another.

Due to the depth of data that will be returned to the aggregator in a chart module, further steps are added to the process, a filter step, a merge step, reformat data step.

the flow can be shown as:

receive data from provider
pass to aggregator
	-filter out/in specific items of data
	-|rename data entities as required
	 |reformat data entities as required
	 -carry out aggregate sorting etc
	-|merge together different data within the payload (to be determined the best way to represent multiple sets of data within a payload,)
	 |use template to merge data, template will refer to reformatted/ renamed items entities
	-send all aggregated data to the display module

	dependencies

	The us of AMCHARTS is restricted by license:

	### License
		If you don't have a commercial license, the use of this software is covered by
		a freeware license. Refer to included LICENSE file. The license is also
		[available online](https://github.com/amcharts/amcharts4/blob/master/dist/script/LICENSE).

	Download the standalone javscript version here: https://www.amcharts.com/download/

	Don't use NPM installation as this doesn't work with this MMM module

	It must be installed in MMM-ChartDisplay/amcharts4

		download and extract the amcharts v4 standalone javascript files (core, fonts and geodata into this and sub directories:

		/MagicMirror/modules/MMM-ChartDisplay/amcharts4
		/MagicMirror/modules/MMM-ChartDisplay/amcharts4/fonts
		/MagicMirror/modules/MMM-ChartDisplay/amcharts4/geodata


	To enable AMCHARTS to work within the client side module, requirejs is required.

	run inside the /MagicMirror/vendor directory to ensure the client side usage will work

		npm install requirejs


###references


		//if a reference set is provided for any of the items (subject,object,value etc)

		//any mismatching items will be dropped
		//any matching item's values will be replaced and the original information dropped

		//this can also be used to filter out items when they have a subject we are not interested in / or interested in

		//TODO add a utility to actually populate a reference file // but it has to be assumed that a reference is largely static

		//    some systems use FIPS  will other iso "FIPS": "UK",			"ISO3166-1-Alpha-2": "GB",
		//    use countries.json to convert the two.

		example reference config:

		```
		{
			input: 'countries.json',
			setmatchkey: 'subject',
			refmatchkey: 'FIPS',
			setvalue: 'subject',
			refvalue: 'ISO3166-1-Alpha-2',
		}
		```
		
