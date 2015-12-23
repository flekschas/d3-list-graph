'use strict';

export function up (node, callback) {
  function traverse (node, child, callback) {
    callback(node, child);
    for (let i = node.parent.length; i--;) {
      traverse(node.parent[i], node, callback);
    }
  }

  for (let i = node.parent.length; i--;) {
    traverse(node.parent[i], node, callback);
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
