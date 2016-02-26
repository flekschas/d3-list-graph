/* eslint no-shadow: 0 */

// External
import * as d3 from 'd3';

// Internal
import { ExtendableError } from './error';
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
 * @date    2016-01-23
 * @param   {Object}  selection        D3 selection to listen for the drag
 *   event.
 * @param   {Object}           dragMoveHandler  Handler for drag-move.
 * @param   {Object}           dropHandler      Handler for drag-end, i.e. drop.
 * @param   {Array}            elsToBeDragged   Array of D3 selections to be
 *   moved according to the drag event. If empty or undefined `selection` will
 *   be used.
 * @param   {String}           orientation      Can either be "horizontal",
 *   "vertical" or `undefined`, i.e. both directions.
 * @param   {Object|Function}  limits           X and Y drag limits. E.g.
 *   `{ x: { min: 0, max: 10 } }`.
 * @param   {Array}             notWhenTrue     List if function returning a
 *   Boolean value which should prevent the dragMoveHandler from working.
 */
export function onDragDrop (
  selection, dragStartHandler, dragMoveHandler, dropHandler, elsToBeDragged,
  orientation, limits, notWhenTrue
) {
  const drag = d3.behavior.drag();

  let appliedLimits = limits || {};  // eslint-disable-line no-param-reassign

  if (dragStartHandler) {
    drag.on('dragstart', () => {
      if (typeof limits === 'function') {
        appliedLimits = limits();
      }
      dragStartHandler();
    });
  }

  if (dragMoveHandler) {
    drag.on('drag', function (data) {
      dragMoveHandler.call(
        this, data, elsToBeDragged, orientation, appliedLimits, notWhenTrue
      );
    });
  }

  if (dropHandler) {
    drag.on('dragend', dropHandler);
  }

  selection.each(function (data) {
    const el = d3.select(this);

    // Set default data if not available.
    if (!data) {
      data = { dragX: 0, dragY: 0 };  // eslint-disable-line no-param-reassign
      el.datum(data);
    }

    // Add drag event handler
    el.call(drag);
  });
}

export function dragMoveHandler (
  data, elsToBeDragged, orientation, limits, notWhenTrue
) {
  for (let i = notWhenTrue.length; i--;) {
    if (notWhenTrue[i]()) {
      return;
    }
  }

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
      data.dragX += d3.event.dx;
      data.dragX = withinLimits(data.dragX + d3.event.dx, limits.x);
      els.style('transform', 'translateX(' + data.dragX + 'px)');
    }
    if (orientation === 'vertical') {
      data.dragY += d3.event.dy;
      data.dragX = withinLimits(data.dragY + d3.event.dy, limits.y);
      els.style('transform', 'translateY(' + data.dragY + 'px)');
    }
  } else {
    data.dragX += d3.event.dx;
    data.dragY += d3.event.dy;
    els.style(
      'transform', 'translate(' + data.dragX + 'px,' + data.dragY + 'px)'
    );
  }
}
