// External
import * as d3 from 'd3';  // eslint-disable-line import/no-unresolved

// Internal
import * as config from './config';

/**
 * Class name of scrollbar elements.
 *
 * @type  {String}
 */
const SCROLLBAR_CLASS = 'scrollbar';

class Scrollbars {
  /**
   * [constructor description]
   *
   * @method  constructor
   * @author  Fritz Lekschas
   * @date    2016-09-14
   * @param   {Object}  baseEl   D3 selection of the element where the
   *   scrollbars should be appended to.
   * @param   {Object}  visData  List Graph App's data.
   * @param   {Number}  width    Width of the scrollbar in pixels.
   */
  constructor (baseEl, visData, width) {
    this.visData = visData;
    this.width = width;

    // Add empty scrollbar element
    this.all = baseEl
      .append('rect')
        .attr('class', SCROLLBAR_CLASS)
        .call((selection) => {
          selection.each(function setScrollBarDomElement () {
            d3.select(this.parentNode).datum().scrollbar.el = this;
          });
        })
        .attr('x', data => data.scrollbar.x - 2)
        .attr('y', data => data.scrollbar.y)
        .attr('width', this.width)
        .attr('height', data => data.scrollbar.height)
        .attr('rx', this.width / 2)
        .attr('ry', this.width / 2)
        .classed('ready', true);
  }

  /**
   * Re-render
   *
   * @method  reRender
   * @author  Fritz Lekschas
   * @date    2017-01-16
   * @param   {Object}  newVisData  New vid data.
   */
  reRender (newVisData) {
    if (newVisData) {
      this.visData = newVisData;
    }

    this.all
      .data(this.visData.nodes)
      .call((selection) => {
        selection.each(function setScrollBarDomElement () {
          d3.select(this.parentNode).datum().scrollbar.el = this;
        });
      });

    this.updateVisibility();
  }

  /**
   * Update the visual state of the scrollbar given the current data.
   *
   * @method  updateVisibility
   * @author  Fritz Lekschas
   * @date    2016-09-14
   */
  updateVisibility () {
    this.all
      .transition()
      .duration(config.TRANSITION_LIGHTNING_FAST)
      .attr('x', data => data.scrollbar.x)
      .attr('height', data => data.scrollbar.height);
  }
}

export default Scrollbars;
