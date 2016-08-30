// External
import * as d3 from 'd3';  // eslint-disable-line import/no-unresolved
import isArray from '../../../node_modules/lodash-es/isArray';
import isFinite from '../../../node_modules/lodash-es/isFinite';
import isObject from '../../../node_modules/lodash-es/isObject';
import assign from '../../../node_modules/lodash-es/assign';

// Internal
import * as defaults from './defaults';
import { NoRootNodes } from './errors';
import traverseGraph from './process-nodes';

// Private variables
const _cellRelInnerPadding = defaults.CELL_REL_INNER_PADDING;
const _grid = {
  columns: defaults.GRID.columns,
  rows: defaults.GRID.rows
};
const _size = {
  width: defaults.SIZE.width,
  height: defaults.SIZE.height
};
const _links = {};

let _colRelPadding = defaults.COL_REL_PADDING;
let _rowRelPadding = defaults.ROW_REL_PADDING;
let _columnWidth;
let _rowHeight;
let _colAbsPadding;
let _colAbsContentWidth;
let _rowAbsPadding;
let _rowAbsContentHeight;
let _cellAbsInnerPadding;

class ListGraphLayout {
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
  constructor (size, grid) {
    this.scale = {
      x: d3.scaleLinear(),
      y: d3.scaleLinear(),
      linkPosition: {}
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
  nodesToMatrix (level) {
    const arr = [];

    let start = 0;
    let end = Object.keys(this.columnCache).length;

    if (isFinite(level)) {
      start = level;
      end = level + 1;
    }

    for (let i = start; i < end; i++) {
      arr.push({
        y: 0,
        x: this.scale.x(i),
        level: i,
        rows: [],
        sortBy: this.columnSorting[i].by,
        sortOrder: this.columnSorting[i].order
      });
      const keys = Object.keys(this.columnCache[i]);
      for (let j = keys.length; j--;) {
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
  process (data, rootIds, options) {
    this.data = data || this.data;
    this.rootIds = rootIds || this.rootIds;

    if (!isArray(this.rootIds)) {
      if (isFinite(this.rootIds)) {
        this.rootIds = [this.rootIds];
      } else {
        throw new NoRootNodes('No root node IDs specified.');
      }
    }

    const _options = assign({}, options);

    traverseGraph(
      this.data,
      this.rootIds,
      this.columnCache,
      this.columnNodeOrder,
      this.scale,
      _links
    );

    for (let i = Object.keys(this.columnCache).length; i--;) {
      this.columnSorting[i] = {};
    }

    if (_options.sortBy) {
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
  sort (level, property, sortOrder) {
    let itr = 0;
    let end = Object.keys(this.columnCache).length;
    let getValue;
    let sortProperty;

    // 1 = asc, -1 = desc [default]
    const numericSortOrder = sortOrder === 1 ? 1 : -1;

    switch (property) {
      case 'precision':
        sortProperty = 'precision';
        getValue = obj => obj.data.barRefs.precision;
        break;
      case 'recall':
        sortProperty = 'recall';
        getValue = obj => obj.data.barRefs.recall;
        break;
      default:
        getValue = obj => obj.data.name.toLowerCase();
        sortProperty = 'name';
        break;
    }

    if (isFinite(level)) {
      itr = level;
      end = level + 1;
    }

    for (itr; itr < end; itr++) {
      this.columnNodeOrder[itr].sort((a, b) => {  // eslint-disable-line no-loop-func
        const valueA = getValue(a);
        const valueB = getValue(b);

        if (valueA > valueB) {
          return numericSortOrder;
        }
        if (valueA < valueB) {
          return -numericSortOrder;
        }
        return 0;
      });

      this.columnSorting[itr].by = sortProperty;
      this.columnSorting[itr].order = numericSortOrder;

      // Update `y` according to the new position.
      for (let i = this.columnNodeOrder[itr].length; i--;) {
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
  compileGlobalProps () {
    return {
      column: {
        width: _columnWidth,
        height: _size.height,
        padding: _colAbsPadding,
        contentWidth: _colAbsContentWidth
      },
      row: {
        height: _rowHeight,
        padding: _rowAbsPadding,
        contentHeight: _rowAbsContentHeight
      },
      cell: {
        padding: _cellAbsInnerPadding
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
  nodes (level) {
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
  links (startLevel, endLevel) {
    let allLinks = [];

    let keys = [];

    if (!isFinite(startLevel)) {
      keys = Object.keys(this.data);
    } else {
      const normStartLevel = Math.max(startLevel, 0);
      const normEndLevel = isFinite(endLevel) ?
        Math.min(endLevel, Object.keys(this.columnCache).length) :
        normStartLevel + 1;

      for (let i = normStartLevel; i < normEndLevel; i++) {
        keys = keys.concat(Object.keys(this.columnCache[i]));
      }
    }

    for (let i = keys.length; i--;) {
      if (this.data[keys[i]].links) {
        allLinks = allLinks.concat(this.data[keys[i]].links.outgoing.refs);
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
  offsetLinks (level, offsetY, nodeType) {
    const links = this.links(level);

    if (
      (nodeType === 'source' || nodeType === 'target') &&
      isFinite(offsetY)
    ) {
      for (let i = links.length; i--;) {
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
  grid (newGrid) {
    if (!newGrid) {
      return _grid;
    }

    if (isArray(newGrid)) {
      _grid.columns = parseInt(newGrid[0], 10) || _grid.columns;
      _grid.rows = parseInt(newGrid[1], 10) || _grid.rows;
      this.updateScaling();
    }

    if (isObject(newGrid)) {
      _grid.columns = parseInt(newGrid.columns, 10) || _grid.columns;
      _grid.rows = parseInt(newGrid.rows, 10) || _grid.rows;
      this.updateScaling();
    }

    return this;
  }

  updateBars (graph) {
    const nodesId = Object.keys(graph);
    const barsData = [];

    for (let i = nodesId.length; i--;) {
      for (let j = graph[nodesId[i]].data.bars.length; j--;) {
        barsData.push({
          barId: nodesId[i] + '.' + graph[nodesId[i]].data.bars[j].id,
          id: graph[nodesId[i]].data.bars[j].id,
          value: graph[nodesId[i]].data.bars[j].value
        });
      }
    }

    return barsData;
  }

  /**
   * Update vertical position when filtering, i.e. hiding, nodes.
   *
   * @method  updateNodeVisibility
   * @author  Fritz Lekschas
   * @date    2016-01-17
   */
  updateNodesVisibility () {
    let skipped;

    for (let i = Object.keys(this.columnCache).length; i--;) {
      skipped = 0;
      // Update `y` according to the number of previously skipped nodes.
      for (let j = 0, len = this.columnNodeOrder[i].length; j < len; j++) {
        if (
          this.columnNodeOrder[i][j].hidden &&
          !this.columnNodeOrder[i][j].data.queryMode
        ) {
          skipped++;
        }
        this.columnNodeOrder[i][j].y = this.scale.y(j - skipped);
      }
    }

    return this;
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
  updateScaling () {
    this.scale.x.domain([0, _grid.columns]).range([0, _size.width]);
    this.scale.y.domain([0, _grid.rows]).range([0, _size.height]);

    _columnWidth = _size.width / _grid.columns;
    _rowHeight = _size.height / _grid.rows;

    _colAbsPadding = _columnWidth * _colRelPadding;
    _colAbsContentWidth = _columnWidth * (
      1 - (2 * _colRelPadding)
    );

    _rowAbsPadding = Math.max(_rowHeight * _rowRelPadding, 2);
    _rowAbsContentHeight = _rowHeight - (2 * _rowAbsPadding);

    _cellAbsInnerPadding = _cellRelInnerPadding * Math.min(
      _colAbsContentWidth,
      _rowAbsContentHeight,
      1
    );

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
  size (newSize) {
    if (!newSize) {
      return _size;
    }

    if (isArray(newSize)) {
      _size.width = parseInt(newSize[0], 10) || _size.width;
      _size.height = parseInt(newSize[1], 10) || _size.height;
      this.updateScaling();
    }

    if (isObject(newSize)) {
      _size.width = parseInt(newSize.width, 10) || _size.width;
      _size.height = parseInt(newSize.height, 10) || _size.height;
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
  columnPadding (padding, absolute) {
    if (!padding) {
      return _colRelPadding;
    }

    if (isFinite(padding)) {
      let relPadding = padding;
      if (absolute && isFinite(_columnWidth)) {
        relPadding = padding / _columnWidth;
      }
      _colRelPadding = Math.max(Math.min(relPadding, 0.66), 0.1);
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
  rowPadding (padding, absolute) {
    if (!padding) {
      return _rowRelPadding;
    }

    if (isFinite(padding)) {
      let relPadding = padding;
      if (absolute && isFinite(_rowHeight)) {
        relPadding = padding / _rowHeight;
      }
      _rowRelPadding = Math.max(Math.min(relPadding, 0.5), 0);
      this.updateScaling();
    }

    return this;
  }
}

export default ListGraphLayout;

