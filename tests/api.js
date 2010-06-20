var sys = require('sys'),
    assert = require('assert'),
    begin = require('../lib/begin').begin;

// Use begin to test itself ;-)

begin()
  (test_begin)
  (test_nested)
  (test_parallel)
  (test_success_error)
  (test_except)
 .end(function() {
     sys.puts('All tests pass.');
  });


/// --- Tests

function test_begin(k) {  
    // The simplest use of begin()

    begin()
      (set_inc, 2)
      (inc, 3).bind(function(err, val) {
	assert.equal(val, 5);
      })
    .end(k);
}

function test_nested(k) {
    // Callbacks can inject statements into the sequence of commands.

    begin()
      (set_inc, 2)
      (inc, 1).bind(function(err, new_inc) {
	assert.equal(3, new_inc);
	this.begin()
	    (set_inc, new_inc)
	    (inc, 4).bind(function(err, val) {
	      assert.equal(val, 7);
	    });
      })
      (inc, 1).bind(function(err, val) {
	assert.equal(4, val);
      })
    .end(k);
}

function test_parallel(k) {
    // The parallel() operator runs commands in parallel.  The series
    // of parallel commands is terminated by bind(), end(), or
    // begin().

    begin()
      (set_inc, 1)
     .parallel()
      (inc, 1)
      (inc, 2)
      (minc, 3, 4)
     .bind(function(err, a, b, c, d) {
	assert.equal(a, 2);
	assert.equal(b, 3);
	assert.equal(c, 4);
	assert.equal(d, 5);
      })
     .end(k);
}

function test_success_error(k) {
    // The success() and error() methods are specializations of
    // bind().

    begin()
      (set_inc, 1)
      (inc, 2).success(function(val) {
	assert.equal(3, val);
      })
      (fails).error(function(err) {
	assert.ok(err instanceof Error);
      })
      .end(k);
}

function test_except(k) {
    // The except() method installs a global error handler.

    var caught = undefined;  
    function global_error_handler(err) {
	caught = err;
    }

    begin()
     .except(global_error_handler)
     (fails)
     (set_inc, 2)
     (inc, 1).success(function(val) {
	 assert.equal(3, val);
     })
     .end(function() {
	 assert.ok(caught instanceof Error);
	 k();
     });
}


/// --- Async Test Methods

var increment = 1;

function inc(val, k) {
    process.nextTick(function() {
	k(null, val + increment);
    });
}

function minc(v1, v2, k) {
    process.nextTick(function() {
	k(null, v1 + increment, v2 + increment);
    });
}

function set_inc(val, k) {
    process.nextTick(function() {
	increment = val;
	k();
    });
}

function fails(k) {
    k(new Error("Always fails."));
}
