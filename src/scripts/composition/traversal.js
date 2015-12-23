'use strict';

export function up (node, callback) {
  // Used as a reference from which child we access the parent.
  let child;

  while (node.parent) {
    child = node;
    node = node.parent;
    callback(node, child);
  }
}

export function down (node, callback) {
  callback(node);
  for (let i = node.childRefs.length; i--;) {
    down(node.childRefs[i], callback);
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
