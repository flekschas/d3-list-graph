// External
import * as d3 from 'd3';
import isFunction from '../../../node_modules/lodash-es/isFunction';

// Internal
import * as traverse from './traversal';
import * as config from './config';
import Bars from './bars';
import { allTransitionsEnded } from '../commons/d3-utils';
import { roundRect } from '../commons/charts';

const CLASS_NODES = 'nodes';
const CLASS_NODE = 'node';
const CLASS_NODE_VISIBLE = 'visible-node';
const CLASS_CLONE = 'clone';
const CLASS_LABEL_WRAPPER = 'label-wrapper';
const CLASS_FOCUS_CONTROLS = 'focus-controls';
const CLASS_ROOT = 'root';
const CLASS_QUERY = 'query';
const CLASS_LOCK = 'lock';
const CLASS_INACTIVE = 'inactive';
const CLASS_INDICATOR_BAR = 'link-indicator';
const CLASS_INDICATOR_LOCATION = 'link-location-indicator';
const CLASS_INDICATOR_INCOMING = 'incoming';
const CLASS_INDICATOR_OUTGOING = 'outgoing';
const CLASS_INDICATOR_ABOVE = 'above';
const CLASS_INDICATOR_BELOW = 'below';

class Nodes {
  constructor (vis, baseSelection, visData, links, events) {
    const that = this;

    this.vis = vis;
    this.visData = visData;
    this.links = links;
    this.events = events;
    this.currentLinks = {};
    this.iconDimension = Math.min(
      (
        this.visData.global.row.contentHeight / 2 -
        this.visData.global.cell.padding * 2
      ),
      this.visData.global.column.padding / 2 - 4
    );

    const linkDensityBg = d3.scale.linear()
      .domain([1, this.vis.rows])
      .range(['#ccc', '#000']);

    function drawLinkIndicator (selection, direction) {
      const incoming = direction === 'incoming';

      selection
        .attr(
          'class',
          CLASS_INDICATOR_BAR + ' ' + (incoming ?
            CLASS_INDICATOR_INCOMING : CLASS_INDICATOR_OUTGOING)
        )
        .attr(
          'd',
          roundRect(
            incoming ? -7 : this.visData.global.column.contentWidth,
            this.visData.global.row.height / 2 - 1,
            7,
            2,
            {
              topLeft: incoming ? 1 : 0,
              topRight: incoming ? 0 : 1,
              bottomLeft: incoming ? 1 : 0,
              bottomRight: incoming ? 0 : 1
            }
          )
        )
        .attr('fill', data => linkDensityBg(data.links[direction].refs.length))
        .classed('visible', data => data.links[direction].refs.length > 0);
    }

    function drawLinkLocationIndicator (selection, direction, position) {
      const above = position === 'above';
      const incoming = direction === 'incoming';

      const className = CLASS_INDICATOR_LOCATION + ' ' + (
        incoming ? CLASS_INDICATOR_INCOMING : CLASS_INDICATOR_OUTGOING
      ) + ' ' + (
        above ? CLASS_INDICATOR_ABOVE : CLASS_INDICATOR_BELOW
      );

      selection
        .datum(data => data.links[direction])
        .attr('class', className)
        .attr('x', incoming ? -5 : this.visData.global.column.contentWidth + 2)
        .attr(
          'y',
          above ?
            this.visData.global.row.height / 2 - 1 :
            this.visData.global.row.height / 2 + 1
        )
        .attr('width', 3)
        .attr('height', 3)
        .attr('fill', data => linkDensityBg(data.refs.length));
    }

    // Helper
    function drawFullSizeRect (selection, className, shrinking, noRoundBorder) {
      const shrinkingAmount = shrinking || 0;

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
        .attr('rx', noRoundBorder ? 0 : 2 - shrinkingAmount)
        .attr('ry', noRoundBorder ? 0 : 2 - shrinkingAmount)
        .classed(className, true);
    }

    function drawMaxSizedRect (selection) {
      selection
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', that.visData.global.column.contentWidth)
        .attr('height', that.visData.global.row.height)
        .attr('class', 'invisible-container');
    }

    this.groups = baseSelection.append('g')
      .attr('class', CLASS_NODES)
      .call(selection => {
        selection.each(function storeLinkToGroupNode () {
          d3.select(this.parentNode).datum().nodes = this;
        });
      });

    this.nodes = this.groups
      .selectAll('.' + CLASS_NODE)
      .data(data => data.rows)
      .enter()
      .append('g')
        .classed(CLASS_NODE, true)
        .classed(CLASS_CLONE, data => data.clone)
        .attr('transform', data => 'translate(' +
          (data.x + this.visData.global.column.padding) + ', ' + data.y + ')');

    this.nodes.append('rect').call(drawMaxSizedRect);

    this.visNodes = this.nodes.append('g').attr('class', CLASS_NODE_VISIBLE);

    this.visNodes.append('rect').call(drawFullSizeRect, 'bg-border');

    this.visNodes.append('rect').call(drawFullSizeRect, 'bg', 1, true);

    if (this.vis.showLinkLocation) {
      this.nodes.append('rect')
          .call(drawLinkLocationIndicator.bind(this), 'incoming', 'above');
      this.nodes.append('rect')
          .call(drawLinkLocationIndicator.bind(this), 'incoming', 'bottom');
      this.nodes.append('rect')
          .call(drawLinkLocationIndicator.bind(this), 'outgoing', 'above');
      this.nodes.append('rect')
          .call(drawLinkLocationIndicator.bind(this), 'outgoing', 'bottom');

      this.nodes.append('path').call(drawLinkIndicator.bind(this), 'incoming');
      this.nodes.append('path').call(drawLinkIndicator.bind(this), 'outgoing');

      // Set all the link location indicator bars.
      this.groups.each((data, index) => {
        this.calcHeightLinkLocationIndicator(index, true, true);
      });
    }

    // Rooting icons
    const nodeRooted = this.nodes.append('g')
      .attr('class', `${CLASS_FOCUS_CONTROLS} ${CLASS_ROOT} ${CLASS_INACTIVE}`);

    nodeRooted.append('rect')
      .call(
        this.setUpFocusControls.bind(this),
        'left',
        0.6,
        'hover-helper',
        'hover-helper'
      );

    nodeRooted.append('svg')
      .call(
        this.setUpFocusControls.bind(this),
        'left',
        0.6,
        'icon',
        'ease-all state-inactive invisible-default icon'
      )
      .append('use')
        .attr('xlink:href', this.vis.iconPath + '#unlocked');

    nodeRooted.append('svg')
      .call(
        this.setUpFocusControls.bind(this),
        'left',
        0.6,
        'icon',
        'ease-all state-active invisible-default icon'
      )
      .append('use')
        .attr('xlink:href', this.vis.iconPath + '#locked');

    // Querying icons
    if (this.vis.querying) {
      const nodeQuery = this.nodes.append('g')
        .attr(
          'class', `${CLASS_FOCUS_CONTROLS} ${CLASS_QUERY} ${CLASS_INACTIVE}`
        );

      nodeQuery.append('rect')
        .call(
          this.setUpFocusControls.bind(this),
          'right',
          0.6,
          'hover-helper',
          'hover-helper'
        );

      nodeQuery.append('svg')
        .call(
          this.setUpFocusControls.bind(this),
          'right',
          0.6,
          'icon',
          'ease-all state-and-or invisible-default icon'
        )
        .append('use')
          .attr('xlink:href', this.vis.iconPath + '#union');

      nodeQuery.append('svg')
        .call(
          this.setUpFocusControls.bind(this),
          'right',
          0.6,
          'icon',
          'ease-all state-not invisible-default icon'
        )
        .append('use')
          .attr('xlink:href', this.vis.iconPath + '#not');
    }

    this.bars = new Bars(this.vis, this.visNodes, this.vis.barMode, this.visData);

    this.visNodes
      .append('rect')
        .call(drawFullSizeRect, 'border');

    // Add node label
    this.visNodes.append('foreignObject')
      .attr('x', this.visData.global.cell.padding)
      .attr('y', this.visData.global.row.padding +
        this.visData.global.cell.padding)
      .attr('width', this.visData.global.column.contentWidth)
      .attr('height', this.visData.global.row.contentHeight -
        this.visData.global.cell.padding * 2)
      .attr('class', CLASS_LABEL_WRAPPER)
      .append('xhtml:div')
        .attr('class', 'label')
        .attr('title', data => data.data.name)
        .style('line-height', (this.visData.global.row.contentHeight -
          this.visData.global.cell.padding * 2) + 'px')
        .append('xhtml:span')
          .text(data => data.data.name);

    if (isFunction(this.events.on)) {
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
          nodeIds, this.toggleLock, []
        )
      );

