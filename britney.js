#!/usr/bin/env node

var request = require('request');
var when = require('when');
var query = require('./index.js');

var wq = query.connect('ldf:http://localhost:4014/wikidata');

// wq.query("http://www.wikidata.org/entity/Q11975", {
//     name: "foaf:name"
// });

var result = wq.query("http://www.wikidata.org/entity/Q11975", {
    name: {
        query: [ 'http://www.wikidata.org/entity/Q11975', 'http://schema.org/description', null ],
        filters: [ "first" ]
    }
});


// 'http://localhost:4014/wikidata'



// var subject = "wikidata:Q11975";
// var model = { name: first("foaf:name") };

// // after transformation
// var query = {
//     name: {
//         query: [ 'http://www.wikidata.org/entity/Q11975', 'http://xmlns.com/foaf/0.1/name', null ],
//         filters: [ "first" ]
//     }
// }


// var subject = "wikidata:Q11975";

// // var query = {
// //     label: lang("en", "rdfs:label"),
// //     desc: lang("ko", "schema:description"),
// //     mbid: first("wikidata:P434s")
// //     // discography: subquery("wikidata:P358", 
// // }

// // http://localhost:4014/wikidata?subject=http%3A%2F%2Fwww.wikidata.org%2Fentity%2FQ11975&predicate=&object=
// // http://localhost:4014/wikidata?subject=http%3A%2F%2Fwww.wikidata.org%2Fentity%2FQ11975&predicate=http%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23label&object=

// var results = ldfQuery('http://www.wikidata.org/entity/Q11975', 'http://www.w3.org/2000/01/rdf-schema#label', '');

// results.then(function (data) {
//     console.log ('we got some data!', JSON.stringify(data, null, "   "));
// });
