// External
import * as d3 from 'd3';  // eslint-disable-line import/no-unresolved

// Internal
import * as config from './config';

/**
 * Class name of the group of link container.
 *
 * @type  {String}
 */
const LINKS_CLASS = 'links';

/**
 * Class name of a link element.
 *
 * @type  {String}
 */
const LINK_CLASS = 'link';

class Links {
  /**
   * [constructor description]
   *
   * @method  constructor
   * @author  Fritz Lekschas
   * @date    2016-09-14
   * @param   {Object}   vis      List Graph App.
   * @param   {Object}   levels   List Graph App's levels.
   * @param   {Object}   visData  List Graph App's data.
   * @param   {Object}   layout   List Graph Layout.
   */
  constructor (vis, levels, visData, layout) {
    this.vis = vis;
    this.visData = visData;
    this.layout = layout;

    this.groups = levels.append('g')
      .attr('class', LINKS_CLASS)
      .call((selection) => {
        selection.each(function () {
          d3.select(this.parentNode).datum().links = this;
        });
      });

    this.links = this.groups.selectAll(LINK_CLASS)
      .data((data, index) => this.layout.links(index))
      .enter()
      .append('g')
        .attr('class', LINK_CLASS)
        .classed(
          'visible',
          !this.vis.hideOutwardsLinks || this.linkVisibility.bind(this)
        );

    this.links.append('path')
      .attr('class', LINK_CLASS + '-bg')
      .attr('d', this.diagonal.bind(this));

    this.links.append('path')
      .attr('class', LINK_CLASS + '-direct')
      .attr('d', this.diagonal.bind(this));
  }

  /**
   * Creates a SVG path string for links based on B-splines.
   *
   * @method  diagonal
   * @author  Fritz Lekschas
   * @date    2016-09-22
   * @return  {String}  SVG path string.
   */
  get diagonal () {
    const extraOffsetX = this.vis.showLinkLocation ? 6 : 0;

    function getSourceX (source) {
      return source.node.x + source.offsetX +
        this.visData.global.column.contentWidth +
        this.visData.global.column.padding;
    }

    function getTargetX (source) {
      return source.node.x + source.offsetX +
        this.visData.global.column.padding;
    }

    function getY (source) {
      return source.node.y + source.offsetY +
        (this.visData.global.row.height / 2);
    }

    function addStraightOffset (path) {
      const lineStart = path.indexOf('L');
      const lineEnd = path.lastIndexOf('L');

      const startPoint = path.substr(1, lineStart - 1).split(',');
      const endPoint = path.substr(lineEnd + 1).split(',');

      return (
        'M' +
        (parseInt(startPoint[0], 10) - extraOffsetX) + ',' + startPoint[1] +
        'L' +
        startPoint[0] + ',' + startPoint[1] +
        path.substring(lineStart, lineEnd) +
        'L' +
        endPoint[0] + ',' + endPoint[1] +
        'L' +
        (parseInt(endPoint[0], 10) + extraOffsetX) + ',' + endPoint[1]
      );
    }

    const getLine = d3.line()
      .x(data => data.x)
      .y(data => data.y)
      .curve(d3.curveBundle.beta(config.LINK_BUNDLING_STRENGTH));

    return (data) => {
      const points = [];

      const sourceX = getSourceX.call(this, data.source);
      const sourceY = getY.call(this, data.source);

      const targetX = getTargetX.call(this, data.target);
      const targetY = getY.call(this, data.target);

      const middleX = (sourceX + targetX) / 2;
      const relMiddleX = (targetX - ((sourceX + targetX) / 2)) * 2 / 3;

      // Push the start point
      points.push({
        x: sourceX + extraOffsetX,
        y: sourceY
      });

      points.push({
        x: middleX,
        y: sourceY
      });

      // Push a control point
      points.push({
        x: targetX - relMiddleX,
        y: targetY
      });

      // Push a control point
      points.push({
        x: targetX - extraOffsetX,
        y: targetY
      });

      return addStraightOffset(getLine(points));
    };
  }

  /**
   * Assess link visibility
   *
   * @method  linkVisibility
   * @author  Fritz Lekschas
   * @date    2016-09-14
   * @param   {Object}  data  D3 selection data object of links.
   */
  linkVisibility (data) {
    // Cache visibility.
    data.hidden = this.vis.pointsOutside.call(this.vis, data);
    return data.hidden === 0;
  }

  /**
   * [highlight description]
   *
   * @method  highlight
   * @author  Fritz Lekschas
   * @date    2016-09-14
   * @param   {Array}    nodeIds    Array of Node IDs.
   * @param   {Boolean}  highlight  If `true` highlights links.
   * @param   {String}   className  Class name added for CSS-based highlighting.
   */
  highlight (nodeIds, highlight, className) {
    this.links
      .filter(data => nodeIds[data.id])
      .classed(className, highlight);
  }

  /**
   * Make links temporarily visible.
   *
   * @method  makeAllTempVisible
   * @author  Fritz Lekschas
   * @date    2016-09-22
   * @param   {Boolean}  unset  If `true` reverts the temporal visibility.
   */
  makeAllTempVisible (unset) {
    if (unset) {
      this.links.classed('visible', this.linkVisibility.bind(this));
    } else {
      this.links.classed('visible', true);
    }
  }

  /**
   * Scroll links when the container is scrolled.
   *
   * @method  scroll
   * @author  Fritz Lekschas
   * @date    2016-09-14
   * @param   {Object}  selection  D3 selection of links.
   * @param   {Object}  data       Updated link data depending on scroll
   *   position.
   */
  scroll (selection, data) {
    // Update data of `g`.
    selection.data(data);

    if (this.vis.hideOutwardsLinks) {
      // Check if links point outwards.
      selection.classed('visible', this.linkVisibility.bind(this));
    }

    // Next, update all paths according to the new data.
    selection.selectAll('path')
      .attr('d', this.diagonal);
  }

  /**
   * Sort links by applying updated data and transitioning to the new position.
   *
   * @method  sort
   * @author  Fritz Lekschas
   * @date    2016-09-14
   * @param   {[type]}    update  [description]
   * @return  {[type]}            [description]
   */
  sort (update) {
    const start = function () { d3.select(this).classed('sorting', true); };
    const end = function () { d3.select(this).classed('sorting', false); };

    // Update data of `g`.
    this.links.data(update, data => data.id);

    // Next update all paths according to the new data.
    this.links.selectAll('path')
      .transition()
      .duration(config.TRANSITION_SEMI_FAST)
      .attr('d', this.diagonal)
      .on('start', start)
      .on('end', end);
  }

  /**
   * Update the visual state of the link according to the current state of data.
   *
   * @description
   * This method differs from checking whether a source or target node is
   * visible as it purely depends on the `hidden` property of the node data. It
   * is primarily used to hide links of hidden nodes, e.g., when nodes are
   * hidden manually.
   *
   * @method  updateVisibility
   * @author  Fritz Lekschas
   * @date    2016-09-22
   */
  updateVisibility () {
    this.links.classed(
      'hidden', data => data.target.node.hidden || data.source.node.hidden
    );

    this.links.selectAll('path')
      .transition()
      .duration(config.TRANSITION_SEMI_FAST)
      .attr('d', this.diagonal);
  }
}

export default Links;
