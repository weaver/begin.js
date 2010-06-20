/// parallel -- use parallel() to run a batch of operations

var fs = require('fs'),
    sys = require('sys'),
    parallel = require('../lib/begin').parallel;

parallel()  
  (fs.writeFile, '/tmp/p1', 'File 1') 
  (fs.writeFile, '/tmp/p2', 'File 2')
 .parallel()
  (fs.readFile, '/tmp/p1')
  (fs.readFile, '/tmp/p2')
 .success(function(p1, p2) {
   sys.puts('P1: ' + p1);
   sys.puts('P2: ' + p2);
 }).parallel()
  (fs.unlink, '/tmp/p1')
  (fs.unlink, '/tmp/p2')
 .end();  

