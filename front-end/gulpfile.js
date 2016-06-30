// Include gulp
var gulp = require('gulp');

// Include Our Plugins
var less = require('gulp-less');
var path = require('path');
var cleancss = require('gulp-clean-css');
var jshint = require('gulp-jshint');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');

// Process LESS files into CSS and concatenate and minify.
gulp.task('less', function() {
	return gulp.src('./assets/less/*.less')
	.pipe(less())
	.pipe(cleancss())
	.pipe(concat('style.css'))
	.pipe(gulp.dest('./assets/css'));
});

// Lint Task
gulp.task('lint', function() {
    return gulp.src('js/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

// Concatenate & Minify JS
gulp.task('scripts-angular', function() {
    return gulp.src([
    		'scripts-angular/app.js',
    		'scripts-angular/controllers/*.js',
    		'scripts-angular/directives/*.js',
    		'scripts-angular/services/*.js',
    		'!scripts-angular/services/viewer.js',
    		'assets/js/bootstrap-switch.min.js',
    	])
        .pipe(concat('scripts/main.js'))
        .pipe(rename('scripts/main.min.js'))
        .pipe(uglify({
        	mangle: false, compress: false
        }))
        .pipe(gulp.dest(''));
});

gulp.task('scripts-viewer', function() {
    return gulp.src([
			'assets/js/DeviceOrientationControls.js',
			'assets/js/OrbitControls.js',
			'assets/js/StereoEffect.js',
			'assets/js/detect-mobile-browser.js',
    	])
        .pipe(concat('scripts/viewer.js'))
        .pipe(rename('scripts/viewer.min.js'))
		.pipe(uglify({
			mangle: {
				except: ['$', 'scope', 'element', 'attrs']
			}
		})).on('error', handleError)
		.pipe(gulp.dest(''));
});

// Watch Files For Changes
gulp.task('watch', function() {
    gulp.watch([
	'assets/less/*.less',
    	'scripts-angular/app.js',
		'scripts-angular/controllers/*.js',
		'scripts-angular/directives/*.js',
		'scripts-angular/services/*.js',
		'assets/js/DeviceOrientationControls.js',
		'assets/js/OrbitControls.js',
		'assets/js/StereoEffect.js',
		'assets/js/detect-mobile-browser.js'
	],
    ['less', 'lint', 'scripts-angular', 'scripts-viewer']);
});

// Default Task
gulp.task('default', ['less', 'lint', 'scripts-angular', 'scripts-viewer', 'watch']);

function handleError(error) {};
