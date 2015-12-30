'use strict';

// External
import * as d3 from 'd3';
import isFinite from '../../../node_modules/lodash-es/lang/isFinite';

export function linearGradient (el, start, end, name) {
  let gradient = el.append('defs')
    .append('linearGradient')
      .attr('id', name)
      .attr('x1', start.x)
      .attr('y1', start.y)
      .attr('x2', end.x)
      .attr('y2', end.y)
      .attr('spreadMethod', 'pad');

  gradient.append('stop')
    .attr('offset', start.offset + '%')
    .attr('stop-color', start.color)
    .attr('stop-opacity', start.opacity);

  gradient.append('stop')
    .attr('offset', end.offset + '%')
    .attr('stop-color', end.color)
    .attr('stop-opacity', end.opacity);
}

/**
 * Creates and adds an interpolated exponential SVG gradient to an SVG element.
 *
 * @example
 * ```
 * exponentialGradient(
 *   d3.select('svg'),
 *   {
 *     color: #fff,
 *     offset: 10,
 *     opacity: 0.5,
 *     x: 0,
 *     y: 0
 *   },
 *   {
 *     color: #000,
 *     offset: 10,
 *     opacity: 1,
 *     x: 1,
 *     y: 1
 *   },
 *   'myFancyGradient',
 *   3,
 *   5
 * );
 * ```
 *
 * @method  exponentialGradient
 * @author  Fritz Lekschas
 * @date    2015-12-30
 * @param   {Object}  el     Element to which the `def` gradient should be
 *   added to.
 * @param   {Object}  start  Start properies.
 * @param   {Object}  end    End properies.
 * @param   {String}  name   Name of the gradient.
 * @param   {Number}  power  Exponential power.
 * @param   {Number}  steps  Interpolation steps.
 */
export function exponentialGradient (el, start, end, name, power, steps) {
  let scale = d3.scale.pow().exponent(power || 2);
  let stepSize = 1 / ((steps || 0) + 1);

  let gradient = el.append('defs')
    .append('linearGradient')
      .attr('id', name)
      .attr('x1', start.x)
      .attr('y1', start.y)
      .attr('x2', end.x)
      .attr('y2', end.y)
      .attr('spreadMethod', 'pad');

  gradient.append('stop')
    .attr('offset', start.offset + '%')
    .attr('stop-color', start.color)
    .attr('stop-opacity', start.opacity);

  for (let i = 0; i < steps; i++) {
    gradient.append('stop')
      .attr(
        'offset',
        (start.offset + (i * stepSize) * (end.offset - start.offset)) + '%'
      )
      .attr('stop-color', end.color)
      .attr(
        'stop-opacity',
        start.opacity + scale(i * stepSize) * (end.opacity - start.opacity)
      );
  }

  gradient.append('stop')
    .attr('offset', end.offset + '%')
    .attr('stop-color', end.color)
    .attr('stop-opacity', end.opacity);
}
