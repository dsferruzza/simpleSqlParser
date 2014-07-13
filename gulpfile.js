var gulp = require('gulp');
var jshint = require('gulp-jshint');
var mocha = require('gulp-mocha');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var source = require('vinyl-source-stream');
var browserify = require('browserify');

gulp.task('lint', function() {
	return gulp.src(['*.js', 'src/*.js', 'tests/*.js'])
		.pipe(jshint())
		.pipe(jshint.reporter('default'))
		.pipe(jshint.reporter('fail'));
});

gulp.task('mocha', function() {
	return gulp.src('./tests/test*.js')
		.pipe(mocha({
			ui: 'qunit',
			reporter: 'spec',
		}));
});

gulp.task('test', ['lint', 'mocha']);

gulp.task('browserifyWithDeps', function() {
	var bundler = browserify('./index.js');
	return bundler
		.bundle({ standalone: 'simpleSqlParser' })
		.pipe(source('simpleSqlParser.js'))
		.pipe(gulp.dest('./dist'));
});

gulp.task('browserifyWithoutDeps', function() {
	var bundler = browserify('./index.js');
	bundler.exclude('Parsimmon');
	bundler.transform('browserify-shim');
	return bundler
		.bundle({ standalone: 'simpleSqlParser' })
		.pipe(source('simpleSqlParser.withoutDeps.js'))
		.pipe(gulp.dest('./dist'));
});

gulp.task('uglifyWithDeps', ['browserifyWithDeps'], function() {
	return gulp.src('dist/simpleSqlParser.js')
		.pipe(uglify())
		.pipe(rename('simpleSqlParser.min.js'))
		.pipe(gulp.dest('./dist'));
});

gulp.task('uglifyWithoutDeps', ['browserifyWithoutDeps'], function() {
	return gulp.src('dist/simpleSqlParser.withoutDeps.js')
		.pipe(uglify())
		.pipe(rename('simpleSqlParser.withoutDeps.min.js'))
		.pipe(gulp.dest('./dist'));
});

gulp.task('default', ['test', 'uglifyWithDeps', 'uglifyWithoutDeps']);
