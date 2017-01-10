export const CLASSNAME = 'list-graph';

/**
 * Width of the scrollbar in pixel.
 *
 * @type  {Number}
 */
export const SCROLLBAR_WIDTH = 6;

/**
 * Default number of columns
 *
 * @type  {Number}
 */
export const COLUMNS = 5;

/**
 * Default number of rows.
 *
 * @type  {Number}
 */
export const ROWS = 5;

/**
 * Path to the icon file. An empty path is equal to inline SVG.
 *
 * @type  {String}
 */
export const ICON_PATH = '';

/**
 * Default sort order.
 *
 * @description
 * -1 = desc, 1 = asc
 *
 * @type  {Number}
 */
export const DEFAULT_SORT_ORDER = -1;

/**
 * Default bar display mode.
 *
 * @type  {String}
 */
export const DEFAULT_BAR_MODE = 'one';

/**
 * Default highlighting of the active level.
 *
 * @type  {Boolean}
 */
export const HIGHLIGHT_ACTIVE_LEVEL = true;

/**
 * Default active level.
 *
 * @type  {Number}
 */
export const ACTIVE_LEVEL = 0;

/**
 * Default difference when no custom root is queried for.
 *
 * @type  {Number}
 */
export const NO_ROOT_ACTIVE_LEVEL_DIFF = 0;

/**
 * Default querying.
 *
 * @type  {Boolean}
 */
export const QUERYING = false;

/**
 * Default value for hiding links pointing to nodes outside the visible area.
 *
 * @type  {Boolean}
 */
export const HIDE_OUTWARDS_LINKS = false;

/**
 * Default value for showing the link indicator bar when links to hidden nodes
 * are hidden.
 *
 * @type  {Boolean}
 */
export const SHOW_LINK_LOCATION = false;

/**
 * Default for disabling debouncing of the node context menu.
 *
 * @type  {Boolean}
 */
export const DISABLE_DEBOUNCED_CONTEXT_MENU = false;

/**
 * Default transition speed in milliseconds for super fast transition.
 *
 * @type  {Number}
 */
export const TRANSITION_LIGHTNING_FAST = 150;

/**
 * Default transition speed in milliseconds for fast transition.
 *
 * @type  {Number}
 */
export const TRANSITION_FAST = 200;
/**
 * Default transition speed in milliseconds for semi-fast transition.
 *
 * @type  {Number}
 */
export const TRANSITION_SEMI_FAST = 250;
/**
 * Default transition speed in milliseconds for normal transition.
 *
 * @type  {Number}
 */
export const TRANSITION_NORMAL = 333;
/**
 * Default transition speed in milliseconds for slow transition.
 *
 * @type  {Number}
 */
export const TRANSITION_SLOW = 666;
/**
 * Default transition speed in milliseconds for slow transition.
 *
 * @type  {Number}
 */
export const TRANSITION_SLOWEST = 1;

/**
 * Strength of how much links should be bundled.
 *
 * @description
 * The value ranges from 0 (no bundling at all) to 1 (move line through every
 * controll point).
 *
 * @type  {Number}
 */
export const LINK_BUNDLING_STRENGTH = 0.95;

/**
 * Stretch out factor for link bundling.
 *
 * @description
 * The value ranges from 0 (no stretch out at all) to 1 (which means the two
 * middle control points defining the B-Spline are identical).
 *
 * @type  {Number}
 */
export const LINK_BUNDLING_STRETCH = 0.333;
