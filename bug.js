/**
 *   This file is part of wald:find.
 *   Copyright (C) 2015  Kuno Woudt <kuno@frob.nl>
 *
 *   This program is free software: you can redistribute it and/or modify
 *   it under the terms of copyleft-next 0.3.0.  See LICENSE.txt.
 */

'use strict';

var N3 = require ('n3');
var fs = require ('fs');
var jsonld = require ('jsonld').promises;
var ldf = require('ldf-client');
var when = require ('when');

require ('ldf-client/lib/util/Logger').setLevel ('DEBUG');

var FilterIterator = require ('ldf-client/lib/iterators/FilterIterator');

var matchesPattern = function (pattern, triple) {
    var subjectMatch   = pattern.subject   === triple.subject   || pattern.subject   === null || pattern.subject   === '';
    var predicateMatch = pattern.predicate === triple.predicate || pattern.predicate === null || pattern.predicate === '';
    var objectMatch    = pattern.object    === triple.object    || pattern.object    === null || pattern.object    === '';

    return subjectMatch && predicateMatch && objectMatch;
};

var ldfQuery = function (connection, pattern) {
    var deferred = when.defer();

    var client = new ldf.FragmentsClient (connection);

    var fragment = client.getFragmentByPattern(pattern);
    var filtered = new FilterIterator (fragment, function (triple) {
        return matchesPattern (pattern, triple);
    });

    filtered.toArray (function (error, items) {
        if (error) {
            console.log('ERROR:', error);
            deferred.reject (error);
        } else {
            deferred.resolve (items);
        }
    });

    return deferred.promise;
};

var fileLoad = function (filename) {
    var deferred = when.defer();
    var body = fs.readFileSync (filename).toString ();
    var parser = new N3.Parser ();
    var store = new N3.Store();

    var nquads = jsonld.toRDF (JSON.parse (body), { format: 'application/nquads' });

    nquads.then (function (data) {
        parser.parse (data, function (error, triple, prefixes) {
            if (error) {
                deferred.reject (error);
            } else if (triple) {
                store.addTriple (triple);
            } else {
                deferred.resolve (store);
            }
        });
    });

    return deferred.promise;
};

var fileQuery = function (filename, pattern) {
    return fileLoad (filename).then (function (store) {
        return store.find(pattern.subject, pattern.predicate, pattern.object);
    });
};

// Of the following two options, if either ldf or file is enabled the correct result is
// returned for that query.  If both are enabled the ldfQuery never returns.
var enabled = {
    ldf: true,
    file: true
};


if (enabled.ldf) {
    ldfQuery ('http://localhost:4014/licensedb', {
        subject: 'http://gnu.org/licenses/agpl-3.0.html',
        predicate: 'http://purl.org/dc/terms/title',
        object: null
    }).then (function (data) {
        console.log('ldfQuery results', data);
    }).catch (function (error) {
        console.log('ldfQuery error', error);
    });
}

if (enabled.file) {
    fileQuery ('data/licensedb.2014-01-19.jsonld', {
        subject: 'http://gnu.org/licenses/agpl-3.0.html',
        predicate: 'http://purl.org/dc/terms/title',
        object: null
    }).then (function (data) {
        console.log('fileQuery results', data);
    }).catch (function (error) {
        console.log('fileQuery error', error);
    });
}
