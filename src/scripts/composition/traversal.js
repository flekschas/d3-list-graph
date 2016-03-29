// External
import isFinite from '../../../node_modules/lodash-es/isFinite';

// Internal
import { collectInclClones } from './utils';

function _up (node, callback, depth, includeClones, child, visitedNodes) {
  if (visitedNodes[node.id]) {
    if (!visitedNodes[node.id][child.id]) {
      callback(node, child);
    }
    return;
  }

  const nodes = includeClones ? collectInclClones(node) : [node];

  for (let i = nodes.length; i--;) {
    visitedNodes[nodes[i].id] = {};

    if (child) {
      callback(nodes[i], child);
      visitedNodes[nodes[i].id][child.id] = true;
    }

    if (!isFinite(depth) || depth > 0) {
      const parentsId = Object.keys(nodes[i].parents);
      for (let j = parentsId.length; j--;) {
        _up(
          nodes[i].parents[parentsId[j]],
          callback,
          depth - 1,
          includeClones,
          nodes[i],
          visitedNodes
        );
      }
    }
  }
}

export function up (node, callback, depth, includeClones, child) {
  const visitedNodes = {};
  _up(node, callback, depth, includeClones, child, visitedNodes);
}

function _down (node, callback, depth, includeClones, visitedNodes) {
  if (visitedNodes[node.id]) {
    return;
  }

  const nodes = includeClones ? collectInclClones(node) : [node];

  for (let i = nodes.length; i--;) {
    callback(nodes[i]);

    visitedNodes[nodes[i].id] = true;

    // We only need to recursivly traverse the graph for the original node as
    // the clones do not have any children (i.e. the have the same children as
    // the original node)
    if (i === 0 && (!isFinite(depth) || depth > 0)) {
      for (let j = nodes[i].childRefs.length; j--;) {
        _down(
          nodes[i].childRefs[j],
          callback,
          depth - 1,
          includeClones,
          visitedNodes
        );
      }
    }
  }
}

export function down (node, callback, depth, includeClones) {
  const visitedNodes = {};
  _down(node, callback, depth, includeClones, visitedNodes);
}

export function upAndDown (
  node, callbackUp, callbackDown, depth, includeClones
) {
  if (callbackDown) {
    up(node, callbackUp, depth, includeClones);
    down(node, callbackDown, depth, includeClones);
  } else {
    const visitedNodes = {};
    up(node, callbackUp, depth, includeClones, visitedNodes);
    down(node, callbackUp, depth, includeClones, visitedNodes);
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
