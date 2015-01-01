/**
 *   This file is part of wald-elements
 *   Copyright (C) 2014  Kuno Woudt <kuno@frob.nl>
 *
 *   This program is free software: you can redistribute it and/or modify
 *   it under the terms of copyleft-next 0.3.0.  See LICENSE.txt.
 */

/* global wald */

(function () {
    'use strict';

    if (typeof require === 'function') {
        var lazy = require ('lazy.js');
        var n3 = require ('n3');
        var request = require ('request');
        var when = require ('when');
        var guard = require ('when/guard');
    } else {
        var guard = when.guard;
    }

    var normalize_term = function (term) {
        if (lazy(term).isEmpty()) {
            return '';
        } else {
            return term;
        }
    };

    var Driver = function (connection) {
        this._base = connection;
    };

    Driver.prototype.query = function (s, p, o) {
        var deferred = when.defer();

        var url = this._base
            + '?subject=' + encodeURIComponent (normalize_term (s))
            + '&predicate=' + encodeURIComponent (normalize_term (p))
            + '&object=' + encodeURIComponent (normalize_term (o));

        request ({
            url: url,
            headers: { Accept: 'application/ld+json' }
        }, function (error, response, body) {
            if (error || response.statusCode !== 200) {
                var error_status = response ? ' [' + response.statusText + '] ' : '';
                var error_prefix = 'Error' + error_status;
                deferred.reject (error_prefix + error);
                return;
            }

            try {
                deferred.resolve (JSON.parse(body));
            } catch (e) {
                var error_prefix = 'Error [' + response.statusText + '] ';
                deferred.reject (error_prefix + e.message);
            }
        });

        return deferred.promise;
    };

    Driver.prototype.queryMultiple = function (queries) {
        var self = this;
        // turn the following into a limited concurrency parallel series of queries.

        var results = queries.map (function (q) {
            return self.query (q[0], q[1], q[2]);
        });

        return when.settle(results);
    };

    if (typeof module === 'object') {
        module.exports = function (registry) {
            registry.register('ldf', Driver);
        };
    } else {
        wald.query.drivers.register ('ldf', Driver);
    }

})();

// // Using when/guard with when/parallel to limit concurrency
// // across *all tasks*

// var guard, parallel, guardTask, tasks, taskResults;

// guard = require('when/guard');
// parallel = require('when/parallel');

// tasks = [/* Array of async functions to execute as tasks */];

// // Use bind() to create a guard that can be applied to any function
// // Only 2 tasks may execute simultaneously
// guardTask = guard.bind(null, guard.n(2));

// // Use guardTask to guard all the tasks.
// tasks = tasks.map(guardTask);

// // Execute the tasks with concurrency/"parallelism" limited to 2
// taskResults = parallel(tasks);
// taskResults.then(function(results) {
//     // Handle results as usual
// });
