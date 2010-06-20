/// begin -- an asyncronous control construct

// The "future" queue is managed with splice() and an index rather
// than just using push().  In the case of a simple sequence of
// statements, this makes no difference, but it allows bind()
// callbacks to inject statements into the front of the queue.

exports.begin = begin;
exports.parallel = parallel;
exports.liftC = liftC;
exports.liftS = liftS;

/**
 * begin -- declare a series of operations to run in order.
 */
function begin(ctx) {
    var future = [],
        started = false,
        handle = undefined,
        tail = 0;

    function self() {
	future.splice(tail++, 0, prepare(Array.prototype.slice.call(arguments)));
	started || start_later();
	return self;
    }

    self.end = function(k) {
	k && self(noop).bind(k);
	start_now();
    }

    self.begin = function() {
	return self;
    };

    self.bind = bind;
    self.either = either;
    self.success = success;
    self.error = error;
    self.except = except;
    self.parallel = parallel;
    self.liftC = _liftC;
    self.liftS = _liftS;

    /// --- Parallel Operations

    function parallel() {
	var ops = [];

	function par() {
 	    ops.push(Array.prototype.slice.call(arguments));
	    return par;
	}

	par.end = done('end');
	par.begin = done('begin');
	par.bind = done('bind');
	par.either = done('either');
	par.success = done('success');
	par.error = done('error');
	par.except = done('except');
	par.parallel = done('parallel');
	par.liftC = _liftC;
	par.liftS = _liftS;

	function done(method) {
	    return function() {
		return self(parallelize(ops))[method].apply(self, arguments);
	    }
	}

	return par;
    }

    function parallelize(ops) {
	return function(k) {
	    var frames = [],
	        limit = ops.length,
	        remain = limit;

	    for (var i = 0; i < limit; i++)
		spawn(i);

	    function spawn(idx) {
		var args = ops[idx],
	            cmd = args.shift();

		args.push(function() {
		    frames[idx] = arguments;
		    (--remain == 0) && done();
		});

		cmd.apply(self, args);
	    }

	    function done() {
		// Skip merging together arguments if they're just
		// going to be ignored anyway.
		(k === step) ? k.call(self) : callback();
	    }

	    function callback() {
		var args = [null];

		// Flatten the potentially multiple arguments from each
		// argument frame into one set of arguments for the
		// callback.
		for (var i = 0, j, jl, frame; i < limit; i++) {
		    frame = frames[i];
		    args[0] = args[0] || (frame.length > 0 ? frame[0] : null);
		    for (j = 1, jl = frame.length; j < jl; j++)
			args.push(frame[j]);
		}

		k.apply(self, args);
	    }
	};
    }

    /// --- Continuations

    function prepare(cmd) {
	cmd.push(cont());
	return cmd;
    }

    function cont(callback) {
	if (!callback) return step;

	return function() {
	    var memo = tail;
	    tail = 0;
	    callback.apply(self, arguments);
	    tail = memo;
	    step();
	}
    }

    function bind(callback) {
	if (!callback) return self;

	var stmt = future[tail - 1];
	if (!stmt)
	    return self(noop).bind(callback);

	stmt[stmt.length - 1] = cont(callback);
	return self;
    }

    function success(callback) {
	return this.either(callback, null);
    }

    function error(callback) {
	return this.either(null, callback);
    }

    function either(success, error) {
	var self = this;
	return this.bind(function(err) {
	    if (err)
		(error || unhandled).call(self, err);
	    else if (success)
		success.apply(self, Array.prototype.slice.call(arguments, 1));
	});
    }

    function except(callback) {
	handle = callback;
	return this;
    }

    var _liftC = liftOp(liftC),
        _liftS = liftOp(liftS);

    function liftOp(lift) {
	return function() {
	    arguments[0] = lift(arguments[0]);
	    return this.apply(this, arguments);
	}
    }

    /// --- Control Loop

    function start_now() {
	if (!started) {
	    started = true;
	    step();
	}
    }

    function start_later() {
	if (!started) {
	    started = true;
	    process.nextTick(step);
	}
    }

    function step(err) {
	if (err)
	    unhandled.call(self, err);
	if (future.length == 0)
	    started = false;
	else {
	    tail--;
	    exec(future.shift());
	}
    }

    function exec(cmd) {
	cmd.shift().apply(ctx, cmd);
    }

    function unhandled(err) {
	if (!handle)
	    throw err;
	handle.call(this, err);
    }

    return self;
}

/**
 * parallel -- top-level parallel batch declaration.
 */
function parallel(ctx) {
    return begin(ctx).parallel();
}

/**
 * liftC -- convert a function to use a standard callback
 *
 * Some functions take a callback in the form:
 *
 *   function(v1, v2, ...) { }
 *
 * Convert this to use callbacks in the standard form:
 *
 *   function(err, v1, v2, ...) { }
 */
function liftC(fn) {
    return function() {
	var args = Array.prototype.slice.call(arguments),
	    k = args.pop();

	args.push(function() {
	    var args = Array.prototype.slice.call(arguments);
	    args.unshift(null);
	    k.apply(this, args);
	});

	try {
	    // This try/catch block might be wrong since callback may
	    // raise an exception.
	    fn.apply(this, args);
	}
	catch (err) {
	    k.call(this, err);
	}
    }
}

/**
 * liftS -- lift a synchronous function to an asynchronous form
 *
 * This is here for completeness right now.  The form is lifted, but
 * the synchronous operation will still block everything.
 */
function liftS(fn) {
    return function() {
	var args = Array.prototype.slice.call(arguments),
	    k = args.pop(),
	    result;

	try {
	    result = fn.apply(this, args);
	}
	catch (err) {
	    k(err);
	    return;
	}

	k(null, result);
    }
}


/// --- Aux

function last(array) {
    var size = array.length;
    return (size > 0) ? array[size - 1] : undefined;
}

function noop(k) {
    k();
}