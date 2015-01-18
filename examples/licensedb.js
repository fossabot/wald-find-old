#!/usr/bin/env node
'use strict';

/* global find:true */
var find = require('../lib/find');

var wf = find.connect('ldf:http://localhost:4014/licensedb');
var result = wf.query('http://gnu.org/licenses/agpl-3.0.html', {
    id: '@id',
    logo: 'foaf:logo',
    sameAs: [ 'owl:sameAs' ],
    name: 'dcterms:title',
    version: 'dcterms:hasVersion',
    replaces: [ wf.sameAs('dcterms:replaces', {
        id: '@id',
        name: 'dcterms:title',
        version: 'dcterms:hasVersion',
    }) ],
}).then (find.normalizeModel);

result.then (function (data) {
    console.log (JSON.stringify (data, null, 4));
}).catch (function (error) {
    console.log ('ERROR:', error.message);
});
