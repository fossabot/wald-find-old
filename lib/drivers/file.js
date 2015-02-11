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
var when = require ('when');

var XHR;
if (typeof XMLHttpRequest !== 'function') {
    XHR = require('xmlhttprequest').XMLHttpRequest;
} else {
    XHR = XMLHttpRequest;
}

var getRequest = function (url) {
    var deferred = when.defer();

    var xhr = new XHR();
    xhr.onload = function () {
        // FIXME: check status code
        deferred.resolve (this.responseText);
    };

    // FIXME: is there an onerror or equivalent we need to check?

    xhr.open('get', url, true);
    xhr.send();

    return deferred.promise;
};

var Driver = function (filename) {
    var scheme = filename.split(':', 1);

    if (scheme[0] === 'file') {
        var withoutScheme = filename.replace('file://', '');
        this._data = when (fs.readFileSync (withoutScheme).toString ());
    } else {
        // FIXME: does xhr work with data: URLs?  If not, add support for those.
        this._data = getRequest (filename);
    }

    var deferred = when.defer();
    this._store = deferred.promise;

    this._data.then (function (body) {
        var parser = new N3.Parser ();
        var store = new N3.Store();
        var nquads = '';

        if (body[0] === '{') {
            nquads = jsonld.toRDF (JSON.parse (body), { format: 'application/nquads' });
        } else if (body[0] === '<') {
            // FIXME: rdf/xml not yet supported.
            deferred.resolve (store);
        } else {
            nquads = when(body);
        }

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
    });
};

Driver.prototype.query = function (pattern) {
    return this._store.then (function (store) {
        return store.find(pattern.subject, pattern.predicate, pattern.object);
    });
};

module.exports = function (registry) {
    registry.register('file', Driver);
};
