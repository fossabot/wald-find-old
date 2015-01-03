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

    // hardcode a few common prefixes.
    var context = {
        '@context': {
            dc: 'http://purl.org/dc/elements/1.1/',
            owl: 'http://www.w3.org/2002/07/owl#',
            rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
            rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
            schema: 'http://schema.org/',
            xsd: 'http://www.w3.org/2001/XMLSchema#',
        }
    };

    if (typeof require === 'function') {
        var N3 = require ('n3');
        var fs = require ('fs');
        var path = require ('path');

        var contextBuffer = fs.readFileSync(path.join (__dirname, '/../data/context.jsonld'));
        context = JSON.parse (contextBuffer.toString ());
    }

    var Namespaces = function () {
        var self = this;

        self._prefixes = {};

        for (var key in context['@context']) {
            if (context['@context'].hasOwnProperty (key)) {
                var base = context['@context'][key];
                if (typeof base === 'string') {
                    self.addPrefix (key, base);
                }
            }
        }
    };

    Namespaces.prototype.addPrefix = function (prefix, base) {
        this._prefixes[prefix] = base;
    };

    Namespaces.prototype.expandTerm = function (iri) {
        return N3.Util.expandPrefixedName(iri, this._prefixes);
    };

    // FIXME: implement a compactTerm function

    wald.query.Namespaces = Namespaces;
})();

if (typeof module === 'object') {
    module.exports = wald.query.Namespaces;
}
