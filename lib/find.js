/**
 *   This file is part of wald:find.
 *   Copyright (C) 2015  Kuno Woudt <kuno@frob.nl>
 *
 *   This program is free software: you can redistribute it and/or modify
 *   it under the terms of copyleft-next 0.3.0.  See LICENSE.txt.
 */

/* global find:true */

'use strict';

// use the browserified version of N3, which prevents our own browserify from pulling
// in all kinds of node.js dependencies.  FIXME: figure out a better way to deal with this.
var N3 = require('n3/browser/n3-browser');
var when = require ('when');
var traverse = require ('traverse');
var _ = require ('underscore');

var Namespaces = require ('./namespaces');
var core = require ('./core');

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

var find = {};
find.drivers = new Drivers();

// FIXME: implement hdt as well.
require ('./drivers/ldfb') (find.drivers);

var Query = function (dsn, ns) {
    this.connection = find.drivers.connect (dsn);
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

Query.prototype.subquery = function (predicate, model) {
    return new core.Subquery (predicate, model, this);
};

Query.prototype.sameAs = function (predicate, model) {
    return new core.SameAs (predicate, model, this);
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
 *     var q = new find.Query('ldf:http://localhost:5000/wikidata/');
 *
 * @param string connection data source name
 */
find.connect = function (connection, namespaces) {
    if (namespaces == null) {
        namespaces = new Namespaces ();
    }

    return new Query (connection, namespaces);
};

var hideLanguage = function (literal, preferredLanguage) {
    // FIXME: match 'en' preferred to e.g. 'en-GB' and 'en-US'

    var lang = N3.Util.getLiteralLanguage (literal);
    if (lang === '') {
        return false;
    }

    return lang !== preferredLanguage;
};

find.language = function (language) {
    return function (queryResult) {
        var step1 = traverse (queryResult).map (function (item) {
            if (!this.isLeaf || !N3.Util.isLiteral (item)) {
                return;
            }

            if (language && hideLanguage (item, language)) {
                this.delete ();
            }
        });

        return traverse (step1).map (function (item) {
            if (_(item).isArray ()) {
                this.update (_(item).compact ());
            }
        });
    };
};

find.normalizeModel = function (queryResult) {
    return traverse (queryResult).map (function (item) {
        if (!this.isLeaf || !N3.Util.isLiteral (item)) {
            return;
        }

        this.update (N3.Util.getLiteralValue (item));
    });
};

module.exports = find;