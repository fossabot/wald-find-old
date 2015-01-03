#!/usr/bin/env node

var request = require('request');
var when = require('when');
var query = require('./index.js');

var wq = query.connect('ldf:http://localhost:4014/wikidata');

var result = wq.query("http://www.wikidata.org/entity/Q192755", {
    id: "@id",
    name: wq.literal (wq.first ("http://www.w3.org/2000/01/rdf-schema#label")),
    performer: wq.subquery (
        "http://www.wikidata.org/entity/P175s",
        wq.subquery ("http://www.wikidata.org/entity/P175v", {
            id: "@id",
            name: wq.first (wq.literal ("http://www.w3.org/2000/01/rdf-schema#label")),
        })
    )
});

result.then(function (data) {
    console.log('--- [ final result ] -------------------------------------');
    console.log(JSON.stringify(data, null, "    "));
}).catch (function (error) {
    console.log('--- [ final error ] -------------------------------------');
    console.log(error.message);
});
