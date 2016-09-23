// External
import * as d3 from 'd3';  // eslint-disable-line import/no-unresolved
import isFunction from '../../../node_modules/lodash-es/isFunction';

// Internal
import * as traverse from './traversal';
import * as config from './config';
import Bars from './bars';
import { allTransitionsEnded } from '../commons/d3-utils';
import { roundRect } from '../commons/charts';

/**
 * CSS class name of grou of nodes.
 *
 * @type  {String}
 */
const CLASS_NODES = 'nodes';

/**
 * CSS class name of node group.
 *
 * @type  {String}
 */
const CLASS_NODE = 'node';

/**
 * CSS class name of visible nodes.
 *
 * @type  {String}
 */
const CLASS_NODE_VISIBLE = 'visible-node';

/**
 * CSS class name of cloned nodes.
 *
 * @type  {String}
 */
const CLASS_CLONE = 'clone';

/**
 * CSS class name of label wrappers of nodes.
 *
 * @type  {String}
 */
const CLASS_LABEL_WRAPPER = 'label-wrapper';

/**
 * CSS class name of focus controls that appear to the left and right of a node
 * when being active.
 *
 * @type  {String}
 */
const CLASS_FOCUS_CONTROLS = 'focus-controls';

/**
 * CSS class name of the root focus button.
 *
 * @type  {String}
 */
const CLASS_ROOT = 'root';

/**
 * CSS class name of the query focus button.
 *
 * @type  {String}
 */
const CLASS_QUERY = 'query';

/**
 * CSS class name of the link indicator.
 *
 * @type  {String}
 */
const CLASS_INDICATOR_BAR = 'link-indicator';

/**
 * CSS class name of the link location indicator.
 *
 * @type  {String}
 */
const CLASS_INDICATOR_LOCATION = 'link-location-indicator';

/**
 * CSS class name for identifing incoming link location indicators.
 *
 * @type  {String}
 */
const CLASS_INDICATOR_INCOMING = 'incoming';

/**
 * CSS class name for identifing outgoing link location indicators.
 *
 * @type  {String}
 */
const CLASS_INDICATOR_OUTGOING = 'outgoing';

/**
 * CSS class name for identifing link location indicators above the visible
 * container.
 *
 * @type  {String}
 */
const CLASS_INDICATOR_ABOVE = 'above';

/**
 * CSS class name for identifing link location indicators below the visible
 * container.
 *
 * @type  {String}
 */
const CLASS_INDICATOR_BELOW = 'below';

class Nodes {
  /**
   * Nodes constructor
   *
   * @method  constructor
   * @author  Fritz Lekschas
   * @date    2016-09-22
   * @param   {Object}  vis      List Graph App.
   * @param   {Object}  baseEl   D3 base selection.
   * @param   {Object}  visData  List Graph App data.
   * @param   {Object}  links    Links class.
   * @param   {Object}  events   Event class.
   */
  constructor (vis, baseEl, visData, links, events) {
    const self = this;

    this.vis = vis;
    this.visData = visData;
    this.links = links;
    this.events = events;
    this.currentLinks = {};
    this.iconDimension = Math.min(
      (
        (this.visData.global.row.contentHeight / 2) -
        (this.visData.global.cell.padding * 2)
      ),
      (this.visData.global.column.padding / 2) - 4
    );

    const linkDensityBg = d3.scaleLinear()
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
            (this.visData.global.row.height / 2) - 1,
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
        .classed('visible', data => data.links[direction].refs.length > 0)
        .style(
          'transform-origin',
          (incoming ? 0 : this.visData.global.column.contentWidth) + 'px ' +
          (this.visData.global.row.height / 2) + 'px'
        );
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
            (this.visData.global.row.height / 2) - 1 :
            (this.visData.global.row.height / 2) + 1
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
        .attr('y', self.visData.global.row.padding + shrinkingAmount)
        .attr(
          'width',
          self.visData.global.column.contentWidth - (2 * shrinkingAmount)
        )
        .attr(
          'height',
          self.visData.global.row.contentHeight - (2 * shrinkingAmount)
        )
        .attr('rx', noRoundBorder ? 0 : 2 - shrinkingAmount)
        .attr('ry', noRoundBorder ? 0 : 2 - shrinkingAmount)
        .classed(className, true);
    }

