/**
 * @usage
 *
 * gulp.src('app.js', {read: false})
 *     .pipe(rollup(options))
 *     .pipe(gulp.dest('dist'));
 */

import through from 'through2';
import gulpUtils from 'gulp-util';
import fs from 'fs';
import path from 'path';
import rollup from 'rollup';

const PLUGIN_NAME = 'gulp-rollup';

function unixStylePath (filePath) {
  return filePath.split(path.sep).join('/');
}

function gulpRollup (_options_) {
  const options = _options_ || {};

  return through.obj((file, enc, callback) => {
    if (!file.path) { callback(); }

    if (file.isStream()) {
      callback(
        new gulpUtils.PluginError(PLUGIN_NAME, 'Streaming not supported')
      );
    }

    try {
      const stats = fs.lstatSync(file.path);
      if (stats.isFile()) {
        let finalOptions = options;
        if (typeof(options) === 'function') {
          finalOptions = options(file);
        }
        finalOptions.entry = file.path;

        rollup.rollup(finalOptions).then(bundle => {
          const res = bundle.generate(finalOptions);
          file.contents = new Buffer(res.code);
          const map = res.map;
          if (map) {
            // This makes sure the paths in the generated source map (file and
            // sources) are relative to file.base:
            map.file = unixStylePath(file.relative);
            map.sources = map.sources.map(
              fileName => unixStylePath(path.relative(file.base, fileName))
            );
            file.sourceMap = map;
          }
          callback(null, file);
        }, err => {
          setImmediate(() => callback(
            new gulpUtils.PluginError(PLUGIN_NAME, err))
          );
        });
      }
    } catch (err) {
      callback(new gulpUtils.PluginError(PLUGIN_NAME, err));
    }
  }, function () {
    this.emit('end');
  });
}

export default gulpRollup;
