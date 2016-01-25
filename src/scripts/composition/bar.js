// Internal
import { roundRect } from './charts';

const BAR_CLASS = 'bar';

class Bar {
  constructor (barGroup, barData, nodeData, visData, bars) {
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

    this.selection = barGroup.selectAll(BAR_CLASS)
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
      const currentSorting = this.visData.nodes[this.nodeData.depth].sortBy;

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

    function setupIndicatorBg (selection) {
      selection
        .attr('d', data => {
          return Bar.generatePath(
            data, this.bars.mode, undefined, this.visData, data.value
          );
        })
        .classed('bar-indicator-bg', true);
    }

    function setupIndicator (selection) {
      selection
        .attr({
          class: 'bar-indicator',
          x: 0,
          y: this.visData.global.row.padding,
          width: 2,
          height: this.visData.global.row.contentHeight,
        });
    }

    this.selection
      .append('rect')
        .call(setupBorder.bind(this));

    this.selection
      .append('path')
        .call(setupMagnitude.bind(this));

    this.selection
      .append('path')
        .call(setupIndicatorBg.bind(this));

    this.selection
      .append('rect')
        .call(setupIndicator.bind(this));
  }

  static updateIndicator (selection, contentWidth, referenceValue) {
    selection
      .attr(
        'x',
        Math.min(
          contentWidth * Math.min(referenceValue, 1),
          contentWidth - 2
        )
      )
      .classed('positive', data => data.value >= referenceValue);
  }

  static generatePath (
    data, mode, currentSorting, visData, indicator, adjustWidth, bottom
  ) {
    if (mode === 'two') {
      return Bar.generateTwoBarsPath(data, visData, bottom);
    }
    return Bar.generateOneBarPath(
      data, currentSorting, visData, indicator, adjustWidth
    );
  }

  static generateOneBarPath (
    data, currentSorting, visData, indicator, adjustWidth
  ) {
    const height = visData.global.row.contentHeight;
    const normValue = Math.min(data.value, 1);
    const normIndicator = Math.min(indicator, 1);

    let x = 0;
    let width = 2;

    let radius = {
      topLeft: 2,
      bottomLeft: 2,
    };

    if (indicator) {
      radius = {};
    }

    if (data.id !== currentSorting && typeof indicator === 'undefined') {
      x = normValue * visData.global.column.contentWidth - 3;
      radius = {};
    } else if (indicator) {
      x = normIndicator * visData.global.column.contentWidth;
      if (adjustWidth) {
        if (normValue < normIndicator) {
          x = normValue * visData.global.column.contentWidth;
        }
        width = Math.max(
          Math.abs(normIndicator - normValue) *
            visData.global.column.contentWidth
          , 2
        );
      }
    } else {
      width = visData.global.column.contentWidth * normValue;
    }

    x = Math.min(x, visData.global.column.contentWidth - 2);

    return roundRect(
      x,
      visData.global.row.padding,
      width,
      height,
      radius
    );
  }

  static generateTwoBarsPath (data, visData, bottom) {
    const normValue = Math.min(data.value, 1);
    const height = visData.global.row.contentHeight / 2;
    const width = visData.global.column.contentWidth * normValue;

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
