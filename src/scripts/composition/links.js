'use strict';

// External
import * as d3 from 'd3';

// Internal
import * as config from './config';

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
      .source(data => {
        return {
          x: data.source.node.y + data.source.offsetY +
            this.visData.global.row.height / 2,
          y: data.source.node.x + data.source.offsetX +
            this.visData.global.column.contentWidth +
            this.visData.global.column.padding
        };})
      .target(data => ({
        x: data.target.node.y + data.target.offsetY +
          this.visData.global.row.height / 2,
        y: data.target.node.x + data.target.offsetX +
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

  sort (update) {
    let start = function () { d3.select(this).classed('sorting', true); };
    let end = function () { d3.select(this).classed('sorting', false); };

    this.links
      .data(update, data => data.id)
      .transition()
      .duration(config.TRANSITION_SEMI_FAST)
      .attr('d', this.diagonal)
      .each('start', start)
      .each('end', end);
  }
}

export default Links;
