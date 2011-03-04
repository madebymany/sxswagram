.PHONY:	all lint test loc

SRC_ROOT=./lib
TEST_ROOT=./test

all:	lint test

lint:
	@find $(SRC_ROOT) -name '*.js' -exec sh -c 'echo {}; jslint {}' \;

test:
	@find $(TEST_ROOT) -name 'test-*.js' -exec nodeunit {} \;

loc:
	@grep -r --binary-files=without-match . $(SRC_ROOT) | wc -l | xargs -I_ echo _ LoC
