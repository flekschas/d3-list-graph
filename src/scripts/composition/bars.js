'use strict';

// External
import * as d3 from 'd3';

// Internal
import Bar from './bar';

const BARS_CLASS = 'bars';

class Bars {
  constructor (selection, visData) {
    let that = this;

    this.visData = visData;

    selection
      .append('g')
        .attr('class', BARS_CLASS)
        .call(selection => {
          selection.each(function (datum) {
            new Bar(d3.select(this), datum.data.bars, datum, that.visData);
          });
        });
  }
}

export default Bars;
