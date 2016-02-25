/* Copyright Fritz Lekschas: D3 example visualization app using list-based graphs */
var ListGraph = (function ($,d3) { 'use strict';

  var babelHelpers = {};

  babelHelpers.classCallCheck = function (instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  };

  babelHelpers.createClass = (function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  })();

  babelHelpers.inherits = function (subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  };

  babelHelpers.possibleConstructorReturn = function (self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  };

  babelHelpers;
  var CLASSNAME = 'list-graph';

  var SCROLLBAR_WIDTH = 6;
  var COLUMNS = 5;
  var ROWS = 5;

  // An empty path is equal to inline SVG.
  var ICON_PATH = '';

  // -1 = desc, 1 = asc
  var DEFAULT_SORT_ORDER = -1;

  var DEFAULT_BAR_MODE = 'one';

  var HIGHLIGHT_ACTIVE_LEVEL = true;
  var ACTIVE_LEVEL = 0;
  var NO_ROOT_ACTIVE_LEVEL_DIFF = 0;

  var TRANSITION_LIGHTNING_FAST = 150;
  var TRANSITION_SEMI_FAST = 250;

  function mergeSelections(selections) {
    // Create a new empty selection
    var mergedSelection = d3.selectAll('.d3-list-graph-not-existent');

    function pushSelection(selection) {
      selection.each(function pushDomNode() {
        mergedSelection[0].push(this);
      });
    }

    for (var i = selections.length; i--;) {
      pushSelection(selections[i]);
    }

    return mergedSelection;
  }

  function allTransitionsEnded(transition, callback) {
    if (transition.size() === 0) {
      callback();
    }
    var n = 0;
    transition.each(function () {
      return ++n;
    }).each('end', function () {
      if (! --n) callback.apply(this, arguments);
    });
  }

  var ExtendableError = (function (_Error) {
    babelHelpers.inherits(ExtendableError, _Error);

    function ExtendableError(message) {
      babelHelpers.classCallCheck(this, ExtendableError);

      var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(ExtendableError).call(this, message));

      _this.name = _this.constructor.name;
      _this.message = message;
      Error.captureStackTrace(_this, _this.constructor.name);
      return _this;
    }

    return ExtendableError;
  })(Error);

  var LimitsUnsupportedFormat = (function (_ExtendableError) {
    babelHelpers.inherits(LimitsUnsupportedFormat, _ExtendableError);

    function LimitsUnsupportedFormat(message) {
      babelHelpers.classCallCheck(this, LimitsUnsupportedFormat);
      return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(LimitsUnsupportedFormat).call(this, message || 'The limits are wrongly formatted. Please provide an ' + 'object of the following format: `{ x: { min: 0, max: 1 }, y: { min: ' + '0, max: 1 } }`'));
    }

    return LimitsUnsupportedFormat;
  })(ExtendableError);

  /**
   * Drap and drop event handler that works via translation.
   *
   * @method  onDragDrop
   * @author  Fritz Lekschas
   * @date    2016-01-23
   * @param   {Object}  selection        D3 selection to listen for the drag
   *   event.
   * @param   {Object}           dragMoveHandler  Handler for drag-move.
   * @param   {Object}           dropHandler      Handler for drag-end, i.e. drop.
   * @param   {Array}            elsToBeDragged   Array of D3 selections to be
   *   moved according to the drag event. If empty or undefined `selection` will
   *   be used.
   * @param   {String}           orientation      Can either be "horizontal",
   *   "vertical" or `undefined`, i.e. both directions.
   * @param   {Object|Function}  limits           X and Y drag limits. E.g.
   *   `{ x: { min: 0, max: 10 } }`.
   * @param   {Array}             notWhenTrue     List if function returning a
   *   Boolean value which should prevent the dragMoveHandler from working.
   */
  function onDragDrop(selection, dragStartHandler, dragMoveHandler, dropHandler, elsToBeDragged, orientation, limits, notWhenTrue) {
    var drag = d3.behavior.drag();

    var appliedLimits = limits || {}; // eslint-disable-line no-param-reassign

    if (dragStartHandler) {
      drag.on('dragstart', function () {
        if (typeof limits === 'function') {
          appliedLimits = limits();
        }
        dragStartHandler();
      });
    }

    if (dragMoveHandler) {
      drag.on('drag', function (data) {
        dragMoveHandler.call(this, data, elsToBeDragged, orientation, appliedLimits, notWhenTrue);
      });
    }

    if (dropHandler) {
      drag.on('dragend', dropHandler);
    }

    selection.each(function (data) {
      var el = d3.select(this);

      // Set default data if not available.
      if (!data) {
        data = { dragX: 0, dragY: 0 }; // eslint-disable-line no-param-reassign
        el.datum(data);
      }

      // Add drag event handler
      el.call(drag);
    });
  }

  function dragMoveHandler(data, elsToBeDragged, orientation, limits, notWhenTrue) {
    for (var i = notWhenTrue.length; i--;) {
      if (notWhenTrue[i]()) {
        return;
      }
    }

    var els = d3.select(this);

    if (elsToBeDragged && elsToBeDragged.length) {
      els = mergeSelections(elsToBeDragged);
    }

    function withinLimits(value, applyingLimits) {
      var restrictedValue = undefined;

      if (applyingLimits) {
        try {
          restrictedValue = Math.min(applyingLimits.max, Math.max(applyingLimits.min, value));
        } catch (e) {
          throw new LimitsUnsupportedFormat();
        }
      }
      return restrictedValue;
    }

    if (orientation === 'horizontal' || orientation === 'vertical') {
      if (orientation === 'horizontal') {
        data.dragX += d3.event.dx;
        data.dragX = withinLimits(data.dragX + d3.event.dx, limits.x);
        els.style('transform', 'translateX(' + data.dragX + 'px)');
      }
      if (orientation === 'vertical') {
        data.dragY += d3.event.dy;
        data.dragX = withinLimits(data.dragY + d3.event.dy, limits.y);
        els.style('transform', 'translateY(' + data.dragY + 'px)');
      }
    } else {
      data.dragX += d3.event.dx;
      data.dragY += d3.event.dy;
      els.style('transform', 'translate(' + data.dragX + 'px,' + data.dragY + 'px)');
    }
  }

  var SCROLLBAR_CLASS = 'scrollbar';

  var Scrollbars = (function () {
    function Scrollbars(baseSelection, visData, width) {
      babelHelpers.classCallCheck(this, Scrollbars);

      this.visData = visData;
      this.width = width;

      // Add empty scrollbar element
      this.all = baseSelection.append('rect').attr('class', SCROLLBAR_CLASS).call(function (selection) {
        selection.each(function setScrollBarDomElement() {
          d3.select(this.parentNode).datum().scrollbar.el = this;
        });
      }).attr('x', function (data) {
        return data.scrollbar.x - 2;
      }).attr('y', function (data) {
        return data.scrollbar.y;
      }).attr('width', this.width).attr('height', function (data) {
        return data.scrollbar.height;
      }).attr('rx', this.width / 2).attr('ry', this.width / 2).classed('ready', true);
    }

    babelHelpers.createClass(Scrollbars, [{
      key: 'updateVisibility',
      value: function updateVisibility() {
        this.all.transition().duration(TRANSITION_LIGHTNING_FAST).attr({
          x: function x(data) {
            return data.scrollbar.x;
          },
          height: function height(data) {
            return data.scrollbar.height;
          }
        });
      }
    }]);
    return Scrollbars;
  })();

  /**
   * Turns an array of IDs into an array of objects holding the ID.
   *
   * @description
   * We need to translate the array of objects into an array of fake objects in
   * order to easily match the links to be highlighted.
   *
   * Using this method selection can be matched easily via the array of fake
   * objects:
   *
   * ```
   * this.links
   *   .data(arrayToFakeObjs([1, 2, 3]), data => data)
   *   .classed('highlight', highlight === false ? false : true);
   * ```
   *
   * @method  arrayToFakeObjs
   * @author  Fritz Lekschas
   * @date    2015-12-23
   * @param   {Array}  arrayIds  Array of IDs.
   * @return  {Array}            Array of objects holding the ID. E.g. `[1]` will
   *   be translated into `[{ id: 1 }]`.
   */
  function arrayToFakeObjs(arrayIds) {
    var fakeObjs = [];

    for (var i = arrayIds.length; i--;) {
      fakeObjs.push({ id: arrayIds[i] });
    }

    return fakeObjs;
  }

  /**
   * Collect all cloned nodes, including the original node.
   *
   * @method  collectInclClones
   * @author  Fritz Lekschas
   * @date    2015-12-30
   * @param   {Object}  node  Start node
   * @return  {Array}         Array of original and cloned nodes.
   */
  function collectInclClones(node) {
    var originalNode = node;

    if (node.clone) {
      originalNode = node.originalNode;
    }

    var clones = [originalNode];

    if (originalNode.clones.length) {
      clones = clones.concat(originalNode.clones);
    }

    return clones;
  }

  /** Used to determine if values are of the language type `Object`. */
  var objectTypes = {
    'function': true,
    'object': true
  };

  /** Detect free variable `exports`. */
  var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;

  /** Detect free variable `module`. */
  var freeModule = objectTypes[typeof module] && module && !module.nodeType && module;

  /** Detect free variable `global` from Node.js. */
  var freeGlobal = freeExports && freeModule && typeof global == 'object' && global && global.Object && global;

  /** Detect free variable `self`. */
  var freeSelf = objectTypes[typeof self] && self && self.Object && self;

  /** Detect free variable `window`. */
  var freeWindow = objectTypes[typeof window] && window && window.Object && window;

  /**
   * Used as a reference to the global object.
   *
   * The `this` value is used if it's the global object to avoid Greasemonkey's
   * restricted `window` object, otherwise the `window` object is used.
   */
  var root = freeGlobal || ((freeWindow !== (this && this.window)) && freeWindow) || freeSelf || this;

  /* Native method references for those with the same name as other `lodash` methods. */
  var nativeIsFinite = root.isFinite;

  /**
   * Checks if `value` is a finite primitive number.
   *
   * **Note:** This method is based on [`Number.isFinite`](http://ecma-international.org/ecma-262/6.0/#sec-number.isfinite).
   *
   * @static
   * @memberOf _
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a finite number, else `false`.
   * @example
   *
   * _.isFinite(10);
   * // => true
   *
   * _.isFinite('10');
   * // => false
   *
   * _.isFinite(true);
   * // => false
   *
   * _.isFinite(Object(10));
   * // => false
   *
   * _.isFinite(Infinity);
   * // => false
   */
  function isFinite(value) {
    return typeof value == 'number' && nativeIsFinite(value);
  }

  function up(node, callback, depth, includeClones, child) {
    var nodesInclClones = includeClones ? collectInclClones(node) : [node];

    for (var i = nodesInclClones.length; i--;) {
      if (child) {
        callback(nodesInclClones[i], child);
      }

      if (!isFinite(depth) || depth > 0) {
        var parentsId = Object.keys(nodesInclClones[i].parents);
        for (var j = parentsId.length; j--;) {
          up(nodesInclClones[i].parents[parentsId[j]], callback, depth - 1, includeClones, nodesInclClones[i]);
        }
      }
    }
  }

  function down(node, callback, depth, includeClones) {
    var nodesInclClones = includeClones ? collectInclClones(node) : [node];

    for (var i = nodesInclClones.length; i--;) {
      callback(nodesInclClones[i]);

      if (!isFinite(depth) || depth > 0) {
        for (var j = nodesInclClones[i].childRefs.length; j--;) {
          down(nodesInclClones[i].childRefs[j], callback, depth - 1, includeClones);
        }
      }
    }
  }

  function upAndDown(node, callbackUp, callbackDown, depth, includeClones) {
    if (callbackDown) {
      up(node, callbackUp, depth, includeClones);
      down(node, callbackDown, depth, includeClones);
    } else {
      up(node, callbackUp, depth, includeClones);
      down(node, callbackUp, depth, includeClones);
    }
  }

  function siblings(node, callback) {
    var parentsId = Object.keys(node.parents);
    for (var i = parentsId.length; i--;) {
      for (var j = node.parents[parentsId[i]].childRefs.length; j--;) {
        callback(node.parents[parentsId[i]].childRefs[j]);
      }
    }
    // The root node doesn't have a `parents` property but might have `siblings`.
    if (node.siblings) {
      var siblingsId = Object.keys(node.siblings);
      for (var i = siblingsId.length; i--;) {
        callback(node.siblings[siblingsId[i]]);
      }
    }
  }

  /**
   * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
   * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
   *
   * @static
   * @memberOf _
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an object, else `false`.
   * @example
   *
   * _.isObject({});
   * // => true
   *
   * _.isObject([1, 2, 3]);
   * // => true
   *
   * _.isObject(1);
   * // => false
   */
  function isObject(value) {
    // Avoid a V8 JIT bug in Chrome 19-20.
    // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
    var type = typeof value;
    return !!value && (type == 'object' || type == 'function');
  }

  /** `Object#toString` result references. */
  var funcTag = '[object Function]';

  /** Used for native method references. */
  var objectProto = Object.prototype;

  /**
   * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
   * of values.
   */
  var objToString = objectProto.toString;

  /**
   * Checks if `value` is classified as a `Function` object.
   *
   * @static
   * @memberOf _
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
   * @example
   *
   * _.isFunction(_);
   * // => true
   *
   * _.isFunction(/abc/);
   * // => false
   */
  function isFunction(value) {
    // The use of `Object#toString` avoids issues with the `typeof` operator
    // in older versions of Chrome and Safari which return 'function' for regexes
    // and Safari 8 which returns 'object' for typed array constructors.
    return isObject(value) && objToString.call(value) == funcTag;
  }

  // Credits go to Mike Bostock: http://bl.ocks.org/mbostock/3468167
  function roundRect(x, y, width, height, radius) {
    var topLeft = radius.topLeft || 0;
    var topRight = radius.topRight || 0;
    var bottomLeft = radius.bottomLeft || 0;
    var bottomRight = radius.bottomRight || 0;

    return 'M' + (x + topLeft) + ',' + y + 'h' + (width - topLeft - topRight) + 'a' + topRight + ',' + topRight + ' 0 0 1 ' + topRight + ',' + topRight + 'v' + (height - (topRight + bottomRight)) + 'a' + bottomRight + ',' + bottomRight + ' 0 0 1 ' + -bottomRight + ',' + bottomRight + 'h' + (bottomLeft - (width - bottomRight)) + 'a' + bottomLeft + ',' + bottomLeft + ' 0 0 1 ' + -bottomLeft + ',' + -bottomLeft + 'v' + (topLeft - (height - bottomLeft)) + 'a' + topLeft + ',' + topLeft + ' 0 0 1 ' + topLeft + ',' + -topLeft + 'z';
  }

  var BAR_CLASS = 'bar';

  var Bar = (function () {
    function Bar(barGroup, barData, nodeData, visData, bars) {
      var _this = this;

      babelHelpers.classCallCheck(this, Bar);

      this.data = barData;
      this.nodeData = nodeData;
      this.visData = visData;
      this.bars = bars;

      this.data.x = nodeData.x;
      this.data.level = nodeData.depth;

      this.height = this.visData.global.row.contentHeight / (this.data.length * 2) - this.visData.global.cell.padding * 2;

      this.activeHeight = this.visData.global.row.contentHeight - 2;

      this.inactiveheight = this.visData.global.cell.padding * 2 - 1;

      this.selection = barGroup.selectAll(BAR_CLASS).data(this.data).enter().append('g').attr('class', function (data) {
        return BAR_CLASS + ' ' + data.id;
      }).classed('active', function (data) {
        return data.id === _this.visData.nodes[_this.nodeData.depth].sortBy;
      });

      // Local helper method to avoid code duplication.
      // Calling a class method from within the consructor is possible but `this`
      // is not available. Thus, we need to create local function and pass in
      // `this` as `that`, which feels very hacky but it works.
      function setupMagnitude(selection) {
        var _this2 = this;

        var currentSorting = this.visData.nodes[this.nodeData.depth].sortBy;

        selection.attr('d', function (data) {
          return Bar.generatePath(data, _this2.bars.mode, currentSorting, _this2.visData);
        }).classed('bar-magnitude', true);
      }

      function setupBorder(selection) {
        selection.attr('x', 0).attr('y', this.visData.global.row.padding).attr('width', this.visData.global.column.contentWidth).attr('height', this.visData.global.row.contentHeight).attr('rx', 2).attr('ry', 2).classed('bar-border', true);
      }

      function setupIndicator(selection) {
        selection.attr({
          class: 'bar-indicator',
          x: 0,
          y: this.visData.global.row.padding,
          width: 2,
          height: 4
        });
      }

      this.selection.append('rect').call(setupBorder.bind(this));

      this.selection.append('path').call(setupMagnitude.bind(this));

      this.selection.append('rect').call(setupIndicator.bind(this));
    }

    babelHelpers.createClass(Bar, null, [{
      key: 'updateIndicator',
      value: function updateIndicator(selection, contentWidth, contentHeight, referenceValue, lessTransitions, reference) {
        var y = Math.min(contentWidth * Math.min(referenceValue, 1) - 1, contentWidth - 2);

        // Stop previous transitions.
        selection.attr({
          height: contentHeight,
          x: reference ? y : 0
        }).classed('positive', function (data) {
          return data.value >= referenceValue;
        }).transition().duration(0).attr('width', reference ? 2 : lessTransitions ? y : 0 // eslint-disable-line no-nested-ternary
        );

        if (!lessTransitions && !reference) {
          selection.transition().duration(TRANSITION_SEMI_FAST).attr('width', y);
        }
      }
    }, {
      key: 'generatePath',
      value: function generatePath(data, mode, currentSorting, visData, indicator, adjustWidth, bottom) {
        if (mode === 'two') {
          return Bar.generateTwoBarsPath(data, visData, bottom);
        }
        return Bar.generateOneBarPath(data, currentSorting, visData, indicator, adjustWidth);
      }
    }, {
      key: 'generateOneBarPath',
      value: function generateOneBarPath(data, currentSorting, visData, indicator, adjustWidth) {
        var height = visData.global.row.contentHeight;
        var normValue = Math.min(data.value, 1);
        var normIndicator = Math.min(indicator, 1);

        var x = 0;
        var width = 2;

        var radius = {
          topLeft: 2,
          bottomLeft: 2
        };

        if (indicator) {
          radius = {};
        }

        if (data.id !== currentSorting && typeof indicator === 'undefined') {
          x = normValue * visData.global.column.contentWidth - 3;
          radius = {};
        } else if (indicator) {
          x = normIndicator * visData.global.column.contentWidth;
          if (adjustWidth) {
            if (normValue < normIndicator) {
              x = normValue * visData.global.column.contentWidth;
            }
            width = Math.max(Math.abs(normIndicator - normValue) * visData.global.column.contentWidth, 2);
          }
        } else {
          width = visData.global.column.contentWidth * normValue;
        }

        x = Math.min(x, visData.global.column.contentWidth - 2);

        return roundRect(x, visData.global.row.padding, width, height, radius);
      }
    }, {
      key: 'generateTwoBarsPath',
      value: function generateTwoBarsPath(data, visData, bottom) {
        var normValue = Math.min(data.value, 1);
        var height = visData.global.row.contentHeight / 2;
        var width = visData.global.column.contentWidth * normValue;

        var y = visData.global.row.padding;
        var radius = { topLeft: 2 };

        if (bottom) {
          radius = { bottomLeft: 2 };
          y += height;
        }

        return roundRect(0, y, width, height, radius);
      }
    }]);
    return Bar;
  })();

  var BARS_CLASS = 'bars';

  var Bars = (function () {
    function Bars(vis, selection, mode, visData) {
      babelHelpers.classCallCheck(this, Bars);

      var that = this;

      this.vis = vis;
      this.mode = mode;
      this.visData = visData;

      this.selection = selection.append('g').attr('class', BARS_CLASS);

      this.selection.each(function (datum) {
        new Bar(d3.select(this), datum.data.bars, datum, that.visData, that);
      });
    }

    babelHelpers.createClass(Bars, [{
      key: 'updateAll',
      value: function updateAll(update, sortBy) {
        var _this = this;

        this.selection.selectAll('.bar-magnitude').data(update, function (data) {
          return data.barId;
        }).transition().duration(TRANSITION_SEMI_FAST).attr('d', function (data) {
          return Bar.generatePath(data, _this.mode, sortBy, _this.visData);
        });
      }
    }, {
      key: 'update',
      value: function update(selection, sortBy) {
        var _this2 = this;

        selection.each(function (data) {
          var el = d3.select(this);

          if (data.id === sortBy && !el.classed('active')) {
            el.classed('active', true);
            // Ensure that the active bars we are places before any other bar,
            // thus placing them in the background
            this.parentNode.insertBefore(this, this.parentNode.children[0]);
          }

          if (data.id !== sortBy) {
            el.classed('active', false);
          }
        });

        selection.selectAll('.bar-magnitude').transition().duration(TRANSITION_SEMI_FAST).attr('d', function (data) {
          return Bar.generatePath(data, _this2.mode, sortBy, _this2.visData);
        });
      }
    }, {
      key: 'updateIndicator',
      value: function updateIndicator(bars, referenceValue, direct) {
        Bar.updateIndicator(bars, this.visData.global.column.contentWidth, direct ? this.visData.global.row.contentHeight : 4, referenceValue, this.vis.lessTransitionsJs, direct);
      }
    }, {
      key: 'switchMode',
      value: function switchMode(mode, currentSorting) {
        var _this3 = this;

        if (this.mode !== mode) {
          if (mode === 'one') {
            if (currentSorting.global.type) {
              this.selection.selectAll('.bar').selectAll('.bar-magnitude').transition().duration(TRANSITION_SEMI_FAST).attr('d', function (data) {
                return Bar.generateOneBarPath(data, currentSorting.global.type, _this3.visData);
              });
            } else {
              // console.error(
              //   'Switching magnitude visualization after individual sorting is ' +
              //   'not supported yet.'
              // );
            }
          }

          if (mode === 'two') {
            this.selection.selectAll('.bar.precision').selectAll('.bar-magnitude').transition().duration(TRANSITION_SEMI_FAST).attr('d', function (data) {
              return Bar.generateTwoBarsPath(data, _this3.visData);
            });

            this.selection.selectAll('.bar.recall').selectAll('.bar-magnitude').transition().duration(TRANSITION_SEMI_FAST).attr('d', function (data) {
              return Bar.generateTwoBarsPath(data, _this3.visData, true);
            });
          }

          this.mode = mode;
        }
      }
    }]);
    return Bars;
  })();

  var NODES_CLASS = 'nodes';
  var NODE_CLASS = 'node';
  var CLONE_CLASS = 'clone';

  var Nodes = (function () {
    function Nodes(vis, baseSelection, visData, links, events) {
      var _this = this;

      babelHelpers.classCallCheck(this, Nodes);

      var that = this;

      // Helper
      function drawFullSizeRect(selection, className, shrinking) {
        var shrinkingAmount = shrinking ? shrinking : 0;

        selection.attr('x', shrinkingAmount).attr('y', that.visData.global.row.padding + shrinkingAmount).attr('width', that.visData.global.column.contentWidth - 2 * shrinkingAmount).attr('height', that.visData.global.row.contentHeight - 2 * shrinkingAmount).attr('rx', 2 - shrinkingAmount).attr('ry', 2 - shrinkingAmount).classed(className, true);
      }

      this.vis = vis;
      this.visData = visData;
      this.links = links;
      this.events = events;
      this.currentLinks = {};
      this.iconDimension = Math.min(this.visData.global.row.contentHeight / 2 - this.visData.global.cell.padding * 2, this.visData.global.column.padding / 2 - 4);

      this.groups = baseSelection.append('g').attr('class', NODES_CLASS).call(function (selection) {
        selection.each(function storeLinkToGroupNode() {
          d3.select(this.parentNode).datum().nodes = this;
        });
      });

      this.nodes = this.groups.selectAll('.' + NODE_CLASS).data(function (data) {
        return data.rows;
      }).enter().append('g').classed(NODE_CLASS, true).classed(CLONE_CLASS, function (data) {
        return data.clone;
      }).attr('transform', function (data) {
        return 'translate(' + (data.x + _this.visData.global.column.padding) + ', ' + data.y + ')';
      }).on('mouseenter', function (data) {
        that.vis.interactionWrapper.call(that.vis, (function (domEl, _data) {
          var el = d3.select(domEl);

          if (!!!this.vis.activeScrollbar) {
            this.enterHandler.call(this, domEl, _data);
          }

          if (!el.classed('rooted')) {
            el.selectAll('.bg-extension').style('transform', 'translateX(' + -(this.iconDimension * 2 + 10) + 'px)');
          }
        }).bind(that), [this, data]);
      }).on('mouseleave', function (data) {
        that.vis.interactionWrapper.call(that.vis, (function (domEl, _data) {
          var el = d3.select(domEl);

          if (!!!this.vis.activeScrollbar) {
            this.leaveHandler.call(this, domEl, _data);
          }

          if (!el.classed('rooted')) {
            if (_data.data.queryMode) {
              el.selectAll('.bg-extension').style('transform', 'translateX(' + (-this.iconDimension - 6) + 'px)');
            } else {
              el.selectAll('.bg-extension').style('transform', 'translateX(0px)');
            }
          }
        }).bind(that), [this, data]);
      });

      this.nodes.append('rect').call(drawFullSizeRect, 'bg-extension').attr('width', Math.max(this.visData.global.column.padding + this.visData.global.column.contentWidth / 2, this.visData.global.column.contentWidth));

      this.nodes.append('rect').call(drawFullSizeRect, 'bg-border');

      this.nodes.append('rect').call(drawFullSizeRect, 'bg', 1);

      // Rooting icons
      var nodeRooted = this.nodes.append('g').attr('class', 'focus-controls root inactive').on('click', function clickHandler(data) {
        that.rootHandler.call(that, this, data);
      });

      nodeRooted.append('rect').call(this.setUpFocusControls.bind(this), 'left', 2, 'hover-helper', 'hover-helper');

      nodeRooted.append('svg').call(this.setUpFocusControls.bind(this), 'left', 2, 'icon', 'ease-all state-inactive invisible-default icon').append('use').attr('xlink:href', this.vis.iconPath + '#unlocked');

      nodeRooted.append('svg').call(this.setUpFocusControls.bind(this), 'left', 2, 'icon', 'ease-all state-active invisible-default icon').append('use').attr('xlink:href', this.vis.iconPath + '#locked');

      // Rooting icons
      var nodeQuery = this.nodes.append('g').attr('class', 'focus-controls query inactive').on('click', function (data) {
        that.toggleQueryMode.call(that, this.parentNode, data);
      });

      nodeQuery.append('rect').call(this.setUpFocusControls.bind(this), 'left', 1, 'hover-helper', 'hover-helper');

      nodeQuery.append('svg').call(this.setUpFocusControls.bind(this), 'left', 1, 'icon', 'ease-all state-inactive invisible-default icon').append('use').attr('xlink:href', this.vis.iconPath + '#set-inactive');

      nodeQuery.append('svg').call(this.setUpFocusControls.bind(this), 'left', 1, 'icon', 'ease-all state-and-or invisible-default icon').append('use').attr('xlink:href', this.vis.iconPath + '#union');

      nodeQuery.append('svg').call(this.setUpFocusControls.bind(this), 'left', 1, 'icon', 'ease-all state-not invisible-default icon').append('use').attr('xlink:href', this.vis.iconPath + '#not');

      var nodeLocks = this.nodes.append('g').attr('class', 'focus-controls lock inactive').on('click', function clickHandler(data) {
        that.lockHandler.call(that, this, data);
      });

      nodeLocks.append('circle').call(this.setUpFocusControls.bind(this), 'right', 0, 'bg', 'bg');

      nodeLocks.append('svg').call(this.setUpFocusControls.bind(this), 'right', 0, 'icon', 'ease-all state-inactive invisible-default icon').append('use').attr('xlink:href', this.vis.iconPath + '#unlocked');

      nodeLocks.append('svg').call(this.setUpFocusControls.bind(this), 'right', 0, 'icon', 'ease-all state-active invisible-default icon').append('use').attr('xlink:href', this.vis.iconPath + '#locked');

      this.bars = new Bars(this.vis, this.nodes, this.vis.barMode, this.visData);

      this.nodes.append('rect').call(drawFullSizeRect, 'border');

      // Add node label
      this.nodes.call(function (selection) {
        selection.append('foreignObject').attr('x', _this.visData.global.cell.padding).attr('y', _this.visData.global.row.padding + _this.visData.global.cell.padding).attr('width', _this.visData.global.column.contentWidth).attr('height', _this.visData.global.row.contentHeight - _this.visData.global.cell.padding * 2).attr('class', 'label-wrapper').on('click', function clickHandler(data) {
          that.clickHandler.call(that, this, data);
        }).append('xhtml:div').attr('class', 'label').attr('title', function (data) {
          return data.data.name;
        }).style('line-height', _this.visData.global.row.contentHeight - _this.visData.global.cell.padding * 2 + 'px').append('xhtml:span').text(function (data) {
          return data.data.name;
        });
      });

      if (isFunction(this.events.on)) {
        // this.events.on('d3ListGraphNodeClick', dataSetIds => {
        //   console.log('d3ListGraphNodeClick', dataSetIds);
        // });

        this.events.on('d3ListGraphFocusNodes', function (event) {
          return _this.focusNodes(event);
        });

        this.events.on('d3ListGraphBlurNodes', function (event) {
          return _this.blurNodes(event);
        });

        this.events.on('d3ListGraphNodeEnter', function (nodeIds) {
          return _this.eventHelper(nodeIds, _this.highlightNodes);
        });

        this.events.on('d3ListGraphNodeLeave', function (nodeIds) {
          return _this.eventHelper(nodeIds, _this.unhighlightNodes);
        });

        this.events.on('d3ListGraphNodeLock', function (nodeIds) {
          return _this.eventHelper(nodeIds, _this.toggleLock, [], '.lock');
        });

        this.events.on('d3ListGraphNodeUnlock', function (nodeIds) {
          return _this.eventHelper(nodeIds, _this.toggleLock, [true], '.lock');
        });

        this.events.on('d3ListGraphNodeRoot', function (data) {
          return _this.eventHelper(data.nodeIds, _this.toggleRoot, [], '.root');
        });

        this.events.on('d3ListGraphNodeUnroot', function (data) {
          return _this.eventHelper(data.nodeIds, _this.toggleRoot, [true], '.root');
        });
      }
    }

    babelHelpers.createClass(Nodes, [{
      key: 'clickHandler',
      value: function clickHandler(el, data) {
        this.toggleQueryMode(el.parentNode, data);
        // this.events.broadcast('d3ListGraphNodeClick', { id: data.id });
      }
    }, {
      key: 'enterHandler',
      value: function enterHandler(el, data) {
        this.highlightNodes(el, data);

        var eventData = {
          id: data.id,
          clone: false,
          clonedFromId: undefined
        };

        if (data.clone) {
          eventData.clone = true;
          eventData.clonedFromId = data.originalNode.id;
        }

        this.events.broadcast('d3ListGraphNodeEnter', eventData);
      }
    }, {
      key: 'leaveHandler',
      value: function leaveHandler(el, data) {
        this.unhighlightNodes(el, data);

        var eventData = {
          id: data.id,
          clone: false,
          clonedFromId: undefined
        };

        if (data.clone) {
          eventData.clone = true;
          eventData.clonedFromId = data.originalNode.id;
        }

        this.events.broadcast('d3ListGraphNodeLeave', eventData);
      }
    }, {
      key: 'lockHandler',
      value: function lockHandler(el) {
        var events = this.toggleLock(el);

        if (events.locked && events.unlocked) {
          if (events.locked) {
            this.events.broadcast('d3ListGraphNodeLockChange', {
              lock: {
                id: events.locked.id,
                clone: events.locked.clone,
                clonedFromId: events.locked.clone ? events.locked.originalNode.id : undefined
              },
              unlock: {
                id: events.unlocked.id,
                clone: events.unlocked.clone,
                clonedFromId: events.unlocked.clone ? events.unlocked.originalNode.id : undefined
              }
            });
          }
        } else {
          if (events.locked) {
            this.events.broadcast('d3ListGraphNodeLock', {
              id: events.locked.id,
              clone: events.locked.clone,
              clonedFromId: events.locked.clone ? events.locked.originalNode.id : undefined
            });
          }

          if (events.unlocked) {
            this.events.broadcast('d3ListGraphNodeUnlock', {
              id: events.unlocked.id,
              clone: events.unlocked.clone,
              clonedFromId: events.unlocked.clone ? events.unlocked.originalNode.id : undefined
            });
          }
        }
      }
    }, {
      key: 'rootHandler',
      value: function rootHandler(el) {
        var events = this.toggleRoot(el);

        if (events.rooted && events.unrooted) {
          this.events.broadcast('d3ListGraphNodeReroot', {
            rooted: {
              id: events.rooted.id,
              clone: events.rooted.clone,
              clonedFromId: events.rooted.clone ? events.rooted.originalNode.id : undefined
            },
            unrooted: {
              id: events.unrooted.id,
              clone: events.unrooted.clone,
              clonedFromId: events.unrooted.clone ? events.unrooted.originalNode.id : undefined
            }
          });
        } else {
          if (events.rooted) {
            this.events.broadcast('d3ListGraphNodeRoot', {
              id: events.rooted.id,
              clone: events.rooted.clone,
              clonedFromId: events.rooted.clone ? events.rooted.originalNode.id : undefined
            });
          }

          if (events.unrooted) {
            this.events.broadcast('d3ListGraphNodeUnroot', {
              id: events.unrooted.id,
              clone: events.unrooted.clone,
              clonedFromId: events.unrooted.clone ? events.unrooted.originalNode.id : undefined
            });
          }
        }

        this.events.broadcast('d3ListGraphUpdateBarsRequest', {
          id: events.rooted.id,
          clone: events.rooted.clone,
          clonedFromId: events.rooted.clone ? events.rooted.originalNode.id : undefined
        });
      }
    }, {
      key: 'focusNodes',
      value: function focusNodes(event) {
        this.eventHelper(event.nodeIds, this.highlightNodes, ['focus', 'directParentsOnly', !!event.excludeClones ? true : false]);
        if (event.zoomOut) {
          this.vis.globalView(this.nodes.filter(function (data) {
            return data.hovering > 0;
          }));
        } else {
          this.vis.zoomedView();
        }
      }
    }, {
      key: 'blurNodes',
      value: function blurNodes(event) {
        this.eventHelper(event.nodeIds, this.unhighlightNodes, ['focus', 'directParentsOnly', !!event.excludeClones ? true : false]);
        if (event.zoomIn) {
          this.vis.zoomedView();
        }
      }
    }, {
      key: 'eventHelper',
      value: function eventHelper(nodeIds, callback, optionalParams, subSelectionClass) {
        var that = this;

        this.nodes
        // Filter by node ID
        .filter(function (data) {
          return !! ~nodeIds.indexOf(data.id);
        }).each(function triggerCallback(data) {
          var el = this;

          if (subSelectionClass) {
            el = d3.select(this).select(subSelectionClass).node();
          }

          callback.apply(that, [el, data].concat(optionalParams ? optionalParams : []));
        });
      }
    }, {
      key: 'toggleLock',
      value: function toggleLock(el, nodeData, setFalse) {
        var d3El = d3.select(el);
        var data = d3El.datum();
        var events = { locked: false, unlocked: false };

        if (this.lockedNode) {
          if (this.lockedNode.datum().id === data.id) {
            this.lockedNode.classed({ active: false, inactive: true });
            this.unlockNode(this.lockedNode.datum().id);
            events.unlocked = this.lockedNode.datum();
            this.lockedNode = undefined;
          } else {
            // Reset previously locked node;
            this.lockedNode.classed({ active: false, inactive: true });
            this.unlockNode(this.lockedNode.datum().id);
            events.unlocked = this.lockedNode.datum();

            if (!setFalse) {
              d3El.classed({ active: true, inactive: false });
              this.lockNode(data.id);
              events.locked = data;
              this.lockedNode = d3El;
            }
          }
        } else {
          if (!setFalse) {
            d3El.classed({ active: true, inactive: false });
            this.lockNode(data.id);
            events.locked = data;
            this.lockedNode = d3El;
          }
        }

        return events;
      }
    }, {
      key: 'lockNode',
      value: function lockNode(id) {
        var that = this;
        var els = this.nodes.filter(function (data) {
          return data.id === id;
        });

        els.each(function triggerHighlighter(data) {
          that.highlightNodes(this, data, 'lock', undefined);
        });

        els.selectAll('.bg-border').transition().duration(TRANSITION_SEMI_FAST).attr('width', function width() {
          return parseInt(d3.select(this).attr('width'), 10) + that.visData.global.row.height / 2;
        });
      }
    }, {
      key: 'unlockNode',
      value: function unlockNode(id) {
        var that = this;
        var els = this.nodes.filter(function (data) {
          return data.id === id;
        });
        var start = function animationStart() {
          d3.select(this.parentNode).classed('animating', true);
        };
        var end = function animationEnd() {
          d3.select(this.parentNode).classed('animating', false);
        };

        els.selectAll('.bg-border').transition().duration(TRANSITION_SEMI_FAST).attr('width', this.visData.global.column.contentWidth).each('start', start).each('end', end);

        els.each(function (data) {
          that.unhighlightNodes(this, data, 'lock', undefined);
        });
      }
    }, {
      key: 'queryNode',
      value: function queryNode(el, data, mode) {
        data.data.queryMode = mode;
        d3.select(el).classed({
          active: true,
          inactive: false,
          'query-and': mode === 'and' ? true : false,
          'query-or': mode === 'or' ? true : false,
          'query-not': mode === 'not' ? true : false
        });
      }
    }, {
      key: 'unqueryNode',
      value: function unqueryNode(el, data) {
        data.data.queryMode = undefined;
        data.data.queryBeforeRooting = undefined;
        d3.select(el).classed({
          active: false,
          inactive: true,
          'query-and': false,
          'query-or': false,
          'query-not': false
        });
        if (this.rootedNode) {
          this.updateVisibility();
        }
      }
    }, {
      key: 'toggleQueryMode',
      value: function toggleQueryMode(el, data) {
        var previousMode = data.data.queryMode;

        if (data.rooted) {
          if (previousMode !== 'or') {
            this.queryNode(el, data, 'or');
          } else {
            this.queryNode(el, data, 'and');
          }
        } else {
          switch (previousMode) {
            case 'or':
              this.queryNode(el, data, 'and');
              break;
            case 'and':
              this.queryNode(el, data, 'not');
              break;
            case 'not':
              this.unqueryNode(el, data);
              break;
            default:
              this.queryNode(el, data, 'or');
              break;
          }
        }

        if (data.data.queryMode) {
          if (data.data.queryMode !== previousMode) {
            this.events.broadcast('d3ListGraphNodeQuery', {
              id: data.id,
              clone: data.clone,
              clonedFromId: data.clone ? data.originalNode.id : undefined,
              mode: data.data.queryMode
            });
          }
        } else {
          this.events.broadcast('d3ListGraphNodeUnquery', {
            id: data.id,
            clone: data.clone,
            clonedFromId: data.clone ? data.originalNode.id : undefined
          });
        }
      }
    }, {
      key: 'progToggleQueryMode',
      value: function progToggleQueryMode(el, data) {
        this.toggleQueryMode(d3.select(el).selectAll('.focus-controls.query')[0].node(), data);
      }
    }, {
      key: 'toggleRoot',
      value: function toggleRoot(el, setFalse) {
        var d3El = d3.select(el);
        var data = d3El.datum();
        var events = { rooted: false, unrooted: false };

        // Blur current levels
        this.vis.levels.blur();

        if (this.rootedNode) {
          // Reset current root node
          this.rootedNode.classed({ active: false, inactive: true });
          this.unrootNode(this.rootedNode.node(), this.rootedNode.datum());
          events.unrooted = this.rootedNode.datum();

          // Activate new root
          if (this.rootedNode.datum().id !== data.id && !setFalse) {
            d3El.classed({ active: true, inactive: false });
            this.rootNode(el, data);
            this.rootedNode = d3El;
            events.rooted = data;
          } else {
            this.rootedNode = undefined;
            // Highlight first level
            this.vis.levels.focus(this.vis.activeLevel - this.vis.noRootActiveLevelDiff);
          }
        } else {
          if (!setFalse) {
            d3El.classed({ active: true, inactive: false });
            this.rootNode(el, data);
            events.rooted = data;
            this.rootedNode = d3El;
          }
        }

        return events;
      }
    }, {
      key: 'rootNode',
      value: function rootNode(el, data) {
        var d3El = d3.select(el.parentNode);

        data.rooted = true;
        d3El.classed('rooted', true);
        this.hideNodes(d3El.node(), data, 'downStream');

        d3El.selectAll('.bg-extension').style('transform', 'translateX(' + -(this.iconDimension * 2 + 10) + 'px)');

        // Highlight level
        this.vis.levels.focus(data.depth + this.vis.activeLevel);

        if (!data.data.queryMode || data.data.queryMode === 'not') {
          this.toggleQueryMode(d3El.node(), data);
          data.data.queryBeforeRooting = false;
        } else {
          data.data.queryBeforeRooting = true;
        }
      }
    }, {
      key: 'unrootNode',
      value: function unrootNode(el, data) {
        var d3El = d3.select(el.parentNode);

        var x = 0;

        if (data.data.queryMode) {
          x = -this.iconDimension - 6;
        }

        d3El.selectAll('.bg-extension').style('transform', 'translateX(' + x + 'px)');

        data.rooted = false;
        d3El.classed('rooted', false);
        this.showNodes(d3El.node(), data, 'downStream');

        if (!data.data.queryBeforeRooting) {
          this.unqueryNode(d3El.node(), data);
        }
      }
    }, {
      key: 'setUpFocusControls',
      value: function setUpFocusControls(selection, location, position, mode, className) {
        // const height = (this.visData.global.row.contentHeight / 2 -
        //   this.visData.global.cell.padding * 2);

        var paddedDim = this.iconDimension + 4;

        var x = location === 'left' ? -paddedDim * (position ? position : 1) : this.visData.global.column.contentWidth + 2;
        var y = this.visData.global.row.padding + (this.visData.global.row.contentHeight - 2 * this.visData.global.cell.padding) / 4;

        if (mode === 'bg') {
          selection.attr({
            class: className,
            cx: x + this.iconDimension / 2,
            cy: y + this.iconDimension / 2,
            r: this.iconDimension * 3 / 4
          });
        } else if (mode === 'hover-helper') {
          selection.attr({
            class: className,
            x: x - 2,
            y: y - 2,
            width: this.iconDimension + 4,
            height: this.iconDimension + 4
          });
        } else {
          selection.attr({
            class: className,
            x: x,
            y: y,
            width: this.iconDimension,
            height: this.iconDimension
          });
        }
      }

      /**
       * Helper method to hide nodes.
       *
       * @method  hideNodes
       * @author  Fritz Lekschas
       * @date    2016-02-21
       * @param   {Object}  el         DOM element.
       * @param   {Object}  data       D3 data object of `el`.
       * @param   {String}  direction  Defines whether upstream or downstream nodes
       *   should be hidden.
       */

    }, {
      key: 'hideNodes',
      value: function hideNodes(el, data, direction) {
        this.nodesVisibility(el, data, direction);
      }

      /**
       * Helper method to show nodes.
       *
       * @method  showNodes
       * @author  Fritz Lekschas
       * @date    2016-02-21
       * @param   {Object}  el         DOM element.
       * @param   {Object}  data       D3 data object of `el`.
       * @param   {String}  direction  Defines whether upstream or downstream nodes
       *   should be shown.
       */

    }, {
      key: 'showNodes',
      value: function showNodes(el, data, direction) {
        this.nodesVisibility(el, data, direction, true);
      }

      /**
       * Sets the nodes' visibility
       *
       * @method  nodesVisibility
       * @author  Fritz Lekschas
       * @date    2016-02-21
       * @param   {Object}   el         DOM element.
       * @param   {Object}   data       D3 data object of `el`.
       * @param   {String}   direction  Defines whether upstream or downstream nodes
       * @param   {Boolean}  show       If `true` nodes will be shown.
       */

    }, {
      key: 'nodesVisibility',
      value: function nodesVisibility(el, data, direction, show) {
        if (show) {
          this.nodes.classed('hidden', false).each(function (nodeData) {
            return nodeData.hidden = false;
          });
        } else {
          // First we set all nodes to `hidden`.
          this.nodes.each(function (nodeData) {
            return nodeData.hidden = true;
          });

          // Then we set direct child and parent nodes of the current node visible.
          upAndDown(data, function (nodeData) {
            return nodeData.hidden = false;
          });

          // We also show sibling nodes.
          siblings(data, function (nodeData) {
            return nodeData.hidden = false;
          });

          this.nodes.classed('hidden', function (nodeData) {
            return nodeData.hidden && !nodeData.data.queryMode;
          });
        }
        this.updateVisibility();
      }
    }, {
      key: 'highlightNodes',
      value: function highlightNodes(el, data, className, restriction, excludeClones) {
        var _this2 = this;

        var that = this;
        var nodeId = data.id;
        var currentNodeData = data.clone ? data.originalNode : data;
        var includeParents = true;
        var appliedClassName = className ? className : 'hovering';
        var includeClones = excludeClones ? false : true;
        var includeChildren = restriction === 'directParentsOnly' ? false : true;

        // Store link IDs
        if (!this.currentLinks[appliedClassName]) {
          this.currentLinks[appliedClassName] = {};
        }
        this.currentLinks[appliedClassName][nodeId] = [];

        var currentlyActiveBar = d3.select(el).selectAll('.bar.active .bar-magnitude');
        if (!currentlyActiveBar.empty()) {
          currentlyActiveBar = currentlyActiveBar.datum();
        } else {
          currentlyActiveBar = undefined;
        }

        var traverseCallbackUp = function traverseCallbackUp(nodeData, childData) {
          nodeData.hovering = 2;
          for (var i = nodeData.links.length; i--;) {
            // Only push direct parent child connections. E.g.
            // Store: (parent)->(child)
            // Ignore: (parent)->(siblings of child)
            if (nodeData.links[i].target.node.id === childData.id) {
              _this2.currentLinks[appliedClassName][nodeId].push(nodeData.links[i].id);
            }
          }
        };

        var traverseCallbackDown = function traverseCallbackDown(nodeData) {
          nodeData.hovering = 2;
          for (var i = nodeData.links.length; i--;) {
            _this2.currentLinks[appliedClassName][nodeId].push(nodeData.links[i].id);
          }
        };

        if (includeParents && includeChildren) {
          upAndDown(data, traverseCallbackUp, traverseCallbackDown, undefined, includeClones);
        }
        if (includeParents && !includeChildren) {
          up(data, traverseCallbackUp, undefined, includeClones);
        }
        if (!includeParents && includeChildren) {
          down(data, traverseCallbackUp, undefined, includeClones);
        }

        currentNodeData.hovering = 1;

        if (includeClones) {
          for (var i = currentNodeData.clones.length; i--;) {
            currentNodeData.clones[i].hovering = 1;
          }
        }

        this.nodes.each(function (nodeData) {
          if (!nodeData.hidden && !that.vis.isHidden.call(that.vis, this)) {
            if (nodeData.hovering > 0) {
              var node = d3.select(this);

              if (nodeData.hovering === 1) {
                node.classed(appliedClassName + '-directly', true);
                if (currentlyActiveBar) {
                  that.bars.updateIndicator(node.selectAll('.bar.' + currentlyActiveBar.id + ' .bar-indicator'), currentlyActiveBar.value, true);
                }
              } else if (nodeData.hovering === 2) {
                node.classed(appliedClassName + '-indirectly', true);
                if (currentlyActiveBar) {
                  that.bars.updateIndicator(node.selectAll('.bar.' + currentlyActiveBar.id + ' .bar-indicator'), currentlyActiveBar.value);
                }
              }
            }
          }
        });

        this.links.highlight(arrayToFakeObjs(this.currentLinks[appliedClassName][data.id]), true, appliedClassName);
      }
    }, {
      key: 'unhighlightNodes',
      value: function unhighlightNodes(el, data, className, restriction, excludeClones) {
        var traverseCallback = function traverseCallback(nodeData) {
          return nodeData.hovering = 0;
        };
        var includeParents = true;
        var appliedClassName = className ? className : 'hovering';
        var includeClones = excludeClones ? false : true;
        var includeChildren = restriction === 'directParentsOnly' ? false : true;

        data.hovering = 0;
        if (includeParents && includeChildren) {
          upAndDown(data, traverseCallback, undefined, undefined, includeClones);
        }
        if (includeParents && !includeChildren) {
          up(data, traverseCallback, undefined, includeClones);
        }
        if (!includeParents && includeChildren) {
          down(data, traverseCallback, undefined, includeClones);
        }

        if (data.clone) {
          data.originalNode.hovering = 0;
        } else {
          if (includeClones) {
            for (var i = data.clones.length; i--;) {
              data.clones[i].hovering = 0;
            }
          }
        }

        this.nodes.classed(appliedClassName + '-directly', false);
        this.nodes.classed(appliedClassName + '-indirectly', false);

        if (this.currentLinks[appliedClassName][data.id]) {
          this.links.highlight(arrayToFakeObjs(this.currentLinks[appliedClassName][data.id]), false, appliedClassName);
        }
      }
    }, {
      key: 'sort',
      value: function sort(update, newSortType) {
        var _this3 = this;

        for (var i = update.length; i--;) {
          var selection = this.nodes.data(update[i].rows, function (data) {
            return data.id;
          });

          this.vis.svgD3.classed('sorting', true);
          selection.transition().duration(TRANSITION_SEMI_FAST).attr('transform', function (data) {
            return 'translate(' + (data.x + _this3.visData.global.column.padding) + ', ' + data.y + ')';
          }).call(allTransitionsEnded, function () {
            _this3.vis.svgD3.classed('sorting', false);
            _this3.vis.updateLevelsVisibility();
            _this3.vis.updateScrolling();
          });

          if (newSortType && this.vis.currentSorting.local[update[i].level].type !== 'name') {
            this.bars.update(selection.selectAll('.bar'), update[i].sortBy);
          }
        }
      }

      /**
       * Updates the nodes' visibility visually.
       *
       * @method  updateVisibility
       * @author  Fritz Lekschas
       * @date    2016-02-21
       */

    }, {
      key: 'updateVisibility',
      value: function updateVisibility() {
        var _this4 = this;

        // Calls the D3 list graph layout method to update the nodes position.
        this.vis.layout.updateNodesVisibility();

        // Transition to the updated position
        this.nodes.transition().duration(TRANSITION_SEMI_FAST).attr('transform', function (data) {
          return 'translate(' + (data.x + _this4.visData.global.column.padding) + ', ' + data.y + ')';
        }).call(allTransitionsEnded, function () {
          _this4.vis.updateLevelsVisibility();
          _this4.vis.updateScrolling();
        });

        this.vis.links.updateVisibility();
      }
    }, {
      key: 'barMode',
      get: function get() {
        return this.bars.mode;
      }
    }]);
    return Nodes;
  })();

  var LINKS_CLASS = 'links';
  var LINK_CLASS = 'link';

  var Links = (function () {
    function Links(levels, visData, layout) {
      var _this = this;

      babelHelpers.classCallCheck(this, Links);

      this.visData = visData;
      this.layout = layout;

      this.groups = levels.append('g').attr('class', LINKS_CLASS).call(function (selection) {
        selection.each(function () {
          d3.select(this.parentNode).datum().links = this;
        });
      });

      this.links = this.groups.selectAll(LINK_CLASS + '-bg').data(function (data, index) {
        return _this.layout.links(index);
      }).enter().append('g').attr('class', LINK_CLASS);

      this.links.append('path').attr({
        class: LINK_CLASS + '-bg',
        d: this.diagonal
      });

      this.links.append('path').attr({
        class: LINK_CLASS + '-direct',
        d: this.diagonal
      });
    }

    babelHelpers.createClass(Links, [{
      key: 'highlight',
      value: function highlight(nodeIds, _highlight, className) {
        this.links.data(nodeIds, function (data) {
          return data.id;
        }).classed(className ? className : 'hovering', _highlight === false ? false : true);
      }
    }, {
      key: 'scroll',
      value: function scroll(selection, data) {
        // Update data of `g`.
        selection.data(data);

        // Next update all paths according to the new data.
        selection.selectAll('path').attr('d', this.diagonal);
      }
    }, {
      key: 'sort',
      value: function sort(update) {
        var start = function start() {
          d3.select(this).classed('sorting', true);
        };
        var end = function end() {
          d3.select(this).classed('sorting', false);
        };

        // Update data of `g`.
        this.links.data(update, function (data) {
          return data.id;
        });

        // Next update all paths according to the new data.
        this.links.selectAll('path').transition().duration(TRANSITION_SEMI_FAST).attr('d', this.diagonal).each('start', start).each('end', end);
      }
    }, {
      key: 'updateVisibility',
      value: function updateVisibility() {
        this.links.selectAll('path').classed('hidden', function (data) {
          return data.target.node.hidden || data.source.node.hidden;
        }).transition().duration(TRANSITION_SEMI_FAST).attr('d', this.diagonal);
      }
    }, {
      key: 'diagonal',
      get: function get() {
        var _this2 = this;

        return d3.svg.diagonal().source(function (data) {
          return {
            x: data.source.node.y + data.source.offsetY + _this2.visData.global.row.height / 2,
            y: data.source.node.x + data.source.offsetX + _this2.visData.global.column.contentWidth + _this2.visData.global.column.padding
          };
        }).target(function (data) {
          return {
            x: data.target.node.y + data.target.offsetY + _this2.visData.global.row.height / 2,
            y: data.target.node.x + data.target.offsetX + _this2.visData.global.column.padding
          };
        }).projection(function (data) {
          return [data.y, data.x];
        });
      }
    }]);
    return Links;
  })();

  var COLUMN_CLASS = 'column';
  var SCROLL_CONTAINER_CLASS = 'scroll-container';

  var Levels = (function () {
    function Levels(selection, vis, visData) {
      var _this = this;

      babelHelpers.classCallCheck(this, Levels);

      this.vis = vis;
      this.visData = visData;
      this.groups = selection.selectAll('g').data(this.visData.nodes).enter().append('g').attr('class', COLUMN_CLASS).classed('active', function (data, index) {
        if (_this.vis.highlightActiveLevel) {
          if (!_this.vis.nodes || !_this.vis.nodes.rootedNode) {
            return index === _this.vis.activeLevel - _this.vis.noRootActiveLevelDiff;
          }
          return index === _this.vis.activeLevel;
        }
      });

      // We need to add an empty rectangle that fills up the whole column to ensure
      // that the `g`'s size is at a maximum, otherwise scrolling will be halted
      // when the cursor leaves an actually drawn element.
      this.groups.append('rect').attr('class', SCROLL_CONTAINER_CLASS).attr('x', function (data) {
        return data.x;
      }).attr('y', function (data) {
        return data.y;
      }).attr('width', this.visData.global.column.width + 1).attr('height', this.visData.global.column.height);
    }

    babelHelpers.createClass(Levels, [{
      key: 'scrollPreparation',
      value: function scrollPreparation(vis, scrollbarWidth) {
        var _this2 = this;

        this.groups.each(function (data, index) {
          var contentHeight = data.nodes.getBoundingClientRect().height + 2 * _this2.visData.global.row.padding;
          var scrollHeight = contentHeight - _this2.visData.global.column.height;
          var scrollbarHeight = scrollHeight > 0 ? Math.max(_this2.visData.global.column.height * _this2.visData.global.column.height / contentHeight, 10) : 0;

          data.height = contentHeight;
          data.linkSelections = {
            incoming: index > 0 ? vis.selectByLevel(index - 1, '.link') : null,
            outgoing: vis.selectByLevel(index, '.link')
          };
          data.scrollHeight = scrollHeight;
          data.scrollTop = 0;
          data.scrollbar = {
            el: undefined,
            x: data.x + _this2.visData.global.column.width - scrollbarWidth,
            y: 0,
            width: scrollbarWidth,
            height: scrollbarHeight,
            scrollHeight: _this2.visData.global.column.height - scrollbarHeight,
            scrollTop: 0,
            heightScale: d3.scale.linear().domain([0, scrollHeight]).range([0, _this2.visData.global.column.height - scrollbarHeight])
          };
          data.invertedHeightScale = data.scrollbar.heightScale.invert;
        });
      }
    }, {
      key: 'updateScrollProperties',
      value: function updateScrollProperties() {
        var _this3 = this;

        this.groups.each(function (data) {
          var contentHeight = data.nodes.getBoundingClientRect().height + 2 * _this3.visData.global.row.padding;
          var scrollHeight = contentHeight - _this3.visData.global.column.height;
          var scrollbarHeight = scrollHeight > 0 ? Math.max(_this3.visData.global.column.height * _this3.visData.global.column.height / contentHeight, 10) : 0;

          data.height = contentHeight;
          data.scrollHeight = scrollHeight;
          data.scrollTop = 0;
          data.scrollbar.y = 0;
          data.scrollbar.height = scrollbarHeight;
          data.scrollbar.scrollHeight = _this3.visData.global.column.height - scrollbarHeight;
          data.scrollbar.scrollTop = 0;
          data.scrollbar.heightScale = d3.scale.linear().domain([0, scrollHeight]).range([0, _this3.visData.global.column.height - scrollbarHeight]);
        });
      }
    }, {
      key: 'updateVisibility',
      value: function updateVisibility() {
        this.groups.each(function () {
          var group = d3.select(this);

          group.classed('hidden', group.selectAll('.node').filter(function (data) {
            return !data.hidden;
          }).empty());
        });
      }
    }, {
      key: 'focus',
      value: function focus(level) {
        if (this.vis.highlightActiveLevel) {
          this.groups.filter(function (data) {
            return data.level === level;
          }).classed('active', true);
        }
      }
    }, {
      key: 'blur',
      value: function blur(level) {
        if (this.vis.highlightActiveLevel) {
          if (level) {
            this.groups.filter(function (data) {
              return data.level === level;
            }).classed('active', false);
          } else {
            this.groups.classed('active', false);
          }
        }
      }
    }, {
      key: 'height',
      get: function get() {
        return this.visData.global.column.height;
      }
    }]);
    return Levels;
  })();

  var TOPBAR_EL = 'div';
  var TOPBAR_CLASS = 'top-bar';

  var TOPBAR_CONTROL_EL = 'ul';
  var TOPBAR_CONTROL_CLASS = 'controls';
  var TOPBAR_GLOBAL_CONTROL_CLASS = 'global-controls';

  var Topbar = (function () {
    function Topbar(vis, selection, visData) {
      var _this = this;

      babelHelpers.classCallCheck(this, Topbar);

      var that = this;

      this.vis = vis;
      this.visData = visData;
      // Add base topbar element
      this.el = selection.select('.' + TOPBAR_CLASS);

      if (this.el.empty()) {
        this.el = selection.insert(TOPBAR_EL, ':first-child').attr('class', TOPBAR_CLASS);
      }

      this.controlSwitch = this.el.append('div').attr('title', 'Toggle global / local topbar').style('width', this.visData.global.column.padding + 'px').classed('control-switch', true).on('click', this.switch.bind(this));

      this.switchArrow = this.controlSwitch.append('svg').append('use').attr('xlink:href', this.vis.iconPath + '#arrow-down').attr('class', 'switch-arrow');

      this.globalControls = this.el.append(TOPBAR_CONTROL_EL).classed(TOPBAR_GLOBAL_CONTROL_CLASS, true);

      // Add button for sorting by precision
      this.globalPrecision = this.globalControls.append('li').attr('class', 'control-btn sort-precision').classed('active', function () {
        if (that.vis.currentSorting.global.type === 'precision') {
          // Save currently active element. Needed when when re-sorting for the
          // first time, to be able to de-highlight this element.
          that.vis.currentSorting.global.el = d3.select(this);
          return true;
        }
      }).on('click', function () {
        that.sortAllColumns(this, 'precision');
      }).on('mouseenter', function () {
        _this.vis.interactionWrapper.call(_this.vis, (function () {
          this.highlightBars(undefined, 'precision');
        }).bind(_this), []);
      }).on('mouseleave', function () {
        _this.vis.interactionWrapper.call(_this.vis, (function () {
          this.highlightBars(undefined, 'precision', true);
        }).bind(_this), []);
      });

      this.globalPrecisionWrapper = this.globalPrecision.append('div').attr('class', 'wrapper');

      this.globalPrecisionWrapper.append('span').attr('class', 'label').text('Precision');

      this.globalPrecisionWrapper.append('svg').attr('class', 'icon-unsort invisible-default').classed('visible', this.vis.currentSorting.global.type !== 'precision').append('use').attr('xlink:href', this.vis.iconPath + '#unsort');

      this.globalPrecisionWrapper.append('svg').attr('class', 'icon-sort-asc invisible-default').classed('visible', this.vis.currentSorting.global.type === 'precision' && this.vis.currentSorting.global.order === 1).append('use').attr('xlink:href', this.vis.iconPath + '#sort-asc');

      this.globalPrecisionWrapper.append('svg').attr('class', 'icon-sort-desc invisible-default').classed('visible', this.vis.currentSorting.global.type === 'precision' && this.vis.currentSorting.global.order !== 1).append('use').attr('xlink:href', this.vis.iconPath + '#sort-desc');

      // Add button for sorting by recall
      this.globalRecall = this.globalControls.append('li').attr('class', 'control-btn sort-recall').classed('active', function () {
        if (that.vis.currentSorting.global.type === 'recall') {
          // See precision
          that.vis.currentSorting.global.el = d3.select(this);
          return true;
        }
      }).on('click', function () {
        that.sortAllColumns(this, 'recall');
      }).on('mouseenter', function () {
        _this.vis.interactionWrapper.call(_this.vis, (function () {
          this.highlightBars(undefined, 'recall');
        }).bind(_this), []);
      }).on('mouseleave', function () {
        _this.vis.interactionWrapper.call(_this.vis, (function () {
          this.highlightBars(undefined, 'recall', true);
        }).bind(_this), []);
      });

      this.globalRecallWrapper = this.globalRecall.append('div').attr('class', 'wrapper');

      this.globalRecallWrapper.append('span').attr('class', 'label').text('Recall');

      this.globalRecallWrapper.append('svg').attr('class', 'icon-unsort invisible-default').classed('visible', this.vis.currentSorting.global.type !== 'recall').append('use').attr('xlink:href', this.vis.iconPath + '#unsort');

      this.globalRecallWrapper.append('svg').attr('class', 'icon-sort-asc invisible-default').classed('visible', this.vis.currentSorting.global.type === 'recall' && this.vis.currentSorting.global.order === 1).append('use').attr('xlink:href', this.vis.iconPath + '#sort-asc');

      this.globalRecallWrapper.append('svg').attr('class', 'icon-sort-desc invisible-default').classed('visible', this.vis.currentSorting.global.type === 'recall' && this.vis.currentSorting.global.order !== 1).append('use').attr('xlink:href', this.vis.iconPath + '#sort-desc');

      // Add button for sorting by name
      this.globalName = this.globalControls.append('li').attr('class', 'control-btn sort-name').classed('active', function () {
        if (that.vis.currentSorting.global.type === 'name') {
          // See precision
          that.vis.currentSorting.global.el = d3.select(this);
          return true;
        }
      }).on('click', function () {
        that.sortAllColumns(this, 'name');
      }).on('mouseenter', function () {
        _this.vis.interactionWrapper.call(_this.vis, (function () {
          this.highlightLabels();
        }).bind(_this), []);
      }).on('mouseleave', function () {
        _this.vis.interactionWrapper.call(_this.vis, (function () {
          this.highlightLabels(true);
        }).bind(_this), []);
      });

      this.globalNameWrapper = this.globalName.append('div').attr('class', 'wrapper');

      this.globalNameWrapper.append('span').attr('class', 'label').text('Name');

      this.globalNameWrapper.append('svg').attr('class', 'icon-unsort invisible-default').classed('visible', this.vis.currentSorting.global.type !== 'name').append('use').attr('xlink:href', this.vis.iconPath + '#unsort');

      this.globalNameWrapper.append('svg').attr('class', 'icon-sort-asc invisible-default').classed('visible', this.vis.currentSorting.global.type === 'name' && this.vis.currentSorting.global.order === 1).append('use').attr('xlink:href', this.vis.iconPath + '#sort-alpha-asc');

      this.globalNameWrapper.append('svg').attr('class', 'icon-sort-desc invisible-default').classed('visible', this.vis.currentSorting.global.type === 'name' && this.vis.currentSorting.global.order !== 1).append('use').attr('xlink:href', this.vis.iconPath + '#sort-alpha-desc');

      // Add button for switching to 'one bar'
      this.globalOneBar = this.globalControls.append('li').attr('class', 'control-btn one-bar').classed('active', this.vis.barMode === 'one').on('click', function () {
        that.switchBarMode(this, 'one');
      });

      this.globalOneBarWrapper = this.globalOneBar.append('div').attr('class', 'wrapper').text('One bar');

      this.globalOneBarWrapper.append('svg').attr('class', 'icon-one-bar').append('use').attr('xlink:href', this.vis.iconPath + '#one-bar');

      // Add button for switching to 'two bars'
      this.globalTwoBars = this.globalControls.append('li').attr('class', 'control-btn two-bars').classed('active', this.vis.barMode === 'two').on('click', function () {
        that.switchBarMode(this, 'two');
      });

      this.globalTwoBarsWrapper = this.globalTwoBars.append('div').attr('class', 'wrapper').text('Two bars');

      this.globalTwoBarsWrapper.append('svg').attr('class', 'icon-two-bars').append('use').attr('xlink:href', this.vis.iconPath + '#two-bars');

      // Add button for zoom-out
      this.globalZoomOut = this.globalControls.append('li').attr('class', 'control-btn zoom-out').classed('active', this.vis.zoomedOut).on('mouseenter', function () {
        _this.vis.interactionWrapper.call(_this.vis, (function () {
          this.vis.globalView.call(this.vis);
        }).bind(_this), []);
      }).on('mouseleave', function () {
        _this.vis.interactionWrapper.call(_this.vis, (function () {
          this.vis.zoomedView.call(this.vis);
        }).bind(_this), []);
      }).on('click', function () {
        that.vis.toggleView.call(that.vis);
        d3.select(this).classed('active', that.vis.zoomedOut);
      });

      this.globalZoomOutWrapper = this.globalZoomOut.append('div').attr('class', 'wrapper').text('Zoom Out').style('margin-right', this.visData.global.column.padding + 'px');

      this.globalZoomOutWrapper.append('svg').attr('class', 'icon-zoom-out').append('use').attr('xlink:href', this.vis.iconPath + '#zoom-out');

      this.localControlWrapper = this.el.append('div').classed('local-controls', true);

      this.localControls = this.localControlWrapper.selectAll(TOPBAR_CONTROL_CLASS).data(visData.nodes).enter().append(TOPBAR_CONTROL_EL).classed(TOPBAR_CONTROL_CLASS, true).style('width', this.visData.global.column.width + 'px');

      this.localControls.each(function (data, index) {
        var control = d3.select(this);

        /*
         * Order:
         * 0 = unsorted
         * 1 = asc
         * -1 = desc
         */
        that.vis.currentSorting.local[index] = {
          type: data.sortBy,
          order: data.sortOrder,
          el: undefined
        };

        control.append('li').attr('class', 'control-btn toggle').style('width', that.visData.global.column.padding + 'px').on('click', that.toggleColumn);

        control.append('li').attr('class', 'control-btn sort-precision ease-all').classed('active', function () {
          if (that.vis.currentSorting.local[index].type === 'precision') {
            // See precision
            that.vis.currentSorting.local[index].el = d3.select(this);
            return true;
          }
        }).style({
          width: that.visData.global.column.contentWidth / 2 + 'px',
          left: that.visData.global.column.padding + 'px'
        }).on('click', function (controlData) {
          that.sortColumn(this, controlData.level, 'precision');
        }).on('mouseenter', function () {
          that.highlightBars(this.parentNode, 'precision');
          d3.select(this).style('width', that.visData.global.column.contentWidth - 16 + 'px');
        }).on('mouseleave', function () {
          that.highlightBars(this.parentNode, 'precision', true);
          d3.select(this).style('width', that.visData.global.column.contentWidth / 2 + 'px');
        }).html('<div class="expandable-label">' + '  <span class="letter abbr">P</span>' + '  <span class="letter abbr">r</span>' + '  <span class="letter">e</span>' + '  <span class="letter abbr">c</span>' + '  <span class="letter">i</span>' + '  <span class="letter">s</span>' + '  <span class="letter">i</span>' + '  <span class="letter">o</span>' + '  <span class="letter">n</span>' + '</div>' + '<svg class="icon-unsort invisible-default ' + (that.vis.currentSorting.local[index].type !== 'precision' ? 'visible' : '') + '">' + // eslint-disable-line
        '  <use xlink:href="' + that.vis.iconPath + '#unsort"></use>' + '</svg>' + '<svg class="icon-sort-asc invisible-default ' + (that.vis.currentSorting.local[index].type === 'precision' && that.vis.currentSorting.local[index].order === 1 ? 'visible' : '') + '">' + // eslint-disable-line
        '  <use xlink:href="' + that.vis.iconPath + '#sort-asc"></use>' + '</svg>' + '<svg class="icon-sort-desc invisible-default ' + (that.vis.currentSorting.local[index].type === 'precision' && that.vis.currentSorting.local[index].order !== 1 ? 'visible' : '') + '">' + // eslint-disable-line
        '  <use xlink:href="' + that.vis.iconPath + '#sort-desc"></use>' + '</svg>');

        control.append('li').attr('class', 'control-btn sort-recall ease-all').classed('active', function () {
          if (that.vis.currentSorting.local[index].type === 'recall') {
            // See recall
            that.vis.currentSorting.local[index].el = d3.select(this);
            return true;
          }
        }).style({
          width: that.visData.global.column.contentWidth / 2 + 'px',
          left: that.visData.global.column.contentWidth / 2 + that.visData.global.column.padding + 'px'
        }).on('click', function (controlData) {
          that.sortColumn(this, controlData.level, 'recall');
        }).on('mouseenter', function () {
          that.highlightBars(this.parentNode, 'recall');
          d3.select(this).style({
            width: that.visData.global.column.contentWidth - 16 + 'px',
            left: that.visData.global.column.padding + 16 + 'px'
          });
        }).on('mouseleave', function () {
          that.highlightBars(this.parentNode, 'recall', true);
          d3.select(this).style({
            width: that.visData.global.column.contentWidth / 2 + 'px',
            left: that.visData.global.column.contentWidth / 2 + that.visData.global.column.padding + 'px'
          });
        }).html('<div class="expandable-label">' + '  <span class="letter abbr">R</span>' + '  <span class="letter">e</span>' + '  <span class="letter abbr">c</span>' + '  <span class="letter">a</span>' + '  <span class="letter abbr">l</span>' + '  <span class="letter">l</span>' + '</div>' + '<svg class="icon-unsort invisible-default ' + (that.vis.currentSorting.local[index].type !== 'recall' ? 'visible' : '') + '">' + // eslint-disable-line
        '  <use xlink:href="' + that.vis.iconPath + '#unsort"></use>' + '</svg>' + '<svg class="icon-sort-asc invisible-default ' + (that.vis.currentSorting.local[index].type === 'recall' && that.vis.currentSorting.local[index].order === 1 ? 'visible' : '') + '">' + // eslint-disable-line
        '  <use xlink:href="' + that.vis.iconPath + '#sort-asc"></use>' + '</svg>' + '<svg class="icon-sort-desc invisible-default ' + (that.vis.currentSorting.local[index].type === 'recall' && that.vis.currentSorting.local[index].order !== 1 ? 'visible' : '') + '">' + // eslint-disable-line
        '  <use xlink:href="' + that.vis.iconPath + '#sort-desc"></use>' + '</svg>');

        control.append('li').attr('class', 'control-btn options').style('width', that.visData.global.column.padding + 'px').on('click', that.toggleOptions).html('<svg class="icon-gear">' + '  <use xlink:href="' + that.vis.iconPath + '#gear"></use>' + '</svg>');

        if (that.vis.currentSorting.local[index].type) {
          that.vis.currentSorting.local[index].el = control.select('.sort-' + that.vis.currentSorting.local[index].type);
        }
      });
    }

    // toggleColumn () {
    //   console.log('Toggle column');
    // }

    babelHelpers.createClass(Topbar, [{
      key: 'selectNodesLevel',
      value: function selectNodesLevel(el) {
        return this.vis.selectByLevel(d3.select(el).datum().level, '.node');
      }
    }, {
      key: 'highlightLabels',
      value: function highlightLabels(deHighlight) {
        this.vis.baseElD3.selectAll('.node').classed('highlight-label', !deHighlight);
      }
    }, {
      key: 'highlightBars',
      value: function highlightBars(el, type, deHighlight) {
        var nodes = el ? this.selectNodesLevel(el) : this.vis.baseElD3.selectAll('.node');

        nodes.classed('highlight-bar', !deHighlight).selectAll('.bar.' + type).classed('highlight', !deHighlight);
      }
    }, {
      key: 'sortAllColumns',
      value: function sortAllColumns(el, type) {
        if (this.semiActiveSortingEls) {
          this.resetSemiActiveSortingEls();
        }

        if (this.vis.currentSorting.global.type !== type) {
          // Unset class of previous global sorting element
          if (this.vis.currentSorting.global.el) {
            this.resetSortEl(this.vis.currentSorting.global.el, type);
          }
        }

        this.vis.currentSorting.global.el = d3.select(el);
        this.vis.currentSorting.global.el.classed('active', true);
        this.vis.currentSorting.global.type = type;

        var columnKeys = Object.keys(this.vis.currentSorting.local);
        for (var i = 0, len = columnKeys.length; i < len; i++) {
          this.sortColumn(el, columnKeys[i], type, true);
        }

        this.vis.sortAllColumns(type, true);
      }
    }, {
      key: 'sortColumn',
      value: function sortColumn(el, index, type, global) {
        // Reset global sorting
        if (!global) {
          if (this.semiActiveSortingEls) {
            this.resetSemiActiveSortingEls();
          }
          if (this.vis.currentSorting.global.type) {
            this.resetSortEl(this.vis.currentSorting.global.el, type);
          }
          this.vis.currentSorting.global.type = undefined;
        }

        var newSortType = false;

        if (this.vis.currentSorting.local[index].el) {
          if (this.vis.currentSorting.local[index].type !== type) {
            this.resetSortEl(this.vis.currentSorting.local[index].el, type);
          }
        }

        if (this.vis.currentSorting.local[index].type !== type) {
          newSortType = true;
          // Reset sort order
          this.vis.currentSorting.local[index].order = 0;
        }

        this.vis.currentSorting.local[index].el = d3.select(el);
        this.vis.currentSorting.local[index].type = type;

        // -1 = desc, 1 = asc
        if (this.vis.currentSorting.local[index].order === -1) {
          this.vis.currentSorting.local[index].order = 1;
          this.vis.currentSorting.local[index].el.select('.icon-sort-desc').classed('visible', false);
          this.vis.currentSorting.local[index].el.select('.icon-sort-asc').classed('visible', true);
        } else {
          this.vis.currentSorting.local[index].order = -1;
          this.vis.currentSorting.local[index].el.select('.icon-sort-asc').classed('visible', false);
          this.vis.currentSorting.local[index].el.select('.icon-sort-desc').classed('visible', true);
        }

        this.vis.currentSorting.local[index].el.select('.icon-unsort').classed('visible', false);

        this.vis.currentSorting.local[index].el.classed('active', true);

        if (!global) {
          this.vis.sortColumn(index, type, this.vis.currentSorting.local[index].order, newSortType);
        }
      }
    }, {
      key: 'resetSortEl',
      value: function resetSortEl(el, newType) {
        el.classed('active', false);
        el.select('.icon-sort-desc').classed('visible', false);
        el.select('.icon-sort-asc').classed('visible', false);
        el.select('.icon-unsort').classed('visible', true);
        if (newType === 'name') {
          el.classed('semi-active', true);
          this.semiActiveSortingEls = true;
        }
      }
    }, {
      key: 'resetSemiActiveSortingEls',
      value: function resetSemiActiveSortingEls() {
        this.el.selectAll('.semi-active').classed('semi-active', false);
      }

      // toggleOptions () {
      //   console.log('Toggle options');
      // }

    }, {
      key: 'switch',
      value: function _switch() {
        this.el.classed('details', !this.el.classed('details'));
      }
    }, {
      key: 'switchBarMode',
      value: function switchBarMode(el, mode) {
        if (this.vis.nodes.barMode !== mode) {
          if (mode === 'one') {
            this.globalOneBar.classed('active', true);
            this.globalTwoBars.classed('active', false);
          } else {
            this.globalOneBar.classed('active', false);
            this.globalTwoBars.classed('active', true);
          }
          this.vis.switchBarMode(mode);
        }
      }
    }]);
    return Topbar;
  })();

  /**
   * Checks if `value` is object-like.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
   */
  function isObjectLike(value) {
    return !!value && typeof value == 'object';
  }

  /** Used to detect host constructors (Safari > 5). */
  var reIsHostCtor = /^\[object .+?Constructor\]$/;

  /** Used for native method references. */
  var objectProto$2 = Object.prototype;

  /** Used to resolve the decompiled source of functions. */
  var fnToString = Function.prototype.toString;

  /** Used to check objects for own properties. */
  var hasOwnProperty = objectProto$2.hasOwnProperty;

  /** Used to detect if a method is native. */
  var reIsNative = RegExp('^' +
    fnToString.call(hasOwnProperty).replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')
    .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
  );

  /**
   * Checks if `value` is a native function.
   *
   * @static
   * @memberOf _
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a native function, else `false`.
   * @example
   *
   * _.isNative(Array.prototype.push);
   * // => true
   *
   * _.isNative(_);
   * // => false
   */
  function isNative(value) {
    if (value == null) {
      return false;
    }
    if (isFunction(value)) {
      return reIsNative.test(fnToString.call(value));
    }
    return isObjectLike(value) && reIsHostCtor.test(value);
  }

  /**
   * Gets the native function at `key` of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @param {string} key The key of the method to get.
   * @returns {*} Returns the function if it's native, else `undefined`.
   */
  function getNative(object, key) {
    var value = object == null ? undefined : object[key];
    return isNative(value) ? value : undefined;
  }

  /**
   * Used as the [maximum length](http://ecma-international.org/ecma-262/6.0/#sec-number.max_safe_integer)
   * of an array-like value.
   */
  var MAX_SAFE_INTEGER = 9007199254740991;

  /**
   * Checks if `value` is a valid array-like length.
   *
   * **Note:** This function is based on [`ToLength`](http://ecma-international.org/ecma-262/6.0/#sec-tolength).
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
   */
  function isLength(value) {
    return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
  }

  /** `Object#toString` result references. */
  var arrayTag = '[object Array]';

  /** Used for native method references. */
  var objectProto$1 = Object.prototype;

  /**
   * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
   * of values.
   */
  var objToString$1 = objectProto$1.toString;

  /* Native method references for those with the same name as other `lodash` methods. */
  var nativeIsArray = getNative(Array, 'isArray');

  /**
   * Checks if `value` is classified as an `Array` object.
   *
   * @static
   * @memberOf _
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
   * @example
   *
   * _.isArray([1, 2, 3]);
   * // => true
   *
   * _.isArray(function() { return arguments; }());
   * // => false
   */
  var isArray = nativeIsArray || function(value) {
    return isObjectLike(value) && isLength(value.length) && objToString$1.call(value) == arrayTag;
  };

  var LayoutNotAvailable = (function (_ExtendableError) {
    babelHelpers.inherits(LayoutNotAvailable, _ExtendableError);

    function LayoutNotAvailable(message) {
      babelHelpers.classCallCheck(this, LayoutNotAvailable);
      return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(LayoutNotAvailable).call(this, message || 'D3.layout.listGraph.js has not been loaded yet.'));
    }

    return LayoutNotAvailable;
  })(ExtendableError);

  var EventDispatcherNoFunction = (function (_ExtendableError2) {
    babelHelpers.inherits(EventDispatcherNoFunction, _ExtendableError2);

    function EventDispatcherNoFunction(message) {
      babelHelpers.classCallCheck(this, EventDispatcherNoFunction);
      return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(EventDispatcherNoFunction).call(this, message || 'Dispatcher needs to be a function.'));
    }

    return EventDispatcherNoFunction;
  })(ExtendableError);

  var Events = (function () {
    function Events(el, broadcast) {
      babelHelpers.classCallCheck(this, Events);

      if (broadcast && !isFunction(broadcast)) {
        throw new EventDispatcherNoFunction();
      }

      this.el = el;
      this._stack = {};
      this.dispatch = broadcast ? broadcast : this._dispatchEvent;
    }

    babelHelpers.createClass(Events, [{
      key: '_dispatchEvent',
      value: function _dispatchEvent(eventName, data) {
        var event = document.createEvent('CustomEvent');
        event.initCustomEvent(eventName, false, false, data);
        this.el.dispatchEvent(event);
      }
    }, {
      key: 'broadcast',
      value: function broadcast(event, data) {
        this.dispatch(event, data);
      }

      /**
       * Add a callback function to an event stack.
       *
       * @method  on
       * @author  Fritz Lekschas
       * @date    2016-01-07
       *
       * @param   {String}    event     Event identifier.
       * @param   {Function}  callback  Function which is called when the event
       *   stack is triggered.
       * @param   {Number}    times     Number of times the callback function should
       *   be triggered before it is removed from the event stack. This is useful
       *   when an event happens only a certain number of times.
       * @return  {Number}              Index of callback, which is needed to
       *   manually remove the callback from the event stack.
       */

    }, {
      key: 'on',
      value: function on(event, callback, times) {
        if (!isFunction(callback)) {
          return false;
        }

        var normTimes = isFinite(times) ? parseInt(times, 10) : Infinity;

        if (isArray(this.stack[event])) {
          return this.stack[event].push({ callback: callback, times: normTimes }) - 1;
        }
        this.stack[event] = [{ callback: callback, times: normTimes }];
        return 0;
      }

      /**
       * Removes a callback function from an event stack given its index.
       *
       * @method  off
       * @author  Fritz Lekschas
       * @date    2016-01-07
       *
       * @param   {String}   event  Event identifier.
       * @param   {Number}   index  Index of the callback to be removed.
       * @return  {Boolean}         Returns `true` if event callback was found and
       *   successfully removed.
       */

    }, {
      key: 'off',
      value: function off(event, index) {
        try {
          this.stack[event].splice(index, 1);
          return true;
        } catch (e) {
          return false;
        }
      }

      /**
       * Trigger an event stack
       *
       * @method  trigger
       * @author  Fritz Lekschas
       * @date    2016-01-07
       *
       * @param   {String}   event  Event identifier.
       * @return  {Boolean}         Returns `true` if an event stack was found.
       */

    }, {
      key: 'trigger',
      value: function trigger(event, data) {
        if (isArray(this.stack[event])) {
          // Traversing from the end to the start, which has the advantage that
          // deletion of events, i.e. calling `Event.off()` doesn't affect the index
          // of event listeners in the next step.
          for (var i = this.stack[event].length; i--;) {
            // Instead of checking whether `stack[event][i]` is a function here,
            // we do it just once when we add the function to the stack.
            if (this.stack[event][i].times--) {
              this.stack[event][i].callback(data);
            } else {
              this.off(event, i);
            }
          }
          return true;
        }
        return false;
      }
    }, {
      key: 'stack',
      get: function get() {
        return this._stack;
      }
    }]);
    return Events;
  })();

  var ListGraph = (function () {
    function ListGraph(init) {
      var _this = this;

      babelHelpers.classCallCheck(this, ListGraph);

      if (!d3.layout.listGraph) {
        throw new LayoutNotAvailable();
      }

      var that = this;

      this.baseEl = init.element;
      this.baseElD3 = d3.select(this.baseEl);
      this.baseElJq = $(this.baseEl);
      this.svgD3 = this.baseElD3.select('svg.base');
      this.svgEl = this.svgD3.node();

      if (this.svgD3.empty()) {
        this.svgD3 = this.baseElD3.append('svg').attr('class', 'base');
        this.svgJq = $(this.svgD3.node());
      } else {
        this.svgJq = $(this.svgD3.node());
      }

      this.rootNodes = init.rootNodes;

      this.width = init.width || this.svgJq.width();
      this.height = init.height || this.svgJq.height();

      // Refresh top and left position of the base `svg` everytime the user enters
      // the element with his/her mouse cursor. This will avoid relying on complex
      // browser resize events and other layout manipulations as they most likely
      // won't happen when the user tries to interact with the visualization.
      this.svgD3.on('mouseenter', function () {
        that.getBoundingRect.call(that, this);
      });

      this.scrollbarWidth = init.scrollbarWidth || SCROLLBAR_WIDTH;
      this.columns = init.columns || COLUMNS;
      this.rows = init.rows || ROWS;
      this.iconPath = init.iconPath || ICON_PATH;

      this.highlightActiveLevel = HIGHLIGHT_ACTIVE_LEVEL;
      if (typeof init.highlightActiveLevel !== 'undefined') {
        this.highlightActiveLevel = init.highlightActiveLevel;
      }

      // Determines which level from the rooted node will be regarded as active.
      // Zero means that the level of the rooted node is regarded.
      this.activeLevel = ACTIVE_LEVEL;
      if (typeof init.activeLevel !== 'undefined') {
        this.activeLevel = init.activeLevel;
      }

      this.noRootActiveLevelDiff = NO_ROOT_ACTIVE_LEVEL_DIFF;
      if (typeof init.noRootActiveLevelDiff !== 'undefined') {
        this.noRootActiveLevelDiff = init.noRootActiveLevelDiff;
      }

      this.lessTransitionsJs = init.lessTransitions > 0;
      this.lessTransitionsCss = init.lessTransitions > 1;

      this.baseElD3.classed('less-animations', this.lessTransitionsCss);

      this.sortBy = init.sortBy;
      this.sortOrder = init.sortOrder === 'asc' ? 1 : DEFAULT_SORT_ORDER;

      this.events = new Events(this.baseEl, init.dispatcher);

      this.baseElJq.addClass(CLASSNAME);

      if (init.forceWidth) {
        this.baseElJq.width(this.width);
      }

      this.layout = new d3.layout.listGraph( // eslint-disable-line new-cap
      [this.width, this.height], [this.columns, this.rows]);

      this.data = init.data;
      this.visData = this.layout.process(this.data, this.rootNodes, {
        sortBy: this.sortBy,
        sortOrder: this.sortOrder
      });

      /**
       * Stores current sorting, e.g. type, order and a reference to the element.
       *
       * @type  {Object}
       */
      this.currentSorting = {
        global: {
          type: this.sortBy,
          order: this.sortOrder
        },
        local: {}
      };

      this.barMode = init.barMode || DEFAULT_BAR_MODE;
      this.svgD3.classed(this.barMode + '-bar', true);

      this.topbar = new Topbar(this, this.baseElD3, this.visData);

      this.svgD3.attr('viewBox', '0 0 ' + this.width + ' ' + this.height);

      this.container = this.svgD3.append('g').attr('class', 'main-container');

      this.levels = new Levels(this.container, this, this.visData);

      this.links = new Links(this.levels.groups, this.visData, this.layout);
      this.nodes = new Nodes(this, this.levels.groups, this.visData, this.links, this.events);
      this.levels.scrollPreparation(this, this.scrollbarWidth);
      this.scrollbars = new Scrollbars(this.levels.groups, this.visData, this.scrollbarWidth);

      // jQuery's mousewheel plugin is much nicer than D3's half-baked zoom event.
      this.$levels = $(this.levels.groups[0]).on('mousewheel', function (event) {
        if (!that.zoomedOut) {
          that.mousewheelColumn(this, event);
        }
      });

      // Normally we would reference a named methods but since we need to aceess
      // the class' `this` property instead of the DOM element we need to use an
      // arrow function.
      this.scrollbars.all.on('mousedown', function () {
        that.scrollbarMouseDown(this, d3.event);
      });

      // We need to listen to `mouseup` and `mousemove` globally otherwise
      // scrolling will only work as long as the cursor hovers the actual
      // scrollbar, which is super annoying.
      d3.select(document).on('mouseup', function () {
        _this.globalMouseUp(d3.event);
      }).on('mousemove', function () {
        _this.globalMouseMove(d3.event);
      });

      // Enable dragging of the whole graph.
      this.svgD3.call(onDragDrop, this.dragStartHandler.bind(this), dragMoveHandler, this.dragEndHandler.bind(this), [this.container, this.topbar.localControlWrapper], 'horizontal', this.getDragLimits.bind(this), [this.scrollbarDragging.bind(this)]);

      this.events.on('d3ListGraphLevelFocus', function (levelId) {
        return _this.levels.focus(levelId);
      });

      this.events.on('d3ListGraphNodeRoot', function () {
        _this.nodes.bars.updateAll(_this.layout.updateBars(_this.data), _this.currentSorting.global.type);
        _this.updateSorting();
      });

      this.events.on('d3ListGraphNodeUnroot', function () {
        _this.nodes.bars.updateAll(_this.layout.updateBars(_this.data), _this.currentSorting.global.type);
        _this.updateSorting();
      });

      this.events.on('d3ListGraphUpdateBars', function () {
        _this.nodes.bars.updateAll(_this.layout.updateBars(_this.data), _this.currentSorting.global.type);
        _this.updateSorting();
      });

      this.events.on('d3ListGraphActiveLevel', function (nextLevel) {
        var oldLevel = _this.activeLevel;
        _this.activeLevel = Math.max(nextLevel, 0);
        if (_this.nodes.rootedNode) {
          var rootNodeDepth = _this.nodes.rootedNode.datum().depth;
          _this.levels.blur(rootNodeDepth + oldLevel);
          _this.levels.focus(rootNodeDepth + _this.activeLevel);
        } else {
          _this.levels.blur(oldLevel - _this.noRootActiveLevelDiff);
          _this.levels.focus(_this.activeLevel - _this.noRootActiveLevelDiff);
        }
      });
    }

    babelHelpers.createClass(ListGraph, [{
      key: 'getDragLimits',
      value: function getDragLimits() {
        return {
          x: {
            min: this.dragMinX,
            max: 0
          }
        };
      }

      /**
       * Helper method to get the top and left position of the base `svg`.
       *
       * @Description
       * Calling `getBoundingClientRect()` right at the beginning leads to errornous
       * values, probably because the function is called because HTML has been fully
       * rendered.
       *
       * @method  getBoundingRect
       * @author  Fritz Lekschas
       * @date    2016-02-24
       * @param   {Object}  el  Element on which `getBoundingClientRect` is called.
       */

    }, {
      key: 'getBoundingRect',
      value: function getBoundingRect(el) {
        this.top = el.getBoundingClientRect().top;
        this.left = el.getBoundingClientRect().left;
      }
    }, {
      key: 'interactionWrapper',
      value: function interactionWrapper(callback, params) {
        if (!this.noInteractions) {
          callback.apply(this, params);
        }
      }
    }, {
      key: 'dragStartHandler',
      value: function dragStartHandler() {
        this.noInteractions = true;
        this.baseElD3.classed('unselectable', true);
      }
    }, {
      key: 'dragEndHandler',
      value: function dragEndHandler() {
        this.noInteractions = false;
        this.baseElD3.classed('unselectable', false);
      }
    }, {
      key: 'scrollbarDragging',
      value: function scrollbarDragging() {
        return !!this.activeScrollbar;
      }
    }, {
      key: 'globalMouseUp',
      value: function globalMouseUp(event) {
        this.noInteractions = false;
        if (this.activeScrollbar) {
          this.baseElD3.classed('unselectable', false);
          var data = this.activeScrollbar.datum();
          var deltaY = data.scrollbar.clientY - event.clientY;

          // Save final vertical position
          // Scrollbar
          data.scrollbar.scrollTop = Math.min(Math.max(data.scrollbar.scrollTop - deltaY, 0), data.scrollbar.scrollHeight);

          // Content
          data.scrollTop = Math.max(Math.min(data.scrollTop + data.invertedHeightScale(deltaY), 0), -data.scrollHeight);

          this.activeScrollbar.classed('active', false);

          this.activeScrollbar = undefined;
        }
      }
    }, {
      key: 'globalMouseMove',
      value: function globalMouseMove(event) {
        if (this.activeScrollbar) {
          var data = this.activeScrollbar.datum();
          var deltaY = data.scrollbar.clientY - event.clientY;

          // Scroll scrollbar
          ListGraph.scrollElVertically(this.activeScrollbar.node(), Math.min(Math.max(data.scrollbar.scrollTop - deltaY, 0), data.scrollbar.scrollHeight));

          // Scroll content
          var contentScrollTop = Math.max(Math.min(data.scrollTop + data.invertedHeightScale(deltaY), 0), -data.scrollHeight);

          ListGraph.scrollElVertically(data.nodes, contentScrollTop);

          // Scroll Links
          this.links.scroll(data.linkSelections.outgoing, this.layout.offsetLinks(data.level, contentScrollTop, 'source'));

          this.links.scroll(data.linkSelections.incoming, this.layout.offsetLinks(data.level - 1, contentScrollTop, 'target'));
        }
      }
    }, {
      key: 'scrollbarMouseDown',
      value: function scrollbarMouseDown(el, event) {
        this.noInteractions = true;
        this.baseElD3.classed('unselectable', true);
        this.activeScrollbar = d3.select(el).classed('active', true);
        this.activeScrollbar.datum().scrollbar.clientY = event.clientY;
      }
    }, {
      key: 'mousewheelColumn',
      value: function mousewheelColumn(el, event) {
        event.preventDefault();

        var data = d3.select(el).datum();

        if (data.scrollHeight > 0) {
          // Scroll nodes
          data.scrollTop = Math.max(Math.min(data.scrollTop + event.deltaY, 0), -data.scrollHeight);

          this.scrollY(data);
        }
      }
    }, {
      key: 'scrollY',
      value: function scrollY(columnData) {
        ListGraph.scrollElVertically(columnData.nodes, columnData.scrollTop);

        // Scroll scrollbar
        columnData.scrollbar.scrollTop = columnData.scrollbar.heightScale(-columnData.scrollTop);

        ListGraph.scrollElVertically(columnData.scrollbar.el, columnData.scrollbar.scrollTop);

        // Scroll Links
        if (columnData.level === this.visData.nodes.length) {
          this.links.scroll(columnData.linkSelections.outgoing, this.layout.offsetLinks(columnData.level, columnData.scrollTop, 'source'));
        }

        if (columnData.level > 0) {
          this.links.scroll(columnData.linkSelections.incoming, this.layout.offsetLinks(columnData.level - 1, columnData.scrollTop, 'target'));
        }
      }
    }, {
      key: 'scrollYTo',
      value: function scrollYTo(selection, positionY) {
        var _this2 = this;

        return selection.transition().duration(TRANSITION_SEMI_FAST).tween('scrollY', function (data) {
          var scrollPositionY = d3.interpolateNumber(data.scrollTop, positionY);
          return function (time) {
            data.scrollTop = scrollPositionY(time);
            _this2.scrollY(data);
          };
        });
      }
    }, {
      key: 'resetAllScrollPositions',
      value: function resetAllScrollPositions() {
        return this.scrollYTo(this.levels.groups, 0);
      }
    }, {
      key: 'selectByLevel',
      value: function selectByLevel(level, selector) {
        return d3.select(this.levels.groups[0][level]).selectAll(selector);
      }
    }, {
      key: 'updateSorting',
      value: function updateSorting() {
        var levels = Object.keys(this.currentSorting.local);
        for (var i = levels.length; i--;) {
          this.sortColumn(i, this.currentSorting.local[levels[i]].type, this.currentSorting.local[levels[i]].order, this.currentSorting.local[levels[i]].type);
        }
      }
    }, {
      key: 'sortColumn',
      value: function sortColumn(level, property, sortOrder, newSortType) {
        this.nodes.sort(this.layout.sort(level, property, sortOrder).updateNodesVisibility().nodes(level), newSortType);
        this.links.sort(this.layout.links(level - 1, level + 1));
      }
    }, {
      key: 'sortAllColumns',
      value: function sortAllColumns(property, newSortType) {
        this.currentSorting.global.order = this.currentSorting.global.order === -1 ? 1 : -1;

        this.nodes.sort(this.layout.sort(undefined, property, this.currentSorting.global.order).updateNodesVisibility().nodes(), newSortType);

        this.links.sort(this.layout.links());
      }
    }, {
      key: 'switchBarMode',
      value: function switchBarMode(mode) {
        this.svgD3.classed('one-bar', mode === 'one');
        this.svgD3.classed('two-bar', mode === 'two');
        this.nodes.bars.switchMode(mode, this.currentSorting);
      }
    }, {
      key: 'trigger',
      value: function trigger(event, data) {
        this.events.trigger(event, data);
      }

      /**
       * Update the scroll position and scroll-bar visibility.
       *
       * @description
       * This method needs to be called after hiding or showing nodes.
       *
       * @method  updateScrolling
       * @author  Fritz Lekschas
       * @date    2016-02-21
       */

    }, {
      key: 'updateScrolling',
      value: function updateScrolling() {
        var _this3 = this;

        this.resetAllScrollPositions().call(allTransitionsEnded, function () {
          _this3.levels.updateScrollProperties();
          _this3.scrollbars.updateVisibility();
        });
      }
    }, {
      key: 'updateLevelsVisibility',
      value: function updateLevelsVisibility() {
        this.levels.updateVisibility();
      }
    }, {
      key: 'globalView',
      value: function globalView(selectionInterst) {
        var _this4 = this;

        if (!this.zoomedOut) {
          (function () {
            var x = 0;
            var y = 0;
            var width = 0;
            var height = 0;
            var bBox = undefined;
            var cRect = undefined;

            var globalCRect = _this4.svgD3.node().getBoundingClientRect();

            if (selectionInterst && !selectionInterst.empty()) {
              selectionInterst.each(function () {
                bBox = this.getBBox();
                cRect = this.getBoundingClientRect();
                width = Math.max(width, cRect.left - globalCRect.left + cRect.width);
                height = Math.max(height, cRect.top - globalCRect.top + cRect.height);
              });
              width = _this4.width > width ? _this4.width : width;
              height = _this4.height > height ? _this4.height : height;
            } else {
              bBox = _this4.container.node().getBBox();
              width = _this4.width > bBox.width ? _this4.width : bBox.width;
              height = _this4.height > bBox.height ? _this4.height : bBox.height;
            }

            x = bBox.x;
            y = bBox.y;

            _this4.svgD3.classed('zoomedOut', true).transition().duration(TRANSITION_SEMI_FAST).attr('viewBox', x + ' ' + y + ' ' + width + ' ' + height);
          })();
        }
      }
    }, {
      key: 'zoomedView',
      value: function zoomedView() {
        if (!this.zoomedOut) {
          this.svgD3.classed('zoomedOut', false).transition().duration(TRANSITION_SEMI_FAST).attr('viewBox', '0 0 ' + this.width + ' ' + this.height);
        }
      }
    }, {
      key: 'toggleView',
      value: function toggleView() {
        if (this.zoomedOut) {
          this.zoomedOut = false;
          this.zoomedView();
        } else {
          this.globalView();
          this.zoomedOut = true;
        }
      }

      /**
       * Check if an element is actually visible, i.e. within the boundaries of the
       * SVG element.
       *
       * @method  isHidden
       * @author  Fritz Lekschas
       * @date    2016-02-24
       * @param   {Object}    el  DOM element to be checked.
       * @return  {Boolean}       If `true` element is not visible.
       */

    }, {
      key: 'isHidden',
      value: function isHidden(el) {
        var boundingRect = el.getBoundingClientRect();
        return boundingRect.top + boundingRect.height <= this.top || boundingRect.left + boundingRect.width <= this.left || boundingRect.top >= this.top + this.height || boundingRect.left >= this.left + this.width;
      }
    }, {
      key: 'area',
      get: function get() {
        return this.container.node().getBoundingClientRect();
      }
    }, {
      key: 'dragMinX',
      get: function get() {
        return Math.min(0, this.width - this.area.width);
      }
    }, {
      key: 'barMode',
      get: function get() {
        if (this.bars) {
          return this.nodes.bars.mode;
        }
        return this._barMode;
      },
      set: function set(mode) {
        if (this.bars) {
          this.nodes.bars.mode = mode;
        }
        this._barMode = mode;
      }
    }], [{
      key: 'scrollElVertically',
      value: function scrollElVertically(el, offset) {
        d3.select(el).attr('transform', 'translate(0, ' + offset + ')');
      }
    }]);
    return ListGraph;
  })();

  return ListGraph;

})($,d3);