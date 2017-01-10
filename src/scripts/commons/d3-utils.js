// External
import * as d3 from 'd3';

/**
 * Merges multiple distinct D3 selection objects.
 *
 * @description
 * First an empty selection is created by querying for a non-existing element.
 *
 * @method  mergeSelections
 * @author  Fritz Lekschas
 * @date    2016-09-12
 * @param   {Array}   selections  Array of multiple D3 selection objects.
 * @return  {Object}              Single D3 selection object containing all the
 *   selected elements from `selections`.
 */
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

/**
 * Detects when an array of transitions has ended.
 *
 * @method  allTransitionsEnded
 * @author  Fritz Lekschas
 * @date    2016-09-12
 * @param   {Object}    transition  D3 transition object.
 * @param   {Function}  callback    Callback function to be triggered when all
 *   transitions have ended.
 */
export function allTransitionsEnded (transition, callback) {
  if (transition.size() === 0) {
    callback();
  }

  let n = 0;

  transition
    .each(() => ++n)
    .on('interrupt end', function end (...args) {
      if (!--n) callback.apply(this, args);
    });
}
