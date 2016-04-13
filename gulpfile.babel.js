import autoprefixer from 'gulp-autoprefixer';
import babel from 'rollup-plugin-babel';
import bump from 'gulp-bump';
import clean from 'gulp-clean';
import cleanCss from 'gulp-clean-css';
import eslint from 'gulp-eslint';
import flatten from 'gulp-flatten';
import gulp from 'gulp';
import gulpIf from 'gulp-if';
import gulpUtil from 'gulp-util';
import ignore from 'gulp-ignore';
import notify from 'gulp-notify';
import opn from 'opn';
import path from 'path';
import plumber from 'gulp-plumber';
import rename from 'gulp-rename';
import rollup from './scripts/gulp-rollup.js';
import runSequence from 'run-sequence';
import sass from 'gulp-sass';
import semver from 'semver';
import sourcemaps from 'gulp-sourcemaps';
import svgmin from 'gulp-svgmin';
import uglify from 'gulp-uglify';
import webserver from 'gulp-webserver';

import * as config from './config.json';
import * as packageJson from './package.json';

// Flags
const production = gulpUtil.env.production;  // E.g. `--production`
const openBrowser = gulpUtil.env.open;  // E.g. `--open`

/*
 * -----------------------------------------------------------------------------
 * Config
 * -----------------------------------------------------------------------------
 */

// Make sure that we catch errors for every task
const gulpSrc = gulp.src;
gulp.src = (...args) => gulpSrc
  .apply(gulp, args)
  .pipe(plumber(function (error) {
    // Error Notification
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
  }));


/*
 * -----------------------------------------------------------------------------
 * Tasks
 * -----------------------------------------------------------------------------
 */

// Shorthand
gulp.task('bv', ['bump-version']);
gulp.task('bump-version', () => {
  let increment;

  if (gulpUtil.env.patch) {
    increment = 'patch';
  }

  if (gulpUtil.env.minor) {
    increment = 'minor';
  }

  if (gulpUtil.env.major) {
    increment = 'major';
  }

  return gulp.src(['./bower.json', './package.json'])
    .pipe(bump({
      version: semver.inc(packageJson.version, increment)
    }))
    .pipe(gulp.dest('./'));
});

gulp.task('bundle', () => gulp
  .src(
    config.globalPaths.src + config.sourcePaths.scripts + '/**/index.js', {
      read: false
    }
  )
  .pipe(sourcemaps.init())
  .pipe(rollup(file => ({
    banner: '/* Copyright ' + packageJson.author + ': ' + config.js.bundles[
      path.dirname(path.relative(file.base, file.path))
    ].banner + ' */',
    format: 'iife',
    moduleName: config.js.bundles[
        path.dirname(path.relative(file.base, file.path))
      ].name,
    plugins: [
      babel({
        babelrc: false,
        exclude: 'node_modules/**',
        presets: 'es2015-rollup'
      })
    ],
    sourceMap: !production
  })))
  .pipe(rename(bundlePath => {
    bundlePath.basename = config.js.bundles[bundlePath.dirname].output;
    return bundlePath;
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
  .pipe(gulp.dest(config.globalPaths.dist))
);

gulp.task('clean', () => gulp
  .src(config.globalPaths.dist, { read: false })
  .pipe(clean())
);

gulp.task('lint', () => gulp
  .src(config.globalPaths.src + config.sourcePaths.scripts + '/**/*.js')
  .pipe(eslint({
    rules: {
      'no-console': 2
    }
  }))
  .pipe(eslint.format())
  .pipe(eslint.failOnError())
);

gulp.task('sass', () => gulp
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
  .pipe(cleanCss())
  // Write sourcemap
  .pipe(sourcemaps.write('.'))
  .pipe(gulp.dest(config.globalPaths.dist))
);

gulp.task('svg', () => gulp
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
  .pipe(gulp.dest(config.globalPaths.dist))
);

gulp.task('watch', () => {
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

gulp.task('webserver', () => gulp
  .src('.')
  .pipe(webserver({
    host: config.server.host,
    port: config.server.port,
    livereload: true,
    directoryListing: false
  }))
);

gulp.task('open', () => {
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

gulp.task('build', callback => {
  runSequence(
    'lint',
    'clean',
    [
      'bundle', 'sass', 'svg'
    ],
    callback
  );
});

gulp.task('dev', callback => {
  runSequence(
    [
      'build', 'webserver', 'watch'
    ],
    'open',
    callback
  );
});

gulp.task('default', ['dev']);
