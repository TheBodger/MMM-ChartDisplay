        require.config({

//            baseUrl: "/scripts/vendors",
            baseUrl: "/modules/MMM-ChartDisplay/",
            shim: {
                'amcharts4/core': {
                    init: function () {
                        return window.am4core;
                    }
                },
                'amcharts4/charts': {
                    deps: ['amcharts4/core'],
                    exports: 'amcharts4/charts',
                    init: function () {
                        return window.am4charts;
                    }
                },
				'amcharts4/maps': {
                    deps: ['amcharts4/core'],
                    exports: 'amcharts4/maps',
                    init: function () {
                        return window.am4maps;
                    }
                },
				'amcharts4/geodata/worldLow': {
                    deps: ['amcharts4/core'],
                    exports: 'amcharts4/geodata/worldLow',
                    init: function () {
                        return window.am4geodata_worldLow;
                    }
                },
				'amcharts4/geodata/continentsLow': {
                    deps: ['amcharts4/core'],
                    exports: 'amcharts4/geodata/continentsLow',
                    init: function () {
                        return window.am4geodata_continentsLow;
                    }
                },
                'amcharts4/themes/animated': {
                    deps: ['amcharts4/core'],
                    exports: 'amcharts4/themes/animated',
                    init: function () {
                        return window.am4themes_animated;
                    }
                },
                'amcharts4/themes/microchart': {
                    deps: ['amcharts4/core'],
                    exports: 'amcharts4/themes/microchart',
                    init: function () {
                        return window.am4themes_microchart;
                    }
                }
            }
        });
