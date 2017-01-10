/* eslint no-shadow: 0 */

// External
import * as d3 from 'd3';
import isFunction from '../../../node_modules/lodash-es/isFunction';

// Internal
import { ExtendableError } from './errors';
import { mergeSelections } from './d3-utils';

export class LimitsUnsupportedFormat extends ExtendableError {
  constructor (message) {
    super(message || 'The limits are wrongly formatted. Please provide an ' +
      'object of the following format: `{ x: { min: 0, max: 1 }, y: { min: ' +
      '0, max: 1 } }`'
    );
  }
}

/**
 * Drap and drop event handler that works via translation.
 *
 * @method  onDragDrop
 * @author  Fritz Lekschas
 * @date    2016-09-12
 * @param   {Object}  selection        D3 selection to listen for the drag
 *   event.
 * @param   {Object}           dragMoveHandler         Handler for drag-move.
 * @param   {Object}           dropHandler             Handler for drag-end,
 *   i.e. drop.
 * @param   {Array}            elsToBeDragged          Array of D3 selections to
 *   be moved according to the drag event. If empty or undefined `selection`
 *   will be used.
 * @param   {String}           orientation             Can either be
 *   "horizontal", "vertical" or `undefined`, i.e. both directions.
 * @param   {Object|Function}  limits                  X and Y drag limits. E.g.
 *   `{ x: { min: 0, max: 10 } }`.
 * @param   {Array}             noDraggingWhenTrue     List if function
 *   returning a Boolean value which should prevent the dragMoveHandler from
 *   working.
 * @param   {String}           clickTolerance          Specify the number of
 *   pixel that are allowed to move but still trigger a click event. Sometimes
 *   it is useful to allow the user to move 1 or 2 pixel, especially in high
 *   res environments. [Default is 0]
 */
export function onDragDrop (
  selection, dragStartHandler, dragMoveHandler, dropHandler, elsToBeDragged,
  orientation, limits, noDraggingWhenTrue, dragData, clickTolerance
) {
  const drag = d3.drag();
  const checkWhenDragging = isFunction(noDraggingWhenTrue);

  let appliedLimits = limits || {};  // eslint-disable-line no-param-reassign

  const filter = function filter () {
    return !(checkWhenDragging && noDraggingWhenTrue());
  };

  drag.filter(filter);

  let d2;

  drag.on('start', () => {
    d2 = 0;
    if (typeof limits === 'function') {
      appliedLimits = limits();
    }
  });

  if (dragMoveHandler) {
    drag.on('drag', function (data) {
      if (checkWhenDragging && noDraggingWhenTrue()) {
        return;
      }
      d3.event.sourceEvent.preventDefault();
      dragStartHandler();
      dragMoveHandler.call(
        this, data, elsToBeDragged, orientation, appliedLimits
      );

      d2 += (d3.event.dx * d3.event.dx) + (d3.event.dy * d3.event.dy);
    });
  }

  if (dropHandler) {
    drag.on('end', function () {
      dropHandler.call(this);

      if (d2 <= (clickTolerance || 0)) {
        // Don't supress the click event for minor mouse movements.
        d3.select(window).on('click.drag', null);
      }
    });
  }

  selection.each(function (data) {
    const el = d3.select(this);

    // Set default data if not available.
    if (!data) {
      data = { drag: dragData };  // eslint-disable-line no-param-reassign
      el.datum(data);
    }

    // Add drag event handler
    el.call(drag);
  });
}

/**
 * Custom drag-move handler used by the custom drag-drop handler.
 *
 * @method  dragMoveHandler
 * @author  Fritz Lekschas
 * @date    2016-09-12
 * @param   {Object}           data            D3's drag event object.
 * @param   {Array}            elsToBeDragged  Array of D3 selections.
 * @param   {String}           orientation     Can either be "horizontal",
 *   "vertical" or `undefined`, i.e. both directions.
 * @param   {Object|Function}  limits          X and Y drag limits. E.g.
 *   `{ x: { min: 0, max: 10 } }`.
 */
export function dragMoveHandler (
  data, elsToBeDragged, orientation, limits
) {
  let els = d3.select(this);

  if (elsToBeDragged && elsToBeDragged.length) {
    els = mergeSelections(elsToBeDragged);
  }

  function withinLimits (value, applyingLimits) {
    let restrictedValue;

    if (applyingLimits) {
      try {
        restrictedValue = Math.min(
          applyingLimits.max,
          Math.max(
            applyingLimits.min,
            value
          )
        );
      } catch (e) {
        throw new LimitsUnsupportedFormat();
      }
    }
    return restrictedValue;
  }

  if (orientation === 'horizontal' || orientation === 'vertical') {
    if (orientation === 'horizontal') {
      data.drag.x += d3.event.dx;
      data.drag.x = withinLimits(data.drag.x + d3.event.dx, limits.x);
      els.style('transform', 'translateX(' + data.drag.x + 'px)');
    }
    if (orientation === 'vertical') {
      data.drag.y += d3.event.dy;
      data.drag.x = withinLimits(data.drag.y + d3.event.dy, limits.y);
      els.style('transform', 'translateY(' + data.drag.y + 'px)');
    }
  } else {
    data.drag.x += d3.event.dx;
    data.drag.y += d3.event.dy;
    els.style(
      'transform', 'translate(' + data.drag.x + 'px,' + data.drag.y + 'px)'
    );
  }
}
