// Include gulp
var gulp = require('gulp');

// Include Our Plugins
var jshint = require('gulp-jshint');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');

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
    		'!scripts-angular/services/viewer.js'
    	])
        .pipe(concat('main.js'))
        .pipe(gulp.dest(''))
        .pipe(rename('main.min.js'))
        .pipe(uglify({
        	mangle: false, compress: false
        }))
        .pipe(gulp.dest(''));
});

gulp.task('scripts-viewer', function() {
    return gulp.src([
    		'scripts-angular/services/viewer.js',
    		'assets/js/DeviceOrientationControls.js',
    		'assets/js/OrbitControls.js',
    		'assets/js/StereoEffect.js',
    		'assets/js/detect-mobile-browser.js',
    	])
        .pipe(concat('viewer.js'))
        .pipe(gulp.dest(''))
        .pipe(rename('viewer.min.js'))
        .pipe(uglify({
        	mangle: {
        		except: ['$', 'scope', 'element', 'attrs']
        	}
        }))
        .pipe(gulp.dest(''));
});

// Watch Files For Changes
gulp.task('watch', function() {
    gulp.watch([
    	'scripts-angular/app.js',
		'scripts-angular/controllers/*.js',
		'scripts-angular/directives/*.js',
		'scripts-angular/services/*.js',
		'assets/js/DeviceOrientationControls.js',
		'assets/js/OrbitControls.js',
		'assets/js/StereoEffect.js',
		'assets/js/detect-mobile-browser.js'
	],
    ['lint', 'scripts-angular', 'scripts-viewer']);
});

// Default Task
gulp.task('default', ['lint', 'scripts-angular', 'scripts-viewer', 'watch']);
