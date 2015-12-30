'use strict';

// External
import * as d3 from 'd3';

// Internal
import * as traverse from './traversal';
import * as config from './config';
import Bars from './bars';
import Links from './links';
import {arrayToFakeObjs} from './utils';

const NODES_CLASS = 'nodes';
const NODE_CLASS = 'node';
const CLONE_CLASS = 'clone';

class Nodes {
  constructor (baseSelection, visData, links, events) {
    let that = this;

    // Helper
    function drawFullSizeRect (selection, className, shrinking) {
      if (!shrinking) {
        shrinking = 0;
      }

      selection
        .attr('x', data => shrinking)
        .attr('y', data => that.visData.global.row.padding + shrinking)
        .attr('width', that.visData.global.column.contentWidth - 2 * shrinking)
        .attr('height', that.visData.global.row.contentHeight - 2 * shrinking)
        .attr('rx', 2 - shrinking)
        .attr('ry', 2 - shrinking)
        .classed(className, true);
    }

    this.visData = visData;
    this.links = links;
    this.events = events;

    this.groups = baseSelection.append('g')
      .attr('class', NODES_CLASS)
      .call(selection => {
        selection.each(function (data, index) {
          d3.select(this.parentNode).datum().nodes = this;
        });
      });

    this.nodes = this.groups
      .selectAll('.' + NODE_CLASS)
      .data(data => data.rows)
      .enter()
      .append('g')
        .classed(NODE_CLASS, true)
        .classed(CLONE_CLASS, data => data.clone)
        .attr('transform', data => 'translate(' +
          (data.x + this.visData.global.column.padding) + ', ' + data.y + ')');

    this.nodes
      .append('rect')
        .call(drawFullSizeRect, 'bg', 1);

    this.nodes.on('click', function (data) {
      that.mouseClick(this, data);
    });

    this.nodes.on('mouseenter', function (data) {
      that.mouseEnter(this, data);
    });

    this.nodes.on('mouseleave', function (data) {
      that.mouseLeave(this, data);
    });

    this.bars = new Bars(this.nodes, this.visData);

    // this.marker = new Bars(this.nodes, this.visData);

    this.nodes
      .append('rect')
        .call(drawFullSizeRect, 'border');

    // Add node label
    this.nodes.call(selection => {
      selection.append('foreignObject')
        .attr('x', data => this.visData.global.cell.padding)
        .attr('y', data => this.visData.global.row.padding +
          this.visData.global.cell.padding)
        .attr('width', this.visData.global.column.contentWidth)
        .attr('height', this.visData.global.row.contentHeight / 2 -
          this.visData.global.cell.padding * 2)
        .attr('class', 'label-wrapper')
        .append('xhtml:div')
          .attr('class', 'label')
          .attr('title', data => data.data.name)
          .append('xhtml:span')
            .text(data => data.data.name);
    });
  }

  mouseClick (el, data) {
    this.events.broadcast('d3ListGraphNodeClick', { id: data.id });
  }

  mouseEnter (el, data) {
    let that = this;
    let currentNodeData = data;

    // Store link IDs
    this.currentlyHighlightedLinks = [];

    let currentActiveProperty = d3.select(el)
      .selectAll('.bar.active .bar-magnitude').datum();

    let traverseCallbackUp = (data, childData) => {
      data.hovering = 2;
      for (let i = data.links.length; i--;) {
        // Only push direct parent child connections. E.g.
        // Store: (parent)->(child)
        // Ignore: (parent)->(siblings of child)
        if (data.links[i].target.node.id === childData.id) {
          this.currentlyHighlightedLinks.push(data.links[i].id);
        }
      }
    };

    let traverseCallbackDown = data => {
      data.hovering = 2;
      for (let i = data.links.length; i--;) {
        this.currentlyHighlightedLinks.push(data.links[i].id);
      }
    };
    traverse.upAndDown(data, traverseCallbackUp, traverseCallbackDown);

    if (data.clone) {
      data.originalNode.hovering = 1;
    }

    data.hovering = 1;

    this.nodes.each(function (data) {
      let node = d3.select(this);

      if (data.hovering === 1) {
        node.classed('hovering-directly', true);
      } else if (data.hovering === 2) {
        node.classed('hovering-indirectly', true);
        node.selectAll('.bar.' + currentActiveProperty.id)
          .classed('copy', data => {
            let id = data.id;

            if (data.clone) {
              id = data.originalNode.id;
            }

            if (id !== currentNodeData.id) {
              return true;
            }
          });

        let currentBar = d3.select(el).selectAll('.bar.' + currentActiveProperty.id)
          .classed('reference', true);

        that.bars.updateIndicator(
          node.selectAll('.bar.copy .bar-indicator'),
          currentBar.selectAll('.bar-indicator'),
          currentActiveProperty.value
        );
      }
    });

    this.links.highlight(arrayToFakeObjs(this.currentlyHighlightedLinks));

    this.events.broadcast('d3ListGraphNodeEnter', { id: data.id });
  }

  mouseLeave (el, data) {
    let traverseCallback = data => data.hovering = 0;

    data.hovering = 0;
    traverse.upAndDown(data, traverseCallback);

    if (data.clone) {
      data.originalNode.hovering = 0;
    }

    this.nodes.classed('hovering-directly', false);
    this.nodes.classed('hovering-indirectly', false);
    this.nodes.selectAll('.bar.reference').classed('reference', false);

    this.links.highlight(
      arrayToFakeObjs(this.currentlyHighlightedLinks), false
    );

    this.events.broadcast('d3ListGraphNodeLeave', { id: data.id });
  }

  sort (update, newSortType) {
    for (let i = update.length; i--;) {
      let start = function () { d3.select(this).classed('sorting', true); };
      let end = function () { d3.select(this).classed('sorting', false); };

      let selection = this.nodes.data(update[i].rows, data => data.id);

      selection
        .transition()
        .duration(config.TRANSITION_SEMI_FAST)
        .attr('transform', data => 'translate(' +
          (data.x + this.visData.global.column.padding) + ', ' + data.y + ')')
        .each('start', start)
        .each('end', end);

      if (newSortType) {
        this.bars.update(selection.selectAll('.bar'), update[i].sortBy);
      }
    }
  }
}

export default Nodes;
