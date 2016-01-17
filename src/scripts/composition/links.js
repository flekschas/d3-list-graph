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

    this.links = this.groups.selectAll(LINK_CLASS + '-bg')
      .data((data, index) => {
        return this.layout.links(index);
      })
      .enter()
      .append('g')
        .attr('class', LINK_CLASS);

    this.links.append('path')
      .attr({
        'class': LINK_CLASS + '-bg',
        'd': this.diagonal
      });

    this.links.append('path')
      .attr({
        'class': LINK_CLASS + '-direct',
        'd': this.diagonal
      });
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

  highlight (nodeIds, highlight, className) {
    className = className ? className : 'hovering';

    this.links
      .data(nodeIds, data => data.id)
      .classed(className, highlight === false ? false : true);
  }

  scroll (selection, data) {
    // Update data of `g`.
    selection.data(data);

    // Next update all paths according to the new data.
    selection.selectAll('path').attr('d', this.diagonal);
  }

  sort (update) {
    let start = function () { d3.select(this).classed('sorting', true); };
    let end = function () { d3.select(this).classed('sorting', false); };

    // Update data of `g`.
    this.links.data(update, data => data.id);

    // Next update all paths according to the new data.
    this.links.selectAll('path')
      .transition()
      .duration(config.TRANSITION_SEMI_FAST)
      .attr('d', this.diagonal)
      .each('start', start)
      .each('end', end);
  }

  updateVisibility () {
    this.links.selectAll('path')
      .classed(
        'hidden', data => data.target.node.hidden || data.source.node.hidden
      )
      .transition()
      .duration(config.TRANSITION_SEMI_FAST)
      .attr('d', this.diagonal);
  }
}

export default Links;
