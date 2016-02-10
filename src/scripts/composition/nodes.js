// External
import * as d3 from 'd3';
import isFunction from '../../../node_modules/lodash-es/lang/isFunction';

// Internal
import * as traverse from './traversal';
import * as config from './config';
import Bars from './bars';
import { arrayToFakeObjs } from './utils';
import { allTransitionsEnded } from '../commons/d3-utils';

const NODES_CLASS = 'nodes';
const NODE_CLASS = 'node';
const CLONE_CLASS = 'clone';

class Nodes {
  constructor (vis, baseSelection, visData, links, events) {
    const that = this;

    // Helper
    function drawFullSizeRect (selection, className, shrinking) {
      const shrinkingAmount = shrinking ? shrinking : 0;

      selection
        .attr('x', shrinkingAmount)
        .attr('y', that.visData.global.row.padding + shrinkingAmount)
        .attr(
          'width',
          that.visData.global.column.contentWidth - 2 * shrinkingAmount
        )
        .attr(
          'height',
          that.visData.global.row.contentHeight - 2 * shrinkingAmount
        )
        .attr('rx', 2 - shrinkingAmount)
        .attr('ry', 2 - shrinkingAmount)
        .classed(className, true);
    }

    this.vis = vis;
    this.visData = visData;
    this.links = links;
    this.events = events;
    this.currentLinks = {};
    this.iconDimension = Math.min(
      (this.visData.global.row.contentHeight / 2 -
      this.visData.global.cell.padding * 2),
      this.visData.global.column.padding / 2 - 4
    );

    this.groups = baseSelection.append('g')
      .attr('class', NODES_CLASS)
      .call(selection => {
        selection.each(function storeLinkToGroupNode () {
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
          (data.x + this.visData.global.column.padding) + ', ' + data.y + ')')
        .on('mouseenter', function (data) {
          that.vis.interactionWrapper.call(that.vis, function (domEl, _data) {
            const el = d3.select(domEl);

            if (!!!this.vis.activeScrollbar) {
              this.enterHandler.call(this, domEl, _data);
            }

            if (!el.classed('rooted')) {
              el.selectAll('.bg-extension')
                .style(
                  'transform',
                  'translateX(' + (-(this.iconDimension * 2 + 10)) + 'px)'
                );
            }
          }.bind(that), [this, data]);
        })
        .on('mouseleave', function (data) {
          that.vis.interactionWrapper.call(that.vis, function (domEl, _data) {
            const el = d3.select(domEl);

            if (!!!this.vis.activeScrollbar) {
              this.leaveHandler.call(this, domEl, _data);
            }

            if (!el.classed('rooted')) {
              if (_data.data.queryMode) {
                el.selectAll('.bg-extension')
                  .style(
                    'transform',
                    'translateX(' + (-this.iconDimension - 6) + 'px)'
                  );
              } else {
                el.selectAll('.bg-extension')
                  .style(
                    'transform',
                    'translateX(0px)'
                  );
              }
            }
          }.bind(that), [this, data]);
        });

    this.nodes
      .append('rect')
        .call(drawFullSizeRect, 'bg-extension')
        .attr(
          'width',
          Math.max(
            this.visData.global.column.padding +
              this.visData.global.column.contentWidth / 2,
            this.visData.global.column.contentWidth
          )
        );

    this.nodes
      .append('rect')
        .call(drawFullSizeRect, 'bg-border');

    this.nodes
      .append('rect')
        .call(drawFullSizeRect, 'bg', 1);

    // Rooting icons
    const nodeRooted = this.nodes.append('g')
      .attr('class', 'focus-controls root inactive')
      .on('click', function clickHandler (data) {
        that.rootHandler.call(that, this, data);
      });

    nodeRooted.append('rect')
      .call(
        this.setUpFocusControls.bind(this),
        'left',
        2,
        'hover-helper',
        'hover-helper'
      );

    nodeRooted.append('svg')
      .call(
        this.setUpFocusControls.bind(this),
        'left',
        2,
        'icon',
        'ease-all state-inactive invisible-default icon'
      )
      .append('use')
        .attr('xlink:href', this.vis.iconPath + '#unlocked');

    nodeRooted.append('svg')
      .call(
        this.setUpFocusControls.bind(this),
        'left',
        2,
        'icon',
        'ease-all state-active invisible-default icon'
      )
      .append('use')
        .attr('xlink:href', this.vis.iconPath + '#locked');

    // Rooting icons
    const nodeQuery = this.nodes.append('g')
      .attr('class', 'focus-controls query inactive')
      .on('click', function (data) {
        that.toggleQueryMode.call(that, this.parentNode, data);
      });

    nodeQuery.append('rect')
      .call(
        this.setUpFocusControls.bind(this),
        'left',
        1,
        'hover-helper',
        'hover-helper'
      );

    nodeQuery.append('svg')
      .call(
        this.setUpFocusControls.bind(this),
        'left',
        1,
        'icon',
        'ease-all state-inactive invisible-default icon'
      )
      .append('use')
        .attr('xlink:href', this.vis.iconPath + '#set-inactive');

    nodeQuery.append('svg')
      .call(
        this.setUpFocusControls.bind(this),
        'left',
        1,
        'icon',
        'ease-all state-and-or invisible-default icon'
      )
      .append('use')
        .attr('xlink:href', this.vis.iconPath + '#union');

    nodeQuery.append('svg')
      .call(
        this.setUpFocusControls.bind(this),
        'left',
        1,
        'icon',
        'ease-all state-not invisible-default icon'
      )
      .append('use')
        .attr('xlink:href', this.vis.iconPath + '#not');

    const nodeLocks = this.nodes.append('g')
      .attr('class', 'focus-controls lock inactive')
      .on('click', function clickHandler (data) {
        that.lockHandler.call(that, this, data);
      });

    nodeLocks.append('circle')
      .call(this.setUpFocusControls.bind(this), 'right', 0, 'bg', 'bg');

    nodeLocks.append('svg')
      .call(
        this.setUpFocusControls.bind(this),
        'right',
        0,
        'icon',
        'ease-all state-inactive invisible-default icon'
      )
      .append('use')
        .attr('xlink:href', this.vis.iconPath + '#unlocked');

    nodeLocks.append('svg')
      .call(
        this.setUpFocusControls.bind(this),
        'right',
        0,
        'icon',
        'ease-all state-active invisible-default icon'
      )
      .append('use')
        .attr('xlink:href', this.vis.iconPath + '#locked');

    this.bars = new Bars(this.vis, this.nodes, this.vis.barMode, this.visData);

    this.nodes
      .append('rect')
        .call(drawFullSizeRect, 'border');

    // Add node label
    this.nodes.call(selection => {
      selection.append('foreignObject')
        .attr('x', this.visData.global.cell.padding)
        .attr('y', this.visData.global.row.padding +
          this.visData.global.cell.padding)
        .attr('width', this.visData.global.column.contentWidth)
        .attr('height', this.visData.global.row.contentHeight -
          this.visData.global.cell.padding * 2)
        .attr('class', 'label-wrapper')
        .on('click', function clickHandler (data) {
          that.clickHandler.call(that, this, data);
        })
        .append('xhtml:div')
          .attr('class', 'label')
          .attr('title', data => data.data.name)
          .style('line-height', (this.visData.global.row.contentHeight -
            this.visData.global.cell.padding * 2) + 'px')
          .append('xhtml:span')
            .text(data => data.data.name);
    });

    if (isFunction(this.events.on)) {
      // this.events.on('d3ListGraphNodeClick', dataSetIds => {
      //   console.log('d3ListGraphNodeClick', dataSetIds);
      // });

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
        data => this.eventHelper(
          data.nodeIds, this.toggleRoot, [], '.root'
        )
      );

      this.events.on(
        'd3ListGraphNodeUnroot',
        data => this.eventHelper(
          data.nodeIds, this.toggleRoot, [true], '.root'
        )
      );
    }
  }

  clickHandler (el, data) {
    this.toggleQueryMode(el.parentNode, data);
    // this.events.broadcast('d3ListGraphNodeClick', { id: data.id });
  }

  enterHandler (el, data) {
    this.highlightNodes(el, data);

    const eventData = {
      id: data.id,
      clone: false,
      clonedFromId: undefined,
    };

    if (data.clone) {
      eventData.clone = true;
      eventData.clonedFromId = data.originalNode.id;
    }

    this.events.broadcast('d3ListGraphNodeEnter', eventData);
  }

  leaveHandler (el, data) {
    this.unhighlightNodes(el, data);

    const eventData = {
      id: data.id,
      clone: false,
      clonedFromId: undefined,
    };

    if (data.clone) {
      eventData.clone = true;
      eventData.clonedFromId = data.originalNode.id;
    }

    this.events.broadcast('d3ListGraphNodeLeave', eventData);
  }

  lockHandler (el) {
    const events = this.toggleLock(el);

    if (events.locked && events.unlocked) {
      if (events.locked) {
        this.events.broadcast('d3ListGraphNodeLockChange', {
          lock: {
            id: events.locked.id,
            clone: events.locked.clone,
            clonedFromId: events.locked.clone ?
              events.locked.originalNode.id : undefined,
          },
          unlock: {
            id: events.unlocked.id,
            clone: events.unlocked.clone,
            clonedFromId: events.unlocked.clone ?
              events.unlocked.originalNode.id : undefined,
          },
        });
      }
    } else {
      if (events.locked) {
        this.events.broadcast('d3ListGraphNodeLock', {
          id: events.locked.id,
          clone: events.locked.clone,
          clonedFromId: events.locked.clone ?
            events.locked.originalNode.id : undefined,
        });
      }

      if (events.unlocked) {
        this.events.broadcast('d3ListGraphNodeUnlock', {
          id: events.unlocked.id,
          clone: events.unlocked.clone,
          clonedFromId: events.unlocked.clone ?
            events.unlocked.originalNode.id : undefined,
        });
      }
    }
  }

  rootHandler (el) {
    const events = this.toggleRoot(el);

    if (events.rooted && events.unrooted) {
      this.events.broadcast('d3ListGraphNodeReroot', {
        rooted: {
          id: events.rooted.id,
          clone: events.rooted.clone,
          clonedFromId: events.rooted.clone ?
            events.rooted.originalNode.id : undefined,
        },
        unrooted: {
          id: events.unrooted.id,
          clone: events.unrooted.clone,
          clonedFromId: events.unrooted.clone ?
            events.unrooted.originalNode.id : undefined,
        },
      });
    } else {
      if (events.rooted) {
        this.events.broadcast('d3ListGraphNodeRoot', {
          id: events.rooted.id,
          clone: events.rooted.clone,
          clonedFromId: events.rooted.clone ?
            events.rooted.originalNode.id : undefined,
        });
      }

      if (events.unrooted) {
        this.events.broadcast('d3ListGraphNodeUnroot', {
          id: events.unrooted.id,
          clone: events.unrooted.clone,
          clonedFromId: events.unrooted.clone ?
            events.unrooted.originalNode.id : undefined,
        });
      }
    }

    this.events.broadcast('d3ListGraphUpdateBarsRequest', {
      id: events.rooted.id,
      clone: events.rooted.clone,
      clonedFromId: events.rooted.clone ?
        events.rooted.originalNode.id : undefined,
    });
  }

  focusNodes (event) {
    this.eventHelper(
      event.nodeIds,
      this.highlightNodes,
      ['focus', 'directParentsOnly', !!event.excludeClones ? true : false]
    );
    if (event.zoomOut) {
      this.vis.globalView(this.nodes.filter(data => data.hovering > 0));
    } else {
      this.vis.zoomedView();
    }
  }

  blurNodes (event) {
    this.eventHelper(
      event.nodeIds,
      this.unhighlightNodes,
      ['focus', 'directParentsOnly', !!event.excludeClones ? true : false]
    );
    if (event.zoomIn) {
      this.vis.zoomedView();
    }
  }

  eventHelper (nodeIds, callback, optionalParams, subSelectionClass) {
    const that = this;

    this.nodes
      // Filter by node ID
      .filter(data => !!~nodeIds.indexOf(data.id))
      .each(function triggerCallback (data) {
        let el = this;

        if (subSelectionClass) {
          el = d3.select(this).select(subSelectionClass).node();
        }

        callback.apply(
          that,
          [el, data].concat(optionalParams ? optionalParams : [])
        );
      });
  }

  get barMode () {
    return this.bars.mode;
  }

  toggleLock (el, nodeData, setFalse) {
    const d3El = d3.select(el);
    const data = d3El.datum();
    const events = { locked: false, unlocked: false };

    if (this.lockedNode) {
      if (this.lockedNode.datum().id === data.id) {
        this.lockedNode.classed({ active: false, inactive: true });
        this.unlockNode(this.lockedNode.datum().id);
        events.unlocked = this.lockedNode.datum();
        this.lockedNode = undefined;
      } else {
        // Reset previously locked node;
        this.lockedNode.classed({ active: false, inactive: true });
        this.unlockNode(this.lockedNode.datum().id);
        events.unlocked = this.lockedNode.datum();

        if (!setFalse) {
          d3El.classed({ active: true, inactive: false });
          this.lockNode(data.id);
          events.locked = data;
          this.lockedNode = d3El;
        }
      }
    } else {
      if (!setFalse) {
        d3El.classed({ active: true, inactive: false });
        this.lockNode(data.id);
        events.locked = data;
        this.lockedNode = d3El;
      }
    }

    return events;
  }

  lockNode (id) {
    const that = this;
    const els = this.nodes.filter(data => data.id === id);

    els.each(function triggerHighlighter (data) {
      that.highlightNodes(this, data, 'lock', undefined);
    });

    els.selectAll('.bg-border')
      .transition()
      .duration(config.TRANSITION_SEMI_FAST)
      .attr('width', function width () {
        return parseInt(
          d3.select(this).attr('width'), 10
        ) + that.visData.global.row.height / 2;
      });
  }

  unlockNode (id) {
    const that = this;
    const els = this.nodes.filter(data => data.id === id);
    const start = function animationStart () {
      d3.select(this.parentNode).classed('animating', true);
    };
    const end = function animationEnd () {
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

  queryNode (el, data, mode) {
    data.data.queryMode = mode;
    d3.select(el).classed({
      active: true,
      inactive: false,
      'query-and': mode === 'and' ? true : false,
      'query-or': mode === 'or' ? true : false,
      'query-not': mode === 'not' ? true : false,
    });
  }

  unqueryNode (el, data) {
    data.data.queryMode = undefined;
    data.data.queryBeforeRooting = undefined;
    d3.select(el).classed({
      active: false,
      inactive: true,
      'query-and': false,
      'query-or': false,
      'query-not': false,
    });
    if (this.rootedNode) {
      this.updateVisibility();
    }
  }

  toggleQueryMode (el, data) {
    const previousMode = data.data.queryMode;

    if (data.rooted) {
      if (previousMode !== 'or') {
        this.queryNode(el, data, 'or');
      } else {
        this.queryNode(el, data, 'and');
      }
    } else {
      switch (previousMode) {
        case 'or':
          this.queryNode(el, data, 'and');
          break;
        case 'and':
          this.queryNode(el, data, 'not');
          break;
        case 'not':
          this.unqueryNode(el, data);
          break;
        default:
          this.queryNode(el, data, 'or');
          break;
      }
    }

    if (data.data.queryMode) {
      if (data.data.queryMode !== previousMode) {
        this.events.broadcast('d3ListGraphNodeQuery', {
          id: data.id,
          clone: data.clone,
          clonedFromId: data.clone ?
            data.originalNode.id : undefined,
          mode: data.data.queryMode,
        });
      }
    } else {
      this.events.broadcast('d3ListGraphNodeUnquery', {
        id: data.id,
        clone: data.clone,
        clonedFromId: data.clone ?
          data.originalNode.id : undefined,
      });
    }
  }

  progToggleQueryMode (el, data) {
    this.toggleQueryMode(
      d3.select(el).selectAll('.focus-controls.query')[0].node(),
      data
    );
  }

  toggleRoot (el, setFalse) {
    const d3El = d3.select(el);
    const data = d3El.datum();
    const events = { rooted: false, unrooted: false };

    // Blur current levels
    this.vis.levels.blur();

    if (this.rootedNode) {
      // Reset current root node
      this.rootedNode.classed({ active: false, inactive: true });
      this.unrootNode(this.rootedNode.node(), this.rootedNode.datum());
      events.unrooted = this.rootedNode.datum();

      // Activate new root
      if (this.rootedNode.datum().id !== data.id && !setFalse) {
        d3El.classed({ active: true, inactive: false });
        this.rootNode(el, data);
        this.rootedNode = d3El;
        events.rooted = data;
      } else {
        this.rootedNode = undefined;
        // Highlight first level
        this.vis.levels.focus(
          this.vis.activeLevelNumber - this.vis.noRootedNodeDifference
        );
      }
    } else {
      if (!setFalse) {
        d3El.classed({ active: true, inactive: false });
        this.rootNode(el, data);
        events.rooted = data;
        this.rootedNode = d3El;
      }
    }

    return events;
  }

  rootNode (el, data) {
    const d3El = d3.select(el.parentNode);

    data.rooted = true;
    d3El.classed('rooted', true);
    this.hideNodes(d3El.node(), data, 'downStream');

    d3El.selectAll('.bg-extension')
      .style(
        'transform',
        'translateX(' + (-(this.iconDimension * 2 + 10)) + 'px)'
      );

    // Highlight level
    this.vis.levels.focus(data.depth + this.vis.activeLevelNumber);

    if (!data.data.queryMode || data.data.queryMode === 'not') {
      this.toggleQueryMode(d3El.node(), data);
      data.data.queryBeforeRooting = false;
    } else {
      data.data.queryBeforeRooting = true;
    }
  }

  unrootNode (el, data) {
    const d3El = d3.select(el.parentNode);

    let x = 0;

    if (data.data.queryMode) {
      x = -this.iconDimension - 6;
    }

    d3El.selectAll('.bg-extension')
      .style(
        'transform',
        'translateX(' + x + 'px)'
      );

    data.rooted = false;
    d3El.classed('rooted', false);
    this.showNodes(d3El.node(), data, 'downStream');

    if (!data.data.queryBeforeRooting) {
      this.unqueryNode(d3El.node(), data);
    }
  }

  setUpFocusControls (selection, location, position, mode, className) {
    // const height = (this.visData.global.row.contentHeight / 2 -
    //   this.visData.global.cell.padding * 2);

    const paddedDim = this.iconDimension + 4;

    const x = location === 'left' ?
      -(paddedDim) * (position ? position : 1) :
        this.visData.global.column.contentWidth + 2;
    const y = this.visData.global.row.padding +
      (
        this.visData.global.row.contentHeight -
        2 * this.visData.global.cell.padding
      ) / 4;

    if (mode === 'bg') {
      selection
        .attr({
          class: className,
          cx: x + (this.iconDimension / 2),
          cy: y + (this.iconDimension / 2),
          r: this.iconDimension * 3 / 4,
        });
    } else if (mode === 'hover-helper') {
      selection
        .attr({
          class: className,
          x: x - 2,
          y: y - 2,
          width: this.iconDimension + 4,
          height: this.iconDimension + 4,
        });
    } else {
      selection
        .attr({
          class: className,
          x,
          y,
          width: this.iconDimension,
          height: this.iconDimension,
        });
    }
  }

  hideNodes (el, data, direction) {
    return this.nodesVisibility(el, data, direction);
  }

  showNodes (el, data, direction) {
    return this.nodesVisibility(el, data, direction, true);
  }

  nodesVisibility (el, data, direction, show) {
    if (show) {
      this.nodes
        .classed('hidden', false)
        .each(nodeData => nodeData.hidden = false);
    } else {
      // First we set all nodes to `hidden`.
      this.nodes.each(nodeData => nodeData.hidden = true);

      // Then we set direct child and parent nodes of the current node visible.
      traverse.upAndDown(data, nodeData => nodeData.hidden = false);

      // We also show sibling nodes.
      traverse.siblings(data, nodeData => nodeData.hidden = false);

      this.nodes.classed(
        'hidden',
        nodeData => nodeData.hidden && !nodeData.data.queryMode
      );
    }
    this.updateVisibility();
  }

  highlightNodes (el, data, className, restriction, excludeClones) {
    const that = this;
    const nodeId = data.id;
    const currentNodeData = data;
    const includeParents = true;
    const appliedClassName = className ? className : 'hovering';
    const includeClones = excludeClones ? false : true;
    const includeChildren = restriction === 'directParentsOnly' ? false : true;

    // Store link IDs
    if (!this.currentLinks[appliedClassName]) {
      this.currentLinks[appliedClassName] = {};
    }
    this.currentLinks[appliedClassName][nodeId] = [];

    const currentActiveProperty = d3.select(el)
      .selectAll('.bar.active .bar-magnitude').datum();

    const traverseCallbackUp = (nodeData, childData) => {
      nodeData.hovering = 2;
      for (let i = nodeData.links.length; i--;) {
        // Only push direct parent child connections. E.g.
        // Store: (parent)->(child)
        // Ignore: (parent)->(siblings of child)
        if (nodeData.links[i].target.node.id === childData.id) {
          this.currentLinks[appliedClassName][nodeId].push(
            nodeData.links[i].id
          );
        }
      }
    };

    const traverseCallbackDown = nodeData => {
      nodeData.hovering = 2;
      for (let i = nodeData.links.length; i--;) {
        this.currentLinks[appliedClassName][nodeId].push(nodeData.links[i].id);
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
    } else {
      if (includeClones) {
        for (let i = data.clones.length; i--;) {
          data.clones[i].hovering = 1;
        }
      }
    }

    data.hovering = 1;

    this.nodes.each(function (nodeData) {
      const node = d3.select(this);

      if (nodeData.hovering === 1) {
        node.classed(appliedClassName + '-directly', true);
      } else if (nodeData.hovering === 2) {
        node.classed(appliedClassName + '-indirectly', true);
        node.selectAll('.bar.' + currentActiveProperty.id)
          .classed('copy', barData => {
            let id = barData.id;

            if (barData.clone) {
              id = barData.originalNode.id;
            }

            if (id !== currentNodeData.id) {
              return true;
            }
          });

        const currentBar = d3.select(el)
          .selectAll('.bar.' + currentActiveProperty.id)
            .classed('reference', true);

        that.bars.updateIndicator(
          node.selectAll('.bar.copy .bar-indicator'),
          node.selectAll('.bar.copy .bar-indicator-bg'),
          currentBar.selectAll('.bar-indicator'),
          currentActiveProperty.value
        );
      }
    });

    this.links.highlight(
      arrayToFakeObjs(this.currentLinks[appliedClassName][data.id]),
      true,
      appliedClassName
    );
  }

  unhighlightNodes (el, data, className, restriction, excludeClones) {
    const traverseCallback = nodeData => nodeData.hovering = 0;
    const includeParents = true;
    const appliedClassName = className ? className : 'hovering';
    const includeClones = excludeClones ? false : true;
    const includeChildren = restriction === 'directParentsOnly' ? false : true;

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
    } else {
      if (includeClones) {
        for (let i = data.clones.length; i--;) {
          data.clones[i].hovering = 0;
        }
      }
    }

    this.nodes.classed(appliedClassName + '-directly', false);
    this.nodes.classed(appliedClassName + '-indirectly', false);

    if (this.currentLinks[appliedClassName][data.id]) {
      this.links.highlight(
        arrayToFakeObjs(this.currentLinks[appliedClassName][data.id]),
        false,
        appliedClassName
      );
    }
  }

  sort (update, newSortType) {
    for (let i = update.length; i--;) {
      const selection = this.nodes.data(update[i].rows, data => data.id);

      this.vis.svgD3.classed('sorting', true);
      selection
        .transition()
        .duration(config.TRANSITION_SEMI_FAST)
        .attr('transform', data => 'translate(' +
          (data.x + this.visData.global.column.padding) + ', ' + data.y + ')')
        .call(allTransitionsEnded, () => {
          this.vis.svgD3.classed('sorting', false);
          this.vis.updateLevelsVisibility();
          this.vis.updateScrollbarVisibility();
        });

      if (
        newSortType &&
        this.vis.currentSorting.local[update[i].level].type !== 'name'
      ) {
        this.bars.update(selection.selectAll('.bar'), update[i].sortBy);
      }
    }
  }

  updateVisibility () {
    this.vis.layout.updateNodesVisibility();

    this.nodes
      .transition()
      .duration(config.TRANSITION_SEMI_FAST)
      .attr('transform', data => 'translate(' +
        (data.x + this.visData.global.column.padding) + ', ' + data.y + ')')
      .call(allTransitionsEnded, () => {
        this.vis.updateLevelsVisibility();
        this.vis.updateScrollbarVisibility();
      });

    this.vis.links.updateVisibility();
  }
}

export default Nodes;
