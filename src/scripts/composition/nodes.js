'use strict';

// External
import * as d3 from 'd3';

// Internal
import Bars from './bars';
import * as traverse from './traversal';

const NODES_CLASS = 'nodes';
const NODE_CLASS = 'node';
const CLONE_CLASS = 'clone';

class Nodes {
  constructor (baseSelection, visData) {
    let that = this;

    this.visData = visData;

    this.groups = baseSelection.append('g')
      .attr('class', NODES_CLASS)
      .call(selection => {
        selection.each(function (data, index) {
          d3.select(this.parentNode).datum().nodes = this;
        });
      });

    this.nodes = this.groups
      .selectAll('.' + NODE_CLASS)
      .data(data => data.rows)
      .enter()
      .append('g')
        .classed(NODE_CLASS, true)
        .classed(CLONE_CLASS, data => data.clone);

    this.nodes
      .append('rect')
        .attr('x', data => data.x + this.visData.global.column.padding)
        .attr('y', data => data.y + this.visData.global.row.padding)
        .attr('width', this.visData.global.column.contentWidth)
        .attr('height', this.visData.global.row.contentHeight)
        .attr('rx', 2)
        .attr('ry', 2)
        .classed('bg', true);

    this.nodes.on('mouseenter', function (data) {
      that.mouseEnter(this, data);
    });

    this.nodes.on('mouseleave', function (data) {
      that.mouseLeave(this, data);
    });

    // Add node label
    this.nodes.call(selection => {
      selection.append('foreignObject')
        .attr('x', data => data.x + this.visData.global.column.padding +
          this.visData.global.cell.padding)
        .attr('y', data => data.y + this.visData.global.row.padding +
          this.visData.global.cell.padding)
        .attr('width', this.visData.global.column.contentWidth)
        .attr('height', this.visData.global.row.contentHeight / 2 -
          this.visData.global.cell.padding * 2)
        .attr('class', 'label-wrapper')
        .append('xhtml:div')
          .attr('class', 'label')
          .attr('title', data => data.data.name)
          .append('xhtml:span')
            .text(data => data.data.name);
    });

    this.bars = new Bars(this.nodes, this.visData);
  }

  mouseEnter (el, data) {
    data.hovering = 1;
    traverse.upAndDown(data, data => data.hovering = 2);

    d3.select(el).classed('hovering-directly', true);
    this.nodes.classed('hovering-indirectly', data => data.hovering === 2);
  }

  mouseLeave (el, data) {
    data.hovering = 0;
    traverse.upAndDown(data, data => data.hovering = 0);

    d3.select(el).classed('hovering-directly', false);
    this.nodes.classed('hovering-indirectly', false);
  }
}

export default Nodes;
