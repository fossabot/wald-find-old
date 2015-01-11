/**
 *   This file is part of wald-query.
 *   Copyright (C) 2015  Kuno Woudt <kuno@frob.nl>
 *
 *   This program is free software: you can redistribute it and/or modify
 *   it under the terms of copyleft-next 0.3.0.  See LICENSE.txt.
 */

/* global suite test */

var assert = require ('assert');

// var waldquery = require('../lib/query.js');
var query = require ('../lib/query.js');

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

});
