/*
 * React.js Starter Kit
 * Copyright (c) 2014 Konstantin Tarkus (@koistya), KriaSoft LLC.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

'use strict';

// Include Gulp and other build automation tools and utilities
// See: https://github.com/gulpjs/gulp/blob/master/docs/API.md
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var del = require('del');
var path = require('path');
var merge = require('merge-stream');
var runSequence = require('run-sequence');
var webpack = require('webpack');
var fs = require('fs');
var url = require('url');
var ReactTools = require('react-tools');
var argv = require('minimist')(process.argv.slice(2));
var nodemon = require('gulp-nodemon');

// Settings
var DEST = './server/public';                         // The build output folder
var RELEASE = !!argv.release;                 // Minimize and optimize during a build?
var GOOGLE_ANALYTICS_ID = 'UA-XXXXX-X';       // https://www.google.com/analytics/web/
var AUTOPREFIXER_BROWSERS = [                 // https://github.com/ai/autoprefixer
  'ie >= 10',
  'ie_mob >= 10',
  'ff >= 30',
  'chrome >= 34',
  'safari >= 7',
  'opera >= 23',
  'ios >= 7',
  'android >= 4.4',
  'bb >= 10'
];

var src = {};
var watch = false;
var pkgs = (function() {
  var pkgs = {};
  var map = function(source) {
    for (var key in source) {
      pkgs[key.replace(/[^a-z0-9]/gi, '')] = source[key].substring(1);
    }
  };
  map(require('../package.json').dependencies);
  return pkgs;
}());

// Configure JSX Harmony transform in order to be able
// require .js files with JSX (see 'pages' task)
var originalJsTransform = require.extensions['.js'];
var reactTransform = function(module, filename) {
  if (filename.indexOf('node_modules') === -1) {
    var src = fs.readFileSync(filename, {encoding: 'utf8'});
    src = ReactTools.transform(src, {harmony: true});
    module._compile(src, filename);
  } else {
    originalJsTransform(module, filename);
  }
};
require.extensions['.js'] = reactTransform;

// The default task
gulp.task('default', ['serve']);

// Clean up
gulp.task('clean', del.bind(null, [DEST]));

// 3rd party libraries
gulp.task('vendor', function() {
  return merge(
    gulp.src('../node_modules/jquery/dist/**')
      .pipe(gulp.dest(DEST + '/vendor/jquery-' + pkgs.jquery)),
    gulp.src('../node_modules/bootstrap/dist/fonts/**')
      .pipe(gulp.dest(DEST + '/fonts'))
  );
});

// Static files
gulp.task('assets', function() {
  src.assets = 'src/assets/**';
  return gulp.src(src.assets)
    .pipe($.changed(DEST))
    .pipe(gulp.dest(DEST))
    .pipe($.size({title: 'assets'}));
});

// HTML pages
gulp.task('pages', function() {
  src.pages = ['src/pages/**/*.js', 'src/pages/404.html'];

  var data = {};

  var render = $.render({
      template: './src/pages/_template.html',
      data: function() { return data; }
    })
    .on('error', function(err) { console.log('hello',err); render.end(); });

  return gulp.src(src.pages)
    .pipe($.changed(DEST, {extension: '.html'}))
    .pipe($.if('*.js', render))
    .pipe($.replace('UA-XXXXX-X', GOOGLE_ANALYTICS_ID))
    .pipe($.if(RELEASE, $.htmlmin({
      removeComments: true,
      collapseWhitespace: true,
      minifyJS: true
    }), $.jsbeautifier()))
    .pipe(gulp.dest(DEST))
    .pipe($.size({title: 'pages'}));
});

// CSS style sheets
gulp.task('styles', function() {
  src.styles = 'src/styles/**/*.{css,less}';
  return gulp.src('src/styles/bootstrap.less')
    .pipe($.plumber())
    .pipe($.less({
      sourceMap: !RELEASE,
      sourceMapBasepath: __dirname
    }))
    .on('error', console.error.bind(console))
    .pipe($.autoprefixer({browsers: AUTOPREFIXER_BROWSERS}))
    .pipe($.csscomb())
    .pipe($.if(RELEASE, $.minifyCss()))
    .pipe(gulp.dest(DEST + '/css'))
    .pipe($.size({title: 'styles'}));
});

// Bundle
gulp.task('bundle', function(cb) {
  var started = false;
  var config = require('./config/webpack.js')(RELEASE);
  var bundler = webpack(config);

  function bundle(err, stats) {
    if (err) {
      throw new $.util.PluginError('webpack', err);
    }

    !!argv.verbose && $.util.log('[webpack]', stats.toString({colors: true}));

    if (!started) {
      started = true;
      return cb();
    }
  }

  if (watch) {
    bundler.watch(200, bundle);
  } else {
    bundler.run(bundle);
  }
});

// Build the app from source code
gulp.task('build', ['clean'], function(cb) {
  runSequence(['vendor', 'assets', /*'images',*/ 'pages', 'styles', 'bundle'], cb);
});

// Launch a lightweight HTTP Server
gulp.task('serve', function(cb) {

  watch = true;

  runSequence('build', function() {
     nodemon({ script: './server/bin/www' })

     gulp.watch(src.assets, ['assets']);
    //  gulp.watch(src.images, ['images']);
     gulp.watch(src.pages, ['pages']);
     gulp.watch(src.styles, ['styles']);
    // gulp.watch(DEST + '/**/*.*', function(file) {
    //   browserSync.reload(path.relative(__dirname, file.path));
    // });
    cb();
  });
});
