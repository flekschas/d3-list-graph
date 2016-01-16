'use strict';

// External
import * as d3 from 'd3';

// Internal
import {ExtendableError} from './error';
import {mergeSelections} from './d3-utils';

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
 * @date    2016-01-15
 * @param   {Object}  selection        D3 selection to listen for the drag
 *   event.
 * @param   {Object}  dragMoveHandler  Handler for drag-move.
 * @param   {Object}  dropHandler      Handler for drag-end, i.e. drop.
 * @param   {Array}   elsToBeDragged   Array of D3 selections to be moved.
 *   according to the drag event. If empty or undefined `selection` will be
 * @param   {String}  orientation      Can either be "horizontal", "vertical" or
 *   `undefined`, i.e. both directions.
 * @param   {Object}  limits           X and Y drag limits. E.g.
 *   `{ x: { min: 0, max: 10 } }`.
 */
export function onDragDrop (
  selection, dragMoveHandler, dropHandler, elsToBeDragged, orientation, limits
) {
  limits = limits || {};

  let drag = d3.behavior.drag();

  if (dragMoveHandler) {
    drag.on('drag', function (data) {
      dragMoveHandler.call(this, data, elsToBeDragged, orientation, limits);
    });
  }

  if (dropHandler) {
    drag.on('dragend', function (data) {
      dropHandler.call(this, data, elsToBeDragged, orientation, limits);
    });
  }

  selection.each(function (data) {
    let el = d3.select(this);

    // Set default data if not available.
    if (!data) {
      data = {
        dragX: 0,
        dragY: 0
      };
      el.datum(data);
    }

    // Add drag event handler
    el.call(drag);
  });
}

export function dragMoveHandler (data, elsToBeDragged, orientation, limits) {
  let els = d3.select(this);

  if (elsToBeDragged && elsToBeDragged.length) {
    els = mergeSelections(elsToBeDragged);
  }

  function withinLimits (value, limits) {
    if (limits) {
      try {
        value = Math.min(
          limits.max,
          Math.max(
            limits.min,
            value
          )
        );
      } catch (e) {
        throw new LimitsUnsupportedFormat();
      }
    }
    return value;
  }

  if (orientation === 'horizontal' || orientation === 'vertical') {
    if (orientation === 'horizontal') {
      // data.dragX += d3.event.dx;
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
