
BROWSERIFY_OPTIONS="--exclude xmlhttprequest --require ./lib/find:find"

all: build

build: node_modules/n3/browser/n3-browser.js
	npm install
	node_modules/.bin/browserify $(BROWSERIFY_OPTIONS) --outfile js/find.js
	node_modules/.bin/browserify $(BROWSERIFY_OPTIONS) --outfile js/find.debug.js --debug
	node_modules/.bin/uglifyjs js/find.js --screw-ie8 --output js/find.min.js

node_modules/n3/browser/n3-browser.js:
	npm install 'n3@^0.4.1'
	cd node_modules/n3 && npm install && npm run browser

clean:
	$(RM) node_modules js/find*.js

