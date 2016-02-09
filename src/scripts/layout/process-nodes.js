// External
import isArray from '../../../node_modules/lodash-es/lang/isArray.js';
import isObject from '../../../node_modules/lodash-es/lang/isObject.js';

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
function traverseGraph (graph, starts, columnCache, nodeOrder, links, scaleX,
  scaleY) {
  const visited = {};
  const queue = [];

  let child;
  let childId;
  let clone;
  let node;
  let cloneId;

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
  function processBars (node) {  // eslint-disable-line no-shadow
    if (node.data.bars) {
      if (isArray(node.data.bars)) {
        node.data.barRefs = {};
        for (let i = 0, len = node.data.bars.length; i < len; i++) {
          node.data.bars[i].value = Math.max(
            Math.min(node.data.bars[i].value, 1),
            0
          );
          node.data.bars[i].barId = node.id + '.' + node.data.bars[i].id;
          node.data.barRefs[node.data.bars[i].id] = node.data.bars[i].value;
        }
      } else if (isObject(node.data.bars)) {
        const bars = [];
        const keys = Object.keys(node.data.bars);
        // Keep the old object reference for quick access, e.g.
        // `node.data.barRefs.precision`
        node.data.barRefs = {};
        for (let i = 0, len = keys.length; i < len; i++) {
          node.data.barRefs[keys[i]] = Math.max(
            Math.min(node.data.bars[keys[i]], 1),
            0
          );
          bars.push({
            barId: node.id + '.' + keys[i],
            id: keys[i],
            value: node.data.barRefs[keys[i]],
          });
        }
        node.data.bars = bars;
      }
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
      id: '(' + source.id + ')->(' + target.id + ')',
      source: {
        node: source,
        offsetX: 0,
        offsetY: 0,
      },
      target: {
        node: target,
        offsetX: 0,
        offsetY: 0,
      },
    });
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
  function processNode (id, node, parent, duplication) {  // eslint-disable-line no-shadow
    let _id = id.toString();
    let _node = node;

    if (duplication) {
      if (parent.depth + 1 !== node.depth) {
        cloneId = id + '.' + (node.clones.length + 1);
        graph[cloneId] = {
          children: [],
          clone: true,
          cloneId: node.clones.length + 1,
          // Data will be referenced rather than copied to avoid inconsistencies
          data: node.data,
          originalId: id.toString(),
          // Reference to the original node
          originalNode: node,
        };
        _id = cloneId;
        _node = graph[cloneId];
        // Add a reference to the original node that points to the clone.
        node.clones.push(_node);
        // Remove parent
        node.parents[parent.id] = undefined;
        delete node.parents[parent.id];
      }
    } else {
      _node.clones = [];
    }

    _node.id = _id;

    if (!_node.parents) {
      _node.parents = {};
    }
    if (parent) {
      _node.parents[parent.id] = parent;
    } else {
      _node.parents = {};
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

  function addSiblings () {
    for (let i = starts.length; i--;) {
      for (let j = starts.length; j--;) {
        if (i !== j) {
          if (!graph[starts[i]].siblings) {
            graph[starts[i]].siblings = {};
          }
          graph[starts[i]].siblings[starts[j]] = graph[starts[j]];
        }
      }
    }
  }

  // BFS for each start node.
  for (let i = starts.length; i--;) {
    if (!graph[starts[i]]) {
      return;
    }

    processNode(starts[i], graph[starts[i]]);

    queue.push(starts[i]);
    visited[starts[i]] = true;

    while (queue.length > 0) {
      node = graph[queue.shift()];

      for (let j = node.children.length; j--;) {
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

  addSiblings();
}

export { traverseGraph as default };
