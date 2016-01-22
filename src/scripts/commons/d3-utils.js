// External
import * as d3 from 'd3';

export function mergeSelections (selections) {
  // Create a new empty selection
  const mergedSelection = d3.selectAll('.d3-list-graph-not-existent');

  function pushSelection (selection) {
    selection.each(function pushDomNode () {
      mergedSelection[0].push(this);
    });
  }

  for (let i = selections.length; i--;) {
    pushSelection(selections[i]);
  }

  return mergedSelection;
}
