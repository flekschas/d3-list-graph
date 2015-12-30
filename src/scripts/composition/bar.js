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
    function setupMagnitude (selection) {
      let currentSorting = that.visData.nodes[that.nodeData.depth].sortBy;

      selection
        .attr('d', data => {
          return Bar.generatePath(data, currentSorting, that.visData);
        })
        .classed('bar-magnitude', true);
    }

    function setupBorder (selection) {
      selection
        .attr('x', 0)
        .attr('y', that.visData.global.row.padding)
        .attr('width', that.visData.global.column.contentWidth)
        .attr('height', that.visData.global.row.contentHeight)
        .attr('rx', 2)
        .attr('ry', 2)
        .classed('bar-border', true);
    }

    function setupIndicator (selection) {
      selection
        .attr('d', data => {
          return Bar.generatePath(data, undefined, that.visData, data.value);
        })
        .classed('bar-indicator', true);
    }

    this.selection
      .append('rect')
        .call(setupBorder);

    this.selection
      .append('path')
        .call(setupMagnitude);

    this.selection
      .append('path')
        .call(setupIndicator);
  }

  static generatePath (data, currentSorting, visData, indicator, adjustWidth) {
    let x = 0;

    let width = 2;

    let height = visData.global.row.contentHeight;

    let radius = {
      topLeft: 2,
      bottomLeft: 2,
    };

    if (indicator) {
      radius = {};
    }

    if (data.id !== currentSorting && typeof indicator === 'undefined') {
      x = data.value * visData.global.column.contentWidth - 3;
      radius = {};
    } else if (indicator) {
      x = indicator * visData.global.column.contentWidth;
      if (adjustWidth) {
        if (data.value < indicator) {
          x = data.value * visData.global.column.contentWidth;
        }
        width = Math.min(Math.abs(indicator - data.value), 2) *
          visData.global.column.contentWidth;
      }
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
