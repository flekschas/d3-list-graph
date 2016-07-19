// External
import * as d3 from 'd3';  // eslint-disable-line import/no-unresolved

// Internal
import * as config from './config';

const LINKS_CLASS = 'links';
const LINK_CLASS = 'link';

class Links {
  constructor (vis, levels, visData, layout) {
    this.vis = vis;
    this.visData = visData;
    this.layout = layout;

    this.groups = levels.append('g')
      .attr('class', LINKS_CLASS)
      .call(selection => {
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
      .attr({
        class: LINK_CLASS + '-bg',
        d: this.diagonal
      });

    this.links.append('path')
      .attr({
        class: LINK_CLASS + '-direct',
        d: this.diagonal
      });
  }

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
        this.visData.global.row.height / 2;
    }

    return data => {
      const sourceY = getY.call(this, data.source);
      const sourceX = getSourceX.call(this, data.source);
      const targetY = getY.call(this, data.target);
      const targetX = getTargetX.call(this, data.target);
      const middleX = (sourceX + targetX) / 2;

      return (
        'M' + sourceX + ',' + sourceY +
        'h' + extraOffsetX +
        'C' + (middleX + extraOffsetX) + ',' + sourceY +
        ' ' + (middleX - extraOffsetX) + ',' + targetY +
        ' ' + (targetX - extraOffsetX) + ',' + targetY +
        'h' + extraOffsetX
      );
    };
  }

  linkVisibility (data) {
    // Cache visibility.
    data.hidden = this.vis.pointsOutside.call(this.vis, data);
    return data.hidden === 0;
  }

  highlight (nodeIds, highlight, className) {
    this.links
      .filter(data => nodeIds[data.id])
      .classed(className, highlight);
  }

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
      .each('start', start)
      .each('end', end);
  }

  updateVisibility () {
    this.links.selectAll('path')
      .classed(
        'hidden', data => data.target.node.hidden || data.source.node.hidden
      )
      .transition()
      .duration(config.TRANSITION_SEMI_FAST)
      .attr('d', this.diagonal);
  }
}

export default Links;
