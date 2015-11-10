d3.layout.listGraph = function() {
  var depthCache = {};
  var nodeCache = {};

  // Lodash
  function isArray (value) {
    return Array.isArray(value);
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
  function walkGraph (graph, start) {
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
        _node.x = node.depth;
        _node.y = Object.keys(depthCache[node.depth]).length;
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

      console.log(depthCache);
    }
  }

  function ListGraph (data, rootIds) {
    var i;

    if (!isArray(rootIds)) {
      rootIds = [rootIds];
    }

    for (i = rootIds.length; i--;) {
      walkGraph(data, rootIds[i], 0);
    }

    return nodeListToFatArray(data);
  }

  ListGraph.prototype.size = function (newSize) {
    if (!arguments.length) {
      return gridSize;
    }

    gridSize = newSize;
    return this;
  }

  return ListGraph;
}
