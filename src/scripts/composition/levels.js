'use strict';

import * as d3 from 'd3';

const COLUMN_CLASS = 'column';
const SCROLL_CONTAINER_CLASS = 'scroll-container';

class Levels {
  constructor (selection, visData) {
    this.visData = visData;
    this.groups = selection
      .selectAll('g')
      .data(this.visData.nodes)
      .enter()
      .append('g')
        .attr('class', COLUMN_CLASS);

    // We need to add an empty rectangle that fills up the whole column to ensure
    // that the `g`'s size is at a maximum, otherwise scrolling will be halted
    // when the cursor leaves an actually drawn element.
    this.groups
      .append('rect')
        .attr('class', SCROLL_CONTAINER_CLASS)
        .attr('x', data => data.x)
        .attr('y', data => data.y)
        .attr('width', data => this.visData.global.column.width)
        .attr('height', data => this.visData.global.column.height);
  }

  scrollPreparation (vis, scrollbarWidth) {
    this.groups.each((data, index) => {
      let contentHeight = data.nodes.getBoundingClientRect().height +
        2 * this.visData.global.row.padding;
      let scrollHeight = contentHeight - this.visData.global.column.height;
      let scrollbarHeight = scrollHeight > 0 ?
        Math.max(
          (
            this.visData.global.column.height *
            this.visData.global.column.height /
            contentHeight
          ),
          10
        ) : 0;

      data.height = contentHeight;
      data.linkSelections = {
        incoming: index > 0 ?
          vis.selectByLevel(index - 1, '.link') : null,
        outgoing: vis.selectByLevel(index, '.link')
      };
      data.scrollHeight = scrollHeight;
      data.scrollTop = 0;
      data.scrollbar = {
        el: undefined,
        x: data.x + this.visData.global.column.width - scrollbarWidth,
        y: 0,
        width: scrollbarWidth,
        height: scrollbarHeight,
        scrollHeight: this.visData.global.column.height - scrollbarHeight,
        scrollTop: 0,
        heightScale: d3.scale.linear()
          .domain([0, scrollHeight])
          .range([0, this.visData.global.column.height - scrollbarHeight])
      };
      data.invertedHeightScale = data.scrollbar.heightScale.invert;
    });
  }

  updateScrollProperties () {
    this.groups.each((data, index) => {
      let contentHeight = data.nodes.getBoundingClientRect().height +
        2 * this.visData.global.row.padding;
      let scrollHeight = contentHeight - this.visData.global.column.height;
      let scrollbarHeight = scrollHeight > 0 ?
        Math.max(
          (
            this.visData.global.column.height *
            this.visData.global.column.height /
            contentHeight
          ),
          10
        ) : 0;

      data.height = contentHeight;
      data.scrollHeight = scrollHeight;
      data.scrollTop = 0;
      data.scrollbar.y = 0;
      data.scrollbar.height = scrollbarHeight;
      data.scrollbar.scrollHeight = this.visData.global.column.height -
        scrollbarHeight;
      data.scrollbar.scrollTop = 0;
      data.scrollbar.heightScale = d3.scale.linear()
        .domain([0, scrollHeight])
        .range([0, this.visData.global.column.height - scrollbarHeight]);
    });
  }

  get height () {
    return this.visData.global.column.height;
  }
}

export default Levels;