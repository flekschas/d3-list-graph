'use strict';

// Credits go to Mike Bostock: http://bl.ocks.org/mbostock/3468167
export function roundRect (x, y, width, height, radius) {
  let topLeft = 0;
  let topRight = 0;
  let bottomLeft = 0;
  let bottomRight = 0;

  try {
    topLeft = radius.topLeft || 0;
    topRight = radius.topRight || 0;
    bottomLeft = radius.bottomLeft || 0;
    bottomRight = radius.bottomRight || 0;
  } catch (e) {}

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
