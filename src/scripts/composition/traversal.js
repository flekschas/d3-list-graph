// External
import isFinite from '../../../node_modules/lodash-es/isFinite';

// Internal
import { collectInclClones } from './utils';

export function up (node, callback, depth, includeClones, child) {
  const nodes = includeClones ? collectInclClones(node) : [node];

  for (let i = nodes.length; i--;) {
    if (child) {
      callback(nodes[i], child);
    }

    if (!isFinite(depth) || depth > 0) {
      const parentsId = Object.keys(nodes[i].parents);
      for (let j = parentsId.length; j--;) {
        up(
          nodes[i].parents[parentsId[j]],
          callback,
          depth - 1,
          includeClones,
          nodes[i]
        );
      }
    }
  }
}

export function down (node, callback, depth, includeClones) {
  const nodes = includeClones ? collectInclClones(node) : [node];

  for (let i = nodes.length; i--;) {
    callback(nodes[i]);

    if (!isFinite(depth) || depth > 0) {
      for (let j = nodes[i].childRefs.length; j--;) {
        down(
          nodes[i].childRefs[j], callback, depth - 1, includeClones
        );
      }
    }
  }
}

export function upAndDown (
  node, callbackUp, callbackDown, depth, includeClones
) {
  if (callbackDown) {
    up(node, callbackUp, depth, includeClones);
    down(node, callbackDown, depth, includeClones);
  } else {
    up(node, callbackUp, depth, includeClones);
    down(node, callbackUp, depth, includeClones);
  }
}

export function siblings (node, callback) {
  const parentsId = Object.keys(node.parents);
  for (let i = parentsId.length; i--;) {
    for (let j = node.parents[parentsId[i]].childRefs.length; j--;) {
      callback(node.parents[parentsId[i]].childRefs[j]);
    }
  }
  // The root node doesn't have a `parents` property but might have `siblings`.
  if (node.siblings) {
    const siblingsId = Object.keys(node.siblings);
    for (let i = siblingsId.length; i--;) {
      callback(node.siblings[siblingsId[i]]);
    }
  }
}
