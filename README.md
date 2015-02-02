
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

Query
-----

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


Search
------

Sometimes you want to start with a list of a certain kind of thing, but do not have an
identifier as a starting point.  If you're interacting with a document instead of a large
dataset it may be useful to list all the data of a certain type from that document.

For example, data/blackout.ttl contains some information about Britney Spears' music, if I
wanted to list all the albums in that document I would be inclined to look for subjects
which have rdf:type schema:MusicAlbum.  However, the creator of the document may have
omitted the type if it the type was already implied by a different predicate.  For example a
triple with the schema:albumReleaseType predicate can only have an album as a subject.

If we want to process such documents without using a reasoner it may be useful to just
manually search for subjects which either have a the required rdf:type or have one or
more of a set of predicates which imply a particular rdf:type.

    var wf = find.connect('file:file//data/blackout.jsonld');

    wf.search("schema:MusicAlbum", "schema:albumReleaseType").then (function (subjects) {
        // ...
    });


`wf.search()` takes zero or more values for rdf:type, and zero or more values for the
predicate, for example:

    wf.search (null, [ "schema:albumProductionType", "schema:albumReleaseType" ]);
    wf.search ([],   [ "schema:albumProductionType", "schema:albumReleaseType" ]);
    wf.search ("schema:MusicAlbum", []);
    wf.search ([ "schema:MusicAlbum", "frbr:Expression" ], null);


Running tests
=============

Tests will need a linked data fragments server running, you can start one with the test
configuration by running `bin/ldf`.  Afterward running `npm test` should work.


License
=======

Copyright (C) 2015  Kuno Woudt <kuno@frob.nl>

This program is free software: you can redistribute it and/or modify
it under the terms of copyleft-next 0.3.0.  See [LICENSE.txt](LICENSE.txt).
