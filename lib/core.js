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
        var _ = require ('underscore');
    }

    var core = {};

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

            if (_(value).isFunction ()) {
                throw new Error('Model error: ' + key
                                + ' is a function, which is not yet supported');
            }

            throw new Error('Model error: ' + key + ' has type ' + (typeof key)
                            + ', expected a string or array of strings');
        }).filter (function (item) {
            return item !== '@id';
        });
    };

    core.buildModel = function (data, model) {
        return _(model).reduce (function (memo, value, key) {
            var predicate;

            if (_(value).isArray ()) {
                predicate = value[0];
                memo[key] = _(data[predicate]).pluck('object');
            } else if (_(value).isString ()) {
                predicate = value;

                if (data[predicate].length === 0) {
                    memo[key] = null;
                } else {
                    memo[key] = data[predicate][0].object;
                }
            } else if (_(value).isFunction ()) {
                throw new Error('Model error: ' + key
                                + ' is a function, which is not yet supported');
            } else {
                throw new Error('Model error: ' + key + ' has type ' + (typeof key)
                                + ', expected a string or array of strings');
            }

            return memo;
        }, {});
    };

    wald.query.core = core;
})();

if (typeof module === 'object') {
    module.exports = wald.query.core;
}
