#!/usr/bin/env node
'use strict';

/* global find:true */
var find = require('../lib/find');

require ('../lib/drivers/web') (find.drivers);

var wf = find.connect('web:');

var mbid = 'https://musicbrainz.org/release-group/0b8e14e1-d44d-3770-8617-5c6137a444a8';
var result = wf.query(mbid, {
    id: '@id',
    name: 'schema:name',
    artist: wf.subquery ('schema:byArtist', {
        id: '@id',
        name: 'schema:name',
        birthdate: 'schema:foundingDate'
    }),
}).then (find.normalizeModel);

result.then (function (data) {
    console.log (JSON.stringify (data, null, 4));
}).catch (function (error) {
    console.log ('ERROR:', error.message);
});
