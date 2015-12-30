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
    let actualBars = selection
      .classed('active', true)
      .selectAll('.bar-magnitude');

    selection.each(data => {
      // this.bar
    });

    actualBars
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
