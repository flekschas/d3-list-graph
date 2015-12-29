'use strict';

function collectInclClones (node) {
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

export function up (node, callback, child) {
  let nodesInclClones = collectInclClones(node);

  for (let i = nodesInclClones.length; i--;) {
    if (child) {
      callback(nodesInclClones[i], child);
    }

    for (let j = nodesInclClones[i].parent.length; j--;) {
      up(nodesInclClones[i].parent[j], callback, nodesInclClones[i]);
    }
  }
}

export function down (node, callback) {
  let nodesInclClones = collectInclClones(node);

  for (let i = nodesInclClones.length; i--;) {
    callback(nodesInclClones[i]);

    for (let j = nodesInclClones[i].childRefs.length; j--;) {
      down(nodesInclClones[i].childRefs[j], callback);
    }
  }
}

export function upAndDown (node, callbackUp, callbackDown) {
  if (callbackDown) {
    up(node, callbackUp);
    down(node, callbackDown);
  } else {
    up(node, callbackUp);
    down(node, callbackUp);
  }
}
