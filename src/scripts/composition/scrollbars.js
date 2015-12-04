'use strict';

import * as d3 from 'd3';

import isObject from '../../../node_modules/lodash-es/lang/isObject.js';

const SCROLLBAR_CLASS = 'scrollbar';

class Scrollbars {
  constructor (baseSelection, visData, width) {
    this.visData = visData;
    this.width = width;

    // Add empty scrollbar element
    this.selection = baseSelection
      .append('rect')
        .attr('class', SCROLLBAR_CLASS)
        .call(selection => {
          selection.each(function (data, index) {
            d3.select(this.parentNode).datum().scrollbar.el = this;
          });
        })
        .attr('x', data => data.scrollbar.x)
        .attr('y', data => data.scrollbar.y)
        .attr('width', data => this.width)
        .attr('height', data => data.scrollbar.height)
        .attr('rx', this.width / 2)
        .attr('ry', this.width / 2)
        .classed('ready', true);
  }
}

export default Scrollbars;
