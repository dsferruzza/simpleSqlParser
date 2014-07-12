var gulp = require('gulp');
var jshint = require('gulp-jshint');
var mocha = require('gulp-mocha');

gulp.task('lint', function() {
	return gulp.src(['*.js', 'tests/*.js'])
		.pipe(jshint())
		.pipe(jshint.reporter('default'))
		.pipe(jshint.reporter('fail'));
});

gulp.task('test', function() {
	return gulp.src('./tests/tests.js')
		.pipe(mocha({
			ui: 'qunit',
			reporter: 'spec',
		}));
});

gulp.task('default', ['lint', 'test']);
