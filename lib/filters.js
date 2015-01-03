/**
 *   This file is part of wald-query.
 *   Copyright (C) 2015  Kuno Woudt <kuno@frob.nl>
 *
 *   This program is free software: you can redistribute it and/or modify
 *   it under the terms of copyleft-next 0.3.0.  See LICENSE.txt.
 */

var wald = wald ? wald : {};
wald.query = wald.query ? wald.query : {};
wald.query.filters = {};

(function () {
    'use strict';

    var engine = typeof require === 'function' ? require ('./engine') : wald.query.engine;

    if (typeof require === 'function') {
        var Lazy = require ('lazy.js');
        var N3 = require ('n3');
    }

    var getLiteralValue = function (triple) {
        if (!triple) {
            return null;
        }

        if (N3.Util.isLiteral (triple.object)) {
            return N3.Util.getLiteralValue (triple.object);
        } else {
            console.log('WARNING: Literal expected (got:',
                        JSON.stringify(triple, null, '    '), ')');
            return null;
        }
    };

    var comma = function (data) {
        var len = data.length ();
        if (len === 0 || len === 1) {
            return data;
        }

        return data.initial ().toArray ().join (', ') + ' & ' + data.last ();
    };

    var literal = function (data) {
        if (data instanceof Lazy.Sequence) {
            return data.map (getLiteralValue);
        } else {
            return getLiteralValue (data);
        }
    };

    var wrapFilter = function (filter) {
        return function (queryOrTerm) {
            var qb = engine.querybuilder (queryOrTerm);

            qb.addFilter(filter);

            return qb;
        };
    };

    wald.query.filters.comma = wrapFilter (comma);
    wald.query.filters.literal = wrapFilter (literal);
    wald.query.filters.all = wrapFilter (function (data) { return data; });
    wald.query.filters.first = wrapFilter (function (data) { return data.first (); });
    wald.query.filters.rest = wrapFilter (function (data) { return data.rest (); });

})();

if (typeof module === 'object') {
    module.exports = wald.query.filters;
}
