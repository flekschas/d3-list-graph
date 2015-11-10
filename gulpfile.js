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
 * Watcher
 * -----------------------------------------------------------------------------
 */

gulp.task('dev', function(callback) {
  runSequence(
    [
      'webserver', 'open'
    ],
    callback
  );
});

gulp.task('default', ['dev']);
