// External
import * as d3 from 'd3';  // eslint-disable-line import/no-unresolved

// Internal
import Bar from './bar';
import * as config from './config';
import { roundRect } from '../commons/charts';

const BARS_CLASS = 'bars';

class Bars {
  constructor (vis, selection, mode, visData) {
    const that = this;

    this.vis = vis;
    this.mode = mode;
    this.visData = visData;

    this.indicatorX = d3.scale.linear()
      .domain([0, 1])
      .range([1, this.visData.global.column.contentWidth - 3]);

    this.selection = selection.append('g').attr('class', BARS_CLASS);

    this.selection.each(function (datum) {
      new Bar(d3.select(this), datum.data.bars, datum, that.visData, that);
    });
  }

  updateAll (update, sortBy) {
    this.selection.selectAll('.bar-magnitude')
      .data(update, data => data.barId)
      .transition()
      .duration(config.TRANSITION_SEMI_FAST)
      .attr('d', data => this.generatePath(
        data, this.mode, sortBy, this.visData
      ));
  }

  update (selection, sortBy) {
    selection.each(function (data) {
      const el = d3.select(this);

      if (data.id === sortBy && !el.classed('active')) {
        el.classed('active', true);
        // Ensure that the active bars we are places before any other bar,
        // thus placing them in the background
        this.parentNode.insertBefore(
          this,
          this.parentNode.children[0]
        );
      }

      if (data.id !== sortBy) {
        el.classed('active', false);
      }
    });

    selection.selectAll('.bar-magnitude')
      .transition()
      .duration(config.TRANSITION_SEMI_FAST)
      .attr('d', data => this.generatePath(data, sortBy));
  }

  updateIndicator (selection, referenceValue) {
    selection
      .attr('x', this.indicatorX(referenceValue))
      .attr('width', 2);
  }

  switchMode (mode, currentSorting) {
    if (this.mode !== mode) {
      if (mode === 'one') {
        if (currentSorting.global.type) {
          this.selection.selectAll('.bar').selectAll('.bar-magnitude')
            .transition()
            .duration(config.TRANSITION_SEMI_FAST)
            .attr('d', data => this.generateOneBarPath(
              data, currentSorting.global.type
            ));
        } else {
          // console.error(
          //   'Switching magnitude visualization after individual sorting is ' +
          //   'not supported yet.'
          // );
        }
      }

      if (mode === 'two') {
        this.selection.selectAll('.bar.precision').selectAll('.bar-magnitude')
          .transition()
          .duration(config.TRANSITION_SEMI_FAST)
          .attr('d', data => this.generateTwoBarsPath(data));

        this.selection.selectAll('.bar.recall').selectAll('.bar-magnitude')
          .transition()
          .duration(config.TRANSITION_SEMI_FAST)
          .attr('d', data => this.generateTwoBarsPath(data, true));
      }

      this.mode = mode;
    }
  }

  generatePath (
    data, currentSorting, indicator, adjustWidth, bottom
  ) {
    if (this.mode === 'two') {
      return this.generateTwoBarsPath(data, bottom);
    }
    return this.generateOneBarPath(
      data, currentSorting, indicator, adjustWidth
    );
  }

  generateOneBarPath (
    data, currentSorting, indicator, adjustWidth
  ) {
    const height = this.visData.global.row.contentHeight;
    const normValue = Math.min(data.value, 1) || 0;
    const normIndicator = Math.min(indicator, 1) || 0;

    let x = 0;
    let width = 2;

    let radius = {
      topLeft: 2,
      bottomLeft: 2
    };

    if (indicator) {
      radius = {};
    }

    if (data.id !== currentSorting && typeof indicator === 'undefined') {
      x = this.indicatorX(normValue);
      radius = {};
    } else if (indicator) {
      x = normIndicator * this.visData.global.column.contentWidth;
      if (adjustWidth) {
        if (normValue < normIndicator) {
          x = normValue * this.visData.global.column.contentWidth;
        }
        width = Math.max(
          Math.abs(normIndicator - normValue) *
            this.visData.global.column.contentWidth
          , 2
        );
      }
    } else {
      width = this.visData.global.column.contentWidth * normValue;
    }

    x = Math.min(x, this.visData.global.column.contentWidth - 2);

    return roundRect(
      x,
      this.visData.global.row.padding,
      width,
      height,
      radius
    );
  }

  generateTwoBarsPath (data, bottom) {
    const normValue = Math.min(data.value, 1);
    const height = this.visData.global.row.contentHeight / 2;
    const width = this.visData.global.column.contentWidth * normValue;

    let y = this.visData.global.row.padding;
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

export default Bars;
