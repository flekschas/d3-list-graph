'use strict';

// Internal
import {roundRect} from './charts';

const BAR_CLASS = 'bar';

class Bar {
  constructor (selection, barData, nodeData, visData) {
    let that = this;

    this.data = barData;
    this.nodeData = nodeData;
    this.visData = visData;

    this.data.x = nodeData.x;
    this.data.level = nodeData.depth;

    this.height = this.visData.global.row.contentHeight /
      (this.data.length * 2) -
      this.visData.global.cell.padding * 2;

    this.activeHeight = this.visData.global.row.contentHeight - 2;

    this.inactiveheight = this.visData.global.cell.padding * 2 - 1;

    this.selection = selection.selectAll(BAR_CLASS)
      .data(this.data)
      .enter()
      .append('g')
        .attr('class', data => BAR_CLASS + ' ' + data.id)
        .classed('active', data => data.id === this.visData.nodes[this.nodeData.depth].sortBy);

    // Local helper method to avoid code duplication.
    // Calling a class method from within the consructor is possible but `this`
    // is not available. Thus, we need to create local function and pass in
    // `this` as `that`, which feels very hacky but it works.
    function setupMagnitude (selection, className) {
      let currentSorting = that.visData.nodes[that.nodeData.depth].sortBy;

      selection
        .attr('d', data => {
          return Bar.generatePath(data, currentSorting, that.visData);
        })
        .classed(className, true);
    }

    function setupBorder (selection, className) {
      selection
        .attr('x', 0)
        .attr('y', that.visData.global.row.padding)
        .attr('width', that.visData.global.column.contentWidth)
        .attr('height', that.visData.global.row.contentHeight)
        .attr('rx', 2)
        .attr('ry', 2)
        .classed(className, true);
    }

    this.selection
      .append('rect')
        .call(setupBorder, 'bar-border');

    this.selection
      .append('path')
        .call(setupMagnitude, 'bar-magnitude');
  }

  static generatePath (data, currentSorting, visData) {
    let x = 0;

    let width = 2;

    let height = visData.global.row.contentHeight;

    let radius = {
      topLeft: 2,
      bottomLeft: 2,
    };

    if (data.id !== currentSorting) {
      x += data.value * visData.global.column.contentWidth - 3;
      radius = {};
    } else {
      width = visData.global.column.contentWidth * data.value;
    }

    return roundRect(
      x,
      visData.global.row.padding,
      width,
      height,
      radius
    );
  }
}

export default Bar;
