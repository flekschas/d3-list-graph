'use strict';

const BAR_CLASS = 'bar';

class Bar {
  constructor (selection, barData, nodeData, visData) {
    let that = this;

    this.data = barData;
    this.nodeData = nodeData;
    this.visData = visData;

    this.height = this.visData.global.row.contentHeight /
      (this.nodeData.data.bars.length * 2) -
      this.visData.global.cell.padding * 2;

    this.selection = selection.selectAll(BAR_CLASS)
      .data(this.data)
      .enter()
      .append('g')
        .attr('class', data => BAR_CLASS + ' ' + data.id);

    // Local helper method to avoid code duplication.
    // Calling a class method from within the consructor is possible but `this`
    // is not available. Thus, we need to create local function and pass in
    // `this` as `that`, which feels very hacky but it works.
    function setup (selection, className, magnitude) {
      selection
        .attr('x', that.nodeData.x + that.visData.global.column.padding +
          that.visData.global.cell.padding)
        .attr('y', function (data, i) {
          return that.visData.global.row.padding +
            that.visData.global.row.contentHeight / 2 +
            that.height * i +
            that.visData.global.cell.padding * (1 + 2 * i);
        })
        .attr('width', function (data) {
          return (magnitude ? data.value : 1) *
            (
              that.visData.global.column.contentWidth -
              that.visData.global.cell.padding * 2
            );
        })
        .attr('height', that.height)
        .classed(className, true);
    }

    this.selection
      .append('rect')
        .call(setup, 'bar-border');

    this.selection
      .append('rect')
        .call(setup, 'bar-magnitude', true);
  }
}

export default Bar;
