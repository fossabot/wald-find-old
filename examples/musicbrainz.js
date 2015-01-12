#!/usr/bin/env node
'use strict';

var query = require('../lib/query');
var core = require('../lib/core');

var wq = query.connect('web:');

var mbid = 'https://musicbrainz.org/release-group/0b8e14e1-d44d-3770-8617-5c6137a444a8';
var result = wq.query(mbid, {
    id: '@id',
    name: 'schema:name',
    artist: wq.subquery ('schema:byArtist', {
        id: '@id',
        name: 'schema:name',
        birthdate: 'schema:foundingDate'
    }),
}).then (core.normalizeModel);

result.then (function (data) {
    console.log (JSON.stringify (data, null, 4));
}).catch (function (error) {
    console.log ('ERROR:', error.message);
});
