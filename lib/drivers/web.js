/**
 *   This file is part of wald-query.
 *   Copyright (C) 2015  Kuno Woudt <kuno@frob.nl>
 *
 *   This program is free software: you can redistribute it and/or modify
 *   it under the terms of copyleft-next 0.3.0.  See LICENSE.txt.
 */

/* global wald */

(function () {
    'use strict';

    var lazy = typeof require === 'function' ? require ('lazy.js') : Lazy;
    var extractJSONLD = typeof require === 'function' ? require ('../extract-json-ld.js') : wald.query.extractJSONLD;

    if (typeof require === 'function') {
        var when = require ('when');
        var request = require ('request');
    }

    var accept = [ 'application/ld+json;q=1.0',
                   'application/trig;q=0.9',
                   'application/n-quads;q=0.7',
                   'text/turtle;q=0.6',
                   'application/n-triples;q=0.5',
                   'text/n3;q=0.4',
                   'text/html;q=0.3'
                 ].join (",");


    var htmlParser = function (body, headers) {
        return extractJSONLD (body);
    };

    var parsers = {
        'text/html': htmlParser
    };

    var matchesPattern = function (pattern, triple) {
        var subjectMatch = pattern.subject === triple.subject
            || pattern.subject === null || pattern.subject === '';

        var predicateMatch = pattern.predicate === triple.predicate
            || pattern.predicate === null || pattern.predicate === '';

        var objectMatch = pattern.object === triple.object
            || pattern.object === null || pattern.object === '';

        return subjectMatch && predicateMatch && objectMatch;
    };

    var Driver = function (connection) {
    };

    Driver.prototype.query = function (pattern) {
        var deferred = when.defer();

        request ({
            url: pattern.subject,
            headers: { Accept: accept }
        }, function(error, response, body) {
            if (error) {
                console.log ("ERROR [" + pattern.subject + "]: ", error);
                return deferred.reject (new Error ('Error fetching ' + pattern.subject));
            }

            // FIXME: error handling
            var contentType = response.headers['content-type'].split (';')[0];

            if (parsers.hasOwnProperty (contentType)) {
                var parser = parsers[contentType];

                parser (body, response.headers).then (function (triples) {
                    var ret = [];

                    triples.forEach (function (item) {
                        if (matchesPattern (pattern, item)) {
                            ret.push (item);
                        }
                    });

                    deferred.resolve (ret);
                });
            } else {
                deferred.reject (new Error("no parser available for " + contentType));
            }
        });

        return deferred.promise;
    };

    if (typeof module === 'object') {
        module.exports = function (registry) {
            registry.register('web', Driver);
        };
    } else {
        wald.query.drivers.register ('web', Driver);
    }

})();
