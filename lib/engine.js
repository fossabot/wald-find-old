/**
 *   This file is part of wald-query.
 *   Copyright (C) 2015  Kuno Woudt <kuno@frob.nl>
 *
 *   This program is free software: you can redistribute it and/or modify
 *   it under the terms of copyleft-next 0.3.0.  See LICENSE.txt.
 */

var wald = wald ? wald : {};
wald.query = wald.query ? wald.query : {};
wald.query.engine = {};

(function () {
    "use strict";

    if (typeof require === 'function') {
        var Lazy = require ('lazy.js');
        var N3 = require ('n3');
        var traverse = require ('traverse');
        var when = require ('when');
        var pipeline = require('when/pipeline');
    } else {
        var pipeline = when.pipeline;
    }

    var QueryBuilder = function (term) {
        this._term = term;
        this._filters = [];
    };

    QueryBuilder.prototype.addFilter = function (filterFunc) {
        this._filters.push (filterFunc);
    };

    QueryBuilder.prototype.execute = function (connection, subject) {
        var self = this;

        var pattern = {
            subject: subject,
            predicate: this._term,
            object: ''
        };

        return connection.query (pattern).then (function (triples) {
            return pipeline (self._filters, Lazy (triples));
        });
    };

    var querybuilder = function (term) {
        if (term instanceof QueryBuilder) {
            return term;
        } else if (typeof term === 'string') {
            return new QueryBuilder (term);
        } else {
            throw new Error('querybuilder expects a string or a QueryBuilder argument');
        }
    }

    wald.query.engine.querybuilder = querybuilder;

})();

if (typeof module === 'object') {
    module.exports = wald.query.engine;
}
