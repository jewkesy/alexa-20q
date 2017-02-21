"use strict";

var gulp = require('gulp');
var mocha = require('gulp-mocha');

gulp.task('testAll', function() {
  var error = false;
  gulp.
    src('./test*.js').
    pipe(mocha({reporter: 'nyan'})).
    on('error', function(err) {
      console.log('Tests failed!', err);
      error = true;
    }).
    on('end', function() {
      // if (!error) {
      //   console.log('Tests succeeded!')
      //   process.exit(0);
      // }
    });
});

gulp.task('watchAll', function() {
  gulp.watch(['./test*.js'], ['testAll']);
  gulp.watch(['./../src/*.js'], ['testAll']);
});
