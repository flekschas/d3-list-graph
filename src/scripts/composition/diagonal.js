'use strict';

export default function nodeDiagonal () {
  return d3.svg.diagonal()
    .projection(data => [data.y, data.x])
    .source(function (data) {
      return {
        x: data.source.y + data.source.offsetY + visData.global.row.height / 2,
        y: data.source.x + data.source.offsetX + visData.global.column.contentWidth + visData.global.column.padding
      };
    })
    .target(function (data) {
      return {
        x: data.target.y + data.target.offsetY + visData.global.row.height / 2,
        y: data.target.x + data.target.offsetX + visData.global.column.padding
      };
    })
    .projection(function (data) {
      return [data.y, data.x];
    });
}
