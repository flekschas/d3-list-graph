'use strict';

// Internal
import {roundRect} from './charts';

const BAR_CLASS = 'bar';

class Bar {
  constructor (selection, barData, nodeData, visData, bars) {
    let that = this;

    this.data = barData;
    this.nodeData = nodeData;
    this.visData = visData;
    this.bars = bars;

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
        .classed('active', data =>
          data.id === this.visData.nodes[this.nodeData.depth].sortBy);

    // Local helper method to avoid code duplication.
    // Calling a class method from within the consructor is possible but `this`
    // is not available. Thus, we need to create local function and pass in
    // `this` as `that`, which feels very hacky but it works.
    function setupMagnitude (selection) {
      let currentSorting = this.visData.nodes[this.nodeData.depth].sortBy;

      selection
        .attr('d', data => {
          return Bar.generatePath(
            data, this.bars.mode, currentSorting, this.visData
          );
        })
        .classed('bar-magnitude', true);
    }

    function setupBorder (selection) {
      selection
        .attr('x', 0)
        .attr('y', this.visData.global.row.padding)
        .attr('width', this.visData.global.column.contentWidth)
        .attr('height', this.visData.global.row.contentHeight)
        .attr('rx', 2)
        .attr('ry', 2)
        .classed('bar-border', true);
    }

    function setupIndicator (selection) {
      selection
        .attr('d', data => {
          return Bar.generatePath(
            data, this.bars.mode, undefined, this.visData, data.value
          );
        })
        .classed('bar-indicator', true);
    }

    this.selection
      .append('rect')
        .call(setupBorder.bind(this));

    this.selection
      .append('path')
        .call(setupMagnitude.bind(this));

    this.selection
      .append('path')
        .call(setupIndicator.bind(this));
  }

  static generatePath (
    data, mode, currentSorting, visData, indicator, adjustWidth, bottom
  ) {
    if (mode === 'two') {
      return Bar.generateTwoBarsPath(data, visData, bottom);
    } else {
      return Bar.generateOneBarPath(
        data, currentSorting, visData, indicator, adjustWidth
      );
    }
  }

  static generateOneBarPath (
    data, currentSorting, visData, indicator, adjustWidth
  ) {
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

  static generateTwoBarsPath (data, visData, bottom) {
    let height = visData.global.row.contentHeight / 2;

    let width = visData.global.column.contentWidth * data.value;

    let y = visData.global.row.padding;

    let radius = { topLeft: 2 };

    if (bottom) {
      radius = { bottomLeft: 2 };
      y += height;
    }

    return roundRect(
      0,
      y,
      width,
      height,
      radius
    );
  }
}

export default Bar;
