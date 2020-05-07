{
	module: "MMM-ChartProvider-Finance",
		config: {
		id: "mmcp1",
			consumerids: ["MMCD2",],
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
		position: "top_right",
			config: {
		id: "MMCD2",
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

		charttype: 'stock_comparing_values',
	}
},
		{
			module: "MMM-ChartProvider-JSON",
			config: {
				id: "MMCP1",
				consumerids: ["MMCD1",],
				//input: 'D:/Users/KCPFr/Source/Workspaces/NODEJS/MMDev/MagicMirror/modules/MMM-ChartProvider-JSON/test.covid.json',//
				input: "https://opendata.ecdc.europa.eu/covid19/casedistribution/json/",
				jsonfeeds: [
					{
						feedname: "Test",
						setid: "Test1",
						rootkey: 'records',
						subject: 'countriesAndTerritories',          
						object: 'CovidDeaths',       
						value: 'deaths',
						type: "numeric",
						timestamp: 'dateRep',
						timestampformat: 'DD-MM-YYYY',
						filename: '/modules/MMM-ChartProvider-JSON/test.output',
					}
				]
			}
		},
		{
			module: "MMM-ChartDisplay",
			position: "top_left",
			config: {
				id: "MMCD1",
				setrules: [{						//an array of rules to be applied to each incoming set
					setid: "Test1",					//must match the setids used in the provider so it can track the different data sets
					filter: {
						"keepsubjects": [
							//"BE", "BR", "BA", "CN", "EC", "FR", "DE", "IR", "IL", "IT", "NL", "ES", "UK", "US"
							"Belgium",
							"Brazil",
							"Canada",
							"China",
							"Ecuador",
							"France",
							"Germany",
							"Iran",
							"Ireland",
							"Italy",
							"Netherlands",
							"Spain",
							"United_Kingdom",
							"United_States_of_America"
						],
						"timestamp_min": "2020-03-08 00:00:00",	
					},
					reformat: {
						"dropkey": ["object"],
						"timestampformat": "YYYY-MM-DD",
						"subjectAKA": "Country",
						"valueAKA": "Deaths",
					},
					grouping: {
						groupby: 'timestampformat',						
					},

				}],
				merge: {
					outputsetid: 'timestampformat',
				},
				charttype:'bar_chart_race',
			}
		},