'use strict';

// External
import * as d3 from 'd3';

export function mergeSelections (selections) {
  // Create a new empty selection
  var mergedSelection = d3.selectAll('.d3-list-graph-not-existent');

  for (let i = selections.length; i--;) {
    selections[i].each(function () {
      mergedSelection[0].push(this);
    });
  }

  return mergedSelection;
}
