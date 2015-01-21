
wald:find
=========

wald:find is a prototype DSL for querying linked data.  It currently includes a driver to
query Linked Data Fragments servers, though the core query language isn't tied to this
(e.g. I imagine writing HDT or SPARQL drivers should be fairly easy).

The goal of this DSL is to give the query the same basic shape as the model you want as a
result, this allows the query to look similar to how you're going to use the data and the
results to be fed directly into template languages like mustache.

NOTE: the work here should be considered a prototype or proof of concept.  I'm not using
this in anything yet.

example
-------

Here is a basic example which asks wikidata for some information about Britney Spears' Blackout
album:

    var wf = find.connect('ldf:http://data.wikidataldf.com/wikidata');

    var result = wf.query('wikidata:Q192755', {
        id: '@id',
        name: 'rdfs:label',
        performer: wf.subquery ('wikidata:P175s', {
            artist: wf.subquery ('wikidata:P175v', {
                id: '@id',
                name: 'rdfs:label',
            })
        })
    }).then (find.normalizeModel);

`wf.query()` will return a promise which will resolve to:

    {
        "id": "http://www.wikidata.org/entity/Q192755",
        "name": "Blackout",
        "performer": {
            "artist": {
                "id": "http://www.wikidata.org/entity/Q11975",
                "name": "Britney Jean Spears"
            }
        }
    }

wikidata relations unfortunately involve an extra indirection (which is why this result
has "performer.artist" as a path, instead of just "performer").

Run `node examples/wikidata.js` to see this query in action, or see the other examples
in the examples folder.


Running tests
=============

Tests will need a linked data fragments server running, you can start one with the test
configuration by running `bin/ldf`.  Afterward running `npm test` should work.


License
=======

Copyright (C) 2015  Kuno Woudt <kuno@frob.nl>

This program is free software: you can redistribute it and/or modify
it under the terms of copyleft-next 0.3.0.  See [LICENSE.txt](LICENSE.txt).
