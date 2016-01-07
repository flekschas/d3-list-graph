'use strict';

import {EventDispatcherNoFunction} from './errors';

class Events {
  constructor (el, broadcast) {
    if (broadcast && typeof broadcast !== 'function') {
      throw new EventDispatcherNoFunction();
    }

    this.el = el;
    this.dispatch = broadcast ? broadcast : this._dispatchEvent;
  }

  _dispatchEvent (eventName, data) {
    let event = document.createEvent('CustomEvent');
    event.initCustomEvent(eventName, false, false, data);
    this.el.dispatchEvent(event);
  }

  broadcast (event, data) {
    this.dispatch(event, data);
  }
}

export default Events;
