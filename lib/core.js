/**
 *   This file is part of wald-query.
 *   Copyright (C) 2015  Kuno Woudt <kuno@frob.nl>
 *
 *   This program is free software: you can redistribute it and/or modify
 *   it under the terms of copyleft-next 0.3.0.  See LICENSE.txt.
 */

var wald = wald ? wald : {};
wald.query = wald.query ? wald.query : {};

(function () {
    'use strict';

    if (typeof require === 'function') {
        var when = require ('when');
        var _ = require ('underscore');
    }

    var core = {};

    core.Subquery = function (predicate, model, parent) {
        this.predicate = predicate;
        this.model = model;
        this.parent = parent;
    };

    core.Subquery.prototype.run = function (subject) {
        return this.parent.query (subject, this.model);
    };

    core.terms = function (model) {

        return _(model).map (function (value, key) {
            if (_(value).isArray ()) {
                if (value.length !== 1) {
                    throw new Error('Model error: ' + key + ' has '
                                    + value.length + ' items, expected 1');
                }
                value = value[0];
            }

            if (_(value).isString ()) {
                return value;
            }

            if (value instanceof core.Subquery) {
                return value.predicate;
            }

            throw new Error('Model error: ' + key + ' has type ' + (typeof key)
                            + ', expected a string or array of strings');
        }).filter (function (item) {
            return item !== '@id';
        });
    };

    core.buildModel = function (queryResult, model) {
        var resolve = function (value) {
            var predicate = value;
            if (value instanceof core.Subquery) {
                // flatten array?
                return when.map (queryResult[value.predicate], function (item) {
                    return value.run (item.object);
                });
            } else {
                return when.map (queryResult[predicate], function (item) {
                    return item.object;
                });
            }
        };

        var reducer = function (memo, key, idx) {
            var value = model[key];

            if (_(value).isArray ()) {
                return resolve (value[0]).then (function (data) {
                    memo[key] = data;
                    return memo;
                });
            } else {
                return resolve (value).then (function (data) {
                    if (data.length === 0) {
                        memo[key] = null;
                    } else {
                        memo[key] = data[0];
                    }
                    return memo;
                });
            }
        };

        return when.reduce (_(model).keys (), reducer, {});
    };

    wald.query.core = core;
})();

if (typeof module === 'object') {
    module.exports = wald.query.core;
}
