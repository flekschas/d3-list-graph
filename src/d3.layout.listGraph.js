d3.layout.listGraph = function() {
  /**
   * Default size
   *
   * @private
   * @type  {Object}
   */
  var _size = {
    width: 300,
    height: 300
  };

  /**
   * Default grid
   *
   * @private
   * @type  {Object}
   */
  var _grid = {
    columns: 3,
    rows: 3
  };

  /**
   * Test if the value is an Array.
   *
   * @copyright  Lodash
   * @see  https://lodash.com/docs#isArray
   *
   * @method  isArray
   * @private
   * @param  {*}  value  Value to be tested.
   * @return  {Boolean}  If `true` the value is an Array.
   */
  function isArray (value) {
    return Array.isArray(value);
  }

  /**
   * Test if the value is an Object.
   *
   * @copyright  Lodash
   * @see  https://lodash.com/docs#isObject
   *
   * @method  isObject
   * @private
   * @param  {*}  value  Value to be tested.
   * @return  {Boolean}  If `true` the value is an Object.
   */
  function isObject(value) {
    // Avoid a V8 JIT bug in Chrome 19-20.
    // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
    var type = typeof value;
    return !!value && (type == 'object' || type == 'function');
  }

  /**
   * Test if the value is a String.
   *
   * @copyright  Lodash
   * @see        https://lodash.com/docs#isString
   *
   * @method   isString
   * @private
   * @param  {*}  value  Value to be tested.
   * @return  {Boolean}  If `true` the value is a String.
   */
  function isString (value) {
    return typeof value == 'string' ||
      (isObjectLike(value) && objToString.call(value) == stringTag);
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
   * @date  2015-11-10
   *
   * @method  nodesToFatMatrix
   * @private
   * @param  {Object}  nodeList  List of nodes.
   * @return  {Array}  Fat array of arrays of nodes.
   */
  function nodesToFatMatrix (nodeList, columnCache) {
    var arr = [];
    var keys;
    var numLevels = Object.keys(columnCache).length

    for (var i = 0; i < numLevels; i++) {
      arr.push([]);
      keys = Object.keys(columnCache[i]);
      for (var j = keys.length; j--;) {
        arr[i].push(nodeList[keys[j]]);
      }
    }

    return arr;
  }

  /**
   * Traverse graph in a breadth-first search fashion and process nodes along
   * the traversal.
   *
   * @author  Fritz Lekschas
   * @date    2015-11-13
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
  function traverseGraph (graph, starts, columnCache, scaleX, scaleY) {
    var j;
    var child;
    var childId;
    var clone;
    var node;
    var visited = {};
    var queue = [];
    var cloneId;

    /**
     * Process a node, e.g. assign `x` and `y`, clone node etc.
     *
     * @description
     * Nodes are edited in place.
     *
     * @method  processNode
     * @author  Fritz Lekschas
     * @date    2015-11-13
     *
     * @private
     * @memberOf  traverseGraph
     * @param     {String}   id           Node ID.
     * @param     {Object}   node         Node to be processed.
     * @param     {Object}   parent       Parent node.
     * @param     {Boolean}  duplication  If `true` node is a duplication.
     */
    function processNode (id, node, parent, duplication) {
      var _id = id;
      var _node = node;

      if (duplication) {
        cloneId = id + '.' + node.clones.length + 1;
        graph[cloneId] = {
          children: [],
          clone: true,
          cloneId: node.clones.length + 1,
          // Data will be referenced rather than copied to avoid inconsistencies
          data: node.data,
          originalId: id,
          // Reference to the original node
          originalNode: node,
        }
        _id = cloneId;
        _node = graph[cloneId];
        // Add a reference to the original node that points to the clone.
        node.clones.push(_node);
      } else {
        _node['clones'] = [];
      }

      _node.depth = parent ? parent.depth + 1 : 0;

      if (!columnCache[_node.depth]) {
        columnCache[_node.depth] = {};
      }

      if (!columnCache[_node.depth][_id]) {
        columnCache[_node.depth][_id] = true;
        _node.x = scaleX(_node.depth);
        _node.y = scaleY(Object.keys(columnCache[_node.depth]).length - 1);
      }
    }

    for (var i = starts.length; i--;) {
      start = starts[i];

      if (!graph[start]) {
        return;
      }

      processNode(start, graph[start]);

      queue.push(start);
      visited[start] = true;

      while (queue.length > 0) {
        id = queue.shift();
        node = graph[id];

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

            processNode(
              childId,
              child,
              node,
              clone
            );
          }
        }
      }
    }
  }

  /**
   * ListGraph class constructor.
   *
   * @author  Fritz Lekschas
   * @date    2015-11-10
   *
   * @class
   * @method  ListGraph
   * @param   {Array|Object}  size  New size. Can either be an Array, e.g.
   *   `[200,20]` or an Object, e.g. `{width: 200, height: 20}`.
   * @param   {Array|Object}  grid  New grid configuration. Can either be an
   *   Array, e.g. `[5,3]` or an Object, e.g. `{columns: 5, rows: 3}`.
   */
  function ListGraph (size, grid) {
    this.scale = {
      x: d3.scale.linear(),
      y: d3.scale.linear()
    };

    this._grid = {
      columns: _grid.columns,
      rows: _grid.rows
    };

    this._size = {
      width: _size.width,
      height: _size.height
    };

    this.grid(grid);
    this.size(size);

    this.columnCache = {};

    return this;
  }

  ListGraph.prototype.process = function (data, rootIds) {
    this.data = data || this.data;
    this.rootIds = rootIds || this.rootIds;

    if (!isArray(this.rootIds)) {
      this.rootIds = [this.rootIds];
    }

    traverseGraph(
      this.data,
      this.rootIds,
      this.columnCache,
      this.scale.x,
      this.scale.y
    );

    return nodesToFatMatrix(this.data, this.columnCache);
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
   * @param   {Array|Object}  newGrid  New grid configuration. Can either be an
   *   Array, e.g. `[5,3]` or an Object, e.g. `{columns: 5, rows: 3}`.
   * @return  {Object}  Self.
   */
  ListGraph.prototype.grid = function (newGrid) {
    if (!arguments.length) {
      return this._grid;
    }

    if (isArray(newGrid)) {
      this._grid.columns = parseInt(newGrid[0]) || this._grid.columns;
      this._grid.rows = parseInt(newGrid[1]) || this._grid.rows;
    }

    if (isObject(newGrid)) {
      this._grid.columns = parseInt(newGrid.columns)|| this._grid.columns;
      this._grid.rows = parseInt(newGrid.rows)|| this._grid.rows;
    }

    this.updateScaling();

    return this;
  }

  /**
   * Updates scaling according to the size and grid configuration.
   *
   * @author  Fritz Lekschas
   * @date    2015-11-10
   *
   * @method  updateScaling
   * @public
   * @chainable
   * @return  {Object}  Self.
   */
  ListGraph.prototype.updateScaling = function () {
    this.scale.x.domain([0, this._grid.columns]).range([0, this._size.width]);
    this.scale.y.domain([0, this._grid.rows]).range([0, this._size.height]);

    return this;
  }

  /**
   * Set or get the size of the layout.
   *
   * @author  Fritz Lekschas
   * @date    2015-11-10
   *
   * @method  size
   * @public
   * @chainable
   * @param   {Array|Object}  newSize  New size. Can either be an Array, e.g.
   *   `[200,20]` or an Object, e.g. `{width: 200, height: 20}`.
   * @return  {Object}  Self.
   */
  ListGraph.prototype.size = function (newSize) {
    if (!arguments.length) {
      return this._size;
    }

    if (isArray(newSize)) {
      this._size.width = parseInt(newSize[0]) || this._size.width;
      this._size.height = parseInt(newSize[1]) || this._size.height;
    }

    if (isObject(newSize)) {
      this._size.width = parseInt(newSize.width) || this._size.width;
      this._size.height = parseInt(newSize.height) || this._size.height;
    }

    this.updateScaling();

    return this;
  }

  return ListGraph;
}
