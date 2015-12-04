'use strict';

export function up (node, callback) {
  while (node.parent) {
    node = node.parent;
    callback(node);
  }
}

export function down (node, callback) {
  for (let i = node.childRefs.length; i--;) {
    callback(node.childRefs[i]);
    down(node.childRefs[i], callback);
  }
}

export function upAndDown (node, callback) {
  up(node, callback);
  down(node, callback);
}
