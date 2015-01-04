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

    var engine     = typeof require === 'function' ? require ('./lib/engine')     : wald.query.engine;
    var filters    = typeof require === 'function' ? require ('./lib/filters')    : wald.query.filters;
    var Namespaces = typeof require === 'function' ? require ('./lib/namespaces') : wald.query.Namespaces;

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
        // FIXME: implement hdt as well.
        require ('./lib/drivers/ldf') (wald.query.drivers);
        require ('./lib/drivers/web') (wald.query.drivers);
    }

    var Query = function (dsn, ns) {
        this.connection = wald.query.drivers.connect (dsn);
        this.namespaces = ns;
    };

    for (var key in filters) {
        if (filters.hasOwnProperty (key)) {
            Query.prototype[key] = filters[key];
        }
    }

    for (var key in engine) {
        if (engine.hasOwnProperty (key)) {
            Query.prototype[key] = engine[key];
        }
    }

    /**
    * Connect to a data source, and then initialize and return a query object with that
    * connection.
    *
    * This takes a [DSN](https://en.wikipedia.org/wiki/Data_source_name) which describes a
    * connection to a data source.  The scheme:// part should be the name of a registered driver.
    * Examples:
    *
    *     // connect to a local [linked data fragments](http://linkeddatafragments.org/) server
    *     var q = new wald.query.Query("ldf:http://localhost:5000/wikidata/");
    *
    * @param string connection data source name
    */
    wald.query.connect = function (connection, namespaces) {
        if (namespaces == null) {
            namespaces = new Namespaces ();
        }

        return new Query (connection, namespaces);
    };
})();

if (typeof module === 'object') {
    module.exports = wald.query;
}
