var autoprefixer  = require('gulp-autoprefixer');
var changed       = require('gulp-changed');
var clean         = require('gulp-clean');
var concat        = require('gulp-concat');
var flatten       = require('gulp-flatten');
var gulp          = require('gulp');
var gulpIf        = require('gulp-if');
var gulpUtil      = require('gulp-util');
var minifyCss     = require('gulp-minify-css');
var opn           = require('opn');
var rename        = require('gulp-rename');
var runSequence   = require('run-sequence');
var sass          = require('gulp-sass');
var sourcemaps    = require('gulp-sourcemaps');
var spawn         = require('child_process').spawn;
var templateCache = require('gulp-angular-templatecache');
var uglify        = require('gulp-uglify');
var webserver     = require('gulp-webserver');
var wrap          = require('gulp-wrap');

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

gulp.task('sass', function () {
  var dest = production ?
    config.globalPaths.dist : config.globalPaths.dev;

  return gulp
    .src(config.globalPaths.src + config.sourcePaths.styles + '/main.scss')
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
    .pipe(rename('listGraph.css'))
    // Write sourcemap
    .pipe(
      gulpIf(
        production,
        sourcemaps.write('.')
      )
    )
    .pipe(gulp.dest(dest));
});

gulp.task('js', function () {
  var dest = production ?
    config.globalPaths.dist : config.globalPaths.dev;

  return gulp
    .src(config.globalPaths.src + config.sourcePaths.scripts + '/**/*.js')
    // Init source map
    .pipe(sourcemaps.init())
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
    .pipe(flatten())
    .pipe(gulp.dest(dest));
});

gulp.task('watch', function() {
  gulp.watch(
    config.globalPaths.src + config.sourcePaths.scripts + '/**/*.js',
    ['js']
  );
  gulp.watch(
    config.globalPaths.src + config.sourcePaths.styles + '/**/*.scss',
    ['sass']
  );
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
  // `--open`
  if (openBrowser) {
    opn('http://' + config.server.host + ':' + config.server.port + '/example');
  }
});

/*
 * -----------------------------------------------------------------------------
 * Task compiltions
 * -----------------------------------------------------------------------------
 */

gulp.task('build', function(callback) {
  runSequence(
    'clean',
    [
      'sass', 'js', 'watch'
    ],
    callback
  );
});

gulp.task('dev', function(callback) {
  runSequence(
    [
      'build', 'webserver'
    ],
    'open',
    callback
  );
});

gulp.task('default', ['dev']);
