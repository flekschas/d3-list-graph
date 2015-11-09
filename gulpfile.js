var clean         = require('gulp-clean');
var concat        = require('gulp-concat');
var gulp          = require('gulp');
var gulpUtil      = require('gulp-util');
var opn           = require('opn');
var rename        = require('gulp-rename');
var runSequence   = require('run-sequence');
var sass          = require('gulp-sass');
var spawn         = require('child_process').spawn;
var templateCache = require('gulp-angular-templatecache');
var webserver     = require('gulp-webserver');
var wrap          = require('gulp-wrap');
var gulpIf        = require('gulp-if');
var minifyCss     = require('gulp-minify-css');
var uglify        = require('gulp-uglify');
var sourcemaps    = require('gulp-sourcemaps');
var autoprefixer  = require('gulp-autoprefixer');
var changed       = require('gulp-changed');

// Flags
var production    = gulpUtil.env.production;  // E.g. `--production`


/*
 * -----------------------------------------------------------------------------
 * Config
 * -----------------------------------------------------------------------------
 */

var openBrowser   = gulpUtil.env.open;
var config        = require('./config.json');


/*
 * -----------------------------------------------------------------------------
 * Tasks
 * -----------------------------------------------------------------------------
 */

gulp.task('clean', function () {
  var dest = production ?
    config.globalPaths.dist : config.globalPaths.dev;

  return gulp
    .src(dest, {read: false})
    .pipe(clean());
});

gulp.task('data', function () {
  var dest = production ?
    config.globalPaths.dist : config.globalPaths.dev;

  return gulp
    .src(config.globalPaths.data + '/*.json')
    .pipe(changed(dest + '/data'))
    .pipe(gulp.dest(dest + '/data'));
});


gulp.task('images', function () {
  var dest = production ?
    config.globalPaths.dist : config.globalPaths.dev;

  return gulp
    .src(config.globalPaths.src + '/assets/images/**/*')
    .pipe(gulp.dest(dest + '/assets/images'));
});

gulp.task('templates', function () {
  var dest = production ?
    config.globalPaths.dist : config.globalPaths.dev;

  return gulp
    .src([
      config.globalPaths.src + '/app/**/*.html',
      config.globalPaths.src + '/common/**/*.html',
    ])
    .pipe(templateCache({
      standalone: true
    }))
    .pipe(gulp.dest(dest + config.sourcePaths.assets));
});

gulp.task('index', function () {
  var dest = production ?
    config.globalPaths.dist : config.globalPaths.dev;

  return gulp
    .src(config.globalPaths.src + '/index.html')
    .pipe(gulp.dest(dest));
});

gulp.task('sass', function () {
  var dest = production ?
    config.globalPaths.dist : config.globalPaths.dev;

  return gulp
    .src(config.globalPaths.src + config.sourcePaths.styles + '/styles.scss')
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    // Add vendor prefixes in production mode
    .pipe(
      gulpIf(
        production,
        autoprefixer({
          browsers: config.browsers,
          cascade: true
        })
      )
    )
    // Minify stylesheet in production mode
    .pipe(
      gulpIf(
        production,
        minifyCss()
      )
    )
    // Write sourcemap
    .pipe(
      gulpIf(
        production,
        sourcemaps.write('.')
      )
    )
    .pipe(gulp.dest(dest + config.sourcePaths.assets));
});

gulp.task('jsSource', function () {
  var dest = production ?
    config.globalPaths.dist : config.globalPaths.dev;

  return gulp
    .src([
      config.globalPaths.src + '/**/*module.js',
      config.globalPaths.src + '/**/!(*module).js'
    ])
    // Init source map
    .pipe(sourcemaps.init())
    .pipe(wrap('// FILE: <%= file.path %>\n<%= contents %>\n\n'))
    .pipe(concat('app.js'))
    // Unglify JavaScript if we start Gulp in production mode. Otherwise
    // concat files only.
    .pipe(
      gulpIf(
        production,
        uglify()
      )
    )
    // Append hash to file name in production mode for better cache control
    .pipe(
      gulpIf(
        production,
        sourcemaps.write('.')
      )
    )
    .pipe(gulp.dest(dest + config.sourcePaths.assets));
});

gulp.task('jsVendor', function () {
  var dest = production ?
    config.globalPaths.dist : config.globalPaths.dev;

  return gulp
    .src(config.vendorPaths)
    // Init source map
    .pipe(sourcemaps.init())
    .pipe(wrap('// FILE: <%= file.path %>\n<%= contents %>\n\n'))
    .pipe(concat('vendor.js'))
    // Unglify JavaScript if we start Gulp in production mode. Otherwise
    // concat files only.
    .pipe(
      gulpIf(
        production,
        uglify()
      )
    )
    // Append hash to file name in production mode for better cache control
    .pipe(
      gulpIf(
        production,
        sourcemaps.write('.')
      )
    )
    .pipe(gulp.dest(dest + config.sourcePaths.assets));
});

gulp.task('webserver', function() {
  gulp.src( '.' )
    .pipe(webserver({
      host:             config.server.host,
      port:             config.server.port,
      livereload:       true,
      directoryListing: false
    }));
});

gulp.task('open', function() {
  var dest = production ?
    config.globalPaths.dist : config.globalPaths.dev;

  if (openBrowser) {
    opn('http://' + config.server.host + ':' + config.server.port + '/' + dest);
  }
});

/*
 * -----------------------------------------------------------------------------
 * Watcher
 * -----------------------------------------------------------------------------
 */

gulp.task('watch', function() {
  gulp.watch(config.globalPaths.src + '/index.html', ['index']);
  gulp.watch([
      config.globalPaths.src + '/app/**/*.html',
      config.globalPaths.src + '/common/**/*.html',
    ], ['templates']);
  gulp.watch(
    config.globalPaths.src +
    config.sourcePaths.styles +
    '/**/*.scss', ['sass']);
  gulp.watch(config.globalPaths.src + '/**/*.js', ['jsSource']);
  gulp.watch(config.vendorPaths, ['jsVendor']);
});

gulp.task('build', function(callback) {
  runSequence(
    'clean',
    [
      'index', 'sass', 'jsSource', 'jsVendor', 'templates', 'data', 'images'
    ],
    callback
  );
});

gulp.task('default', function(callback) {
  runSequence(
    [
      'build', 'webserver', 'watch'
    ],
    'open',
    callback
  );
});
