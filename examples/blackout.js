#!/usr/bin/env node
'use strict';

/* global find:true */
var find = require ('../lib/find');
var path = require ('path');

require ('../lib/drivers/file') (find.drivers);

var filename = path.join(__dirname, '../data/blackout.ttl');
var wf = find.connect('file:file://' + filename);

wf.namespaces.addPrefix('schema', 'http://schema.org/');

var result = wf.search(null, [ 'schema:birthDate' ])
    .then (function (subjects) {
        return wf.query (subjects[0], {
            id: '@id',
            name: 'schema:name',
            location: wf.subquery ('schema:location', {
                id: '@id',
                name: 'schema:name'
            })
        });
    }).then (find.normalizeModel);

result.then (function (data) {
    console.log (JSON.stringify (data, null, 4));
}).catch (function (error) {
    console.log ('ERROR:', error.message);
});
