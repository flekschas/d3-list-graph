'use strict';

var autoprefixer  = require('gulp-autoprefixer');
var babel         = require('rollup-plugin-babel');
var changed       = require('gulp-changed');
var clean         = require('gulp-clean');
var concat        = require('gulp-concat');
var flatten       = require('gulp-flatten');
var gulp          = require('gulp');
var gulpIf        = require('gulp-if');
var gulpUtil      = require('gulp-util');
var ignore        = require('gulp-ignore');
var minifyCss     = require('gulp-minify-css');
var notify        = require('gulp-notify');
var opn           = require('opn');
var path          = require('path');
var plumber       = require('gulp-plumber');
var rename        = require('gulp-rename');
var rollup        = require('./scripts/gulp-rollup.js');
var runSequence   = require('run-sequence');
var sass          = require('gulp-sass');
var sourcemaps    = require('gulp-sourcemaps');
var spawn         = require('child_process').spawn;
var svgmin        = require('gulp-svgmin');
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
var packageJson   = require('./package.json');

// Make sure that we catch errors for every task
var gulp_src = gulp.src;
gulp.src = function() {
  return gulp_src.apply(gulp, arguments)
    .pipe(plumber(function(error) {
      //Error Notification
      notify.onError({
        title: 'Error: ' + error.plugin,
        message: error.plugin + ' is complaining.',
        sound: 'Funk'
      })(error);

      // Output an error message
      gulpUtil.log(
        gulpUtil.colors.red('Error (' + error.plugin + '): ' + error.message)
      );

      // Emit the end event, to properly end the task
      this.emit('end');
    })
  );
};


/*
 * -----------------------------------------------------------------------------
 * Tasks
 * -----------------------------------------------------------------------------
 */

gulp.task('bundle', function () {
  gulp
    .src(
      config.globalPaths.src + config.sourcePaths.scripts + '/**/index.js', {
        read: false
      }
    )
    .pipe(sourcemaps.init())
    .pipe(rollup(function (file) {
      var bundleName = path.dirname(path.relative(file.base, file.path));
      return {
        banner: '/* Copyright ' + packageJson.author + ': ' + config.js.bundles[
          path.dirname(path.relative(file.base, file.path))
        ].banner + ' */',
        format: 'iife',
        moduleName: config.js.bundles[
            path.dirname(path.relative(file.base, file.path))
          ].name,
        plugins: [
          babel({
            exclude: 'node_modules/**'
          })
        ],
        sourceMap: !production
      };
    }))
    .pipe(rename(function (path) {
      path.basename = config.js.bundles[path.dirname].output;
      return path;
    }))
    .pipe(flatten())
    .pipe(sourcemaps.write('.'))
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
    .pipe(uglify({
      preserveComments: 'license'
    }))
    // Append hash to file name in production mode for better cache control
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(config.globalPaths.dist));
});

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

gulp.task('svg', function () {
  return gulp
    .src(config.globalPaths.src + config.sourcePaths.images + '/*.svg')
    .pipe(svgmin({
      plugins: [
        {
          removeTitle: true
        },
        {
          cleanupIDs: false
        }
      ]
    }))
    .pipe(gulp.dest(config.globalPaths.dist));
});

gulp.task('watch', function() {
  gulp.watch(
    config.globalPaths.src + config.sourcePaths.scripts + '/**/*.js',
    ['bundle']
  );
  gulp.watch(
    config.globalPaths.src + config.sourcePaths.styles + '/**/*.scss',
    ['sass']
  );
  gulp.watch(
    config.globalPaths.src + config.sourcePaths.images + '/*.svg',
    ['svg']
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
      'bundle', 'sass', 'svg'
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
