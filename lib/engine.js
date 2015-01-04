/**
 *   This file is part of wald-query.
 *   Copyright (C) 2015  Kuno Woudt <kuno@frob.nl>
 *
 *   This program is free software: you can redistribute it and/or modify
 *   it under the terms of copyleft-next 0.3.0.  See LICENSE.txt.
 */

/*global Lazy */

var wald = wald ? wald : {};
wald.query = wald.query ? wald.query : {};

(function () {
    'use strict';

    var engine = {};

    if (typeof require === 'function') {
        var when = require ('when');
    }

    var lazy = typeof require === 'function' ? require ('lazy.js') : Lazy;
    var util = typeof require === 'function' ? require ('./util') : wald.query.util;
    var pipeline = typeof require === 'function' ? require ('when/pipeline') : when.pipeline;

    var QueryBuilder = function (term) {
        this._term = term;
        this._filters = [];
    };

    QueryBuilder.prototype.addFilter = function (filterFunc) {
        this._filters.push (filterFunc);
    };

    QueryBuilder.prototype.execute = function (queryObj, subject) {
        var self = this;

        // make connection available to subqueries.
        self.query = queryObj;

        var pattern = {
            subject: self.query.namespaces.expandTerm (subject),
            predicate: self.query.namespaces.expandTerm (this._term),
            object: ''
        };

        return self.query.connection.query (pattern).then (function (triples) {
            return pipeline (self._filters, lazy (triples));
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
    };

    var subquery = function (queryOrTerm, model) {
        var self = this;

        var qb = engine.querybuilder (queryOrTerm);

        qb.addFilter(function (data) {
            if (data.isEmpty ()) {
                return when (lazy ([]));
            }

            return when.all (data.map (function (item) {
                var subject = item.object;
                if (model instanceof engine.QueryBuilder) {
                    return model.execute (qb.query, subject);
                } else {
                    return self.query (subject, model);
                }
            }).toArray ()).then (function (results) {
                return lazy (results);
            });
        });

        return qb;
    };

    var query = function (subject, queryModel) {
        var self = this;

        subject = self.namespaces.expandTerm (subject);

        var resultModel = {};
        var waitFor = lazy (queryModel).map (function (item, key) {
            if (item === '@id') {
                resultModel[key] = subject;
                return when (subject);
            }

            var promise = engine.querybuilder (item).execute (self, subject);

            promise.then (function (results) {
                resultModel[key] = util.unwrapLazy (results);
            }).catch (function (error) {
                console.log('ERROR:', error.message);
            });

            return promise;
        }).toArray ();

        var deferred = when.defer();

        when.settle(waitFor).then (function () {
            deferred.resolve (resultModel);
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
