/**
 * Default size
 *
 * @constant
 * @default
 * @type  {Object}
 */
export const SIZE = {
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
export const GRID = {
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
export const COL_REL_PADDING = 0.2;

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
export const ROW_REL_PADDING = 0.05;

/**
 * Default inner padding of a cell relative to the shorter dimension, e.g.
 * width or height.
 *
 * @type  {Number}
 */
export const CELL_REL_INNER_PADDING = 0.05;
