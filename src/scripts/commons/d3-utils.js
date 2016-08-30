// External
import * as d3 from 'd3';

export function mergeSelections (selections) {
  // Create a new empty selection
  const mergedSelection = d3.selectAll('.d3-list-graph-not-existent');

  for (let i = selections.length; i--;) {
    mergedSelection._groups = mergedSelection._groups.concat(
      selections[i]._groups
    );
  }

  return mergedSelection;
}

export function allTransitionsEnded (transition, callback) {
  if (transition.size() === 0) {
    callback();
  }
  let n = 0;
  transition
    .each(() => ++n)
    .on('end', function (...args) {
      if (!--n) callback.apply(this, args);
    });
}
