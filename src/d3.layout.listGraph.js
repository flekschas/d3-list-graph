d3.layout.listGraph = function() {
  /**
   * Default size
   *
   * @type  {Object}
   * @private
   */
  var _size = {
    width: 300,
    height: 300
  };

  /**
   * Default grid
   *
   * @type  {Object}
   * @private
   */
  var _grid = {
    columns: 3,
    rows: 3
  };

  // Lodash
  function isArray (value) {
    return Array.isArray(value);
  }

  // Lodash
  function isObject(value) {
    // Avoid a V8 JIT bug in Chrome 19-20.
    // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
    var type = typeof value;
    return !!value && (type == 'object' || type == 'function');
  }

  // Lodash
  function isString (value) {
    return typeof value == 'string' ||
      (isObjectLike(value) && objToString.call(value) == stringTag);
  }

  /**
   * Convert an object-based list of nodes into a fat array.
   *
   * @description
   * Representing a graph using hierarchical data structure such as an array is
   * difficult. To save resources and avoid complex structures a graph is
   * represented as a simple list of nodes. The list correspondes to an objects
   * where the object's keys stand for node identifiers. This ensures uniqueness
   * but has the disadvantage that D3 doesn't know what to do with it, this we
   * have to convert that structure into a fat array with duplicated nodes.
   *
   * @method  nodeListToFatArray
   * @author  Fritz Lekschas
   * @date    2015-11-10
   *
   * @private
   * @param   {Object}  nodeList  List of nodes.
   * @return  {Array}             Fat array of nodes.
   */
  function nodeListToFatArray (nodeList) {
    var arr = [];
    var keys = Object.keys(nodeList);

    for (var i = keys.length; i--;) {
      arr.push(nodeList[keys[i]]);
    }

    return arr;
  }

  // Breadth first search
  function walkGraph (graph, start, depthCache, scaleX, scaleY) {
    var i;
    var node;
    var visited = {};
    var queue = [];

    function processNode (id, node, duplication) {
      var _node = node;

      if (duplication) {
        _node = {
          children: [],
          clone: true,
          cloneId: node.clones.length,
          id: node + '.' + node.clones.length,
          name: node.name,
          originalId: id,
          originalNode: node,
        }
        node.clones.push(_node);
      } else {
        _node['clones'] = [];
      }

      if (!depthCache[node.depth]) {
        depthCache[node.depth] = {};
      }

      if (!depthCache[node.depth][id]) {
        depthCache[node.depth][id] = true;
        _node.x = scaleX(node.depth);
        _node.y = scaleY(Object.keys(depthCache[node.depth]).length);
      }
    }

    if (!graph[start]) {
      return;
    }

    graph[start].depth = 0;

    queue.push(start);
    visited[start] = true;

    while (queue.length > 0) {
      id = queue.shift();
      node = graph[id];

      processNode(id, node);
      for (i = node.children.length; i--;) {
        if (!visited[node.children[i]]) {
          queue.push(node.children[i]);
          visited[node.children[i]] = true;
          graph[node.children[i]].depth = node.depth + 1;
        } else {
          // Duplicate
          // Adding an _indicator_ node for user-controlled switching. Children
          // of duplicated nodes wont be processed at this time.
          processNode(
            node.children[i],
            graph[node.children[i]],
            true
          );
        }
      }
    }
  }

  /**
   * [ListGraph description]
   *
   * @method  ListGraph
   * @author  Fritz Lekschas
   * @date    2015-11-10
   *
   * @constructor
   * @param  {Array|Object}  size  New size. Can either be an Array, e.g.
   *   `[200,20]` or an Object, e.g. `{width: 200, height: 20}`.
   * @param  {Array|Object}  grid  New grid configuration. Can either be an
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

    console.log(this._size, this._grid);

    this.depthCache = {};

    return this;
  }

  ListGraph.prototype.process = function (data, rootIds) {
    this.data = data || this.data;
    this.rootIds = rootIds || this.rootIds;

    if (!isArray(this.rootIds)) {
      this.rootIds = [this.rootIds];
    }

    for (var i = this.rootIds.length; i--;) {
      walkGraph(
        this.data,
        this.rootIds[i],
        this.depthCache,
        this.scale.x,
        this.scale.y
      );
    }

    return nodeListToFatArray(this.data);
  }

  /**
   * Set or get the grid configuration.
   *
   * @method  grid
   * @author  Fritz Lekschas
   * @date    2015-11-10
   *
   * @public
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
   * @method  updateScaling
   * @author  Fritz Lekschas
   * @date    2015-11-10
   *
   * @public
   * @return  {Object}  Self.
   */
  ListGraph.prototype.updateScaling = function () {
    console.log(this._size);
    this.scale.x.domain([0, this._grid.columns]).range([0, this._size.width]);
    this.scale.y.domain([0, this._grid.rows]).range([0, this._size.height]);

    return this;
  }

  /**
   * Set or get the size of the layout.
   *
   * @method  size
   * @author  Fritz Lekschas
   * @date    2015-11-10
   *
   * @public
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
