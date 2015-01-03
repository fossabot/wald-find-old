
wald-query
==========

wald-query is a prototype DSL for querying linked data.  It currently includes a driver to query
Linked Data Fragments servers, though the core query language isn't tied to this (e.g. I imagine
writing HDT or SPARQL drivers should be fairly easy).

The goal of this DSL is to give the query the same basic shape as the model you want as a result,
this allows the query to look similar to how you're going to use the data and the results to be
fed directly into template languages like mustache.

NOTE: the work here should be considered a prototype or proof of concept.  There are no unittests
and it is still under heavy development.

example
-------

Here is a basic example which asks wikidata for some information about Britney Spears' Blackout
album:

    var wq = query.connect('ldf:http://data.wikidataldf.com/wikidata', ns);

    var result = wq.query("wikidata:Q192755", {
        id: "@id",
        name: wq.literal (wq.first ("rdfs:label")),
        performer: wq.subquery ("wikidata:P175s", wq.subquery ("wikidata:P175v", {
            id: "@id",
            name: wq.first (wq.literal ("rdfs:label")),
        }))
    });


`wq.query()` will return a promise which will resolve to:

    {
        "id": "http://www.wikidata.org/entity/Q192755",
        "name": "Blackout",
        "performer": {
            "id": "http://www.wikidata.org/entity/Q11975",
            "name": "Britney Jean Spears"
        }
    }


Run `node example.js` to see this query in action.


License
=======

Copyright (C) 2015  Kuno Woudt <kuno@frob.nl>

This program is free software: you can redistribute it and/or modify
it under the terms of copyleft-next 0.3.0.  See [LICENSE.txt](LICENSE.txt).
