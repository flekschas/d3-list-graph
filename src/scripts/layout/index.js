'use strict';

import d3 from 'd3';
import isArray from '../../../node_modules/lodash-es/lang/isArray.js';
import isFinite from '../../../node_modules/lodash-es/lang/isFinite.js';
import isObject from '../../../node_modules/lodash-es/lang/isObject.js';
import traverseGraph from './processNodes.js';

/**
 * Default size
 *
 * @constant
 * @default
 * @type  {Object}
 */
const SIZE = {
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
const GRID = {
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
const COL_REL_PADDING = 0.2;

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
const ROW_REL_PADDING = 0.05;

/**
 * Default inner padding of a cell relative to the shorter dimension, e.g.
 * width or height.
 *
 * @type  {Number}
 */
const CELL_REL_INNER_PADDING = 0.05;

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
   * @method  nodesToMatrix
   * @memberOf  ListGraph
   * @public
   * @return  {Array}  Fat array of arrays of nodes.
   */
  nodesToMatrix () {
    let arr = [];
    let keys;
    let numLevels = Object.keys(this.columnCache).length;

    for (let i = 0; i < numLevels; i++) {
      arr.push({
        y: 0,
        x: this.scale.x(i),
        level: i,
        rows: []
      });
      keys = Object.keys(this.columnCache[i]);
      for (let j = keys.length; j--;) {
        arr[i].rows.push(this.data[keys[j]]);
      }
    }

    return arr;
  }

  /**
   * Process original data and return an D3 ready Array.
   *
   * @author  Fritz Lekschas
   * @date  2015-11-16
   *
   * @method  process
   * @memberOf  ListGraph
   * @public
   * @category  Data
   * @param  {Object}  data  Object list of nodes.
   * @param  {Array}  rootIds  Array of node IDs to start traversal.
   * @return  {Array}  Array of Array of nodes.
   */
  process (data, rootIds) {
    this.data = data || this.data;
    this.rootIds = rootIds || this.rootIds;

    if (!isArray(this.rootIds)) {
      this.rootIds = [this.rootIds];
    }

    traverseGraph(
      this.data,
      this.rootIds,
      this.columnCache,
      this.links,
      this.scale.x,
      this.scale.y
    );

    return {
      global: this.compileGlobalProps(),
      nodes: this.nodesToMatrix()
    };
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
   * @return  {Array}  Array of Array of nodes.
   */
  nodes () {
    return this.nodesToMatrix();
  }

  /**
   * Returns an array of links per level, i.e. column, or all links.
   *
   * @description
   * The column ID and level might be the same for small graphs but it's
   * possible that the first column does not represent the root nodes. This is
   * obviously the case when the user scrolls away.
   *
   * @author  Fritz Lekschas
   * @date  2015-11-17
   *
   * @method  links
   * @memberOf  ListGraph
   * @public
   * @category  Data
   * @param  {Integer}  level  If given get's only links of a certain level. The
   *   level of a node is relative to the length of the shortest path to the
   *   root node.
   * @return  {Array}  Array of objects containing the information for outgoing
   *   links.
   */
  links (level) {
    let allLinks = [], source, keys, nodeLinks;

    if (!isFinite(level)) {
      source = this.data;
    } else {
      source = this.columnCache[level];
    }

    keys = source ? Object.keys(source) : [];

    for (let i = keys.length; i--;) {
      nodeLinks = this.data[keys[i]].links;
      for (let j = nodeLinks.length; j--;) {
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
  offsetLinks (level, offsetY, nodeType) {
    let links = this.links(level);

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
    if (!arguments.length) {
      return this._grid;
    }

    if (isArray(newGrid)) {
      this._grid.columns = parseInt(newGrid[0]) || this._grid.columns;
      this._grid.rows = parseInt(newGrid[1]) || this._grid.rows;
      this.updateScaling();
    }

    if (isObject(newGrid)) {
      this._grid.columns = parseInt(newGrid.columns)|| this._grid.columns;
      this._grid.rows = parseInt(newGrid.rows)|| this._grid.rows;
      this.updateScaling();
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
    this.scale.x.domain([0, this._grid.columns]).range([0, this._size.width]);
    this.scale.y.domain([0, this._grid.rows]).range([0, this._size.height]);

    this._columnWidth = this._size.width / this._grid.columns;
    this._rowHeight = this._size.height / this._grid.rows;

    this._colAbsPadding = this._columnWidth * this._colRelPadding;
    this._colAbsContentWidth = this._columnWidth * (
      1 - 2 * this._colRelPadding
    );

    this._rowAbsPadding = this._rowHeight * this._rowRelPadding;
    this._rowAbsContentHeight = this._rowHeight * (
      1 - 2 * this._rowRelPadding
    );

    this._cellAbsInnerPadding = this._cellRelInnerPadding * Math.min(
      this._colAbsContentWidth,
      this._rowAbsContentHeight
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
  columnPadding (padding, absolute) {
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
  rowPadding (padding, absolute) {
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
}

export default ListGraphLayout;
