// Credits go to Mike Bostock: http://bl.ocks.org/mbostock/3468167
export function roundRect (x, y, width, height, radius) {
  const topLeft = radius.topLeft || 0;
  const topRight = radius.topRight || 0;
  const bottomLeft = radius.bottomLeft || 0;
  const bottomRight = radius.bottomRight || 0;

  return 'M' + (x + topLeft) + ',' + y +
    'h' + (width - topLeft - topRight) +
    'a' + topRight + ',' + topRight + ' 0 0 1 ' + topRight + ',' + topRight +
    'v' + (height - (topRight + bottomRight)) +
    'a' + bottomRight + ',' + bottomRight + ' 0 0 1 ' + -bottomRight + ',' + bottomRight +
    'h' + (bottomLeft - (width - bottomRight)) +
    'a' + bottomLeft + ',' + bottomLeft + ' 0 0 1 ' + -bottomLeft + ',' + -bottomLeft +
    'v' + (topLeft - (height - bottomLeft)) +
    'a' + topLeft + ',' + topLeft + ' 0 0 1 ' + topLeft + ',' + -topLeft +
    'z';
}

/**
 * Creates a path that looks like a drop menu
 *
 * @example
 * The following is an example how to create a drop menu path:
 * ```javascript
 * import { dropMenu } from './charts';
 * const dropMenuPath = dropMenu({
 *   x: 0,
 *   y: 0,
 *   width: 50,
 *   height: 100,
 *   radius: 5,
 *   arrowSize: 5
 * });
 * ```
 *
 * @method  dropMenu
 * @author  Fritz Lekschas
 * @date    2016-03-03
 * @param   {Object}  c  Config object that needs to contain the following
 *   properties: x, y, width, height, radius and arrowSize.
 */
export function dropMenu (c) {
  return 'M' + (c.x + c.radius) + ',' + c.y +
    'h' + (c.width - (c.radius * 2)) +
    'a' + c.radius + ',' + c.radius + ' 0 0 1 ' + c.radius + ',' + c.radius +
    'v' + (c.height - (c.radius * 2)) +
    'a' + c.radius + ',' + c.radius + ' 0 0 1 ' + -c.radius + ',' + c.radius +
    'h' + (-(c.width - (c.radius * 2) - (c.arrowSize * 2)) / 2) +
    'l' + (-c.arrowSize) + ',' + (c.arrowSize) +
    'l' + (-c.arrowSize) + ',' + (-c.arrowSize) +
    'h' + (-(c.width - (c.radius * 2) - (c.arrowSize * 2)) / 2) +
    'a' + c.radius + ',' + c.radius + ' 0 0 1 ' + -c.radius + ',' + -c.radius +
    'v' + (c.radius - (c.height - c.radius)) +
    'a' + c.radius + ',' + c.radius + ' 0 0 1 ' + c.radius + ',' + -c.radius +
    'z';
}
