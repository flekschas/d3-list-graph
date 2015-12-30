'use strict';

// External
import * as d3 from 'd3';

// Internal
import Bar from './bar';
import * as config from './config';

const BARS_CLASS = 'bars';

class Bars {
  constructor (selection, visData) {
    let that = this;

    this.visData = visData;

    this.selection = selection.append('g')
      .attr('class', BARS_CLASS);

    this.selection.each(function (datum) {
      new Bar(d3.select(this), datum.data.bars, datum, that.visData);
    });
  }

  update (selection, sortBy) {
    selection.each(function () {
      let el = d3.select(this);

      if (el.classed('active')) {
        el.classed('active', false);
      } else {
        el.classed('active', false);
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
        return Bar.generatePath(data, sortBy, this.visData);
      });
  }

  inactivate (selection) {

  }
}

export default Bars;