      this.events.on(
        'd3ListGraphNodeUnlock',
        nodeIds => this.eventHelper(
          nodeIds, this.toggleLock, [true]
        )
      );

      this.events.on(
        'd3ListGraphNodeRoot',
        data => this.eventHelper(
          data.nodeIds, this.toggleRoot, [false, true]
        )
      );

      this.events.on(
        'd3ListGraphNodeUnroot',
        data => this.eventHelper(
          data.nodeIds, this.toggleRoot, [true, true]
        )
      );
    }

    this.nodes.call(this.isInvisible.bind(this));
  }

  get classNnodes () { return CLASS_NODES; }
  get classNode () { return CLASS_NODE; }
  get classNodeVisible () { return CLASS_NODE_VISIBLE; }
  get classClone () { return CLASS_CLONE; }
  get classLabelWrapper () { return CLASS_LABEL_WRAPPER; }
  get classFocusControls () { return CLASS_FOCUS_CONTROLS; }
  get classRoot () { return CLASS_ROOT; }
  get classQuery () { return CLASS_QUERY; }
  get classLock () { return CLASS_LOCK; }

  updateLinkLocationIndicators (left, right) {
    this.calcHeightLinkLocationIndicator(left, false, true);
    this.calcHeightLinkLocationIndicator(right, true, false);
  }

  calcHeightLinkLocationIndicator (level, incoming, outgoing) {
    const nodes = this.nodes.filter(data => data.depth === level);
    nodes.each(data => {
      if (incoming) {
        data.links.incoming.above = 0;
        data.links.incoming.below = 0;
        for (let i = data.links.incoming.total; i--;) {
          // We are checking the source location of the incoming link. The
          // source location is the location of the node of the column being
          // scrolled.
          if ((data.links.incoming.refs[i].hidden & 1) > 0) {
            data.links.incoming.above++;
          }
          if ((data.links.incoming.refs[i].hidden & 2) > 0) {
            data.links.incoming.below++;
          }
        }
      }
      if (outgoing) {
        data.links.outgoing.above = 0;
        data.links.outgoing.below = 0;
        for (let i = data.links.outgoing.total; i--;) {
          // We are checking the target location of the outgoing link. The
          // source location is the location of the node of the column being
          // scrolled.
          if ((data.links.outgoing.refs[i].hidden & 4) > 0) {
            data.links.outgoing.above++;
          }
          if ((data.links.outgoing.refs[i].hidden & 8) > 0) {
            data.links.outgoing.below++;
          }
        }
      }
    });

    if (incoming) {
      this.updateHeightLinkLocationIndicatorBars(nodes);
    }

    if (outgoing) {
      this.updateHeightLinkLocationIndicatorBars(nodes, true);
    }
  }

  updateHeightLinkLocationIndicatorBars (selection, outgoing) {
    const barRefHeight = this.visData.global.row.contentHeight / 2 - 1;
    const barAboveRefTop = this.visData.global.row.height / 2 - 1;

    const baseClassName = '.' + CLASS_INDICATOR_LOCATION +
      '.' + (
        outgoing ? CLASS_INDICATOR_OUTGOING : CLASS_INDICATOR_INCOMING
      );

    selection.selectAll(
      baseClassName +
      '.' + CLASS_INDICATOR_ABOVE
    ).attr(
      'y',
      data => data.total ?
        barAboveRefTop - data.above / data.total * barRefHeight :
        barAboveRefTop
    ).attr(
      'height',
      data => data.total ? data.above / data.total * barRefHeight : 0
    );

    selection.selectAll(
      baseClassName +
      '.' + CLASS_INDICATOR_BELOW
    ).attr(
      'height',
      data => data.total ? data.below / data.total * barRefHeight : 0
    );
  }

  enterHandler (el, data) {
    this.highlightNodes(d3.select(el));

    const eventData = {
      id: data.id,
      clone: false,
      clonedFromId: undefined
    };

    if (data.clone) {
      eventData.clone = true;
      eventData.clonedFromId = data.originalNode.id;
    }

    this.events.broadcast('d3ListGraphNodeEnter', eventData);
  }

  leaveHandler (el, data) {
    this.unhighlightNodes(d3.select(el));

    const eventData = {
      id: data.id,
      clone: false,
      clonedFromId: undefined
    };

    if (data.clone) {
      eventData.clone = true;
      eventData.clonedFromId = data.originalNode.id;
    }

    this.events.broadcast('d3ListGraphNodeLeave', eventData);
  }

  lockHandler (d3El) {
    const events = this.toggleLock(d3El);

    if (events.locked && events.unlocked) {
      this.events.broadcast('d3ListGraphNodeLockChange', {
        lock: {
          id: events.locked.id,
          clone: events.locked.clone,
          clonedFromId: events.locked.clone ?
            events.locked.originalNode.id : undefined
        },
        unlock: {
          id: events.unlocked.id,
          clone: events.unlocked.clone,
          clonedFromId: events.unlocked.clone ?
            events.unlocked.originalNode.id : undefined
        }
      });
    } else {
      if (events.locked) {
        this.events.broadcast('d3ListGraphNodeLock', {
          id: events.locked.id,
          clone: events.locked.clone,
          clonedFromId: events.locked.clone ?
            events.locked.originalNode.id : undefined
        });
      }

      if (events.unlocked) {
        this.events.broadcast('d3ListGraphNodeUnlock', {
          id: events.unlocked.id,
          clone: events.unlocked.clone,
          clonedFromId: events.unlocked.clone ?
            events.unlocked.originalNode.id : undefined
        });
      }
    }
  }

  rootHandler (d3El, unroot) {
    if (!d3El.datum().data.state.root && unroot) {
      // The node is not rooted so there's no point in unrooting.
      return;
    }
    const events = this.toggleRoot(d3El, unroot);

    if (events.rooted && events.unrooted) {
      this.events.broadcast('d3ListGraphNodeReroot', {
        rooted: {
          id: events.rooted.id,
          clone: events.rooted.clone,
          clonedFromId: events.rooted.clone ?
            events.rooted.originalNode.id : undefined
        },
        unrooted: {
          id: events.unrooted.id,
          clone: events.unrooted.clone,
          clonedFromId: events.unrooted.clone ?
            events.unrooted.originalNode.id : undefined
        }
      });
    } else {
      if (events.rooted) {
        this.events.broadcast('d3ListGraphNodeRoot', {
          id: events.rooted.id,
          clone: events.rooted.clone,
          clonedFromId: events.rooted.clone ?
            events.rooted.originalNode.id : undefined
        });
      }

      if (events.unrooted) {
        this.events.broadcast('d3ListGraphNodeUnroot', {
          id: events.unrooted.id,
          clone: events.unrooted.clone,
          clonedFromId: events.unrooted.clone ?
            events.unrooted.originalNode.id : undefined
        });
      }
    }

    this.events.broadcast('d3ListGraphUpdateBarsRequest', {
      id: events.rooted.id,
      clone: events.rooted.clone,
      clonedFromId: events.rooted.clone ?
        events.rooted.originalNode.id : undefined
    });
  }

  focusNodes (event) {
    const same = this.checkNodeFocusEventSame(event.nodeIds);
    if (this.nodeFocusId && !same) {
      // Show unrelated nodes first before we hide them again.
      this.blurNodes({
        nodeIds: this.nodeFocusId
      });
    }

    this.nodeFocusId = event.nodeIds;

    this.eventHelper(
      event.nodeIds,
      this.highlightNodes,
      [
        'focus',
        'directParentsOnly',
        !!event.excludeClones,
        event.zoomOut || event.hideUnrelatedNodes
      ]
    );

    if (event.zoomOut) {
      this.vis.globalView(this.nodes.filter(data => data.hovering > 0));
    } else {
      this.vis.zoomedView();
    }

    if (event.hideUnrelatedNodes) {
      if (!same || !this.tempHidingUnrelatedNodes) {
        this.hideUnrelatedNodes(event.nodeIds);
      }
    } else if (this.tempHidingUnrelatedNodes) {
      this.showUnrelatedNodes();
    }
  }

  blurNodes (event) {
    this.eventHelper(
      event.nodeIds,
      this.unhighlightNodes,
      ['focus', 'directParentsOnly', !!event.excludeClones]
    );

    if (event.zoomIn) {
      this.vis.zoomedView();
    }

    if (this.tempHidingUnrelatedNodes) {
      this.showUnrelatedNodes();
    }
  }

  checkNodeFocusEventSame (nodeIds) {
    if (!this.nodeFocusId) {
      return false;
    }
    if (nodeIds.length !== this.nodeFocusId.length) {
      return false;
    }
    for (let i = nodeIds.length; i--;) {
      if (nodeIds[i] !== this.nodeFocusId[i]) {
        return false;
      }
    }
    return true;
  }

  hideUnrelatedNodes (nodeIds) {
    this.tempHidingUnrelatedNodes = nodeIds;

    this.nodes
      .filter(data => !data.hovering)
      .classed(
        'hidden', true
      )
      .each(data => {
        // Store old value for `hidden` temporarily
        data._hidden = data.hidden;
        data.hidden = true;
      });

    this.updateVisibility();
  }

  showUnrelatedNodes () {
    this.tempHidingUnrelatedNodes = undefined;

    this.nodes
      .filter(data => !data.hovering)
      .classed(
        'hidden', data => data._hidden
      )
      .each(data => {
        data.hidden = data._hidden;
        data._hidden = undefined;
      });

    this.updateVisibility();
  }

  eventHelper (nodeIds, callback, optionalParams, subSelectionClass) {
    const that = this;

    this.nodes
      // Filter by node ID
      .filter(data => !!~nodeIds.indexOf(data.id))
      .each(function triggerCallback () {
        let d3El = d3.select(this);

        if (subSelectionClass) {
          d3El = d3El.select(subSelectionClass);
        }

        callback.apply(
          that,
          [d3El].concat(optionalParams || [])
        );
      });
  }

  get barMode () {
    return this.bars.mode;
  }

  toggleLock (d3El, setFalse) {
    const data = d3El.datum();
    const events = { locked: false, unlocked: false };

    if (this.lockedNode) {
      if (this.lockedNode.datum().id === data.id) {
        this.unlockNode(this.lockedNode.datum().id);
        events.unlocked = this.lockedNode.datum();
        this.lockedNode = undefined;
      } else {
        // Reset previously locked node;
        this.unlockNode(this.lockedNode.datum().id);
        events.unlocked = this.lockedNode.datum();

        if (!setFalse) {
          this.lockNode(data.id);
          events.locked = data;
          this.lockedNode = d3El;
        }
      }
    } else {
      if (!setFalse) {
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

    els.each(function (data) {
      that.highlightNodes(d3.select(this), 'lock', undefined);
      data.data.state.lock = true;
    });
  }

  unlockNode (id) {
    const that = this;
    const els = this.nodes.filter(data => data.id === id);

    els.each(function (data) {
      that.unhighlightNodes(d3.select(this), 'lock', undefined);
      data.data.state.lock = undefined;
    });
  }

  queryByNode (d3El, mode) {
    d3El.datum().data.state.query = mode;
    d3El.classed({
      active: true,
      inactive: false,
      'query-and': mode === 'and',
      'query-or': mode === 'or',
      'query-not': mode === 'not'
    });
  }

  unqueryByNode (d3El) {
    const data = d3El.datum();

    data.data.state.query = undefined;
    data.data.queryBeforeRooting = undefined;

    d3El.classed({
      active: false,
      inactive: true,
      'query-and': false,
      'query-or': false,
      'query-not': false
    });

    if (this.rootedNode) {
      this.updateVisibility();
    }
  }

  toggleQueryByNode (d3El) {
    const data = d3El.datum();
    const previousMode = data.data.state.query;

    if (data.data.state.root) {
      if (previousMode !== 'or') {
        this.queryByNode(d3El, 'or');
      } else {
        this.queryByNode(d3El, 'and');
      }
    } else {
      switch (previousMode) {
        case 'or':
          this.queryByNode(d3El, 'and');
          break;
        case 'and':
          this.queryByNode(d3El, 'not');
          break;
        case 'not':
          this.unqueryByNode(d3El);
          break;
        default:
          this.queryByNode(d3El, 'or');
          break;
      }
    }
  }

  batchQueryHandler (els, noNotification) {
    const actions = [];
    for (let i = els.length; i--;) {
      actions.push(this.queryHandler(
        els[i].d3El, els[i].action, els[i].mode, true)
      );
    }

    if (!noNotification) {
      this.events.broadcast('d3ListGraphBatchQuery', actions);
    }
  }

  queryHandler (d3El, action, mode, returnNoNotification) {
    const data = d3El.datum();
    const previousMode = data.data.state.query;
    const event = {};

    if (!previousMode && action === 'unquery') {
      // We haven't queried anything so there's nothing to unquery.
      return undefined;
    }

    switch (action) {
      case 'query':
        this.queryByNode(d3El, mode);
        break;
      case 'unquery':
        this.unqueryByNode(d3El);
        break;
      default:
        this.toggleQueryByNode(d3El);
        break;
    }

    if (data.data.state.query) {
      if (data.data.state.query !== previousMode) {
        event.name = 'd3ListGraphNodeQuery';
        event.data = {
          id: data.id,
          clone: data.clone,
          clonedFromId: data.clone ?
            data.originalNode.id : undefined,
          mode: data.data.state.query
        };
      }
    } else {
      event.name = 'd3ListGraphNodeUnquery';
      event.data = {
        id: data.id,
        clone: data.clone,
        clonedFromId: data.clone ?
          data.originalNode.id : undefined
      };
    }

    if (event.name && !returnNoNotification) {
      this.events.broadcast(event.name, event.data);
    }

    return event.name ? event : undefined;
  }

  toggleRoot (d3El, setFalse, noNotification) {
    const data = d3El.datum();
    const events = { rooted: false, unrooted: false };
    const queries = [];

    // Blur current levels
    this.vis.levels.blur();

    if (this.rootedNode) {
      // Reset current root node
      this.rootedNode.classed({ active: false, inactive: true });
      events.unrooted = this.rootedNode.datum();
      if (this.unrootNode(this.rootedNode).unquery) {
        queries.push({
          d3El: this.rootedNode,
          action: 'unquery'
        });
      }

      // Activate new root
      if (this.rootedNode.datum().id !== data.id && !setFalse) {
        d3El.classed({ active: true, inactive: false });
        this.rootedNode = d3El;
        events.rooted = d3El.datum();
        if (this.rootNode(d3El).query) {
          queries.push({
            d3El,
            action: 'query',
            mode: 'or'
          });
        }
      } else {
        this.rootedNode = undefined;
        // Highlight first level
        this.vis.levels.focus(
          this.vis.activeLevel - this.vis.noRootActiveLevelDiff
        );
      }
    } else {
      if (!setFalse) {
        d3El.classed({ active: true, inactive: false });
        this.rootedNode = d3El;
        events.rooted = d3El.datum();
        if (this.rootNode(d3El).query) {
          queries.push({
            d3El,
            action: 'query',
            mode: 'or'
          });
        }
      }
    }

    if (queries.length) {
      this.batchQueryHandler(queries, noNotification);
    }

    return events;
  }

  rootNode (d3El) {
    const data = d3El.datum();

    data.data.state.root = true;
    d3El.classed('rooted', true);
    this.hideNodes(data);

    // Highlight level
    this.vis.levels.focus(data.depth + this.vis.activeLevel);

    if (!data.data.state.query || data.data.state.query === 'not') {
      data.data.queryBeforeRooting = false;
      // this.queryHandler(d3El, 'query', 'or');
      return {
        query: true
      };
    }

    data.data.queryBeforeRooting = true;

    return {
      query: false
    };
  }

  unrootNode (d3El) {
    const data = d3El.datum();

    data.data.state.root = false;
    d3El.classed('rooted', false);
    this.showNodes();

    if (!data.data.queryBeforeRooting) {
      // this.queryHandler(d3El, 'unquery');
      return {
        unquery: true
      };
    }

    return {
      unquery: false
    };
  }

  setUpFocusControls (selection, location, position, mode, className) {
    const paddedDim = this.iconDimension + 4;

    let x = 0 - (paddedDim * (position + 1));

    if (location === 'right') {
      x = this.visData.global.column.contentWidth + 2 + paddedDim * position;
    }

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
          r: this.iconDimension * 3 / 4
        });
    } else if (mode === 'hover-helper') {
      selection
        .attr({
          class: className,
          x: x - 4,
          y: y - 4,
          width: this.iconDimension + 8,
          height: this.iconDimension + 8,
          rx: this.iconDimension,
          ry: this.iconDimension
        });
    } else {
      selection
        .attr({
          class: className,
          x,
          y,
          width: this.iconDimension,
          height: this.iconDimension
        });
    }
  }

  /**
   * Helper method to hide nodes.
   *
   * @method  hideNodes
   * @author  Fritz Lekschas
   * @date    2016-02-21
   * @param   {Object}   data        Node data object.
   */
  hideNodes (data) {
    this.nodesVisibility(data);
  }

  /**
   * Helper method to show nodes.
   *
   * @method  showNodes
   * @author  Fritz Lekschas
   * @date    2016-02-21
   * @param   {Object}  data       Node data object.
   */
  showNodes () {
    this.nodesVisibility(undefined, true);
  }

  /**
   * Sets the nodes' visibility
   *
   * @method  nodesVisibility
   * @author  Fritz Lekschas
   * @date    2016-02-21
   * @param   {Object}   data        Node data object.
   * @param   {Boolean}  show        If `true` nodes will be shown.
   */
  nodesVisibility (data, show) {
    if (show) {
      this.nodes
        .classed('hidden', false)
        .each(nodeData => { nodeData.hidden = false; });
    } else {
      // First we set all nodes to `hidden`.
      this.nodes.each(nodeData => { nodeData.hidden = true; });

      // Then we set direct child and parent nodes of the current node visible.
      traverse.upAndDown(data, nodeData => { nodeData.hidden = false; });

      // We also show sibling nodes.
      traverse.siblings(data, nodeData => { nodeData.hidden = false; });

      this.nodes.classed(
        'hidden',
        nodeData => nodeData.hidden && !nodeData.data.state.query
      );
    }
    this.updateVisibility();
  }

  isInvisible (selection, customScrollTop) {
    selection.classed('invisible', data => {
      const scrollTop = customScrollTop ||
        this.visData.nodes[data.depth].scrollTop;

      // Node is right to the visible container
      if (data.x + this.vis.dragged.x >= this.vis.width) {
        return (data.invisible = true);
      }
      // Node is below the visible container
      if (
        data.y + scrollTop >= this.vis.height
      ) {
        return (data.invisible = true);
      }
      // Node is above the visible container
      if (
        data.y + this.visData.global.row.height +
        scrollTop <= 0
      ) {
        return (data.invisible = true);
      }
      // Node is left to the visible container
      if (data.x + this.vis.dragged.x + this.visData.global.column.width <= 0) {
        return (data.invisible = true);
      }
      return (data.invisible = false);
    });
  }

  makeAllTempVisible (unset) {
    if (unset) {
      this.nodes.classed(
        'invisible', data => {
          const prevInvisible = data._invisible;
          data._invisible = undefined;

          return prevInvisible;
        }
      );
    } else {
      this.nodes
        .classed(
          'invisible', data => {
            data._invisible = data.invisible;
            return false;
          }
        );
    }
  }

  highlightNodes (
    d3El, className, restriction, excludeClones, noVisibilityCheck
  ) {
    const that = this;
    const data = d3El.datum();
    const nodeId = data.id;
    const currentNodeData = data.clone ? data.originalNode : data;
    const includeParents = true;
    const appliedClassName = className || 'hovering';
    const includeClones = !!!excludeClones;
    const includeChildren = restriction !== 'directParentsOnly';

    // Store link IDs
    if (!this.currentLinks[appliedClassName]) {
      this.currentLinks[appliedClassName] = {};
    }
    this.currentLinks[appliedClassName][nodeId] = {};

    let currentlyActiveBar = d3El.selectAll(
      '.bar.active .bar-magnitude'
    );
    if (!currentlyActiveBar.empty()) {
      currentlyActiveBar = currentlyActiveBar.datum();
    } else {
      currentlyActiveBar = undefined;
    }

    const traverseCallbackUp = (nodeData, childData) => {
      nodeData.hovering = 2;
      for (let i = nodeData.links.outgoing.refs.length; i--;) {
        // Only push direct parent child connections. E.g.
        // Store: (parent)->(child)
        // Ignore: (parent)->(siblings of child)
        if (nodeData.links.outgoing.refs[i].target.node.id === childData.id) {
          this.currentLinks[appliedClassName][nodeId][
            nodeData.links.outgoing.refs[i].id
          ] = true;
        }
      }
    };

    const traverseCallbackDown = nodeData => {
      nodeData.hovering = 2;
      for (let i = nodeData.links.outgoing.refs.length; i--;) {
        this.currentLinks[appliedClassName][nodeId][
          nodeData.links.outgoing.refs[i].id
        ] = true;
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

    currentNodeData.hovering = 1;

    if (includeClones) {
      for (let i = currentNodeData.clones.length; i--;) {
        currentNodeData.clones[i].hovering = 1;
      }
    }

    /**
     * Helper method to assess the node visibility.
     *
     * @method  checkNodeVisibility
     * @author  Fritz Lekschas
     * @date    2016-02-25
     * @param   {Object}  _el    [description]
     * @param   {Object}  _data  [description]
     * @return  {Boolean}        If `true` element is hidden.
     */
    function checkNodeVisibility (_el, _data) {
      return noVisibilityCheck || (
        !_data.hidden &&
        !that.vis.isHidden.call(that.vis, _el)
      );
    }

    /**
     * Helper method to filter out directly hovered nodes.
     *
     * @method  checkNodeDirect
     * @author  Fritz Lekschas
     * @date    2016-02-25
     * @param   {Object}  nodeData  The node's data object.
     * @return  {Boolean}           If `true` element will not be filtered out.
     */
    function checkNodeDirect (nodeData) {
      return nodeData.hovering === 1 && checkNodeVisibility(this, nodeData);
    }

    /**
     * Helper method to filter out indirectly hovered nodes.
     *
     * @method  checkNodeIndirect
     * @author  Fritz Lekschas
     * @date    2016-02-25
     * @param   {Object}  nodeData  The node's data object.
     * @return  {Boolean}           If `true` element will not be filtered out.
     */
    function checkNodeIndirect (nodeData) {
      return nodeData.hovering === 2 && checkNodeVisibility(this, nodeData);
    }

    /**
     * Helper method to update bar indicators of the directly hovered node and
     * clones.
     *
     * @method  updateDirectBarIndicator
     * @author  Fritz Lekschas
     * @date    2016-02-25
     * @param   {Object}  selection  D3 node selection.
     */
    function updateDirectBarIndicator (selection) {
      that.bars.updateIndicator(
        selection,
        currentlyActiveBar.value,
        true
      );
    }

    /**
     * Helper method to update bar indicators of the indirectly hovered nodes.
     *
     * @method  updateDirectBarIndicator
     * @author  Fritz Lekschas
     * @date    2016-02-25
     * @param   {Object}  selection  D3 node selection.
     */
    function updateIndirectBarIndicator (selection) {
      that.bars.updateIndicator(
        selection,
        currentlyActiveBar.value
      );
    }

    const barIndicatorClass = currentlyActiveBar ?
      '.bar.' + currentlyActiveBar.id + ' .bar-indicator' : '';
    const directNodes = this.nodes.filter(checkNodeDirect)
      .classed(appliedClassName + '-directly', true);
    const indirectNodes = this.nodes.filter(checkNodeIndirect)
      .classed(appliedClassName + '-indirectly', true);

    if (currentlyActiveBar) {
      directNodes.select(barIndicatorClass).call(updateDirectBarIndicator);
      indirectNodes.select(barIndicatorClass).call(updateIndirectBarIndicator);
    }

    this.links.highlight(
      this.currentLinks[appliedClassName][data.id],
      true,
      appliedClassName
    );
  }

  unhighlightNodes (d3El, className, restriction, excludeClones) {
    const data = d3El.datum();
    const traverseCallback = nodeData => { nodeData.hovering = 0; };
    const includeParents = true;
    const appliedClassName = className || 'hovering';
    const includeClones = !!!excludeClones;
    const includeChildren = restriction !== 'directParentsOnly';

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

    if (
      this.currentLinks[appliedClassName] &&
      this.currentLinks[appliedClassName][data.id]
    ) {
      this.links.highlight(
        this.currentLinks[appliedClassName][data.id],
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
          this.vis.updateScrolling();
        });

      if (
        newSortType &&
        this.vis.currentSorting.local[update[i].level].type !== 'name'
      ) {
        this.bars.update(selection.selectAll('.bar'), update[i].sortBy);
      }
    }
  }

  /**
   * Updates the nodes' visibility visually.
   *
   * @method  updateVisibility
   * @author  Fritz Lekschas
   * @date    2016-02-21
   */
  updateVisibility () {
    // Calls the D3 list graph layout method to update the nodes position.
    this.vis.layout.updateNodesVisibility();

    // Transition to the updated position
    this.nodes
      .transition()
      .duration(config.TRANSITION_SEMI_FAST)
      .attr('transform', data => 'translate(' +
        (data.x + this.visData.global.column.padding) + ', ' + data.y + ')')
      .call(allTransitionsEnded, () => {
        this.vis.updateLevelsVisibility();
        this.vis.updateScrolling();
        this.nodes.call(this.isInvisible.bind(this));
      });

    this.vis.links.updateVisibility();
  }
}

export default Nodes;
