'use strict';

// External
import isFinite from '../../../node_modules/lodash-es/lang/isFinite';

// Internal
import {collectInclClones} from './utils';

export function up (node, callback, depth, includeClones, child) {
  let nodesInclClones = includeClones ? collectInclClones(node) : [node];

  for (let i = nodesInclClones.length; i--;) {
    if (child) {
      callback(nodesInclClones[i], child);
    }

    if (!isFinite(depth) || depth > 0) {
      for (let j = nodesInclClones[i].parents.length; j--;) {
        up(
          nodesInclClones[i].parents[j],
          callback,
          --depth,
          includeClones,
          nodesInclClones[i]
        );
      }
    }
  }
}

export function down (node, callback, depth, includeClones) {
  let nodesInclClones = includeClones ? collectInclClones(node) : [node];

  for (let i = nodesInclClones.length; i--;) {
    callback(nodesInclClones[i]);

    if (!isFinite(depth) || depth > 0) {
      for (let j = nodesInclClones[i].childRefs.length; j--;) {
        down(nodesInclClones[i].childRefs[j], callback, --depth, includeClones);
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
