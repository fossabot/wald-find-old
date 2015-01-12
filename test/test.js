/**
 *   This file is part of wald-query.
 *   Copyright (C) 2015  Kuno Woudt <kuno@frob.nl>
 *
 *   This program is free software: you can redistribute it and/or modify
 *   it under the terms of copyleft-next 0.3.0.  See LICENSE.txt.
 */

/* global suite test */

var assert = require ('assert');
var _ = require ('underscore');

var query = require ('../lib/query');
var core = require ('../lib/core');

var wq = query.connect ('ldf:http://localhost:4014/licensedb');

suite ('Query', function () {
    'use strict';

    test ('simple terms', function () {
        var result = wq.query ('http://gnu.org/licenses/gpl-3.0.html', {
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

    test ('subquery in array', function () {
        var result = wq.query ('http://gnu.org/licenses/agpl-3.0.html', {
            id: '@id',
            name: 'dcterms:title',
            replaces: [ wq.subquery ('dcterms:replaces', {
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

    test ('normalize', function () {
        var result = wq.query ('http://gnu.org/licenses/agpl-3.0.html', {
            id: '@id',
            name: 'dcterms:identifier',
            version: 'dcterms:hasVersion',
            titles: [ 'dcterms:title' ],
        }).then (core.normalizeModel);

        return result.then (function (data) {
            assert.equal (data.id, 'http://gnu.org/licenses/agpl-3.0.html');
            assert.equal (data.name, 'GNU AGPL');
            assert.equal (data.version, '3.0');
            assert.equal (data.titles[0], 'GNU Affero General Public License');
        });
    });

    test ('language filter', function () {
        var result = wq.query ('http://creativecommons.org/licenses/by-sa/3.0/', {
            id: '@id',
            titles: [ 'dcterms:title' ],
        }).then (core.language ('ko')).then (core.normalizeModel);

        return result.then (function (data) {
            var sorted = _(data.titles).sort ();

            assert.equal (data.id, 'http://creativecommons.org/licenses/by-sa/3.0/');
            assert.equal (sorted[0], 'Attribution-ShareAlike 3.0 Unported');
            assert.equal (sorted[1], '저작자표시-동일조건변경허락 3.0 Unported');
        });
    });

});
