// External
import isFinite from '../../../node_modules/lodash-es/lang/isFinite';

// Internal
import { collectInclClones } from './utils';

export function up (node, callback, depth, includeClones, child) {
  const nodesInclClones = includeClones ? collectInclClones(node) : [node];

  for (let i = nodesInclClones.length; i--;) {
    if (child) {
      callback(nodesInclClones[i], child);
    }

    if (!isFinite(depth) || depth > 0) {
      const parentsId = Object.keys(nodesInclClones[i].parents);
      for (let j = parentsId.length; j--;) {
        up(
          nodesInclClones[i].parents[parentsId[j]],
          callback,
          depth - 1,
          includeClones,
          nodesInclClones[i]
        );
      }
    }
  }
}

export function down (node, callback, depth, includeClones) {
  const nodesInclClones = includeClones ? collectInclClones(node) : [node];

  for (let i = nodesInclClones.length; i--;) {
    callback(nodesInclClones[i]);

    if (!isFinite(depth) || depth > 0) {
      for (let j = nodesInclClones[i].childRefs.length; j--;) {
        down(
          nodesInclClones[i].childRefs[j], callback, depth - 1, includeClones
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
