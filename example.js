#!/usr/bin/env node

var request = require('request');
var when = require('when');
var query = require('./index.js');

var Namespaces = require ('./lib/namespaces');
var ns = new Namespaces ();

var wq = query.connect('ldf:http://data.wikidataldf.com/wikidata', ns);

var result = wq.query("wikidata:Q192755", {
    id: "@id",
    name: wq.literal (wq.first ("rdfs:label")),
    performer: wq.subquery ("wikidata:P175s", wq.subquery ("wikidata:P175v", {
        id: "@id",
        name: wq.first (wq.literal ("rdfs:label")),
    }))
});

result.then(function (data) {
    console.log(JSON.stringify(data, null, "    "));
}).catch (function (error) {
    console.log('ERROR:', error.message);
});
