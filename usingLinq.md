Notes on how to use and developmene xamples for linq.js in node.js

install with npm install linq.js

look at the reference data, tutorials and stackoverflow

			//use linq to get a nice group by set
			//build the query from the parameters

			//// use fourth argument to groupBy (compareSelector)
			//var groupeddata = linq.from(self.consumerstorage[moduleinstance].feedstorage[feedstorekey].feedsets[setid].items)
			//	.groupBy(
			//		"$.timestampformat",
			//		"'{'+$.subjectname+':'+$.subject+','+$.valuename+':'+$.value+'}'",
			//		function (key, group) { return { s: key, o: group.toJoinedString(',') } },
			//		function (key) { return key.toString() })
			//	.toArray();

			////console.info(teams);

			//console.info(groupeddata);


			//var groupeddata = linq.from(self.consumerstorage[moduleinstance].feedstorage[feedstorekey].feedsets[setid].items)
			//	.groupBy(
			//		"$.timestampformat",
			//		null,
			//		function (key, group) { return { s: key, o: group.sum("$.value") } },
			//		function (key) { return key.toString() })
			//	.toArray();

			//console.info(groupeddata);

			//var groupeddata = linq.from(self.consumerstorage[moduleinstance].feedstorage[feedstorekey].feedsets[setid].items)
			//	.groupBy(
			//		"{ timestamp : $.timestampformat, subject: $.subject}",
			//		"{ value: $.value}",
			//		"{ timestamp : $.timestamp, subject: $.subject, values: $$.toArray() }",
			//		"String($.timestamp) + $.subject"
			//	)
			//	.toArray();

			//groupingrules.groupby

			//1) build the groupby clause
			//2) build the other data to return
			//3) build the return format
			//4) and add a tostring to ensure that the groupby key works correctly

			//TK keySelector(T),
			//TE elementSelector(T),
			//TR resultSelector(T, Enumerable),
			//TC compareSelector(TK) 

			

			//var groupeddata = linq.from(self.consumerstorage[moduleinstance].feedstorage[feedstorekey].feedsets[setid].items)
			//	.groupBy(
			//		"{ timestamp : $.timestampformat}",
			//		"{ subjectname: $.subject, valuename: $.value}",
			//		"{ setid : $.timestamp, values: $$.toArray() }",
			//		"{ timestamp : $.timestamp, values : $$.toArray() }",
			//		"String($.timestamp)"
			//	)
			//	.toArray();

			