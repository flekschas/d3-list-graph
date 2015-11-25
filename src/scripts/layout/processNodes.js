'use strict';

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
function traverseGraph (graph, starts, columnCache, links, scaleX, scaleY) {
  let j;
  let child;
  let childId;
  let clone;
  let node;
  let visited = {};
  let queue = [];
  let cloneId;

  /**
   * Ensure that the bar values are in [0,1] and that the structure of `bars`
   * is unified.
   *
   * @description
   * Each node can feature a number of bars representing something. The layout
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
  function processBars (node) {
    if (node.data.bars) {
      if (isArray(node.data.bars)) {
        for (let i = node.data.bars.length; i--;) {
          node.data.bars[i].value = Math.max(
            Math.min(node.data.bars[i].value, 1),
            0
          );
        }
      } else if (isObject(node.data.bars)) {
        let bars = [];
        let keys = Object.keys(node.data.bars);
        for (let i = keys.length; i--;) {
          node.data.bars[keys[i]] = Math.max(
            Math.min(node.data.bars[keys[i]], 1),
            0
          );
          bars.push({
            id: keys[i],
            value: node.data.bars[keys[i]]
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
  function processNode (id, node, parent, duplication) {
    let _id = id;
    let _node = node;

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
      };
      _id = cloneId;
      _node = graph[cloneId];
      // Add a reference to the original node that points to the clone.
      node.clones.push(_node);
    } else {
      _node['clones'] = [];
    }

    _node.parent = parent;

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
    }

    if (!columnCache[_node.depth][_id]) {
      columnCache[_node.depth][_id] = true;
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
  function processLink (source, target) {
    source.links.push({
      source: {
        x: source.x,
        y: source.y,
        offsetX: 0,
        offsetY: 0
      },
      target: {
        x: target.x,
        y: target.y,
        offsetX: 0,
        offsetY: 0
      }
    });
  }

  // BFS for each start node.
  for (let i = starts.length; i--;) {
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

export {traverseGraph as default};
