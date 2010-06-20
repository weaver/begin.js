// touch -- use begin() to make a method that accepts a callback

var fs = require('fs'),
    sys = require('sys'),
    path = require('path'),
    B = require('../lib/begin');

// Operations on two files are performed in parallel.  The lift()
// method is used to convert the path.exists() callback from the form
// function(success) { ... } to the form function(err, success) { }.

B.parallel()
  (touch, '/tmp/p1', 0644)
  (touch, '/tmp/p2', 0644)
 .parallel()
  .liftC(path.exists, '/tmp/p1')
  .liftC(path.exists, '/tmp/p2')
 .success(function(p1, p2) {
   sys.puts('Touch ' + (p1 && p2 ? 'succeeded' : 'failed') + '.');
 })
 .parallel()
  (fs.unlink, '/tmp/p1')
  (fs.unlink, '/tmp/p2')
 .end();

// Above is an example of using begin() to control a sequence of
// operations.  Below, touch() uses begin() to implement an operation.
// From the outside, touch() looks like any other callback-style
// operation.  The begin() construct integrates seemlessly.

// The except() method routes any errors directly to the callback.
// When all the statements in the series are done, end() passes
// control to the callback.  If there were values to pass, success()
// or bind() could be used instead of end().

function touch(path, mode, callback) {
  B.begin()      
    .except(callback)
    (fs.open, path, 'a+', mode).success(function(fd) {
	this.begin()
	  (fs.close, fd);
    })
    .end(callback);
}

/// Compare the method above an equivalent method written in
/// strict-callback style.  Since touch() is a short method, there's
/// little advantage to using begin().  You needed to see how except()
/// and end() worked somehow, though ;-)
//
//   function touch(path, mode, callback) {
//     fs.open(path, 'a+', mode, function(err, fd) {
//       err ? callback(err) : fs.close(fd, callback);
//     });
//   }
