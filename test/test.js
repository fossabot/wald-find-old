/**
 *   This file is part of wald:find.
 *   Copyright (C) 2015  Kuno Woudt <kuno@frob.nl>
 *
 *   This program is free software: you can redistribute it and/or modify
 *   it under the terms of copyleft-next 0.3.0.  See LICENSE.txt.
 */

'use strict';

/* global suite test find:true */

var N3 = require ('n3');
var _ = require ('underscore');
var assert = require ('assert');
var find = require ('../lib/find');
var leche = require('leche');

require ('../lib/drivers/ldf') (find.drivers);
require ('../lib/drivers/ldfb') (find.drivers);
require ('../lib/drivers/file') (find.drivers);

var licensedb = 'http://localhost:4014/licensedb';

var clients = {
    // disable the ldf-client test for now as it is broken on node 0.10.x when combined with
    // the file-jsonld test.

    // FIXME: enable this again when travis-ci supports io.js 1.0.x
    // 'ldf-client': find.connect ('ldf:' + licensedb),
    'ldf-b': find.connect ('ldfb:' + licensedb),
    'file-ttl': find.connect ('file:file://data/licensedb.2014-01-19.ttl'),
    'file-jsonld': find.connect ('file:file://data/licensedb.2014-01-19.jsonld')
};

Object.keys(clients).forEach (function (key) {
    clients[key].namespaces.addPrefix('dcterms', 'http://purl.org/dc/terms/');
});

suite ('Query', function () {
    leche.withData (clients, function (wf) {
        var prefix = this.title.replace ('with ', '') + ': ';

        test (prefix + 'simple terms', function () {
            var result = wf.query ('http://gnu.org/licenses/gpl-3.0.html', {
                id: '@id',
                sameAs: [ 'owl:sameAs' ],
                name: 'dcterms:title',
            });

            return result.then (function (data) {
                assert.equal (data.id, 'http://gnu.org/licenses/gpl-3.0.html');
                assert.equal (data.name, '"GNU General Public License"');
                assert.equal (data.sameAs[0], 'https://licensedb.org/id/GPL-3');
            });
        });

        test (prefix + 'subquery in array', function () {
            var result = wf.query ('http://gnu.org/licenses/agpl-3.0.html', {
                id: '@id',
                name: 'dcterms:title',
                replaces: [ wf.subquery ('dcterms:replaces', {
                    id: '@id',
                }) ]
            });

            return result.then (function (data) {
                var replaces = _(data.replaces).chain ().pluck ('id').sort ().value ();

                assert.equal (data.id, 'http://gnu.org/licenses/agpl-3.0.html');
                assert.equal (replaces[0], 'https://licensedb.org/id/AGPL-1');
                assert.equal (replaces[1], 'https://licensedb.org/id/AGPL-2');
            });
        });

        test (prefix + 'normalize', function () {
            var result = wf.query ('http://gnu.org/licenses/agpl-3.0.html', {
                id: '@id',
                name: 'dcterms:identifier',
                version: 'dcterms:hasVersion',
                titles: [ 'dcterms:title' ],
            }).then (find.normalizeModel);

            return result.then (function (data) {
                assert.equal (data.id, 'http://gnu.org/licenses/agpl-3.0.html');
                assert.equal (data.name, 'GNU AGPL');
                assert.equal (data.version, '3.0');
                assert.equal (data.titles[0], 'GNU Affero General Public License');
            });
        });

        test (prefix + 'language filter', function () {
            var result = wf.query ('http://creativecommons.org/licenses/by-sa/3.0/', {
                id: '@id',
                titles: [ 'dcterms:title' ],
            }).then (find.language ('ko')).then (find.normalizeModel);

            return result.then (function (data) {
                var sorted = _(data.titles).sort ();

                assert.equal (data.id, 'http://creativecommons.org/licenses/by-sa/3.0/');
                assert.equal (sorted[0], 'Attribution-ShareAlike 3.0 Unported');
                assert.equal (sorted[1], '저작자표시-동일조건변경허락 3.0 Unported');
            });
        });

        test (prefix + 'owl:sameAs', function () {
            var result = wf.query ('http://gnu.org/licenses/agpl-3.0.html', {
                id: '@id',
                name: 'dcterms:title',
                version: 'dcterms:hasVersion',
                replaces: [ wf.sameAs('dcterms:replaces', {
                    id: '@id',
                    name: 'dcterms:title',
                    version: 'dcterms:hasVersion'
                }) ]
            }).then (find.normalizeModel);

            return result.then (function (data) {
                var sorted = _(data.replaces).sortBy ('id');

                assert.equal (data.id, 'http://gnu.org/licenses/agpl-3.0.html');
                assert.equal (data.name, 'GNU Affero General Public License');
                assert.equal (data.version, '3.0');
                assert.equal (sorted[0].id, 'http://www.affero.org/agpl2.html');
                assert.equal (sorted[1].id, 'http://www.affero.org/oagpl.html');
                assert.equal (sorted[0].name, 'Affero General Public License');
                assert.equal (sorted[1].name, 'Affero General Public License');
                assert.equal (sorted[0].version, '2');
                assert.equal (sorted[1].version, '1');
            });
        });


        test (prefix + 'turtles', function () {
            var result = wf.query ('http://gnu.org/licenses/agpl-3.0.html', {
                id: '@id',
                replaces: [ wf.sameAs('dcterms:replaces', {
                    id: '@id',
                    name: 'dcterms:title',
                    replacedBy: [ wf.sameAs('dcterms:isReplacedBy', {
                        id: '@id',
                        name: 'dcterms:title',
                    }) ]
                }) ]
            }).then (find.normalizeModel);

            return result.then (function (data) {
                var level1 = _(data.replaces).sortBy ('id');

                // AGPLv2 is replaced by v3.
                assert.equal (data.id, 'http://gnu.org/licenses/agpl-3.0.html');
                assert.equal (level1[0].id, 'http://www.affero.org/agpl2.html');
                assert.equal (level1[0].replacedBy[0].id, data.id);

                var level2 = _(level1[1].replacedBy).sortBy ('id');
                assert.equal (level2[0].name, 'GNU Affero General Public License');
                assert.equal (level2[1].name, 'Affero General Public License');
            });
        });

        test (prefix + 'paging', function () {
            var pattern = {
                subject: 'http://creativecommons.org/licenses/by-sa/3.0/',
                predicate: null,
                object: null
            };

            return wf.connection.query (pattern).then (function (data) {
                assert.equal (data.length, 115);

                var titles = _(data).filter (function (item) {
                    return item.predicate === 'http://purl.org/dc/terms/title';
                });

                assert.equal (titles.length, 91);

                var sorted = _(titles).sortBy ('object');

                assert.equal (N3.Util.getLiteralLanguage (sorted[0].object), 'eu');
                assert.equal (N3.Util.getLiteralValue (sorted[0].object),
                    'Aitortu-PartekatuBerdin 3.0 Unported');

                assert.equal (N3.Util.getLiteralLanguage (sorted[90].object), 'ko');
                assert.equal (N3.Util.getLiteralValue (sorted[90].object),
                    '저작자표시-동일조건변경허락 3.0 Unported');
            });
        });
    });
});
