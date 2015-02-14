

# From http://hdt-it.googlecode.com/svn
# RDF2HDT=~/path/to/hdt-it/trunk/hdt-lib/tools/rdf2hdt
RDF2HDT=rdf2hdt

all: licensedb.2014-01-19.hdt

context.jsonld:
	wget http://prefix.cc/context.jsonld

%.nt: %.ttl
	rapper -i turtle $< -o nquads > $@

%.hdt: %.nt
	$(RDF2HDT) -f ntriples $< $@

