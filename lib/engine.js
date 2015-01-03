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
    "use strict";

    var engine = {};

    var util =     typeof require === 'function' ? require ('./util')        : wald.query.util;
    var pipeline = typeof require === 'function' ? require ('when/pipeline') : when.pipeline;

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

        // make connection available to subqueries.
        self._connection = connection;

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
            console.log ('got', when.isPromiseLike (term), Object.keys (term));
            throw new Error('querybuilder expects a string or a QueryBuilder argument');
        }
    }

    var subquery = function (query_or_term, model) {
        var self = this;

        var qb = engine.querybuilder (query_or_term);

        qb.addFilter(function (data) {
            // FIXME: subquery does an implicit first() here, perhaps it should return
            // all results.
            var subject = data.first ().object;

            if (model instanceof engine.QueryBuilder) {
                return model.execute (qb._connection, subject);
            } else {
                return self.query (subject, model);
            }
        });

        return qb;
    };

    var query = function (subject, query_model) {
        var self = this;

        var result_model = {};
        var wait_for = Lazy (query_model).map (function (item, key) {
            if (item === "@id") {
                result_model[key] = subject;
                return when (subject);
            }

            var promise = engine.querybuilder (item).execute (self._connection, subject);

            promise.then (function (results) {
                result_model[key] = util.unwrap_lazy (results);
            }).catch (function (error) {
                console.log('ERROR:', error.message);
            });

            return promise;
        }).toArray ();

        var deferred = when.defer();

        when.settle(wait_for).then (function () {
            deferred.resolve (result_model);
        });

        return deferred.promise;
    };

    engine.QueryBuilder = QueryBuilder;
    engine.querybuilder = querybuilder;
    engine.subquery = subquery;
    engine.query = query;

    wald.query.engine = engine;
})();

if (typeof module === 'object') {
    module.exports = wald.query.engine;
}
