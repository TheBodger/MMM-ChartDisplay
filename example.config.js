	//1) Top Left, reddit images
	//2) Top Right, twitter and RSS text only feeds
	//3) Bottom left, Instagram Images
	//4) Bottom right, RSS images

	//To enable this there are 5 Provider modules:
	//		1) Twitter
	//2) RSS Text only feeds(news)
	//3) RSS Image feeds
	//4) Reddit
	//5) Instagram
	{
		module: "MMM-FeedProvider-Reddit",
		config: {
			text: "Help me!!",
			id: "reddit",
			consumerids: ["reddit"],
			datarefreshinterval: 11000,
			feeds: [
				{
					feedname: 'Nature',
					feedtitle: 'Nature',
					reddit: 'earthporn',
					oldestage: 'all',
					type: 'top',

				},

			],
		}
	},
	{
		module: "MMM-FeedProvider-Instagram",
		config: {
			text: "Help me!!",
			id: "MMFP7",
			consumerids: ["instagram",],
			datarefreshinterval: 11000,
			feeds: [
				{ feedname: 'MX5', feedtitle: 'MX5', searchHashtag: 'mx5', oldestage: '2020-01-01 00:00:01' },

			]
		}
	},
	{
		module: 'MMM-FeedProvider-Twitter',
		config: {
			consumerids: ['twitter'], // the unique id of the consumer(s) to listen out for
			id: "MMFP4", //the unique id of this provider
			// visit the url below for the twitter keys/tokens
			// https://dev.twitter.com/oauth/overview/application-owner-access-tokens
			consumer_key: '',
			consumer_secret: '',
			access_token_key: '-',
			access_token_secret: '',
			feeds: [
				{ feedname: 'ITVNews', feedtitle: 'ITVNews', searchHashtag: 'ITV', oldestage: 60 * 24 },
			],
			maxTweetAgeMins: 360 * 15,
			totalTweetsPerUpdate: 50,
			excludeRetweets: false,
			language: "en",
		}
	},
	{
		module: "MMM-FeedProvider-RSS",
		config: {
			text: "help me!!",
			id: "mmfp2",
			consumerids: ["rss"],
			feeds: [
				{ feedname: 'elle2', feedtitle: 'elle', feedurl: 'https://www.elle.com/rss/all.xml/', oldestage: 24 * 1 * 60 },
			],
			datarefreshinterval: 15000,
		}
	},
	{
		module: "MMM-FeedProvider-RSS",
		config: {
			text: "Help me!!",
			id: "MMFP1",
			consumerids: ["twitter",],
			feeds: [
				{ feedname: 'bbc_world', feedtitle: 'BBCW', feedurl: 'https://feeds.bbci.co.uk/news/world/rss.xml', oldestage: 24 * 1 * 60 },
			],
			datarefreshinterval: 17000,
		}
	},

	//1) Top Left, reddit images
	//2) Top Right, twitter and RSS text only feeds
	//3) Bottom left, Instagram Images
	//4) Bottom right, RSS images

	//To enable this there are 5 Provider modules:
	//		1) Twitter
	//2) RSS Text only feeds(news)
	//3) RSS Image feeds
	//4) Reddit
	//5) Instagram

	{
		module: "MMM-FeedDisplay",
		position: "top_left",
		config: {
			id: "reddit",
			article: {
				mergetype: 'alternate',
				ordertype: 'date',
			},
			display: {
				articlimage: true,
				refreshtime: 5000,
				articlecount: 1,
				rotationstyle: 'scroll',
				modulewidth: "20vw",
				sourcenamelength: 20,
				textbelowimage: true,
				articleage: true,
			}

		}
	},
	{
		module: "MMM-FeedDisplay",
		position: "bottom_left",
		config: {
			id: "instagram",
			text: "testing",
			article: {

				ordertype: 'age',
				order: 'descending',
				mergetype: 'alternate',
			},
			display: {
				articlimage: true,
				refreshtime: 10000,
				articlecount: 1,
				rotationstyle: 'scroll',
				modulewidth: "20vw",
				sourcenamelength: 20,
				textbelowimage: true,
				articleage: true,
				articledescription: false,
				textlength: 72,
				firstfulltext: false,
				wraparticles: true,
			},
		},
	},
	{
		module: "MMM-FeedDisplay",
		position: "top_right",
		config: {
			id: "twitter",
			text: "testing",
			article: {
				mergetype: 'alternate',
				ordertype: 'date',
				order: 'descending',
			},
			display: {
				articlimage: false,
				refreshtime: 10000,
				articlecount: 4,
				rotationstyle: 'scroll',
				modulewidth: "18vw",
				sourcenamelength: 20,
				textbelowimage: true,
				articleage: true,
				articledescription: false,
				wraparticles: true,
				firstfulltext: true,
				textlength: 72,
			},
		},
	},
	{
		module: "MMM-FeedDisplay",
		position: "bottom_right",
		config: {
			id: "rss",
			text: "Loading...",
			article: {
				mergetype: 'alternate',
				ordertype: 'age',
				order: 'ascending',
				ignorecategorylist: ['horoscopes'],
			},
			display: {
				articlimage: true,
				refreshtime: 10000,
				articlecount: 1,
				rotationstyle: 'scroll',
				modulewidth: "20vw",
				sourcenamelength: 20,
				textbelowimage: true,
				articleage: true,
				articledescription: false,
				wraparticles: true,

			},
		},
	},