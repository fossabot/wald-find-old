/**
 *   This file is part of wald-elements
 *   Copyright (C) 2014  Kuno Woudt <kuno@frob.nl>
 *
 *   This program is free software: you can redistribute it and/or modify
 *   it under the terms of copyleft-next 0.3.0.  See LICENSE.txt.
 */

var wald = wald ? wald : {};
wald.query = wald.query ? wald.query : {};

(function () {
    "use strict";

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
        var traverse = require ('traverse');
        var when = require('when');
        wald.query.transform = require ('./lib/transform.js');
        require ('./lib/drivers/ldf.js') (wald.query.drivers);
    }

    var Query = function (dsn) {
        this._connection = wald.query.drivers.connect (dsn);
    };

    Query.prototype.query = function (subject, model) {

        var query_rows = [];

        traverse(model).forEach (function (item) {
            if (!item) {
                return;
            }

            if (typeof item === 'object' && item.hasOwnProperty('query')) {
                query_rows.push (item.query);
            }
        });

        var result_rows = this._connection.queryMultiple (query_rows);

        when.settle (result_rows).then (function (results) {
            console.log ('results:', results[0].value.value['@graph']);
        });

        return null;
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
