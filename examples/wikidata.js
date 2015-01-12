#!/usr/bin/env node
'use strict';

var query = require('../lib/query');
var core = require('../lib/core');

var wq = query.connect('ldf:http://data.wikidataldf.com/wikidata');

var result = wq.query('wikidata:Q192755', {
    id: '@id',
    name: 'rdfs:label',
    performer: wq.subquery ('wikidata:P175s', {
        artist: wq.subquery ('wikidata:P175v', {
            id: '@id',
            name: 'rdfs:label',
        })
    })
}).then (core.normalizeModel);

result.then (function (data) {
    console.log (JSON.stringify (data, null, 4));
}).catch (function (error) {
    console.log ('ERROR:', error.message);
});
