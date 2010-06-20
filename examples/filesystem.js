/// filesystem -- use begin() to sequence filesystem operations.

var fs = require('fs'),
    sys = require('sys'),
    path = require('path'),
    begin = require('../lib/begin').begin;

begin()
  (path.exists, '/tmp/a').bind(function(exists) {
      if (!exists) {
	  this.begin()
            (fs.mkdir, '/tmp/a', 0755);
      }
  })
  (fs.writeFile, '/tmp/a/b', 'Hello, world!')
  (fs.readFile, '/tmp/a/b')
  .success(function(data) {
      sys.puts('DATA: ' + data.toString('utf-8'));
  })
  (fs.unlink, '/tmp/a/b')
  (fs.rmdir, '/tmp/a')
  (path.exists, '/tmp/a').bind(function(exists) {
      sys.puts('RESULT: /tmp/a was' + (exists ? ' not' : '') + ' removed.');
  });

/// Compare this to the equivalent code written using synchronous
/// operations:
//
//   path.exists('/tmp/a', function(exists) {
//       if (!exists)
//           fs.mkdirSync('/tmp/a');
//       fs.writeFileSync('/tmp/a/b', 'Hello, world!');
//       sys.puts('DATA: ' + fs.readFileSync('/tmp/a/b').toString('utf-8'));
//       fs.unlinkSync('/tmp/a/b');
//       fs.rmdirSync('/tmp/a/b');
//       path.exists('/tmp/a', function(exists) {
//           sys.puts('RESULT: /tmp/a was' + (exists ? ' not' : '') + ' removed.');
//       });
//   });

/// And this code written in continuation-passing style:
//
//   path.exists('/tmp/a', function(exists) {
//       if (!exists) {
//           fs.mkdir('/tmp/a', 0755, function(err) {
//               if (err) throw err;
//               write();
//           });
//       }
//       else
//           write();
//
//       function write() {
//           fs.writeFile('/tmp/a/b', 'Hello, world!', function(err) {
//               if (err) throw err;
//               fs.readFile('/tmp/a/b/', function(err, data) {
//                   if (err) throw err;
//                   sys.puts('DATA: ' + data.toString('utf-8'));
//                   sys.unlink('/tmp/a/b', function(err) {
//                       if (err) throw err;
//                       fs.rmdir('/tmp/a', function(err) {
//                           if (err) throw err;
//                           path.exists('/tmp/a', function(exists) {
//                               sys.puts('RESULT: /tmp/a was'
//                                        + (exists ? ' not' : '')
//                                        + ' removed');
//                           });
//                       });
//                   });
//               });
//           });
//       }
//   });

/// Or this equivalent with tasks split into procedures to minimize
/// nesting:
//
//   path.exists('/tmp/a', function(exists) {
//       if (!exists) {
//           fs.mkdir('/tmp/a', 0755, function(err) {
//               if (err) throw err;
//               write();
//           });
//       }
//       else
//           write();
//
//       function write() {
//           fs.writeFile('/tmp/a/b', 'Hello, world!', function(err) {
//               if (err) throw err;
//               read();
//           });
//       }
//
//       function read() {
//           fs.readFile('/tmp/a/b/', function(err, data) {
//               if (err) throw err;
//               sys.puts('DATA: ' + data.toString('utf-8'));
//               unlink();
//           });
//       }
//
//       function unlink() {
//           sys.unlink('/tmp/a/b', function(err) {
//               if (err) throw err;
//               rmdir();
//           });
//       }
//
//       function rmdir() {
//           fs.rmdir('/tmp/a', function(err) {
//               if (err) throw err;
//               done();
//           });
//       }
//
//       function done() {
//           path.exists('/tmp/a', function(exists) {
//               sys.puts('RESULT: /tmp/a was' + (exists ? ' not' : '') + ' removed');
//           });
//       }
//   });


