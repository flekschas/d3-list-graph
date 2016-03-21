/**
 * Collect all cloned nodes, including the original node.
 *
 * @method  collectInclClones
 * @author  Fritz Lekschas
 * @date    2016-03-20
 * @param   {Object}   node                 Start node
 * @param   {Boolean}  onlyForOriginalNode  If `true` only collect clones when
 *   `node` is not a clone itself.
 * @return  {Array}                         Array of original and cloned nodes.
 */
export function collectInclClones (node, onlyForOriginalNode) {
  let originalNode = node;

  if (node.clone) {
    originalNode = node.originalNode;
    if (onlyForOriginalNode) {
      return [];
    }
  }

  let clones = [originalNode];

  if (originalNode.clones.length) {
    clones = clones.concat(originalNode.clones);
  }

  return clones;
}
