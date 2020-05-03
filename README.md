# MMM-ChartDisplay
Generic Magic mirror module to display data from Chart data

The module works along the same lines as the FeedDisplay module, in that all data received from providers is sent to the aggregator, which in tern, send all aggregated data to the be formated for display

In the Feeddisplay, the formatting function has some simple filter rules that will include or exclude some parts of the data, however, all itesm recevied will be displayed in some way or another.

Due to the depth of data that will be returned to the aggregator in a chart module, further steps are added to the process, a filter step, a merge step, reformat data step.

the flow can be shown as:

receive data from provider
pass to aggregator
	filter out/in specific items of data
	|rename data entities as required
	|reformat data entities as required
	merge together different data within the payload (to be determined the best way to represent multiple sets of data within a payload,)
	carry out aggregate sorting etc
	send all aggragted data to the display module