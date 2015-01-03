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

    var engine =  typeof require === 'function' ? require ('./lib/engine')  : wald.query.engine;
    var filters = typeof require === 'function' ? require ('./lib/filters') : wald.query.filters;
    var util =    typeof require === 'function' ? require ('./lib/util') : wald.query.util;

    var Drivers = function () {
        this._drivers = {};
    };

    Drivers.prototype.register = function (name, driver) {
        this._drivers[name] = driver;
    };

    Drivers.prototype.connect = function (dsn) {
        var colon = dsn.indexOf (':');
        if (colon === -1) {
            throw new Error ("could not parse data source name");
        }
        var driver_name = dsn.slice (0, colon);
        // FIXME: error handling.
        return new this._drivers[driver_name](dsn.slice (colon + 1));
    };

    wald.query.drivers = new Drivers();

    if (typeof require === 'function') {
        var Lazy = require ('lazy.js');
        var N3 = require ('n3');
        var traverse = require ('traverse');
        var when = require ('when');

        require ('./lib/drivers/ldf.js') (wald.query.drivers);
    }

    var Query = function (dsn) {
        this._connection = wald.query.drivers.connect (dsn);
    };

    for (var key in filters) {
        if (filters.hasOwnProperty (key)) {
            Query.prototype[key] = filters[key];
        }
    }

    Query.prototype.subquery = function (query_or_term, model) {
        var qb = engine.querybuilder (query_or_term);

        if (model) {
            for (var key in model) {
                if (model.hasOwnProperty (key)) {
                    model[key] = engine.querybuilder (model[key]);
                }
            }
        }

        return qb;
    };

    Query.prototype.query = function (subject, query_model) {
        var self = this;

        var result_model = {};
        var wait_for = Lazy (query_model).map (function (item, key) {
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

    /**
    * Connect to a data source, and then initialize and return a query object with that
    * connection.
    *
    * This constructor takes a [DSN](https://en.wikipedia.org/wiki/Data_source_name) which
    * describes a connection to a data source.  The scheme:// part should be the name of a
    * registered driver.  Examples:
    *
    *     // connect to a local [linked data fragments](http://linkeddatafragments.org/) server
    *     var q = new wald.query.Query("ldf://localhost:5000/wikidata/");
    *
    *     // use a local RDF [HDT](http://www.rdfhdt.org/) file.
    *     var r = new wald.query.Query("hdt://data/wikidata-2014-05-26.hdt");
    *
    * @param string connection data source name
    */
    wald.query.connect = function (connection) {
        return new Query (connection);
    };
})();

if (typeof module === 'object') {
    module.exports = wald.query;
}
