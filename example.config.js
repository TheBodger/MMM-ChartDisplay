{
	module: "MMM-ChartProvider-Finance",
		config: {
		id: "mmcp1",
			consumerids: ["MMCD7",],
				datarefreshinterval: 1001 * 60,
					financefeeds: [
						{
							feedname: "tstocks",
							setid: "TJXStocks",
							subject: 'stock',
							object: 'close',
							value: 'indicators.quote.0.close', //dot address of the value field, relative to rootkey (defaults)
							type: "numeric",
							timestamp: 'timestamp',
							//stocks: [ '^FTSE'],
							stocks: ['tjx', 'msft', 'rost', '^DJI'],
							periodrange: '1y',
							interval: '1d',
						}
					]
	}
},
{
	module: "MMM-ChartDisplay",
		position: "bottom_left",
			config: {
		id: "MMCD7",
			setrules: [{						//an array of rules to be applied to each incoming set
				setid: "TJXStocks",				//must match the setids used in the provider so it can track the different data sets
				filter: {
				},
				reformat: {
					"dropkey": ["object"],
					"timestampAKA": "date",
					"timestampformat": "x",  //timestamp  milliseconds for time level charts
				},
				grouping: {
					groupby: 'subject',
				},

			}],
				merge: {
		},
		//charttype: 'simple_line_chart',
		charttype: 'stock_comparing_values',
			}
},

{
	module: "MMM-FeedProvider-RSS",
		config: {
		text: "Help me!!",
			id: "MMFP3",
				consumerids: ["MMCP3"],
					datarefreshinterval: 11000,
						feeds: [

							{ feedname: 'bbc_UK', feedtitle: 'BBCU', feedurl: 'https://feeds.bbci.co.uk/news/uk/rss.xml', oldestage: 24 * 1 * 60 },
							{ feedname: 'bbc_world', feedtitle: 'BBCW', feedurl: 'https://feeds.bbci.co.uk/news/world/rss.xml', oldestage: 24 * 1 * 60 },
							{ feedname: 'sky_news', feedtitle: 'SKY ', feedurl: 'https://feeds.skynews.com/feeds/rss/home.xml', oldestage: 24 * 1 * 60 },
							{ feedname: 'CNN_latest', feedtitle: 'CNN ', feedurl: 'http://rss.cnn.com/rss/cnn_latest.rss', oldestage: 24 * 1 * 60 },
						]
	}
},
{
	module: "MMM-ChartProvider-Words",
		config: {
		id: "MMCP3",
			consumerids: ["MMCD3",],
				datarefreshinterval: 1000 * 60 * 60 * 24,
					input: 'feedprovider',
						wordfeeds: [
							{
								feedname: "twords",
								setid: "TJXWords",
								type: "numeric",
							}
						]
	}
},
{
	module: "MMM-ChartDisplay",
		position: "top_left",
			config: {
		id: "MMCD3",
			setrules: [{
				setid: "TJXWords",
				filter: {
					dropvalues: 3,
				},
				reformat: {
					"dropkey": ["object", "timestamp"],
					"valueAKA": "count",
				},
				grouping: {
					groupby: 'subject',
					aggregate: "sum",
				},
			}],
				merge: {
			outputsetid: 'subject',
				},
		charttype: 'tag_cloud',
			}
},
{
	module: "MMM-ChartProvider-JSON",
		config: {
		id: "MMCP1",
			consumerids: ["MMCD1", "MMCD4", "MMCD5"],
				//input: 'D:/Users/KCPFr/Source/Workspaces/NODEJS/MMDev/MagicMirror/modules/MMM-ChartProvider-JSON/test.covid.json',
				input: "https://opendata.ecdc.europa.eu/covid19/casedistribution/json/",
					jsonfeeds: [
						{
							feedname: "Test",
							setid: "Test1",
							rootkey: 'records',
							subject: 'countryterritoryCode',
							//subject: 'countriesAndTerritories',          
							object: 'CovidDeaths',
							value: 'deaths',
							type: "numeric",
							timestamp: 'dateRep',
							timestampformat: 'DD-MM-YYYY',
							//filename: '/modules/MMM-ChartProvider-JSON/test.output',
						}
					]
	}
},
//example config settings for bar-chart-race. Chart currently cannot be shown in the same magic mirror as the rotating world map
//{
//	module: "MMM-ChartDisplay",
//	position: "bottom_right",
//	config: {
//		id: "MMCD1",
//		setrules: [{						
//			setid: "Test1",					
//			filter: {
//				"keepsubjects": [
//					"BEL", "BRA", "CHN", "BIH", "ECU", "FRA", "DEU", "IRN", "ITA", "NLD", "ESP", "GBR", "USA"

//				],
//				"timestamp_min": "2020-03-08 00:00:00",
//				warnonarraysunequal:true,
//			},
//			reformat: {
//				"dropkey": ["object"],
//				"timestampformat": "YYYY-MM-DD",
//			},
//			grouping: {
//				groupby: 'timestampformat',	
//				equalisearrays:true,
//			},
//		}],
//		merge: {
//			outputsetid: 'timestampformat',
//		},
//		charttype:'bar_chart_race',
//	}
//},
{
	module: "MMM-ChartDisplay",
		position: "bottom_right",
			config: {
		id: "MMCD5",
			setrules: [{
				setid: "Test1",
				filter: {
					"keepsubjects": [
						"BEL", "BRA", "CHN", "BIH", "ECU", "FRA", "DEU", "IRN", "ITA", "NLD", "ESP", "GBR", "USA"

					],
					"timestamp_min": "2020-05-09 00:00:00",
					warnonarraysunequal: true,
				},
				reformat: {
					"dropkey": ["object"],
					"timestampformat": "YYYY-MM-DD",
				},

				references:
					[
						{
							input: 'modules/MMM-ChartDisplay/countries.json',
							setmatchkey: 'subject',
							refmatchkey: 'ISO3166-1-Alpha-3',
							setvalue: 'subject',
							refvalue: 'CLDR display name',
						}
					],

				grouping: {
					groupby: 'timestampformat',
					equalisearrays: true,
				},
			}],
				merge: {
			outputsetid: 'timestampformat',
				},
		charttype: 'simple_bar_chart',
			}
},
{
	module: "MMM-ChartDisplay",
		position: "top_right",
			config: {
		id: "MMCD4",
			setrules: [{
				setid: "Test1",
				filter: {
					"keepsubjects": ["BEL", "BRA", "CHN", "BIH", "ECU", "FRA", "DEU", "IRN", "ITA", "NLD", "ESP", "GBR", "USA"],
					"timestamp_min": "2020-05-09 00:00:00",
				},
				reformat: {
					"dropkey": ["object", "timestamp"],
					"valueAKA": "count",
				},
				references:
					[
						{
							input: 'modules/MMM-ChartDisplay/countries.json',
							setmatchkey: 'subject',
							refmatchkey: 'ISO3166-1-Alpha-3',
							setvalue: 'subject',
							refvalue: 'ISO3166-1-Alpha-2',
						}
					],
				grouping: {
					groupby: 'subject',
				},

			}],
				merge: {
			outputsetid: 'subject',
				},
		charttype: 'rotating_globe',
			}
},