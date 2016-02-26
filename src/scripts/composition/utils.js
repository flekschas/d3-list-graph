/**
 * Collect all cloned nodes, including the original node.
 *
 * @method  collectInclClones
 * @author  Fritz Lekschas
 * @date    2015-12-30
 * @param   {Object}  node  Start node
 * @return  {Array}         Array of original and cloned nodes.
 */
export function collectInclClones (node) {
  let originalNode = node;

  if (node.clone) {
    originalNode = node.originalNode;
  }

  let clones = [originalNode];

  if (originalNode.clones.length) {
    clones = clones.concat(originalNode.clones);
  }

  return clones;
}
