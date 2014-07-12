var gulp = require('gulp');
var jshint = require('gulp-jshint');
var mocha = require('gulp-mocha');
var source = require('vinyl-source-stream');
var browserify = require('browserify');

gulp.task('lint', function() {
	return gulp.src(['*.js', 'tests/*.js'])
		.pipe(jshint())
		.pipe(jshint.reporter('default'))
		.pipe(jshint.reporter('fail'));
});

gulp.task('test', function() {
	return gulp.src('./tests/test*.js')
		.pipe(mocha({
			ui: 'qunit',
			reporter: 'spec',
		}));
});

gulp.task('browserifyWithDeps', function() {
	var bundler = browserify('./simpleSqlParser.js');
	return bundler
		.bundle({ standalone: 'simpleSqlParser' })
		.pipe(source('simpleSqlParser.js'))
		.pipe(gulp.dest('./dist'));
});

gulp.task('default', ['lint', 'test', 'browserifyWithDeps']);
