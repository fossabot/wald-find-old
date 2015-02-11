/**
 *   This file is part of wald:find.
 *   Copyright (C) 2015  Kuno Woudt <kuno@frob.nl>
 *
 *   This program is free software: you can redistribute it and/or modify
 *   it under the terms of copyleft-next 0.3.0.  See LICENSE.txt.
 *
 *
 *   This is an alternative Linked Data Fragments driver which is better optimized
 *   to work in a browser environment.  (ldf-client pulls in some node.js modules
 *   in its browserified version, which as a result clocks in at 557 kb non-minified
 *   non-gzipped).
 */

'use strict';

var N3 = require('n3');
var when = require ('when');
var querystring = require ('querystring');

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
    xhr.setRequestHeader('Accept', 'application/trig');
    xhr.send();

    return deferred.promise;
};

var Driver = function (connection) {
    this._server = connection;
};

Driver.prototype.page = function (url, triples) {
    var self = this;
    var parser = new N3.Parser({ format: 'application/trig' });
    var nextPage = null;

    if (!triples) {
        triples = [];
    }

    return getRequest (url).then (function (body) {
        var deferred = when.defer();

        parser.parse (body, function (parserError, triple, prefixes) {
            if (parserError != null) {
                return deferred.reject (parserError);
            }

            if (!triple) {
                return deferred.resolve (nextPage ? self.page (nextPage, triples) : triples);
            }

            if (triple.graph === '') {
                triples.push (triple);
            } else if (triple.predicate === 'http://www.w3.org/ns/hydra/core#nextPage') {
                nextPage = triple.object;
            }
        });

        return deferred.promise;
    });
};

Driver.prototype.query = function (pattern) {
    var url = this._server + '?' + querystring.stringify(pattern);

    return this.page (url);
};

module.exports = function (registry) {
    registry.register('ldfb', Driver);
};
