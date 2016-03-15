export const requestAnimationFrame = (function () {
  let lastTime = 0;

  return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function (callback) {
      const currTime = new Date().getTime();
      const timeToCall = Math.max(0, 16 - (currTime - lastTime));
      const id = window.setTimeout(() => {
        callback(currTime + timeToCall);
      }, timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };
}());

export const cancelAnimationFrame = (function () {
  return window.cancelAnimationFrame ||
    window.webkitCancelAnimationFrame ||
    window.mozCancelAnimationFrame ||
    window.oCancelAnimationFrame ||
    window.msCancelAnimationFrame ||
    window.cancelAnimationFrame ||
    window.webkitCancelAnimationFrame ||
    window.mozCancelAnimationFrame ||
    window.oCancelAnimationFrame ||
    window.msCancelAnimationFrame ||
    function (id) { window.clearTimeout(id); };
}());

const nextAnimationFrame = (function () {
  const ids = {};

  function requestId () {
    let id;
    do {
      id = Math.floor(Math.random() * 1E9);
    } while (id in ids);
    return id;
  }

  return {
    request: window.requestNextAnimationFrame || function (callback, element) {
      const id = requestId();

      ids[id] = requestAnimationFrame(() => {
        ids[id] = requestAnimationFrame(ts => {
          delete ids[id];
          callback(ts);
        }, element);
      }, element);

      return id;
    },
    cancel: window.cancelNextAnimationFrame || function (id) {
      if (ids[id]) {
        cancelAnimationFrame(ids[id]);
        delete ids[id];
      }
    }
  };
}());

export const requestNextAnimationFrame = nextAnimationFrame.request;
export const cancelNextAnimationFrame = nextAnimationFrame.cancel;
