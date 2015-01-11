#!/usr/bin/env node

var request = require('request');
var when = require('when');
var query = require('./index.js');

// var wq = query.connect('ldf:http://localhost:4014/wikidata');

// var result = wq.query("wikidata:Q192755", {
//     id: "@id",
//     name: wq.literal (wq.first ("rdfs:label")),
//     performer: wq.first (wq.subquery ("wikidata:P175s",
//                wq.first (wq.subquery ("wikidata:P175v", {
//         id: "@id",
//         name: wq.first (wq.literal ("rdfs:label")),
//     }))))
// });

// result.then (function (data) {
//     console.log (JSON.stringify (data, null, "    "));
// }).catch (function (error) {
//     console.log ('ERROR:', error.message);
// });

var wq = query.connect('ldf:http://localhost:4014/licensedb');

var result = wq.query("http://gnu.org/licenses/gpl-3.0.html", {
    id: "@id",
    sameAs: wq.all ("owl:sameAs"),
    name: wq.literal (wq.first ("dcterms:title")),
    replaces: wq.all ("dc:replaces"),
});

result.then (function (data) {
    console.log (JSON.stringify (data, null, "    "));
}).catch (function (error) {
    console.log ('ERROR:', error.message);
});

