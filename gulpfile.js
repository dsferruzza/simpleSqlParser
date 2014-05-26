var gulp = require('gulp');
var jshint = require('gulp-jshint');
var qunit = require('gulp-qunit');

gulp.task('lint', function() {
	return gulp.src(['*.js', 'tests/*.js'])
		.pipe(jshint())
		.pipe(jshint.reporter('default'))
		.pipe(jshint.reporter('fail'));
});

gulp.task('test', function() {
	return gulp.src('./tests/tests.html')
		.pipe(qunit());
});

gulp.task('default', ['lint', 'test']);
