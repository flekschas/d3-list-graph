// External
import * as d3 from 'd3';  // eslint-disable-line import/no-unresolved

// Internal
import Bar from './bar';
import * as config from './config';
import { roundRect } from '../commons/charts';

const BARS_CLASS = 'bars';

class Bars {
  /**
   * [constructor description]
   *
   * @method  constructor
   * @author  Fritz Lekschas
   * @date    2016-09-14
   * @param   {Object}  baseEl   D3 selection where the group of bars should be
   *   appended to.
   * @param   {String}  mode     Display more. Can be either `one` or `two`.
   * @param   {Object}  visData  Object with the list graph app data.
   */
  constructor (baseEl, mode, visData) {
    const self = this;

    this.mode = mode;
    this.visData = visData;

    this.xScale = d3.scaleLinear()
      .domain([0, 1])
      .range([1, this.visData.global.column.contentWidth - 3]);

    this.baseEl = baseEl.append('g').attr('class', BARS_CLASS);

    this.baseEl.each(function (datum) {
      new Bar(d3.select(this), datum.data.bars, datum, self.visData, self);
    });
  }

  /**
   * Updates all bar magnitude elements.
   *
   * @method  updateAll
   * @author  Fritz Lekschas
   * @date    2016-09-14
   * @param   {Object}  update  Object with the current data.
   * @param   {String}  sortBy  Name of the poperty to be sorted by.
   */
  updateAll (update, sortBy) {
    this.baseEl.selectAll('.bar-magnitude')
      .data(update, data => data.barId)
      .transition()
      .duration(config.TRANSITION_SEMI_FAST)
      .attr('d', data => this.generatePath(data, sortBy));
  }

  /**
   * Update bars when switching the bar mode.
   *
   * @method  update
   * @author  Fritz Lekschas
   * @date    2016-09-14
   * @param   {Object}  selection  D3 selection
   * @param   {String}  sortBy     Name of the poperty to be sorted by.
   */
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

  /**
   * Switch one and two-bar display mode.
   *
   * @method  switchMode
   * @author  Fritz Lekschas
   * @date    2016-09-14
   * @param   {String}  mode            Name of the display mode. Can either be
   *   `one` or `two`.
   * @param   {String}  currentSorting  Name if the property currently sorted
   *   by.
   */
  switchMode (mode, currentSorting) {
    if (this.mode !== mode) {
      if (mode === 'one') {
        if (currentSorting.global.type) {
          this.baseEl.selectAll('.bar').selectAll('.bar-magnitude')
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
        this.baseEl.selectAll('.bar.precision').selectAll('.bar-magnitude')
          .transition()
          .duration(config.TRANSITION_SEMI_FAST)
          .attr('d', data => this.generateTwoBarsPath(data));

        this.baseEl.selectAll('.bar.recall').selectAll('.bar-magnitude')
          .transition()
          .duration(config.TRANSITION_SEMI_FAST)
          .attr('d', data => this.generateTwoBarsPath(data, true));
      }

      this.mode = mode;
    }
  }

  /**
   * Helper method to generate path used as a bar.
   *
   * @method  generatePath
   * @author  Fritz Lekschas
   * @date    2016-09-14
   * @param   {Object}   data             Data object.
   * @param   {String}   sortBy           Name of the property currently sorted
   *   by.
   */
  generatePath (data, sortBy) {
    if (this.mode === 'two') {
      return this.generateTwoBarsPath(data);
    }
    return this.generateOneBarPath(data, sortBy);
  }

  /**
   * Generates a bar when one-bar display mode is active.
   *
   * @method  generateOneBarPath
   * @author  Fritz Lekschas
   * @date    2016-09-14
   * @param   {Object}   data    Data object.
   * @param   {String}   sortBy  Name of the property currently sorted by.
   */
  generateOneBarPath (data, sortBy) {
    const height = this.visData.global.row.contentHeight;
    const normValue = Math.min(data.value, 1) || 0;

    let x = 0;
    let width = 2;

    let radius = {
      topLeft: 2,
      bottomLeft: 2
    };

    if (data.id !== sortBy) {
      x = this.xScale(normValue);
      radius = {};
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

  /**
   * Generates a bar when two-bar display mode is active.
   *
   * @method  generateTwoBarsPath
   * @author  Fritz Lekschas
   * @date    2016-09-14
   * @param   {Object}   data      Data object.
   * @param   {Boolean}  isBottom  If `true` then the bottom bar should be
   *   generated.
   */
  generateTwoBarsPath (data, isBottom) {
    const normValue = Math.min(data.value, 1);
    const height = this.visData.global.row.contentHeight / 2;
    const width = this.visData.global.column.contentWidth * normValue;

    let y = this.visData.global.row.padding;
    let radius = { topLeft: 2 };

    if (isBottom) {
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
