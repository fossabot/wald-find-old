/**
 *   This file is part of wald:find.
 *   Copyright (C) 2015  Kuno Woudt <kuno@frob.nl>
 *
 *   This program is free software: you can redistribute it and/or modify
 *   it under the terms of copyleft-next 0.3.0.  See LICENSE.txt.
 */

'use strict';

var _ = require ('underscore');
var when = require ('when');

var core = {};

core.ReversePredicate = function (predicate) {
    this.predicate = predicate;
};

core.ReversePredicate.prototype.toString = function () {
    return this.predicate;
};

core.Subquery = function (predicate, model, parent) {
    this.predicate = predicate;
    this.model = model;
    this.parent = parent;
};

core.Subquery.prototype.run = function (parentResults) {
    var self = this;

    return when.map (parentResults, function (item) {
        return self.parent.query (item.object, self.model);
    });
};

core.Reverse = function (predicate, model, parent) {
    core.Subquery.call (this, predicate, model, parent);
    this.predicate = new core.ReversePredicate (predicate);
};

core.Reverse.prototype = Object.create(core.Subquery.prototype);
core.Reverse.prototype.constructor = core.Reverse;
core.Reverse.prototype.run = function (parentResults) {
    var self = this;

    return when.map (parentResults, function (item) {
        return self.parent.query (item.subject, self.model);
    });
};

core.SameAs = function (predicate, model, parent) {
    core.Subquery.call(this, predicate, model, parent);
};

core.SameAs.prototype = Object.create(core.Subquery.prototype);
core.SameAs.prototype.constructor = core.SameAs;

core.SameAs.prototype.run = function (parentResults) {
    var self = this;

    return when.map (parentResults, function (item) {
        return self.subqueries (item.object);
    }).then (function (data) {
        // because of the nature of sameAs, it may return a bunch of
        // "empty" values, we remove those here.
        return _(data).flatten(true).filter(core.modelHasData);
    });
};

core.SameAs.prototype.subqueries = function (subject) {
    var self = this;
    var conn = self.parent.connection;
    var owlSameAs = 'http://www.w3.org/2002/07/owl#sameAs';

    subject = self.parent.namespaces.expandTerm (subject);

    return when.all ([
        when ([ subject ]),
        conn.query ({ subject: subject, predicate: owlSameAs, object: null }),
        conn.query ({ subject: null, predicate: owlSameAs, object: subject }),
    ]).then (function (data) {
        var subjects = _(data[0])
            .concat (_(data[1]).pluck ('object'))
            .concat (_(data[2]).pluck ('subject'));

        return when.map (subjects, function (newSubject) {
            return self.parent.query (newSubject, self.model);
        });
    });
};

core.terms = function (model) {

    return _(model).map (function (value, key) {
        if (_(value).isArray ()) {
            if (value.length !== 1) {
                throw new Error('Model error: ' + key + ' has '
                                + value.length + ' items, expected 1');
            }
            value = value[0];
        }

        if (_(value).isString ()) {
            return value;
        }

        if (value.hasOwnProperty('predicate')) {
            return value.predicate;
        }

        throw new Error('Model error: ' + key + ' has type ' + (typeof value)
                        + ', expected a string or array of strings');
    }).filter (function (item) {
        return item !== '@id';
    });
};

core.modelHasData = function (model) {
    return _(model).chain ().omit ('id').values ().filter (function (item) {
        return !_(item).isEmpty ();
    }).value ().length > 0;
};

core.buildModel = function (queryResult, model) {

    var resolve = function (value) {
        var predicate = value;

        if  (value instanceof core.Subquery) {
            return value.run (queryResult[value.predicate]);
        } else {
            return when.map (queryResult[predicate], function (item) {
                return item.object;
            });
        }
    };

    var reducer = function (memo, key, idx) {
        var value = model[key];

        if (_(value).isArray ()) {
            return resolve (value[0]).then (function (data) {
                memo[key] = data;
                return memo;
            });
        } else {
            return resolve (value).then (function (data) {
                if (data.length === 0) {
                    memo[key] = null;
                } else {
                    memo[key] = data[0];
                }
                return memo;
            });
        }
    };

    return when.reduce (_(model).keys (), reducer, {});
};

module.exports = core;
