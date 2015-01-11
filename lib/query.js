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

    var Namespaces = typeof require === 'function'
        ? require ('./namespaces') : wald.query.Namespaces;
    var core = typeof require === 'function' ? require ('./core') : wald.query.core;

    var Drivers = function () {
        this._drivers = {};
    };

    Drivers.prototype.register = function (name, driver) {
        this._drivers[name] = driver;
    };

    Drivers.prototype.connect = function (dsn) {
        var colon = dsn.indexOf (':');
        if (colon === -1) {
            throw new Error ('could not parse data source name');
        }
        var driverName = dsn.slice (0, colon);
        // FIXME: error handling.
        return new this._drivers[driverName](dsn.slice (colon + 1));
    };

    wald.query.drivers = new Drivers();
    if (typeof require === 'function') {
        // FIXME: implement hdt as well.
        require ('./drivers/ldf') (wald.query.drivers);
        require ('./drivers/web') (wald.query.drivers);
    }

    var Query = function (dsn, ns) {
        this.connection = wald.query.drivers.connect (dsn);
        this.namespaces = ns;
    };

    Query.prototype.query = function (subject, model) {
        var self = this;

        var terms = core.terms (model);
        subject = self.namespaces.expandTerm (subject);

        return when.map (terms, function (term) {
            var predicate = self.namespaces.expandTerm (term);

            return self.connection.query ({
                subject: subject,
                predicate: predicate,
                object: null
            });
        }).then (function (data) {
            var result = _.object (terms, data);
            result['@id'] = [ { subject: subject, predicate: '@id', object: subject } ];
            return result;
        }).then (function (data) {
            return core.buildModel (data, model);
        });
    };

    /**
     * Connect to a data source, and then initialize and return a query object with that
     * connection.
     *
     * This takes a [DSN](https://en.wikipedia.org/wiki/Data_source_name) which describes a
     * connection to a data source.  The scheme:// part should be the name of a registered
     * driver.
     *
     * Examples:
     *
     *     // connect to a local [linked data fragments](http://linkeddatafragments.org/) server
     *     var q = new wald.query.Query('ldf:http://localhost:5000/wikidata/');
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
