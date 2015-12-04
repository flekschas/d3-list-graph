'use strict';

import * as d3 from 'd3';

const LINKS_CLASS = 'links';
const LINK_CLASS = 'link';

class Links {
  constructor (selection, visData, layout) {
    this.visData = visData;
    this.layout = layout;

    this.groups = selection.append('g')
      .attr('class', LINKS_CLASS)
      .call(selection => {
        selection.each(function (data, index) {
          d3.select(this.parentNode).datum().links = this;
        });
      });

    this.links = this.groups.selectAll(LINK_CLASS)
      .data((data, index) => {
        return this.layout.links(index);
      })
      .enter()
      .append('path')
        .attr('class', 'link')
        .attr('d', this.diagonal);
  }

  get diagonal () {
    return d3.svg.diagonal()
      .source(data => ({
        x: data.source.y + data.source.offsetY +
          this.visData.global.row.height / 2,
        y: data.source.x + data.source.offsetX +
          this.visData.global.column.contentWidth +
          this.visData.global.column.padding
      }))
      .target(data => ({
        x: data.target.y + data.target.offsetY +
          this.visData.global.row.height / 2,
        y: data.target.x + data.target.offsetX +
          this.visData.global.column.padding
      }))
      .projection(data => [data.y, data.x]);
  }

  scroll (selection, data) {
    selection
      .data(data)
      .attr('d', this.diagonal)
      .exit().remove();
  }
}

export default Links;
