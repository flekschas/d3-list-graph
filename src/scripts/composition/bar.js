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

    this.height = this.visData.global.row.contentHeight /
      (this.data.length * 2) -
      this.visData.global.cell.padding * 2;

    this.activeHeight = this.visData.global.row.contentHeight - 2;

    this.inactiveheight = this.visData.global.cell.padding * 2 - 1;

    this.selection = selection.selectAll(BAR_CLASS)
      .data(this.data)
      .enter()
      .append('g')
        .attr('class', data => BAR_CLASS + ' ' + data.id);

    // Local helper method to avoid code duplication.
    // Calling a class method from within the consructor is possible but `this`
    // is not available. Thus, we need to create local function and pass in
    // `this` as `that`, which feels very hacky but it works.
    function setupMagnitude (selection, className) {
      selection
        .attr('d', (data, index) => {
          let x = that.nodeData.x + that.visData.global.column.padding;

          if (data.id !== 'precision') {
            x += data.value * that.visData.global.column.contentWidth;
          }

          let y = that.visData.global.row.padding;

          let width = 1;
          if (data.id === 'precision') {
            width = that.visData.global.column.contentWidth * data.value;
          }

          let height = that.visData.global.row.contentHeight;

          let radius = {
            topLeft: 2,
            bottomLeft: 2,
          };

          return roundRect(x, y, width, height, radius);
        })
        .classed(className, true);
    }

    function setupBorder (selection, className) {
      selection
        .attr('x', that.nodeData.x + that.visData.global.column.padding)
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
}

export default Bar;
