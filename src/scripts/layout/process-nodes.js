// External
import isArray from '../../../node_modules/lodash-es/isArray';
import isObject from '../../../node_modules/lodash-es/isObject';

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
 * @param  {Object}  scale  D3 linear scale functions for the
 *    x-axis (columns), y-axis (rows) and other stuff.
 * œparam  {Object}  links  Object storing links data.
 */
function traverseGraph (graph, starts, columnCache, nodeOrder, scale, links) {
  const visited = {};
  const queue = [];

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
  function processBars (node) {
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
            value: node.data.barRefs[keys[i]]
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
    const id = '(' + source.id + ')->(' + target.id + ')';

    links[id] = {
      id,
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
    };

    source.links.outgoing.refs.push(links[id]);
    target.links.incoming.refs.push(links[id]);

    source.links.outgoing.total++;
    target.links.incoming.total++;
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
   * @param  {Boolean}  duplication  If `true` node needs to be duplicated or
   *   cloned.
   */
  function processNode (id, node, parent, duplication) {
    let _id = id.toString();
    let _node = node;
    let skip = false;

    if (duplication) {
      // Check if there is already another clone on the same level. If so, skip
      // creating a new clone. The rationale is to have only one clone per
      // level.
      for (let i = node.clones.length; i--;) {
        if (node.clones[i].depth === parent.depth + 1) {
          skip = true;
          _id = node.clones[i].cloneId;
          _node = node.clones[i];
          break;
        }
      }

      // Clone node only when the parent is **not** just one level before the
      // clone because then the parent can simple link to the _original node_.
      if (parent.depth + 1 !== node.depth && !skip) {
        const cloneId = id + '.' + (node.clones.length + 1);
        graph[cloneId] = {
          children: [],
          clone: true,
          cloneId,
          cloneNum: node.clones.length + 1,
          // Data will be referenced rather than copied to avoid inconsistencies
          data: node.data,
          originalId: id.toString(),
          // Reference to the original node
          originalNode: node
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

    if (!_node.data.state) {
      _node.data.state = {};
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
      _node.links = {
        incoming: {
          refs: [],
          above: 0,
          below: 0,
          total: 0
        },
        outgoing: {
          refs: [],
          above: 0,
          below: 0,
          total: 0
        }
      };
    }

    if (!columnCache[_node.depth]) {
      columnCache[_node.depth] = {};
      nodeOrder[_node.depth] = [];
    }

    if (!columnCache[_node.depth][_id]) {
      columnCache[_node.depth][_id] = true;
      nodeOrder[_node.depth].push(_node);
      _node.x = scale.x(_node.depth);
      _node.y = scale.y(Object.keys(columnCache[_node.depth]).length - 1);
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
      const node = graph[queue.shift()];

      for (let j = node.children.length; j--;) {
        const childId = node.children[j];
        const child = graph[childId];

        if (child) {
          let clone = true;

          if (!visited[childId]) {
            queue.push(childId);
            visited[childId] = true;
            clone = false;
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
