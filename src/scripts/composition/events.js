// External
import isArray from '../../../node_modules/lodash-es/isArray';
import isFinite from '../../../node_modules/lodash-es/isFinite';
import isFunction from '../../../node_modules/lodash-es/isFunction';

// Internal
import { EventDispatcherNoFunction } from './errors';

class Events {
  constructor (el, broadcast) {
    if (broadcast && !isFunction(broadcast)) {
      throw new EventDispatcherNoFunction();
    }

    this.el = el;
    this._stack = {};
    this.dispatch = broadcast || this._dispatchEvent;
  }

  get stack () {
    return this._stack;
  }

  _dispatchEvent (eventName, data) {
    const event = document.createEvent('CustomEvent');
    event.initCustomEvent(eventName, false, false, data);
    this.el.dispatchEvent(event);
  }

  broadcast (event, data) {
    this.dispatch(event, data);
  }

  /**
   * Add a callback function to an event stack.
   *
   * @method  on
   * @author  Fritz Lekschas
   * @date    2016-01-07
   *
   * @param   {String}    event     Event identifier.
   * @param   {Function}  callback  Function which is called when the event
   *   stack is triggered.
   * @param   {Number}    times     Number of times the callback function should
   *   be triggered before it is removed from the event stack. This is useful
   *   when an event happens only a certain number of times.
   * @return  {Number}              Index of callback, which is needed to
   *   manually remove the callback from the event stack.
   */
  on (event, callback, times) {
    if (!isFunction(callback)) {
      return false;
    }

    const normTimes = isFinite(times) ? parseInt(times, 10) : Infinity;

    if (isArray(this.stack[event])) {
      return this.stack[event]
        .push({ callback, times: normTimes }) - 1;
    }
    this.stack[event] = [{ callback, times: normTimes }];
    return 0;
  }

  /**
   * Removes a callback function from an event stack given its index.
   *
   * @method  off
   * @author  Fritz Lekschas
   * @date    2016-01-07
   *
   * @param   {String}   event  Event identifier.
   * @param   {Number}   index  Index of the callback to be removed.
   * @return  {Boolean}         Returns `true` if event callback was found and
   *   successfully removed.
   */
  off (event, index) {
    try {
      this.stack[event].splice(index, 1);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Trigger an event stack
   *
   * @method  trigger
   * @author  Fritz Lekschas
   * @date    2016-01-07
   *
   * @param   {String}   event  Event identifier.
   * @return  {Boolean}         Returns `true` if an event stack was found.
   */
  trigger (event, data) {
    if (isArray(this.stack[event])) {
      // Traversing from the end to the start, which has the advantage that
      // deletion of events, i.e. calling `Event.off()` doesn't affect the index
      // of event listeners in the next step.
      for (let i = this.stack[event].length; i--;) {
        // Instead of checking whether `stack[event][i]` is a function here,
        // we do it just once when we add the function to the stack.
        if (this.stack[event][i].times--) {
          this.stack[event][i].callback(data);
        } else {
          this.off(event, i);
        }
      }
      return true;
    }
    return false;
  }
}

export default Events;
