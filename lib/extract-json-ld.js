/**
 *   This file is part of wald:find.
 *   Copyright (C) 2015  Kuno Woudt <kuno@frob.nl>
 *
 *   This program is free software: you can redistribute it and/or modify
 *   it under the terms of copyleft-next 0.3.0.  See LICENSE.txt.
 */

'use strict';

var N3 = require('n3');
var _ = require ('underscore');
var jsdom = require ('jsdom');
var jsonld = require ('jsonld').promises;
var when = require ('when');

var extractScripts = function (body, type) {
    var deferred = when.defer();

    jsdom.env(body, [], function (errors, window) {
        var ldscripts = window.document.querySelectorAll ('script[type="' + type + '"]');

        deferred.resolve (_(ldscripts).pluck ('text'));
    });

    return deferred.promise;
};

var parseDocument = function (body) {
    return extractScripts (body, 'application/ld+json').then (function (scripts) {
        var ret = [];

        scripts.forEach (function (item) {
            var scriptBody = item == null ? '' : item.trim ();

            if (scriptBody.length > 0) {
                var doc = JSON.parse (scriptBody);
                var options = { format: 'application/nquads' };

                ret.push (jsonld.toRDF(doc, options));
            }
        });

        // FIXME: this combines multiple nquad documents by concatenating them, this
        // cause misleading data if the same blank nodes appear in each document.
        return when.all (ret).then (function (items) { return items.join ('\n'); });
    });
};

/**
 * This function extracts any JSON-LD embedded in a text/html document.
 *
 */
var extractJSONLD = function (body) {
    var deferred = when.defer ();
    var parser = new N3.Parser ();

    var ret = [];

    parseDocument (body).then (function (nquads) {
        parser.parse (nquads, function (error, triple, prefixes) {
            if (error) {
                deferred.reject (error);
            } else if (triple) {
                ret.push (triple);
            } else {
                deferred.resolve (ret);
            }
        });
    });

    return deferred.promise;
};

module.exports = extractJSONLD;
