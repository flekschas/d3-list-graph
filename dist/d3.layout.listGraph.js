/* Copyright Fritz Lekschas: D3 layout for list-based graphs */
(function (d3) { 'use strict';

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
  var objectProto$2 = Object.prototype;

  /**
   * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
   * of values.
   */
  var objToString$1 = objectProto$2.toString;

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
    return isObject(value) && objToString$1.call(value) == funcTag;
  }

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
  var objectProto$1 = Object.prototype;

  /** Used to resolve the decompiled source of functions. */
  var fnToString = Function.prototype.toString;

  /** Used to check objects for own properties. */
  var hasOwnProperty = objectProto$1.hasOwnProperty;

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
  var objectProto = Object.prototype;

  /**
   * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
   * of values.
   */
  var objToString = objectProto.toString;

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
    return isObjectLike(value) && isLength(value.length) && objToString.call(value) == arrayTag;
  };

  /**
   * Traverse graph in a breadth-first search fashion and process nodes along
   * the traversal.
   *
   * @author  Fritz Lekschas
   * @date  2015-11-13
   *
   * @private
   * @method  traverseGraph
   * @param  {Object}  graph  Graph to be traversed
   * @param  {Array}  starts  Array of node IDs for start the traversal.
   * @param  {Object}  columnCache  Cache storing node IDs per column.
   * @param  {Object|Function}  scaleX  D3 linear scale function for the
   *    x-axis, e.g. columns.
   * @param  {Object|Function}  scaleY  D3 linear scale function for the
   *    y-axis, e.g. rows.
   */
  function traverseGraph(graph, starts, columnCache, nodeOrder, links, scaleX, scaleY) {
    var j = undefined;
    var child = undefined;
    var childId = undefined;
    var clone = undefined;
    var node = undefined;
    var visited = {};
    var queue = [];
    var cloneId = undefined;

    /**
     * Ensure that the bar values are in [0,1] and that the structure of `bars`
     * is unified.
     *
     * @description
     * Each node can feature a number of bars representing some value. The layout
     * can handle two structure, an object-based and an array-based structure.
     *
     * Object-based model:
     * ```
     * {
     *   children: [...],
     *   data: {
     *     "name": "whatever",
     *     "bars": {
     *       "propertyA": 0.9,
     *       "propertyB": 0.5
     *     }
     *   }
     * }
     * ```
     *
     * Array-based model:
     * ```
     * {
     *   children: [...],
     *   data: {
     *     "name": "whatever",
     *     "bars": [{
     *         "id": "propertyA",
     *         "value": 0.9
     *       }, {
     *         "id": "propertyB",
     *         "value": 0.5
     *       }
     *     ]
     *   }
     * }
     * ```
     *
     * @author  Fritz Lekschas
     * @date  2015-11-18
     *
     * @method  processBars
     * @private
     * @memberOf  traverseGraph
     * @param  {Object}  node  Node to be processed.
     */
    function processBars(node) {
      if (node.data.bars) {
        if (isArray(node.data.bars)) {
          node.data.barRefs = {};
          for (var i = 0, len = node.data.bars.length; i < len; i++) {
            node.data.bars[i].value = Math.max(Math.min(node.data.bars[i].value, 1), 0);
            node.data.barRefs[node.data.bars[i].id] = node.data.bars[i].value;
          }
        } else if (isObject(node.data.bars)) {
          var bars = [];
          var keys = Object.keys(node.data.bars);
          // Keep the old object reference for quick access, e.g.
          // `node.data.barRefs.precision`
          node.data.barRefs = {};
          for (var i = 0, len = keys.length; i < len; i++) {
            node.data.barRefs[keys[i]] = Math.max(Math.min(node.data.bars[keys[i]], 1), 0);
            bars.push({
              id: keys[i],
              value: node.data.barRefs[keys[i]]
            });
          }
          node.data.bars = bars;
        }
      }
    }

    /**
     * Process a node, e.g. assign `x` and `y`, clone node etc.
     *
     * @description
     * Nodes are edited in place.
     *
     * @author  Fritz Lekschas
     * @date  2015-11-13
     *
     * @method  processNode
     * @private
     * @memberOf  traverseGraph
     * @param  {String}  id  Node ID.
     * @param  {Object}  node  Node to be processed.
     * @param  {Object}  parent  Parent node.
     * @param  {Boolean}  duplication  If `true` node is a duplication.
     */
    function processNode(id, node, parent, duplication) {
      var _id = id;
      var _node = node;

      if (duplication) {
        if (parent.depth + 1 !== node.depth) {
          cloneId = id + '.' + node.clones.length + 1;
          graph[cloneId] = {
            children: [],
            clone: true,
            cloneId: node.clones.length + 1,
            // Data will be referenced rather than copied to avoid inconsistencies
            data: node.data,
            originalId: id,
            // Reference to the original node
            originalNode: node
          };
          _id = cloneId;
          _node = graph[cloneId];
          // Add a reference to the original node that points to the clone.
          node.clones.push(_node);
        }
      } else {
        _node['clones'] = [];
      }

      _node.id = _id;

      if (!_node.parents) {
        _node.parents = [];
      }
      if (parent) {
        _node.parents.push(parent);
      }

      if (!_node.childRefs) {
        _node.childRefs = [];
      }

      if (parent) {
        _node.depth = parent.depth + 1;
        parent.childRefs.push(_node);
      } else {
        _node.depth = 0;
      }

      if (!_node.links) {
        _node.links = [];
      }

      if (!columnCache[_node.depth]) {
        columnCache[_node.depth] = {};
        nodeOrder[_node.depth] = [];
      }

      if (!columnCache[_node.depth][_id]) {
        columnCache[_node.depth][_id] = true;
        nodeOrder[_node.depth].push(_node);
        _node.x = scaleX(_node.depth);
        _node.y = scaleY(Object.keys(columnCache[_node.depth]).length - 1);
      }

      processBars(_node);

      if (parent) {
        processLink(parent, _node);
      }
    }

    /**
     * Process outgoing links and add them to the source
     *
     * @author  Fritz Lekschas
     * @date    2015-11-17
     *
     * @method  processLink
     * @private
     * @memberOf  traverseGraph
     * @param  {Object}  source  Source node.
     * @param  {Object}  target  Target node.
     */
    function processLink(source, target) {
      source.links.push({
        id: '(' + source.id + ')->(' + target.id + ')',
        source: {
          node: source,
          offsetX: 0,
          offsetY: 0
        },
        target: {
          node: target,
          offsetX: 0,
          offsetY: 0
        }
      });
    }

    // BFS for each start node.
    for (var i = starts.length; i--;) {
      if (!graph[starts[i]]) {
        return;
      }

      processNode(starts[i], graph[starts[i]]);

      queue.push(starts[i]);
      visited[starts[i]] = true;

      while (queue.length > 0) {
        node = graph[queue.shift()];

        for (j = node.children.length; j--;) {
          childId = node.children[j];
          child = graph[childId];

          if (!!child) {
            if (!visited[childId]) {
              queue.push(childId);
              visited[childId] = true;
              clone = false;
            } else {
              clone = true;
            }

            processNode(childId, child, node, clone);
          }
        }
      }
    }
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

  var NoRootNodes = (function (_ExtendableError) {
    babelHelpers.inherits(NoRootNodes, _ExtendableError);

    function NoRootNodes(message) {
      babelHelpers.classCallCheck(this, NoRootNodes);
      return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(NoRootNodes).call(this, message || 'No root node IDs specified.'));
    }

    return NoRootNodes;
  })(ExtendableError);

  /**
   * Default size
   *
   * @constant
   * @default
   * @type  {Object}
   */
  var SIZE = {
    width: 300,
    height: 300
  };

  /**
   * Default grid
   *
   * @constant
   * @default
   * @type  {Object}
   */
  var GRID = {
    columns: 3,
    rows: 3
  };

  /**
   * Default relative padding of columns.
   *
   * @description
   * Padding between columns refers to the left and right inner padding used
   * for links between items in the column. Padding is relative to the overall
   * width of the column.
   *
   * @constant
   * @default
   * @type  {Number}
   */
  var COL_REL_PADDING = 0.2;

  /**
   * Default relative padding of rows.
   *
   * @description
   * Padding between rows refers to the top and bottom inner padding used to
   * separate items vertically in the column. Padding is relative to the overall
   * height of the row.
   *
   * @constant
   * @default
   * @type  {Number}
   */
  var ROW_REL_PADDING = 0.05;

  /**
   * Default inner padding of a cell relative to the shorter dimension, e.g.
   * width or height.
   *
   * @type  {Number}
   */
  var CELL_REL_INNER_PADDING = 0.05;

  var ListGraphLayout = (function () {
    /**
     * ListGraph class constructor.
     *
     * @author  Fritz Lekschas
     * @date  2015-11-10
     *
     * @constructor
     * @param  {Array|Object}  size  New size. Can either be an Array, e.g.
     *   `[200,20]` or an Object, e.g. `{width: 200, height: 20}`.
     * @param  {Array|Object}  grid  New grid configuration. Can either be an
     *   Array, e.g. `[5,3]` or an Object, e.g. `{columns: 5, rows: 3}`.
     */

    function ListGraphLayout(size, grid) {
      babelHelpers.classCallCheck(this, ListGraphLayout);

      this.scale = {
        x: d3.scale.linear(),
        y: d3.scale.linear()
      };

      this._colRelPadding = COL_REL_PADDING;
      this._rowRelPadding = ROW_REL_PADDING;
      this._cellRelInnerPadding = CELL_REL_INNER_PADDING;

      this._grid = {
        columns: GRID.columns,
        rows: GRID.rows
      };

      this._size = {
        width: SIZE.width,
        height: SIZE.height
      };

      this.grid(grid);
      this.size(size);

      this.columnCache = {};
      this.columns = {};
      this.columnNodeOrder = {};
      this.columnSorting = {};
    }

    /**
     * Convert an object-based list of nodes into an array of arrays of nodes.
     *
     * @description
     * Representing a graph using hierarchical data structures such as an Array is
     * difficult. To save resources and avoid complex structures a graph is
     * represented as a simple list of nodes. The list correspondes to an objects
     * where the object's keys stand for node identifiers. This ensures uniqueness
     * but has the disadvantage that D3 doesn't know what to do with it, thus we
     * have to convert that structure into a fat array of array of nodes. It's
     * important to notice that the nodes are *not* cloned into the array but
     * instead simply linked using references.
     *
     * @author  Fritz Lekschas
     * @date  2015-12-04
     *
     * @method  nodesToMatrix
     * @memberOf  ListGraph
     * @public
     * @param  {Integer}  Level for which nodes should be returned.
     * @return  {Array}  Fat array of arrays of nodes.
     */

    babelHelpers.createClass(ListGraphLayout, [{
      key: 'nodesToMatrix',
      value: function nodesToMatrix(level) {
        var arr = [];
        var keys = undefined;
        var start = 0;
        var end = Object.keys(this.columnCache).length;

        if (isFinite(level)) {
          start = level;
          end = level + 1;
        }

        for (var i = start; i < end; i++) {
          arr.push({
            y: 0,
            x: this.scale.x(i),
            level: i,
            rows: [],
            sortBy: this.columnSorting[i].by,
            sortOrder: this.columnSorting[i].order
          });
          keys = Object.keys(this.columnCache[i]);
          for (var j = keys.length; j--;) {
            arr[i - start].rows.push(this.data[keys[j]]);
          }
        }

        return arr;
      }

      /**
       * Process original data and return an D3 ready Array.
       *
       * @author  Fritz Lekschas
       * @date  2015-12-28
       *
       * @method  process
       * @memberOf  ListGraph
       * @public
       * @category  Data
       * @param  {Object}  data  Object list of nodes.
       * @param  {Array}  rootIds  Array of node IDs to start traversal.
       * @param  {Object}  options  Object holding extra options such as sorting.
       * @return  {Array}  Array of Array of nodes.
       */

    }, {
      key: 'process',
      value: function process(data, rootIds, options) {
        this.data = data || this.data;
        this.rootIds = rootIds || this.rootIds;

        if (!isArray(this.rootIds)) {
          if (isFinite(this.rootIds)) {
            this.rootIds = [this.rootIds];
          } else {
            throw new NoRootNodes('No root node IDs specified.');
          }
        }

        traverseGraph(this.data, this.rootIds, this.columnCache, this.columnNodeOrder, this.links, this.scale.x, this.scale.y);

        for (var i = Object.keys(this.columnCache).length; i--;) {
          this.columnSorting[i] = {};
        }

        if (options && options.sortBy) {
          this.sort(undefined, options.sortBy, options.sortOrder || 'desc');
        }

        return {
          global: this.compileGlobalProps(),
          nodes: this.nodesToMatrix()
        };
      }

      /**
       * Sorts nodes of all or a specific level according to a property and order.
       *
       * @description
       * Currently nodes can only be sorted by _precision_, _recall_ or by name.
       *
       * @method  sort
       * @author  Fritz Lekschas
       * @date    2015-12-04
       * @param  {Integer}  level  Specifies the level which should be sorted.
       * @param  {String}  property   The property used for sorting. Can be one of
       *   ['precision', 'recall', 'name'].
       * @param  {Integer}  sortOrder  If `1` sort asc. If `-1` sort desc.
       * @return  {Object}  Self.
       */

    }, {
      key: 'sort',
      value: function sort(level, property, sortOrder) {
        var itr = 0,
            end = Object.keys(this.columnCache).length,
            getValue = undefined;

        // 1 = asc, -1 = desc [default]
        sortOrder = sortOrder === 1 ? 1 : -1;

        switch (property) {
          case 'precision':
            getValue = function (obj) {
              return obj.data.barRefs.precision;
            };
            break;
          case 'recall':
            getValue = function (obj) {
              return obj.data.barRefs.recall;
            };
            break;
          default:
            getValue = function (obj) {
              return obj.data.name.toLowerCase();
            };
            property = name;
            break;
        }

        if (isFinite(level)) {
          itr = level;
          end = level + 1;
        }

        for (itr; itr < end; itr++) {
          this.columnNodeOrder[itr].sort(function (a, b) {
            var valueA = getValue(a);
            var valueB = getValue(b);
            return valueA > valueB ? sortOrder : valueA < valueB ? -sortOrder : 0;
          });

          this.columnSorting[itr].by = property;
          this.columnSorting[itr].order = sortOrder;

          // Update `y` according to the new position.
          for (var i = this.columnNodeOrder[itr].length; i--;) {
            this.columnNodeOrder[itr][i].y = this.scale.y(i);
          }
        }

        return this;
      }

      /**
       * Compiles an object of global properties of the visualization.
       *
       * @description
       * Global properties comprise all properties that can be applied to globally
       * across the visualization such as the width and padding of columns or the
       * height and padding of rows.
       *
       * @author  Fritz Lekschas
       * @date    2015-11-17
       *
       * @method  compileGlobalProps
       * @memberOf  ListGraph
       * @public
       * @category  Data
       * @return  {Object}  Object with global properties.
       */

    }, {
      key: 'compileGlobalProps',
      value: function compileGlobalProps() {
        return {
          column: {
            width: this._columnWidth,
            height: this._size.height,
            padding: this._colAbsPadding,
            contentWidth: this._colAbsContentWidth
          },
          row: {
            height: this._rowHeight,
            padding: this._rowAbsPadding,
            contentHeight: this._rowAbsContentHeight
          },
          cell: {
            padding: this._cellAbsInnerPadding
          }
        };
      }

      /**
       * Returns the processed nodes as an Array of Array of nodes.
       *
       * @author  Fritz Lekschas
       * @date  2015-11-16
       *
       * @method  nodes
       * @memberOf  ListGraph
       * @public
       * @category  Data
       * @param  {Integer}  Level for which nodes should be returned.
       * @return  {Array}  Array of Array of nodes.
       */

    }, {
      key: 'nodes',
      value: function nodes(level) {
        return this.nodesToMatrix(level);
      }

      /**
       * Returns an array of outgoing links per level, i.e. column, or all outgoing
       * links.
       *
       * @description
       * The column ID and level might be the same for small graphs but it's
       * possible that the first column does not represent the first level.
       *
       * @author  Fritz Lekschas
       * @date  2015-12-04
       *
       * @method  links
       * @memberOf  ListGraph
       * @public
       * @category  Data
       * @param  {Integer}  startLevel  Start level for returning links. If `to` is
       *   not specified that only links from `start` level are returned.
       * @param  {Integer}  endLevel  End level for returning links. So all links
       *   from `start` to `to` (including) will be returned
       * @return  {Array}  Array of objects containing the information for outgoing
       *   links.
       */

    }, {
      key: 'links',
      value: function links(startLevel, endLevel) {
        var allLinks = [],
            keys = [],
            nodeLinks = undefined;

        if (!isFinite(startLevel)) {
          keys = Object.keys(this.data);
        } else {
          startLevel = Math.max(startLevel, 0);
          endLevel = isFinite(endLevel) ? Math.min(endLevel, Object.keys(this.columnCache).length) : startLevel + 1;

          for (var i = startLevel; i < endLevel; i++) {
            keys = keys.concat(Object.keys(this.columnCache[i]));
          }
        }

        for (var i = keys.length; i--;) {
          nodeLinks = this.data[keys[i]].links;
          for (var j = nodeLinks.length; j--;) {
            allLinks.push(nodeLinks[j]);
          }
        }

        return allLinks;
      }

      /**
       * Offset one end of all links per level vertically.
       *
       * @author  Fritz Lekschas
       * @date    2015-11-18
       *
       * @method  offsetLinks
       * @memberOf  ListGraph
       * @public
       * @category  Links
       * @param  {Integer}  level  If given get's only links of a certain level. The
       *   level of a node is relative to the length of the shortest path to the
       *   root node.
       * @param  {Number}  offsetY  The amount that one end of the link should be
       *   offset vertically.
       * @param  {String}  nodeType  Defines which end of the link should be
       *   shifted. This can either be `source` or `traget`.
       * @return  {Array}  Array of objects containing the information of the
       *   modified outgoing links.
       */

    }, {
      key: 'offsetLinks',
      value: function offsetLinks(level, offsetY, nodeType) {
        var links = this.links(level);

        if ((nodeType === 'source' || nodeType === 'target') && isFinite(offsetY)) {
          for (var i = links.length; i--;) {
            links[i][nodeType].offsetY = offsetY;
          }
        }

        return links;
      }

      /**
       * Set or get the grid configuration.
       *
       * @author  Fritz Lekschas
       * @date    2015-11-10
       *
       * @method  grid
       * @memberOf  ListGraph
       * @public
       * @chainable
       * @category  Data
       * @param  {Array|Object}  newGrid  New grid configuration. Can either be an
       *   Array, e.g. `[5,3]` or an Object, e.g. `{columns: 5, rows: 3}`.
       * @return  {Object}  Self.
       */

    }, {
      key: 'grid',
      value: function grid(newGrid) {
        if (!arguments.length) {
          return this._grid;
        }

        if (isArray(newGrid)) {
          this._grid.columns = parseInt(newGrid[0]) || this._grid.columns;
          this._grid.rows = parseInt(newGrid[1]) || this._grid.rows;
          this.updateScaling();
        }

        if (isObject(newGrid)) {
          this._grid.columns = parseInt(newGrid.columns) || this._grid.columns;
          this._grid.rows = parseInt(newGrid.rows) || this._grid.rows;
          this.updateScaling();
        }

        return this;
      }

      /**
       * Update vertical position when filtering, i.e. hiding, nodes.
       *
       * @method  updateNodeVisibility
       * @author  Fritz Lekschas
       * @date    2016-01-17
       */

    }, {
      key: 'updateNodesVisibility',
      value: function updateNodesVisibility() {
        var skipped = {};

        for (var i = Object.keys(this.columnCache).length; i--;) {
          skipped[i] = 0;
          // Update `y` according to the number of previously skipped nodes.
          for (var j = 0, len = this.columnNodeOrder[i].length; j < len; j++) {
            if (this.columnNodeOrder[i][j].hidden) {
              skipped[i]++;
            }
            this.columnNodeOrder[i][j].y = this.scale.y(j - skipped[i]);
          }
        }
      }

      /**
       * Updates scaling according to the size and grid configuration.
       *
       * @author  Fritz Lekschas
       * @date  2015-11-10
       *
       * @method  updateScaling
       * @memberOf  ListGraph
       * @public
       * @chainable
       * @return  {Object}  Self.
       */

    }, {
      key: 'updateScaling',
      value: function updateScaling() {
        this.scale.x.domain([0, this._grid.columns]).range([0, this._size.width]);
        this.scale.y.domain([0, this._grid.rows]).range([0, this._size.height]);

        this._columnWidth = this._size.width / this._grid.columns;
        this._rowHeight = this._size.height / this._grid.rows;

        this._colAbsPadding = this._columnWidth * this._colRelPadding;
        this._colAbsContentWidth = this._columnWidth * (1 - 2 * this._colRelPadding);

        this._rowAbsPadding = Math.max(this._rowHeight * this._rowRelPadding, 2);
        this._rowAbsContentHeight = this._rowHeight - 2 * this._rowAbsPadding;

        this._cellAbsInnerPadding = this._cellRelInnerPadding * Math.min(this._colAbsContentWidth, this._rowAbsContentHeight, 1);

        return this;
      }

      /**
       * Set or get the size of the layout.
       *
       * @author  Fritz Lekschas
       * @date  2015-11-10
       *
       * @method  size
       * @memberOf  ListGraph
       * @public
       * @chainable
       * @param  {Array|Object}  newSize  New size. Can either be an Array, e.g.
       *   `[200, 20]` or an Object, e.g. `{width: 200, height: 20}`.
       * @return  {Object}  Self.
       */

    }, {
      key: 'size',
      value: function size(newSize) {
        if (!arguments.length) {
          return this._size;
        }

        if (isArray(newSize)) {
          this._size.width = parseInt(newSize[0]) || this._size.width;
          this._size.height = parseInt(newSize[1]) || this._size.height;
          this.updateScaling();
        }

        if (isObject(newSize)) {
          this._size.width = parseInt(newSize.width) || this._size.width;
          this._size.height = parseInt(newSize.height) || this._size.height;
          this.updateScaling();
        }

        return this;
      }

      /**
       * Set or get the relative width of the content area of a node.
       *
       * @author  Fritz Lekschas
       * @date  2015-11-17
       *
       * @method  columnPadding
       * @memberOf  ListGraph
       * @public
       * @chainable
       * @param  {Number}  padding  Number in [0.1, 0.66].
       * @param  {Boolean}  absolute  If `true` `padding` is regarded to be an
       *   absolute number. Otherwise a relative number is assumed.
       * @return  {Number|Object}  When `padding` is passed `this` will be returned
       *   for chaining. Otherwise the current padding of columns will be returned.
       */

    }, {
      key: 'columnPadding',
      value: function columnPadding(padding, absolute) {
        if (!arguments.length) {
          return this._colRelPadding;
        }

        if (isFinite(padding)) {
          if (absolute && isFinite(this._columnWidth)) {
            padding = padding / this._columnWidth;
          }
          this._colRelPadding = Math.max(Math.min(padding, 0.66), 0.1);
          this.updateScaling();
        }

        return this;
      }

      /**
       * Set or get the relative width of the content area of a node.
       *
       * @author  Fritz Lekschas
       * @date  2015-11-17
       *
       * @method  rowPadding
       * @memberOf  ListGraph
       * @public
       * @chainable
       * @param  {Number}  padding  Number in [0, 0.5].
       * @param  {Boolean}  absolute  If `true` `padding` is regarded to be an
       *   absolute number. Otherwise a relative number is assumed.
       * @return  {Number|Object}  When `padding` is passed `this` will be returned
       *   for chaining. Otherwise the current padding of rows will be returned.
       */

    }, {
      key: 'rowPadding',
      value: function rowPadding(padding, absolute) {
        if (!arguments.length) {
          return this._rowRelPadding;
        }

        if (isFinite(padding)) {
          if (absolute && isFinite(this._rowHeight)) {
            padding = padding / this._rowHeight;
          }
          this._rowRelPadding = Math.max(Math.min(padding, 0.5), 0);
          this.updateScaling();
        }

        return this;
      }
    }]);
    return ListGraphLayout;
  })();

  d3.layout.listGraph = ListGraphLayout;

})(d3);