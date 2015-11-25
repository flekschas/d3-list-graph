'use strict';

var rollup = require('rollup');
var babel = require('rollup-plugin-babel');
var config = require('../config.json');

config.js.bundles.forEach(function (bundle) {
  console.log(config.globalPaths.dist + '/' + bundle.output);
  rollup.rollup({
    entry: config.globalPaths.src +
      config.sourcePaths.scripts + '/' + bundle.entry,
    plugins: [
      babel({
        exclude: 'node_modules/**'
      })
    ]
  }).then(function (bundleFiles) {
    bundleFiles.write({
      dest: config.globalPaths.dist + '/' + bundle.output,
      format: 'iife',
      export: 'default',
      moduleName: 'D3LayoutListGraph'
    });
  });
});

console.log(config.js.bundles[1].output);
rollup.rollup({
  entry: config.globalPaths.src +
    config.sourcePaths.scripts + '/' + config.js.bundles[1].entry,
  external: [],
  plugins: [
    babel({
      exclude: 'node_modules/**'
    })
  ]
}).then(function (bundleFiles) {
  bundleFiles.write({
    dest: config.globalPaths.dist + '/' + config.js.bundles[1].output,
    format: 'iife',
    moduleName: 'D3LayoutListGraph'
  });
});
