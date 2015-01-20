#!/usr/bin/env node
'use strict';

/* global find:true */
var find = require('../lib/find');

// I think wikidata runs an older version of the linked data fragment server which
// doesn't support application/trig -- which is required by the ldfb driver.
require ('../lib/drivers/ldf') (find.drivers);

var wf = find.connect('ldf:http://data.wikidataldf.com/wikidata');

wf.namespaces.addPrefix('wikidata', 'http://www.wikidata.org/entity/');

var result = wf.query('wikidata:Q192755', {
    id: '@id',
    name: 'rdfs:label',
    performer: wf.subquery ('wikidata:P175s', {
        artist: wf.subquery ('wikidata:P175v', {
            id: '@id',
            name: 'rdfs:label',
        })
    })
}).then (find.normalizeModel);

result.then (function (data) {
    console.log (JSON.stringify (data, null, 4));
}).catch (function (error) {
    console.log ('ERROR:', error.message);
});