    function drawMaxSizedRect (selection) {
      selection
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', self.visData.global.column.contentWidth)
        .attr('height', self.visData.global.row.height)
        .attr('class', 'invisible-container');
    }

    this.groups = baseEl.append('g')
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
      .attr('class', `${CLASS_FOCUS_CONTROLS} ${CLASS_ROOT}`);

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
        'ease-all state-active invisible-default icon'
      )
      .append('use')
        .attr('xlink:href', this.vis.iconPath + '#locked');

    // Querying icons
    if (this.vis.querying) {
      const nodeQuery = this.nodes.append('g')
        .attr(
          'class', `${CLASS_FOCUS_CONTROLS} ${CLASS_QUERY}`
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

    this.bars = new Bars(this.visNodes, this.vis.barMode, this.visData);

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
        (this.visData.global.cell.padding * 2))
      .attr('class', CLASS_LABEL_WRAPPER)
      .append('xhtml:div')
        .attr('class', 'label')
        .attr('title', data => data.data.name)
        .style('line-height', (this.visData.global.row.contentHeight -
          (this.visData.global.cell.padding * 2)) + 'px')
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

  /**
   * Get the CSS class of the group of nodes.
   *
   * @method  classNnodes
   * @author  Fritz Lekschas
   * @date    2016-09-22
   * @return  {String}  CSS name.
   */
  get classNnodes () { return CLASS_NODES; }

  /**
   * Get the CSS class of the group of nodes.
   *
   * @method  classNode
   * @author  Fritz Lekschas
   * @date    2016-09-22
   * @return  {String}  CSS name.
   */
  get classNode () { return CLASS_NODE; }

  /**
   * Get the CSS class of the node group.
   *
   * @method  classNodeVisible
   * @author  Fritz Lekschas
   * @date    2016-09-22
   * @return  {String}  CSS name.
   */
  get classNodeVisible () { return CLASS_NODE_VISIBLE; }

  /**
   * Get the CSS class of focus controls.
   *
   * @method  classFocusControls
   * @author  Fritz Lekschas
   * @date    2016-09-22
   * @return  {String}  CSS name.
   */
  get classFocusControls () { return CLASS_FOCUS_CONTROLS; }

  /**
   * Get the CSS class of root elements.
   *
   * @method  classRoot
   * @author  Fritz Lekschas
   * @date    2016-09-22
   * @return  {String}  CSS name.
   */
  get classRoot () { return CLASS_ROOT; }

  /**
   * Get the CSS class of query button..
   *
   * @method  classQuery
   * @author  Fritz Lekschas
   * @date    2016-09-22
   * @return  {String}  CSS name.
   */
  get classQuery () { return CLASS_QUERY; }

  /**
   * Update the link location indicators.
   *
   * @description
   * Updates the link location indicators of level / column `right` - `left`.
   *
   * @method  updateLinkLocationIndicators
   * @author  Fritz Lekschas
   * @date    2016-09-22
   * @param   {Number}  left   Index of the column to the left.
   * @param   {Number}  right  Index of the right column.
   */
  updateLinkLocationIndicators (left, right) {
    this.calcHeightLinkLocationIndicator(left, true);
    this.calcHeightLinkLocationIndicator(right);
  }

  /**
   * Calculates the height of all incoming or outgoing link location indicators
   * for a given level.
   *
   * @method  calcHeightLinkLocationIndicator
   * @author  Fritz Lekschas
   * @date    2016-09-22
   * @param   {Number}   level     Index of the level / column.
   * @param   {Boolean}  outgoing  If `true` outgoing link location indicator
   *   heights are calculated. Otherwise incoming link location indicator
   *   heights are calculated.
   */
  calcHeightLinkLocationIndicator (level, outgoing) {
    const nodes = this.nodes.filter(data => data.depth === level);
    nodes.each(data => {
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
      } else {
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
    });

    if (outgoing) {
      this.updateHeightLinkLocationIndicatorBars(nodes, true);
    } else {
      this.updateHeightLinkLocationIndicatorBars(nodes);
    }
  }

  /**
   * Updates the visual appearance of the link location indicators.
   *
   * @method  updateHeightLinkLocationIndicatorBars
   * @author  Fritz Lekschas
   * @date    2016-09-22
   * @param   {Object}   selection  D3 selection of the corresponding nodes.
   * @param   {Boolean}  outgoing   If `true` outgoing link location indicator
   *   heights are updated. Otherwise incoming link location indicator
   *   heights are updated.
   */
  updateHeightLinkLocationIndicatorBars (selection, outgoing) {
    const barRefHeight = (this.visData.global.row.contentHeight / 2) - 1;
    const barAboveRefTop = (this.visData.global.row.height / 2) - 1;

    const baseClassName = '.' + CLASS_INDICATOR_LOCATION +
      '.' + (
        outgoing ? CLASS_INDICATOR_OUTGOING : CLASS_INDICATOR_INCOMING
      );

    selection.selectAll(
      baseClassName +
      '.' + CLASS_INDICATOR_ABOVE
    ).attr(
      'y',
      data => (data.total ?
        barAboveRefTop - (data.above / data.total * barRefHeight) :
        barAboveRefTop)
    ).attr(
      'height',
      data => (data.total ? data.above / data.total * barRefHeight : 0)
    );

    selection.selectAll(
      baseClassName +
      '.' + CLASS_INDICATOR_BELOW
    ).attr(
      'height',
      data => (data.total ? data.below / data.total * barRefHeight : 0)
    );
  }

  /**
   * Node _mouse enter_ handler.
   *
   * @method  enterHandler
   * @author  Fritz Lekschas
   * @date    2016-09-22
   * @param   {Object}  el    DOM element.
   * @param   {Object}  data  D3 data object of the DOM element.
   */
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

  /**
   * Node _mouse leave handler.
   *
   * @method  leaveHandler
   * @author  Fritz Lekschas
   * @date    2016-09-22
   * @param   {Object}  el    DOM element.
   * @param   {Object}  data  D3 data object of the DOM element.
   */
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

  /**
   * Handler managing visual _lock_ events.
   *
   * @method  lockHandler
   * @author  Fritz Lekschas
   * @date    2016-09-22
   * @param   {Object}  d3El  D3 selection of the element to be visually locked.
   */
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

  /**
   * Handler managing _root_ events.
   *
   * @method  rootHandler
   * @author  Fritz Lekschas
   * @date    2016-09-22
   * @param   {Object}   d3El    D3 selection of the node to be rooted.
   * @param   {Boolean}  unroot  If `true` the rooting is resolved.
   */
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
  }

  /**
   * Visually focus a node.
   *
   * @method  focusNodes
   * @author  Fritz Lekschas
   * @date    2016-09-22
   * @param   {Object}  event  Event object.
   */
  focusNodes (event) {
    const same = this.checkNodeFocusSameEvent(event.nodeIds);
    if (this.nodeFocusIds && !same) {
      // Show unrelated nodes first before we hide them again.
      this.blurNodes({
        nodeIds: this.nodeFocusIds
      });
    }

    this.nodeFocusIds = event.nodeIds;

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
      this.hideUnrelatedNodes(undefined, true);
    }
  }


  /**
   * Visually blur a node.
   *
   * @method  blurNodes
   * @author  Fritz Lekschas
   * @date    2016-09-22
   * @param   {Object}  event  Event object.
   */
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
      this.hideUnrelatedNodes(undefined, true);
    }
  }

  /**
   * Tests if the event-related node list is identical.
   *
   * @method  checkNodeFocusSameEvent
   * @author  Fritz Lekschas
   * @date    2016-09-22
   * @param   {Array}  nodeIds  Array of node IDs.
   * @return  {Boolean}         If `true` the event node ID list is identical to
   *   the current focus node ID list.
   */
  checkNodeFocusSameEvent (nodeIds) {
    if (!this.nodeFocusIds) {
      return false;
    }
    if (nodeIds.length !== this.nodeFocusIds.length) {
      return false;
    }
    for (let i = nodeIds.length; i--;) {
      if (nodeIds[i] !== this.nodeFocusIds[i]) {
        return false;
      }
    }
    return true;
  }

  /**
   * Hide unrelated nodes temporarily.
   *
   * @method  hideUnrelatedNodes
   * @author  Fritz Lekschas
   * @date    2016-09-22
   * @param   {Array}    nodeIds    Array of node IDs.
   * @param   {Boolean}  showAgain  If `true` displays hidden nows again.
   */
  hideUnrelatedNodes (nodeIds, showAgain) {
    this.tempHidingUnrelatedNodes = showAgain ? undefined : nodeIds;

    this.nodes
      .filter(data => !data.hovering)
      .classed(
        'hidden', data => (showAgain ? data._hidden : true)
      )
      .each(data => {
        if (showAgain) {
          // Reset old hiding state
          data.hidden = data._hidden;
          data._hidden = undefined;
        } else {
          // Store old value for `hidden` temporarily
          data._hidden = data.hidden;
          data.hidden = true;
        }
      });

    this.updateVisibility();
  }

  /**
   * Event helper.
   *
   * @method  eventHelper
   * @author  Fritz Lekschas
   * @date    2016-09-22
   * @param   {Array}     nodeIds            Array of node IDs.
   * @param   {Function}  callback           Call back function of the actual
   *   event.
   * @param   {Array}     optionalParams     Array of optional parameters to be
   *   passed to the callback.
   * @param   {String}    subSelectionClass  Subselection of certain elements
   *   based on a CSS class. The selection will be passed to the callback.
   */
  eventHelper (nodeIds, callback, optionalParams, subSelectionClass) {
    const self = this;

    this.nodes
      // Filter by node ID
      .filter(data => !!~nodeIds.indexOf(data.id))
      .each(function triggerCallback () {
        let d3El = d3.select(this);

        if (subSelectionClass) {
          d3El = d3El.select(subSelectionClass);
        }

        callback.apply(
          self,
          [d3El].concat(optionalParams || [])
        );
      });
  }

  /**
   * Get the current bar mode.
   *
   * @method  barMode
   * @author  Fritz Lekschas
   * @date    2016-09-22
   * @return  {String}  Bar mode string.
   */
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
    const self = this;
    const els = this.nodes.filter(data => data.id === id);

    els.each(function (data) {
      self.highlightNodes(d3.select(this), 'lock', undefined);
      data.data.state.lock = true;
    });
  }

  unlockNode (id) {
    const self = this;
    const els = this.nodes.filter(data => data.id === id);

    els.each(function (data) {
      self.unhighlightNodes(d3.select(this), 'lock', undefined);
      data.data.state.lock = undefined;
    });
  }

  queryByNode (d3El, mode) {
    d3El.datum().data.state.query = mode;
    d3El
      .classed('active', true)
      .classed('inactive', false)
      .classed('query-and', mode === 'and')
      .classed('query-or', mode === 'or')
      .classed('query-not', mode === 'not');
  }

  unqueryByNode (d3El) {
    const data = d3El.datum();

    data.data.state.query = undefined;
    data.data.queryBeforeRooting = undefined;

    d3El
      .classed('active', true)
      .classed('inactive', false)
      .classed('query-and', false)
      .classed('query-or', false)
      .classed('query-not', false);

    if (this.rootedNode) {
      this.hideNodes(this.rootedNode.datum());
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
      this.rootedNode
        .classed('active', false)
        .classed('inactive', true);

      events.unrooted = this.rootedNode.datum();
      if (this.unrootNode(this.rootedNode).unquery) {
        queries.push({
          d3El: this.rootedNode,
          action: 'unquery'
        });
      }

      // Activate new root
      if (this.rootedNode.datum().id !== data.id && !setFalse) {
        d3El
          .classed('active', true)
          .classed('inactive', false);

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
        d3El
          .classed('active', true)
          .classed('inactive', false);

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
      x = this.visData.global.column.contentWidth + 2 + (paddedDim * position);
    }

    const y = this.visData.global.row.padding +
      (
        (
          this.visData.global.row.contentHeight -
          (2 * this.visData.global.cell.padding)
        ) / 4
      );

    if (mode === 'bg') {
      selection
        .attr('class', className)
        .attr('cx', x + (this.iconDimension / 2))
        .attr('cy', y + (this.iconDimension / 2))
        .attr('r', this.iconDimension * 3 / 4);
    } else if (mode === 'hover-helper') {
      selection
        .attr('class', className)
        .attr('x', x - 4)
        .attr('y', y - 4)
        .attr('width', this.iconDimension + 8)
        .attr('height', this.iconDimension + 8)
        .attr('rx', this.iconDimension)
        .attr('ry', this.iconDimension);
    } else {
      selection
        .attr('class', className)
        .attr('x', x)
        .attr('y', y)
        .attr('width', this.iconDimension)
        .attr('height', this.iconDimension);
    }
  }

  /**
   * Helper method to hide nodes.
   *
   * @method  hideNodes
   * @author  Fritz Lekschas
   * @date    2016-09-22
   * @param   {Object}   data  Node data object.
   */
  hideNodes (data) {
    this.nodesVisibility(data);
  }

  /**
   * Helper method to show nodes.
   *
   * @method  showNodes
   * @author  Fritz Lekschas
   * @date    2016-09-22
   */
  showNodes () {
    this.nodesVisibility(undefined, true);
  }

  /**
   * Only show the subtree and siblings of the node `data`.
   *
   * @method  nodesVisibility
   * @author  Fritz Lekschas
   * @date    2016-09-22
   * @param   {Object}   data  Node data object.
   * @param   {Boolean}  show  If `true` nodes will be shown again.
   */
  nodesVisibility (data, show) {
    if (show) {
      this.nodes
        .classed('hidden', false)
        .each(nodeData => { nodeData.hidden = false; });
    } else {
      // First we set all nodes to `hidden` except those that are currently
      // queried for.
      this.nodes.each(nodeData => {
        nodeData.hidden = !nodeData.data.state.query;
      });

      // Then we set direct child and parent nodes of the current node visible.
      traverse.upAndDown(data, nodeData => { nodeData.hidden = false; });

      // We also show sibling nodes.
      traverse.siblings(data, nodeData => { nodeData.hidden = false; });

      // Assign CSS class to actually hide the nodes.
      this.nodes.classed(
        'hidden',
        nodeData => nodeData.hidden
      );
    }
    this.updateVisibility();
  }

  /**
   * Marks nodes as being invisible via assigning a class depending on the
   * custom scroll top position or the columns scroll top position.
   *
   * @method  isInvisible
   * @author  Fritz Lekschas
   * @date    2016-09-12
   * @param   {Object}  selection        D3 selection of nodes to be checked.
   * @param   {Number}  customScrollTop  Custom scroll top position. Used when
   *   column is actively scrolled.
   */
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
    const self = this;
    const data = d3El.datum();
    const nodeId = data.id;
    const currentNodeData = data.clone ? data.originalNode : data;
    const includeParents = true;
    const appliedClassName = className || 'hovering';
    const includeClones = !excludeClones;
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
        data.clone ? data.originalNode : data,
        traverseCallbackUp,
        traverseCallbackDown,
        undefined,
        includeClones
      );
    }
    if (includeParents && !includeChildren) {
      traverse.up(data, traverseCallbackUp, undefined, includeClones);
    }
    if (!includeParents && includeChildren) {
      traverse.down(
        data.clone ? data.originalNode : data,
        traverseCallbackUp,
        undefined,
        includeClones
      );
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
        !self.vis.isHidden.call(self.vis, _el)
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

    this.nodes.filter(checkNodeDirect)
      .classed(appliedClassName + '-directly', true);
    this.nodes.filter(checkNodeIndirect)
      .classed(appliedClassName + '-indirectly', true);

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
    const includeClones = !excludeClones;
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
