var gulp = require('gulp');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var gutil = require('gulp-util');
var pump = require('pump');
var cleanCSS = require('gulp-clean-css');

// Concat JS
gulp.task('concat-js', function() {
  return gulp.src(['js/cookies.js', 'js/init.js'])
    .pipe(concat('app.js'))
    .pipe(gulp.dest('js/dist/'));
});

// Concat JS
gulp.task('concat-css', function() {
  return gulp.src(['css/style.css', 'css/navbar.css'])
    .pipe(concat('app.css'))
    .pipe(gulp.dest('css/dist/'));
});


// Minify compiled CSS
gulp.task('minify-css',['concat-css'], function() {
    return gulp.src(['css/dist/app.css'])
        .pipe(cleanCSS({ compatibility: 'ie8' }))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('public/css'))
});

gulp.task('minify-js',['concat-js'], function(cb) {
    pump([
        gulp.src(['js/dist/app.js','js/index.js','js/auth.js','js/admin.js']),
        uglify().on('error', function(err) {
            gutil.log(gutil.colors.red('[Error:]'), err.toString());
            this.emit('end');
            }),
        uglify(),
        rename({ suffix: '.min' }),
        gulp.dest('public/js'),
        ],
        cb
        );
});



gulp.task('default', ['minify-css', 'minify-js']);