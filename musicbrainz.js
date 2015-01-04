#!/usr/bin/env node

var request = require('request');
var when = require('when');
var query = require('./index.js');

// var wq = query.connect('ldf:http://data.wikidataldf.com/wikidata');

// var result = wq.query("wikidata:Q192755", {
//     id: "@id",
//     name: wq.literal (wq.first ("rdfs:label")),
//     performer: wq.subquery ("wikidata:P175s", wq.subquery ("wikidata:P175v", {
//         id: "@id",
//         name: wq.first (wq.literal ("rdfs:label")),
//     }))
// });

var wq = query.connect('web:');

var result = wq.query("https://musicbrainz.org/release-group/0b8e14e1-d44d-3770-8617-5c6137a444a8", {
    id: "@id",
    name: wq.literal (wq.first ("schema:name")),
    artist: wq.first (wq.subquery ("schema:byArtist", {
        id: "@id",
        name: wq.literal (wq.first  ("schema:name")),
        birthdate: wq.literal (wq.first ("schema:foundingDate"))
    })),
});

result.then (function (data) {
    console.log (JSON.stringify (data, null, "    "));
}).catch (function (error) {
    console.log ('ERROR:', error.message);
});
