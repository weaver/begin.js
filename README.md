# begin.js #

The begin.js library is a control construct for running asynchronous
methods in order or in parallel.  For example,

    begin()
      (fs.unlink, '/tmp/a/b')
      (fs.rmdir, '/tmp/a');

is equivalent to:

    fs.unlink('/tmp/a/b', function(err) {
        if (err) throw err;
        fs.rmdir(function(err) {
            if (err) throw err;
        });
    });

## How Does It Work? ##

The `begin()` construct builds on a commonly used convention:
asynchronous methods that take a callback as the last argument.  The
callback is usually in this form.

    function(err, v1, v2, ...) {
    }

For example, to read data from a file in Node.JS, a callback accepts a
(possibly null) error as the first argument and the data as the
second.

    fs.readFile('/tmp/a/b', function(err, data) {
        if (err) throw err;
        sys.puts('DATA: ', data.toString('utf-8'));
    });

Nesting quickly becomes uncomfortable when performing a long series of
these operations in order.  To address this, `begin()` allows you to
sequence operations by listing as series of `(op, arg1, ...)`
statements.  When a statement produces a value you need, use `bind()`
or `success()` to pass it to a callback.

    begin()
      (fs.readFile, '/tmp/a/b').success(function(data) {
          sys.puts('DATA: ', data.toString('utf-8'));
      })
      (fs.unlink, '/tmp/a/b')
      (fs.rmdir, '/tmp/a');

As you can see, `begin()` doesn't eliminate callbacks completely.  It
allows you to write just the callbacks you want.  To minimize nesting,
a callback can inject more operations into the sequence by using
`this.begin()`.  See [filesystems.js][3] for a longer example
with comparisons to synchronous and straight-callback styles.

Other projects like [Do][1] and [FileIO][2] have similar goals, but
encourage writing methods in a "continuable" or monadic style.  The
`begin()` construct is designed to work with existing callback
conventions.  Use it when it suits you; or use an explicit
callback-style when you want.

## What About Parallel Operations? ##

Sometimes you just need to run a batch of operations, but the order
doesn't matter.

    parallel()
      (fs.writeFile, '/tmp/p1', 'File 1')
      (fs.writeFile, '/tmp/p2', 'File 2')

See [parallel.js][4] and [touch.js][5] examples.

## API ##

These top-level forms begin the declaration of a series of operations
in the form:

    (fn, arg1, arg2, ...)

All operations are called in the context given to `begin()`.

**begin([ctx])**
Execute a sequence of asynchronous operations in order.  Optionally,
specify the context each operation should be called in.

**parallel([ctx])**
This is a top-level shortcut for `begin([ctx]).parallel()`.

### Methods ###

These methods are available in any `begin()` or `parallel()`
declaration.  All callbacks are called in the context of the `begin()`
itself.  This allows callbacks to inject more operations into the
sequence.

See [examples][6] and [tests/api.js][7] to see how these methods can be
combined.

**.begin()**
Terminate a batch of parallel operations and start a series of
sequential operations.

**.parallel()**
Collect a batch of operations to run in parallel.  These operations
must be terminated by another method (e.g. `bind`, `end`, etc.).

**.end(callback)**
End a series of operations.  Control is passed to the callback by
invoking it with no arguments.

**.bind(callback)**
Invoke `callback` with the result of the last method in the sequence.
If `bind()` is used to terminate a batch of parallel operations, the
callback is applied to the merged results.

**.either(success, error)**
Call `success` with the values from the last method in the sequence.
If there was an error, call `error` with it.

**.success(callback)**
A variant of `either` that just binds a success callback.

**.error(callback)**
A variant of `either` that just binds an error callback.

**.except(callback)**
Install an error callback for the entire sequence of operations.  By
default, errors are thrown.

## Convert Existing Functions ##

**liftC(fn)**
Convert a function that takes a callback in the value-only form
`function(v1, ...)` to use callbacks in the standard form
`function(err, v1, ...)`.

**liftS(fn)**
Convert a synchronous function to use an asynchronous callback form.
This is here for completeness right now; the synchronous call will
still block the process.

### Methods ###

**.liftC(fn, arg1, arg2, ...)**
For convenience, this method will `liftC` the `fn` of an operation in
a series.

**.liftS(fn, arg1, arg2, ...)**
For convenience, this method will `liftS` the `fn` of an operation in
a series.

[1]: http://github.com/creationix/do
[2]: http://inimino.org/~inimino/blog/fileio_v0.2
[3]: examples/filesystem.js
[4]: examples/parallel.js
[5]: examples/touch.js
[6]: examples
[7]: tests/api.js
