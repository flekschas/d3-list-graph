var autoprefixer  = require('gulp-autoprefixer');
var changed       = require('gulp-changed');
var clean         = require('gulp-clean');
var concat        = require('gulp-concat');
var flatten       = require('gulp-flatten');
var gulp          = require('gulp');
var gulpIf        = require('gulp-if');
var gulpUtil      = require('gulp-util');
var ignore        = require('gulp-ignore');
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
  return gulp
    .src(config.globalPaths.dist, {read: false})
    .pipe(clean());
});

gulp.task('sass', function () {
  return gulp
    .src(config.globalPaths.src + config.sourcePaths.styles + '/main.scss')
    .pipe(rename('listGraph.css'))
    .pipe(flatten())
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest(config.globalPaths.dist))
    // Exclude everything when we are not in production mode.
    .pipe(
      gulpIf(
        !production,
        ignore.exclude('*')
      )
    )
    // Rename file
    .pipe(rename({ suffix: '.min' }))
    .pipe(sourcemaps.init())
    // Add vendor prefixes in production mode
    .pipe(autoprefixer({
      browsers: config.browsers,
      cascade: true
    }))
    // Minify stylesheet in production mode
    .pipe(minifyCss())
    // Write sourcemap
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(config.globalPaths.dist));
});

gulp.task('js', function () {
  return gulp
    .src(config.globalPaths.src + config.sourcePaths.scripts + '/**/*.js')
    .pipe(flatten())
    .pipe(gulp.dest(config.globalPaths.dist))
    // Exclude everything when we are not in production mode.
    .pipe(
      gulpIf(
        !production,
        ignore.exclude('*')
      )
    )
    // Rename file
    .pipe(rename({ suffix: '.min' }))
    // Init source map
    .pipe(sourcemaps.init())
    // Unglify JavaScript if we start Gulp in production mode. Otherwise
    // concat files only.
    .pipe(uglify())
    // Append hash to file name in production mode for better cache control
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(config.globalPaths.dist));
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
      'sass', 'js'
    ],
    callback
  );
});

gulp.task('dev', function(callback) {
  runSequence(
    [
      'build', 'webserver', 'watch'
    ],
    'open',
    callback
  );
});

gulp.task('default', ['dev']);
