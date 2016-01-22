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
