'use strict';

// External
import * as d3 from 'd3';
import isFunction from '../../../node_modules/lodash-es/lang/isFunction';

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
  constructor (vis, baseSelection, visData, links, events) {
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

    this.vis = vis;
    this.visData = visData;
    this.links = links;
    this.events = events;
    this.currentLinks = {};

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
        .call(drawFullSizeRect, 'bg-extension')
        .attr('width', this.visData.global.column.padding + 5);

    this.nodes
      .append('rect')
        .call(drawFullSizeRect, 'bg-border');

    this.nodes
      .append('rect')
        .call(drawFullSizeRect, 'bg', 1);

    // Rooting icons
    let nodeRooted = this.nodes.append('g')
      .attr('class', 'focus-controls root inactive')
      .on('click', function (data) {
        that.rootHandler.call(that, this, data);
      });

    nodeRooted.append('circle')
      .call(this.setUpFocusControls.bind(this), 'left', 'bg', 'bg');

    nodeRooted.append('svg')
      .call(
        this.setUpFocusControls.bind(this),
        'left',
        'icon',
        'ease-all state-inactive invisible-default'
      )
      .append('use')
        .attr('xlink:href', this.vis.iconPath + '#unlocked');

    nodeRooted.append('svg')
      .call(
        this.setUpFocusControls.bind(this),
        'left',
        'icon',
        'ease-all state-active invisible-default'
      )
      .append('use')
        .attr('xlink:href', this.vis.iconPath + '#locked');

    let nodeLocks = this.nodes.append('g')
      .attr('class', 'focus-controls lock inactive')
      .on('click', function (data) {
        that.lockHandler.call(that, this, data);
      });

    nodeLocks.append('circle')
      .call(this.setUpFocusControls.bind(this), 'right', 'bg', 'bg');

    nodeLocks.append('svg')
      .call(
        this.setUpFocusControls.bind(this),
        'right',
        'icon',
        'ease-all state-inactive invisible-default'
      )
      .append('use')
        .attr('xlink:href', this.vis.iconPath + '#unlocked');

    nodeLocks.append('svg')
      .call(
        this.setUpFocusControls.bind(this),
        'right',
        'icon',
        'ease-all state-active invisible-default'
      )
      .append('use')
        .attr('xlink:href', this.vis.iconPath + '#locked');

    this.nodes.on('click', function (data) {
      that.clickHandler.call(that, this, data);
    });

    this.nodes.on('mouseenter', function (data) {
      that.enterHandler.call(that, this, data);
    });

    this.nodes.on('mouseleave', function (data) {
      that.leaveHandler.call(that, this, data);
    });

    this.bars = new Bars(this.nodes, this.vis.barMode, this.visData);

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
        .attr('height', this.visData.global.row.contentHeight -
          this.visData.global.cell.padding * 2)
        .attr('class', 'label-wrapper')
        .append('xhtml:div')
          .attr('class', 'label')
          .attr('title', data => data.data.name)
          .style('line-height', (this.visData.global.row.contentHeight -
            this.visData.global.cell.padding * 2) + 'px')
          .append('xhtml:span')
            .text(data => data.data.name);
    });

    if (isFunction(this.events.on)) {
      this.events.on('d3ListGraphNodeClick', dataSetIds => {
        console.log('d3ListGraphNodeClick', dataSetIds);
      });

      this.events.on('d3ListGraphFocusNodes', event => this.focusNodes(event));

      this.events.on('d3ListGraphBlurNodes', event => this.blurNodes(event));

      this.events.on(
        'd3ListGraphNodeEnter',
        nodeIds => this.eventHelper(
          nodeIds, this.highlightNodes
        )
      );

      this.events.on(
        'd3ListGraphNodeLeave',
        nodeIds => this.eventHelper(
          nodeIds, this.unhighlightNodes
        )
      );

      this.events.on(
        'd3ListGraphNodeLock',
        nodeIds => this.eventHelper(
          nodeIds, this.toggleLock, [], '.lock'
        )
      );

      this.events.on(
        'd3ListGraphNodeUnlock',
        nodeIds => this.eventHelper(
          nodeIds, this.toggleLock, [true], '.lock'
        )
      );

      this.events.on(
        'd3ListGraphNodeRoot',
        nodeIds => this.eventHelper(
          nodeIds, this.toggleRoot, [], '.root'
        )
      );

      this.events.on(
        'd3ListGraphNodeUnroot',
        nodeIds => this.eventHelper(
          nodeIds, this.toggleRoot, [true], '.root'
        )
      );
    }
  }

  clickHandler (el, data) {
    this.events.broadcast('d3ListGraphNodeClick', { id: data.id });
  }

  enterHandler (el, data) {
    this.highlightNodes(el, data);
    this.events.broadcast('d3ListGraphNodeEnter', { id: data.id });
  }

  leaveHandler (el, data) {
    this.unhighlightNodes(el, data);
    this.events.broadcast('d3ListGraphNodeLeave', { id: data.id });
  }

  lockHandler (el, data) {
    let events = this.toggleLock(el);

    if (events.locked) {
      this.events.broadcast('d3ListGraphNodeLock', { id: events.locked });
    }
    if (events.unlocked) {
      this.events.broadcast('d3ListGraphNodeUnlock', { id: events.unlocked });
    }
  }

  rootHandler (el, data) {
    let events = this.toggleRoot(el);

    if (events.rooted) {
      this.events.broadcast('d3ListGraphNodeRoot', { id: events.rooted });
    }
    if (events.unrooted) {
      this.events.broadcast('d3ListGraphNodeUnroot', { id: events.unrooted });
    }
  }

  focusNodes (event) {
    this.eventHelper(
      event.nodeIds,
      this.highlightNodes,
      ['focus', 'directParentsOnly', true]
    );
    if (event.zoomOut) {
      this.vis.globalView();
    }
  }

  blurNodes (event) {
    this.eventHelper(
      event.nodeIds,
      this.unhighlightNodes,
      ['focus', 'directParentsOnly', true]
    );
    if (event.zoomIn) {
      this.vis.zoomedView();
    }
  }

  eventHelper (nodeIds, callback, optionalParams, subSelectionClass) {
    let that = this;

    optionalParams = optionalParams ? optionalParams : [];

    for (let i = nodeIds.length; i--;) {
      this.nodes.filter(data => data.id === nodeIds[i]).each(
        function (data) {
          let el = this;

          if (subSelectionClass) {
            el = d3.select(this).select(subSelectionClass).node();
          }

          callback.apply(
            that,
            [el, data].concat(optionalParams)
          );
        }
      );
    }
  }

  get barMode () {
    return this.bars.mode;
  }

  toggleLock (el, nodeData, setFalse) {
    let d3El = d3.select(el);
    let data = d3El.datum();
    let events = { locked: false, unlocked: false };

    if (this.lockedNode) {
      if (this.lockedNode.datum().id === data.id) {
        this.lockedNode.classed({
          'active': false,
          'inactive': true
        });
        this.unlockNode(this.lockedNode.datum().id);
        events.unlocked = this.lockedNode.datum().id;
        this.lockedNode = undefined;
      } else {
        // Reset previously locked node;
        this.lockedNode.classed({
          'active': false,
          'inactive': true
        });
        this.unlockNode(this.lockedNode.datum().id);
        events.unlocked = this.lockedNode.datum().id;

        if (!setFalse) {
          d3El.classed({
            'active': true,
            'inactive': false
          });
          this.lockNode(data.id);
          events.locked = data.id;
          this.lockedNode = d3El;
        }
      }
    } else {
      if (!setFalse) {
        d3El.classed({
          'active': true,
          'inactive': false
        });
        this.lockNode(data.id);
        events.locked = data.id;
        this.lockedNode = d3El;
      }
    }

    return events;
  }

  lockNode (id) {
    let that = this;
    let els = this.nodes.filter(data => data.id === id);

    els.each(function (data) {
      that.highlightNodes(this, data, 'lock', undefined);
    });

    els.selectAll('.bg-border')
      .transition()
      .duration(config.TRANSITION_SEMI_FAST)
      .attr('width', function () {
        return parseInt(
          d3.select(this).attr('width')
        ) + that.visData.global.row.height / 2;
      });
  }

  unlockNode (id) {
    let that = this;
    let els = this.nodes.filter(data => data.id === id);
    let start = function () {
      d3.select(this.parentNode).classed('animating', true);
    };
    let end = function () {
      d3.select(this.parentNode).classed('animating', false);
    };

    els.selectAll('.bg-border')
      .transition()
      .duration(config.TRANSITION_SEMI_FAST)
      .attr('width', this.visData.global.column.contentWidth)
      .each('start', start)
      .each('end', end);

    els.each(function (data) {
      that.unhighlightNodes(this, data, 'lock', undefined);
    });
  }

  toggleRoot (el, nodeData, setFalse) {
    let d3El = d3.select(el);
    let data = d3El.datum();
    let events = { rooted: false, unrooted: false };

    if (this.rootedNode) {
      // Reset current root node
      this.rootedNode.classed({
        'active': false,
        'inactive': true
      });
      this.unrootNode(this.rootedNode.datum().id);
      events.unrooted = this.rootedNode.datum().id;

      // Activate new root
      if (this.rootedNode.datum().id !== data.id && !setFalse) {
        d3El.classed({
          'active': true,
          'inactive': false
        });
        this.rootNode(data.id);
        this.rootedNode = d3El;
        events.rooted = data.id;
      } else {
        this.rootedNode = undefined;
      }
    } else {
      if (!setFalse) {
        d3El.classed({
          'active': true,
          'inactive': false
        });
        this.rootNode(data.id);
        events.rooted = data.id;
        this.rootedNode = d3El;
      }
    }

    return events;
  }

  rootNode (id) {
    let that = this;
    let els = this.nodes.filter(data => data.id === id);

    els.each(function (data) {
      data.rooted = true;
      d3.select(this).classed('rooted', true);
      that.hideNodes.call(that, this, data, 'downStream');
    });

    els.selectAll('.bg-extension')
      .transition()
      .duration(config.TRANSITION_SEMI_FAST)
      .attr('x', -that.visData.global.row.height / 2);
  }

  unrootNode (id) {
    let that = this;
    let els = this.nodes.filter(data => data.id === id);
    let start = function () {
      d3.select(this.parentNode).classed('animating', true);
    };
    let end = function () {
      d3.select(this.parentNode).classed('animating', false);
    };

    els.selectAll('.bg-extension')
      .transition()
      .duration(config.TRANSITION_SEMI_FAST)
      .attr('x', 0)
      .each('start', start)
      .each('end', end);

    els.each(function (data) {
      data.rooted = false;
      d3.select(this).classed('rooted', false);
      that.showNodes.call(that, this, data, 'downStream');
    });
  }

  setUpFocusControls (selection, location, mode, className) {
    let height = (this.visData.global.row.contentHeight / 2 -
      this.visData.global.cell.padding * 2);
    let x = location === 'left' ?
      -height - 2 : this.visData.global.column.contentWidth + 2;
    let y = this.visData.global.row.padding +
      (
        this.visData.global.row.contentHeight -
        2 * this.visData.global.cell.padding
      ) / 4;

    if (mode === 'bg') {
      selection
        .attr({
          class: className,
          cx: x + (height / 2),
          cy: y + (height / 2),
          r: height * 3 / 4,
        });
    } else {
      selection
        .attr({
          class: className,
          x: x,
          y: y,
          width: height,
          height: height
        });
    }
  }

  hideNodes (el, data, direction) {
    return this.nodesVisibility (el, data, direction);
  }

  showNodes (el, data, direction) {
    return this.nodesVisibility (el, data, direction, true);
  }

  nodesVisibility (el, data, direction, show) {
    let that = this;
    let currentNodeData = data;

    if (show) {
      this.nodes
        .classed('hidden', false)
        .each(data => data.hidden = false);
    } else {
      // First we set all nodes to `hidden`.
      this.nodes.each(data => data.hidden = true);

      // Then we set direct child and parent nodes of the current node visible.
      traverse.upAndDown(data, data => data.hidden = false);

      // We also show sibling nodes.
      traverse.siblings(data, data => data.hidden = false);

      this.nodes.classed('hidden', data => data.hidden);
    }
    this.updateVisibility();
  }

  highlightNodes (el, data, className, restriction) {
    let that = this;
    let nodeId = data.id;
    let currentNodeData = data;
    let includeClones = true;
    let includeParents = true;
    let includeChildren = true;

    className = className ? className : 'hovering';

    if (restriction === 'directParentsOnly') {
      includeClones = false;
      includeChildren = false;
    }

    // Store link IDs
    if (!this.currentLinks[className]) {
      this.currentLinks[className] = {};
    }
    this.currentLinks[className][nodeId] = [];

    let currentActiveProperty = d3.select(el)
      .selectAll('.bar.active .bar-magnitude').datum();

    let traverseCallbackUp = (data, childData) => {
      data.hovering = 2;
      for (let i = data.links.length; i--;) {
        // Only push direct parent child connections. E.g.
        // Store: (parent)->(child)
        // Ignore: (parent)->(siblings of child)
        if (data.links[i].target.node.id === childData.id) {
          this.currentLinks[className][nodeId].push(data.links[i].id);
        }
      }
    };

    let traverseCallbackDown = data => {
      data.hovering = 2;
      for (let i = data.links.length; i--;) {
        this.currentLinks[className][nodeId].push(data.links[i].id);
      }
    };

    if (includeParents && includeChildren) {
      traverse.upAndDown(
        data, traverseCallbackUp, traverseCallbackDown, undefined, includeClones
      );
    }
    if (includeParents && !includeChildren) {
      traverse.up(data, traverseCallbackUp, undefined, includeClones);
    }
    if (!includeParents && includeChildren) {
      traverse.down(data, traverseCallbackUp, undefined, includeClones);
    }

    if (data.clone) {
      data.originalNode.hovering = 1;
    }

    data.hovering = 1;

    this.nodes.each(function (data) {
      let node = d3.select(this);

      if (data.hovering === 1) {
        node.classed(className + '-directly', true);
      } else if (data.hovering === 2) {
        node.classed(className + '-indirectly', true);
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

        let currentBar = d3.select(el)
          .selectAll('.bar.' + currentActiveProperty.id)
            .classed('reference', true);

        that.bars.updateIndicator(
          node.selectAll('.bar.copy .bar-indicator'),
          currentBar.selectAll('.bar-indicator'),
          currentActiveProperty.value
        );
      }
    });

    this.links.highlight(
      arrayToFakeObjs(this.currentLinks[className][data.id]),
      true,
      className
    );
  }

  unhighlightNodes (el, data, className, restriction) {
    let traverseCallback = data => data.hovering = 0;
    let includeClones = true;
    let includeParents = true;
    let includeChildren = true;

    className = className ? className : 'hovering';

    if (restriction === 'directParentsOnly') {
      includeClones = false;
      includeChildren = false;
    }

    className = className ? className : 'hovering';

    data.hovering = 0;
    if (includeParents && includeChildren) {
      traverse.upAndDown(
        data, traverseCallback, undefined, undefined, includeClones
      );
    }
    if (includeParents && !includeChildren) {
      traverse.up(data, traverseCallback, undefined, includeClones);
    }
    if (!includeParents && includeChildren) {
      traverse.down(data, traverseCallback, undefined, includeClones);
    }

    if (data.clone) {
      data.originalNode.hovering = 0;
    }

    this.nodes.classed(className + '-directly', false);
    this.nodes.classed(className + '-indirectly', false);

    this.links.highlight(
      arrayToFakeObjs(this.currentLinks[className][data.id]),
      false,
      className
    );
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

  updateVisibility () {
    this.vis.layout.updateNodesVisibility();

    let completed = (transition, callback) => {
      if (transition.size() === 0) {
        callback();
      }
      let n = 0;
      transition
        .each(() => ++n)
        .each('end', function () {
          if (!--n) callback.apply(this, arguments);
        });
    };

    this.nodes
      .transition()
      .duration(config.TRANSITION_SEMI_FAST)
      .attr('transform', data => 'translate(' +
        (data.x + this.visData.global.column.padding) + ', ' + data.y + ')')
      .call(completed, () => this.vis.updateScrollbarVisibility());

    this.vis.links.updateVisibility();
  }
}

export default Nodes;
