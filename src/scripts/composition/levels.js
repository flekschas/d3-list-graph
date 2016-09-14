// External
import * as d3 from 'd3';  // eslint-disable-line import/no-unresolved

/**
 * Class name of columns.
 *
 * @type  {String}
 */
const COLUMN_CLASS = 'column';

/**
 * Class name of scroll containers.
 *
 * @type  {String}
 */
const SCROLL_CONTAINER_CLASS = 'scroll-container';

class Levels {
  /**
   * Level / column constructor.
   *
   * @method  constructor
   * @author  Fritz Lekschas
   * @date    2016-09-14
   * @param   {Object}  selection  D3 selection of element the levels should be
   *   appended to.
   * @param   {Object}  vis        List Graph App.
   * @param   {Object}  visData    List Graph App data.
   */
  constructor (selection, vis, visData) {
    this.vis = vis;
    this.visData = visData;
    this.groups = selection
      .selectAll('g')
      .data(this.visData.nodes)
      .enter()
      .append('g')
        .attr('class', COLUMN_CLASS)
        .classed(
          'active',
          (data, index) => {
            if (this.vis.highlightActiveLevel) {
              if (!this.vis.nodes || !this.vis.nodes.rootedNode) {
                return index === this.vis.activeLevel -
                  this.vis.noRootActiveLevelDiff;
              }
              return index === this.vis.activeLevel;
            }
            return false;
          }
        )
        .each(data => { data.scrollTop = 0; });

    // We need to add an empty rectangle that fills up the whole column to ensure
    // that the `g`'s size is at a maximum, otherwise scrolling will be halted
    // when the cursor leaves an actually drawn element.
    this.groups
      .append('rect')
        .attr('class', SCROLL_CONTAINER_CLASS)
        .attr('x', data => data.x)
        .attr('y', data => data.y)
        .attr('width', this.visData.global.column.width + 1)
        .attr('height', this.visData.global.column.height);
  }

  /**
   * Prepare column for scrolling.
   *
   * @method  scrollPreparation
   * @author  Fritz Lekschas
   * @date    2016-09-14
   * @param   {Number}  scrollbarWidth  Width of the scrollbar in pixel.
   */
  scrollPreparation (scrollbarWidth) {
    this.groups.each((data, index) => {
      const contentHeight = data.nodes.getBoundingClientRect().height +
        (2 * this.visData.global.row.padding);
      const scrollHeight = contentHeight - this.visData.global.column.height;
      const scrollbarHeight = scrollHeight > 0 ?
        Math.max(
          (
            (
              this.visData.global.column.height *
              this.visData.global.column.height
            ) / contentHeight
          ),
          10
        ) : 0;

      data.height = contentHeight;
      data.linkSelections = {
        incoming: index > 0 ?
          this.vis.selectByLevel(index - 1, '.link') : null,
        outgoing: this.vis.selectByLevel(index, '.link')
      };
      data.scrollHeight = scrollHeight;
      data.scrollTop = 0;
      data.scrollbar = {
        el: undefined,
        x: data.x + (this.visData.global.column.width - scrollbarWidth),
        y: 0,
        width: scrollbarWidth,
        height: scrollbarHeight,
        scrollHeight: this.visData.global.column.height - scrollbarHeight,
        scrollTop: 0,
        heightScale: d3.scaleLinear()
          .domain([0, scrollHeight])
          .range([0, this.visData.global.column.height - scrollbarHeight])
      };
      data.invertedHeightScale = data.scrollbar.heightScale.invert;
    });
  }

  /**
   * Update the properties for column scrolling.
   *
   * @method  updateScrollProperties
   * @author  Fritz Lekschas
   * @date    2016-09-14
   */
  updateScrollProperties () {
    this.groups.each(data => {
      const contentHeight = data.nodes.getBoundingClientRect().height +
        (2 * this.visData.global.row.padding);
      const scrollHeight = contentHeight - this.visData.global.column.height;
      const scrollbarHeight = scrollHeight > 0 ?
        Math.max(
          (
            (
              this.visData.global.column.height *
              this.visData.global.column.height
            ) / contentHeight
          ),
          10
        ) : 0;

      data.height = contentHeight;
      data.scrollHeight = scrollHeight;
      data.scrollTop = 0;
      data.scrollbar.y = 0;
      data.scrollbar.height = scrollbarHeight;
      data.scrollbar.scrollHeight = this.visData.global.column.height -
        scrollbarHeight;
      data.scrollbar.scrollTop = 0;
      data.scrollbar.heightScale = d3.scaleLinear()
        .domain([0, scrollHeight])
        .range([0, this.visData.global.column.height - scrollbarHeight]);
    });
  }

  /**
   * Check if column should be hidden when it's not in the visible area.
   *
   * @method  updateVisibility
   * @author  Fritz Lekschas
   * @date    2016-09-14
   */
  updateVisibility () {
    this.groups.each(function () {
      const group = d3.select(this);

      group.classed('hidden', group.selectAll('.node')
        .filter(data => !data.hidden).empty());
    });
  }

  /**
   * Get the column's class name.
   *
   * @method  className
   * @author  Fritz Lekschas
   * @date    2016-09-14
   * @return  {String}  Class name of the column.
   */
  get className () {
    return COLUMN_CLASS;
  }

  /**
   * Get the column's height.
   *
   * @method  height
   * @author  Fritz Lekschas
   * @date    2016-09-14
   * @return  {Number}  Column height in pixel.
   */
  get height () {
    return this.visData.global.column.height;
  }

  /**
   * Focus a level.
   *
   * @method  focus
   * @author  Fritz Lekschas
   * @date    2016-09-14
   * @param   {Number}  level  ID of the column.
   */
  focus (level) {
    if (this.vis.highlightActiveLevel) {
      this.groups.filter(data => data.level === level).classed('active', true);
    }
  }

  /**
   * Blur a level.
   *
   * @method  blur
   * @author  Fritz Lekschas
   * @date    2016-09-14
   * @param   {Number}  level  ID of the column.
   */
  blur (level) {
    if (this.vis.highlightActiveLevel) {
      if (level) {
        this.groups.filter(data => data.level === level).classed('active', false);
      } else {
        this.groups.classed('active', false);
      }
    }
  }
}

export default Levels;
