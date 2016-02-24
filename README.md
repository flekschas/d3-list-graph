# D3 List Graph [![Build Status](https://travis-ci.org/flekschas/d3-list-graph.svg?branch=master)](https://travis-ci.org/flekschas/d3-list-graph)

> A flat horizontal scrollable node-link diagram, implemented in D3.

Demo: https://flekschas.github.io/d3-list-graph/

## Install

```shell
bower install flekschas/d3-list-graph --save
```

## Dependencies

This visualization depends on the following libraries to be available globally:

- D3
- jQuery
- jQuery's Mousewheel Plugin

## Usage

This example assumes that you're using Bower to fetch all code.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Example</title>
  <link href="bower_components/d3-list-graph/dist/listGraph.min.css" rel="stylesheet" type="text/css">
</head>
<body>
  <div class="list-graph">
    <div class="top-bar"></div>
    <div class="wrapper"><svg class="base"></svg></div>
  </div>
  <script src="bower_components/jquery/dist/jquery.js"></script>
  <script src="bower_components/jquery-mousewheel/jquery.mousewheel.js"></script>
  <script src="bower_components/d3/d3.js"></script>
  <script src="bower_components/d3-list-graph/dist/d3.layout.listGraph.js"></script>
  <script src="bower_components/d3-list-graph/dist/listGraph.min.js"></script>
  <script>
    d3.json('bower_components/d3-list-graph/example/data.json', function (error, data) {
      if (error) throw error;

      var graph = new ListGraph({
        data: data,
        element: document.querySelector('.list-graph'),
        iconPath: '/dist/icons.svg',
        rootNodes: [1, 2]
      });
    });
  </script>
</body>
</html>
```

### Options

* = required
[`true`] = default value

**element** *: _Object_
DOM element that should act as the base element.

**data** *: _Object_
Unique key-value list-like object. E.g.: `{1: {...}, 2: {...}, 3: {...}}`.

**rootNodes** *: _Array_
List of node ids that should act as root nodes.

**iconPath** *: _String_ [_Empty string_]
Path to the SVG icon file. Default is an empty string, which is equivalent to inline SVG.

**width**: _Number_ [100% of the SVG container]
Number of columns to be shown.

**height**: _Number_ [100% of the SVG container]
Number of columns to be shown.

**scrollbarWidth**: _Number_ [`6`]
Width of the scrollbars.

**columns**: _Number_ [`5`]
Number of columns to be shown.

**rows**: _Number_
Number of rows to be shown. [`5`]

**barMode**: _String_ [`one`]
Initial bar mode. Can either be `one` or `two`.

**highlightActiveLevel**: _Boolean_ [`false`]
If `true` the currently active root level is highlighted

**activeLevel**: _Number_ [`0`]
Offset of the root level to be highlighted. If `1` one level to the right of the root level will be highlighted.

**noRootActiveLevelDiff**: _Number_ [`0`]
Negative offset when no manually selected new root level is set.

**forceWidth**: _Boolean_ [`false`]
If you want to force the visualization to be of a certain width use this. [Default: false]

**sortBy**: _String_
Initial sorting of a property. This string should be identical to the property key.

**sortOrder:** _String_ [`desc`]
Initial sort order. Can either be `asc` or `desc`.

**dispatcher**: _Function_
Can be used to listen to internal events.

**lessTransitions**: _Number_ [`0`]
 - 0 [Default]: Show all transitions
 - 1: Show only CSS transitions
 - 2: Show no transitions

## Develop

To preview the toy development example website do:

```shell
gulp --open
```

In order to build a final production ready library run:

```shell
gulp build --production
```

**Note:** You can also pass `--production` to `gulp` in order to test if the
compiled version really works. Note that you have to change the paths in
`example/index.html`.
