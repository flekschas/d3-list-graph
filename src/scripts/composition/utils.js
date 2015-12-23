'use strict';

/**
 * Turns an array of IDs into an array of objects holding the ID.
 *
 * @description
 * We need to translate the array of objects into an array of fake objects in
 * order to easily match the links to be highlighted.
 *
 * Using this method selection can be matched easily via the array of fake
 * objects:
 *
 * ```
 * this.links
 *   .data(arrayToFakeObjs([1, 2, 3]), data => data)
 *   .classed('highlight', highlight === false ? false : true);
 * ```
 *
 * @method  arrayToFakeObjs
 * @author  Fritz Lekschas
 * @date    2015-12-23
 * @param   {Array}  arrayIds  Array of IDs.
 * @return  {Array}            Array of objects holding the ID. E.g. `[1]` will
 *   be translated into `[{ id: 1 }]`.
 */
export function arrayToFakeObjs (arrayIds) {
  let fakeObjs = [];

  for (let i = arrayIds.length; i--;) {
    fakeObjs.push({ id: arrayIds[i] });
  }

  return fakeObjs;
}
