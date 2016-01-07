'use strict';

// External
import * as d3 from 'd3';

// Internal
import Bar from './bar';
import * as config from './config';

const BARS_CLASS = 'bars';

class Bars {
  constructor (selection, mode, visData) {
    let that = this;

    this.mode = mode;
    this.visData = visData;

    this.selection = selection.append('g')
      .attr('class', BARS_CLASS);

    this.selection.each(function (datum) {
      new Bar(d3.select(this), datum.data.bars, datum, that.visData, that);
    });
  }

  update (selection, sortBy) {
    selection.each(function () {
      let el = d3.select(this);

      if (el.classed('active')) {
        el.classed('active', false);
      } else {
        el.classed('active', true);
        // Ensure that the active bars we are places before any other bar,
        // thus placing them in the background
        this.parentNode.insertBefore(
          this,
          d3.select(this.parentNode).select('.bar').node()
        );
      }
    });

    selection.selectAll('.bar-magnitude')
      .transition()
      .duration(config.TRANSITION_SEMI_FAST)
      .attr('d', data => {
        return Bar.generatePath(data, this.mode, sortBy, this.visData);
      });
  }

  updateIndicator (refBars, currentBar, referenceValue) {
    currentBar
      .transition()
      .duration(0)
      .attr(
        'd',
        data => Bar.generatePath(data, this.mode, undefined, this.visData)
      );

    refBars
      .attr('d', data => {
        return Bar.generatePath(
          data,
          this.mode,
          undefined,
          this.visData,
          referenceValue
        );
      })
      .classed('positive', data => data.value >= referenceValue);

    refBars
      .transition()
      .duration(config.TRANSITION_SEMI_FAST)
      .attr('d', data => {
        return Bar.generatePath(
          data, this.mode, undefined, this.visData, referenceValue, true
        );
      });
  }

  switchMode (mode, currentSorting) {
    if (this.mode !== mode) {
      if (mode === 'one') {
        if (currentSorting.global.type) {
          this.selection.selectAll('.bar').selectAll('.bar-magnitude')
            .transition()
            .duration(config.TRANSITION_SEMI_FAST)
            .attr('d', data => {
              return Bar.generateOneBarPath(
                data, currentSorting.global.type, this.visData
              );
            });
          console.log('bratzen');
        } else {
          console.log('kacken');
        }
      }

      if (mode === 'two') {
        this.selection.selectAll('.bar.precision').selectAll('.bar-magnitude')
          .transition()
          .duration(config.TRANSITION_SEMI_FAST)
          .attr('d', data => {
            return Bar.generateTwoBarsPath(data, this.visData);
          });

        this.selection.selectAll('.bar.recall').selectAll('.bar-magnitude')
          .transition()
          .duration(config.TRANSITION_SEMI_FAST)
          .attr('d', data => {
            return Bar.generateTwoBarsPath(data, this.visData, true);
          });
      }

      this.mode = mode;
    }
  }
}

export default Bars;
