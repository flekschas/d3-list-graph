// External
import '$';  // eslint-disable-line
import * as d3 from 'd3';  // eslint-disable-line
import isArray from '../../../node_modules/lodash-es/isArray';

// Internal
import { D3VersionFourRequired } from '../commons/errors';
import { LayoutNotAvailable } from './errors';
import * as config from './config';
import Topbar from './topbar';
import Levels from './levels';
import Links from './links';
import Nodes from './nodes';
import Scrollbars from './scrollbars';
import Events from './events';
import NodeContextMenu from './node-context-menu';
import { onDragDrop, dragMoveHandler } from '../commons/event-handlers';
import { allTransitionsEnded } from '../commons/d3-utils';
import { dropShadow } from '../commons/filters';
import { requestNextAnimationFrame } from '../commons/animation-frame';
import { setOption } from '../commons/utils';
import { all as icons } from './icons';
import { createSymbolIcon } from '../commons/symbols';

/**
 * Private d3 object. Needed to handle cases where D3.js v3 and v4 are used.
 *
 * @type  {Object}
 */
let _d3 = d3;

class ListGraph {
  /**
   * ListGraph App constructor.
   *
   * @method  constructor
   * @author  Fritz Lekschas
   * @date    2016-10-02
   * @param   {Object}  init  Config object.
   */
  constructor (init) {
    if (init.d3) {
      _d3 = init.d3;
    }

    if (_d3.version[0] !== '4') {
      throw new D3VersionFourRequired(_d3.version);
    }

    if (!_d3.listGraph) {
      throw new LayoutNotAvailable();
    }

    const self = this;

    this.baseEl = init.element;
    this.baseEl.__d3ListGraphBase__ = true;

    this.baseElD3 = _d3.select(this.baseEl);
    this.baseElJq = $(this.baseEl);
    this.svgD3 = this.baseElD3.select('svg.base');
    this.svgEl = this.svgD3.node();
    this.outsideClickHandler = {};
    this.outsideClickClassHandler = {};

    if (this.svgD3.empty()) {
      this.svgD3 = this.baseElD3.append('svg').attr('class', 'base');
      this.svgJq = $(this.svgD3.node());
    } else {
      this.svgJq = $(this.svgD3.node());
    }

    // Array of root node IDs.
    this.rootNodes = init.rootNodes;

    // Width of the vis. If `undefined` the SVG's width will be used.
    this.width = setOption(init.width, this.svgJq.width(), true);

    // Height of the vis. If `undefined` the SVG's height will be used.
    this.height = setOption(init.height, this.svgJq.height(), true);

    // Refresh top and left position of the base `svg` everytime the user enters
    // the element with his/her mouse cursor. This will avoid relying on complex
    // browser resize events and other layout manipulations as they most likely
    // won't happen when the user tries to interact with the visualization.
    this.svgD3.on('mouseenter', this.getBoundingRect.bind(this));

    // With of the column's scrollbars
    this.scrollbarWidth = setOption(
      init.scrollbarWidth, config.SCROLLBAR_WIDTH, true
    );

    // Number of visible columns
    this.columns = setOption(init.columns, config.COLUMNS, true);

    // Number of visible rows.
    this.rows = setOption(init.rows, config.ROWS, true);

    // Path to SVG icon file.
    this.iconPath = setOption(init.iconPath, config.ICON_PATH, true);

    // If `true` query icons and controls are enabled.
    this.querying = setOption(init.querying, config.QUERYING);

    // If `true` hide links that point to invisible nodes.
    this.hideOutwardsLinks = setOption(
      init.hideOutwardsLinks, config.HIDE_OUTWARDS_LINKS
    );

    // If `true` and `this.hideOutwardsLinks === true` indicates the location of
    // target nodes of invisible nodes connected via links.
    this.showLinkLocation = setOption(
      init.showLinkLocation, config.SHOW_LINK_LOCATION
    );

    // The visual size of a location bucket. E.g. `3` pixel.
    this.linkLocationBucketSize = init.linkLocationBucketSize;

    // If `true` the currently rooted level will softly be highlighted.
    this.highlightActiveLevel = setOption(
      init.highlightActiveLevel, config.HIGHLIGHT_ACTIVE_LEVEL
    );

    // Determines which level from the rooted node will be regarded as active.
    // Zero means that the level of the rooted node is regarded.
    this.activeLevel = setOption(init.activeLevel, config.ACTIVE_LEVEL);

    // When no manually rooted node is available the active level will be
    // `this.activeLevel` minus `this.noRootActiveLevelDiff`.
    // WAT?
    // In some cases it makes sense to hide the original root node just to save
    // a column, so having no manually set root node means that the invisible
    // root node is active. Using this option it can be assured that the
    // approriate column is being highlighted.
    this.noRootActiveLevelDiff = setOption(
      init.noRootActiveLevelDiff, config.NO_ROOT_ACTIVE_LEVEL_DIFF
    );

    // Determine the level of transitions
    // - 0 [Default]: Show all transitions
    // - 1: Show only CSS transitions
    // - 2: Show no transitions
    this.lessTransitionsJs = init.lessTransitions > 0;
    this.lessTransitionsCss = init.lessTransitions > 1;

    // Enable or disable
    this.disableDebouncedContextMenu = setOption(
      init.disableDebouncedContextMenu,
      config.DISABLE_DEBOUNCED_CONTEXT_MENU
    );

    // Create custom topbar buttons
    this.customTopbarButtons = setOption(
      init.customTopbarButtons, []
    );

    this.baseElD3.classed('less-animations', this.lessTransitionsCss);

    // Add SVG Icons
    icons.forEach(
      icon => createSymbolIcon(this.svgD3, icon.id, icon.paths, icon.viewBox)
    );

    // Holds the key of the property to be sorted initially. E.g. `precision`.
    this.sortBy = init.sortBy;

    // Initial sort order. Anything other than `asc` will fall back to `desc`.
    this.sortOrder = init.sortOrder === 'asc' ? 1 : config.DEFAULT_SORT_ORDER;

    this.nodeInfoContextMenu = isArray(init.nodeInfoContextMenu) ?
      init.nodeInfoContextMenu : [];

    this.events = new Events(this.baseEl, init.dispatcher);

    this.baseElJq.addClass(config.CLASSNAME);

    this.dragged = { x: 0, y: 0 };

    if (init.forceWidth) {
      this.baseElJq.width(this.width);
    }

    this.layout = new _d3.listGraph({ // eslint-disable-line new-cap
      size: [
        this.width,
        this.height
      ],
      grid: [
        this.columns,
        this.rows
      ],
      d3: _d3
    });

    this.data = init.data;
    this.visData = this.layout.process(
      this.data,
      this.rootNodes,
      {
        showLinkLocation: this.showLinkLocation,
        linkLocationBucketSize: this.linkLocationBucketSize,
        sortBy: this.sortBy,
        sortOrder: this.sortOrder
      }
    );

    /**
     * Stores current sorting, e.g. type, order and a reference to the element.
     *
     * @type  {Object}
     */
    this.currentSorting = {
      global: {
        type: this.sortBy,
        order: this.sortOrder
      },
      local: {}
    };

    this.barMode = init.barMode || config.DEFAULT_BAR_MODE;
    this.svgD3.classed(this.barMode + '-bar', true);

    this.topbar = new Topbar(
      this, this.baseElD3, this.visData, this.customTopbarButtons
    );

    this.svgD3.attr('viewBox', '0 0 ' + this.width + ' ' + this.height);

    this.container = this.svgD3.append('g').attr('class', 'main-container');

    this.levels = new Levels(this.container, this, this.visData);

    this.links = new Links(this, this.levels.groups, this.visData, this.layout);
    this.nodes = new Nodes(
      this,
      this.levels.groups,
      this.visData,
      this.links,
      this.events
    );
    this.levels.scrollPreparation(this.scrollbarWidth);
    this.scrollbars = new Scrollbars(
      this.levels.groups,
      this.visData,
      this.scrollbarWidth
    );

    this.nodeContextMenu = new NodeContextMenu({
      visData: this.visData,
      baseEl: this.container,
      events: this.events,
      nodes: this.nodes,
      iconPath: this.iconPath,
      infoFields: this.nodeInfoContextMenu,
      isQueryable: this.querying,
      isDebounced: !this.disableDebouncedContextMenu
    });

    this.nodeContextMenu.wrapper.on('mousedown', () => {
      this.mouseDownOnContextMenu = true;
    });

    dropShadow(this.svgD3, 'context-menu', 0, 1, 2, 0.2);
    dropShadow(this.svgD3, 'context-menu-inverted', 0, -1, 2, 0.2);

    // jQuery's mousewheel plugin is much nicer than D3's half-baked zoom event.
    // We are using delegated event listeners to provide better scaling
    this.svgJq.on('mousewheel', '.' + Levels.className, function (event) {
      if (!self.zoomedOut) {
        self.mousewheelColumn(this, event);
      }
    });

    this.svgJq.on('click', (event) => {
      self.checkGlobalClick.call(self, event.target);
    });

    // Add jQuery delegated event listeners instead of direct listeners of D3.
    this.svgJq.on(
      'click',
      `.${Nodes.classNodeVisible}`,
      function () {
        // Add a new global outside click listener using this node and the
        // node context menu as the related elements.
        requestNextAnimationFrame(() => {
          self.registerOutSideClickHandler(
            'nodeContextMenu',
            [self.nodeContextMenu.wrapper.node()],
            ['visible-node'],
            () => {
              // The context of this method is the context of the outer click
              // handler.
              self.nodeContextMenu.close();
              self.unregisterOutSideClickHandler.call(
                self, 'nodeContextMenu'
              );
            }
          );
        });

        self.nodeContextMenu.toggle.call(
          self.nodeContextMenu,
          _d3.select(this.parentNode)
        );
      }
    );

    this.svgJq.on(
      'click',
      `.${Nodes.classFocusControls}.${Nodes.classRoot}`,
      function () {
        self.nodes.rootHandler.call(self.nodes, _d3.select(this), true);
      }
    );

    if (this.querying) {
      this.svgJq.on(
        'click',
        `.${Nodes.classFocusControls}.${Nodes.classQuery}`,
        function () {
          self.nodes.queryHandler.call(
            self.nodes,
            _d3.select(this.parentNode),
            'unquery'
          );
          self.nodeContextMenu.updateStates();
        }
      );
    }

    this.svgJq.on(
      'mouseenter',
      `.${Nodes.classNodeVisible}`,
      function () {
        self.interactionWrapper.call(self, function (domEl, data) {
          if (!this.vis.activeScrollbar) {
            this.enterHandler.call(this, domEl, data);
          }
        }.bind(self.nodes), [this, _d3.select(this).datum()]);
      }
    );

    this.svgJq.on(
      'mouseleave',
      `.${Nodes.classNodeVisible}`,
      function () {
        self.interactionWrapper.call(self, function (domEl, data) {
          if (!this.vis.activeScrollbar) {
            this.leaveHandler.call(this, domEl, data);
          }
        }.bind(self.nodes), [this, _d3.select(this).datum()]);
      }
    );

    // Normally we would reference a named methods but since we need to access
    // the class' `this` property instead of the DOM element we need to use an
    // arrow function.
    this.scrollbars.all.on('mousedown', function () {
      self.scrollbarMouseDown(this, _d3.event);
    });

    // We need to listen to `mouseup` and `mousemove` globally otherwise
    // scrolling will only work as long as the cursor hovers the actual
    // scrollbar, which is super annoying.
    _d3.select(document)
      .on('mouseup', () => { this.globalMouseUp(_d3.event); });

    // Enable dragging of the whole graph.
    this.svgD3.call(
      onDragDrop,
      this.dragStartHandler.bind(this),
      this.dragMoveHandler.bind(this),
      this.dragEndHandler.bind(this),
      [
        this.container,
        this.topbar.localControlWrapper
      ],
      'horizontal',
      this.getDragLimits.bind(this),
      this.noDragging.bind(this),
      this.dragged,
      2
    );

    this.events.on(
      'd3ListGraphLevelFocus',
      levelId => this.levels.focus(levelId)
    );

    this.events.on(
      'd3ListGraphNodeRoot',
      () => {
        this.nodes.bars.updateAll(
          _d3.listGraph.updateBars(this.data), this.currentSorting.global.type
        );
        this.updateSorting();
      }
    );

    this.events.on(
      'd3ListGraphNodeUnroot',
      () => {
        this.nodes.bars.updateAll(
          _d3.listGraph.updateBars(this.data), this.currentSorting.global.type
        );
        this.updateSorting();
      }
    );

    this.events.on(
      'd3ListGraphUpdateBars',
      () => {
        this.nodes.bars.updateAll(
          _d3.listGraph.updateBars(this.data), this.currentSorting.global.type
        );
        this.updateSorting();
      }
    );

    this.events.on(
      'd3ListGraphActiveLevel',
      (nextLevel) => {
        const oldLevel = this.activeLevel;
        this.activeLevel = Math.max(nextLevel, 0);
        if (this.nodes.rootedNode) {
          const rootNodeDepth = this.nodes.rootedNode.datum().depth;
          this.levels.blur(rootNodeDepth + oldLevel);
          this.levels.focus(rootNodeDepth + this.activeLevel);
        } else {
          this.levels.blur(oldLevel - this.noRootActiveLevelDiff);
          this.levels.focus(
            this.activeLevel - this.noRootActiveLevelDiff
          );
        }
      }
    );

    // Initialize `this.left` and `this.top`
    this.getBoundingRect();
  }

  /**
   * Get visually used area of the container
   *
   * @method  area
   * @author  Fritz Lekschas
   * @date    2016-10-02
   * @return  {Object}  Bounding client rectangle.
   */
  get area () {
    return this.container.node().getBoundingClientRect();
  }

  /**
   * Get current bar mode.
   *
   * @method  barMode
   * @author  Fritz Lekschas
   * @date    2016-10-02
   * @return  {String}  Bar mode. Either "one" or "two".
   */
  get barMode () {
    if (this.bars) {
      return this.nodes.bars.mode;
    }
    return this._barMode;
  }

  /**
   * Set bar mode.
   *
   * @method  barMode
   * @author  Fritz Lekschas
   * @date    2016-10-02
   * @param   {String}  mode  Bar mode. Either "one" or "two".
   */
  set barMode (mode) {
    if (this.bars) {
      this.nodes.bars.mode = mode;
    }
    this._barMode = mode;
  }

  /**
   * Check global mouse click
   *
   * @method  checkGlobalClick
   * @author  Fritz Lekschas
   * @date    2016-10-02
   * @param   {Object}  target  DOM element
   */
  checkGlobalClick (target) {
    const found = {};
    const checkClass = Object.keys(this.outsideClickClassHandler).length;

    let el = target;
    try {
      while (!el.__d3ListGraphBase__) {
        if (el.__id__) {
          for (let i = el.__id__.length; i--;) {
            found[el.__id__[i]] = true;
          }
        }
        if (checkClass) {
          const classNames = Object.keys(this.outsideClickClassHandler);
          for (let i = classNames.length; i--;) {
            const className = el.getAttribute('class');
            if (className && className.indexOf(classNames[i]) >= 0) {
              found[this.outsideClickClassHandler[classNames[i]].id] = true;
            }
          }
        }
        el = el.parentNode;
      }
    } catch (e) { return; }

    const handlerIds = Object.keys(this.outsideClickHandler);
    for (let i = handlerIds.length; i--;) {
      if (!found[handlerIds[i]]) {
        this.outsideClickHandler[handlerIds[i]].callback.call(this);
      }
    }
  }

  /**
   * Check which nodes of a level are visible.
   *
   * @method  checkNodeVisibility
   * @author  Fritz Lekschas
   * @date    2016-10-02
   * @param   {Number}  level            Index of the level or column.
   * @param   {[type]}             customScrollTop  [description]
   */
  checkNodeVisibility (level, customScrollTop) {
    const nodes = level ?
      this.nodes.nodes.filter(data => data.depth === level) : this.nodes.nodes;

    nodes.call(this.nodes.isInvisible.bind(this.nodes), customScrollTop);
  }

  /**
   * Drag end handler
   *
   * @method  dragEndHandler
   * @author  Fritz Lekschas
   * @date    2016-10-02
   */
  dragEndHandler () {
    if (this.dragging) {
      this.noInteractions = (this.dragging = false);
    }
  }

  /**
   * Get the minimal drag X value
   *
   * @method  dragMinX
   * @author  Fritz Lekschas
   * @date    2016-10-02
   * @return  {Number}  Minimal drag x value.
   */
  get dragMinX () {
    return Math.min(0, this.width - this.area.width);
  }

  /**
   * Drag-move handler instance.
   *
   * @method  dragMoveHandler
   * @author  Fritz Lekschas
   * @date    2016-10-02
   * @param   {Object}           data            D3's drag event object.
   * @param   {Array}            elsToBeDragged  Array of D3 selections.
   * @param   {String}           orientation     Can either be "horizontal",
   *   "vertical" or `undefined`, i.e. both directions.
   * @param   {Object|Function}  limits          X and Y drag limits. E.g.
   *   `{ x: { min: 0, max: 10 } }`.
   */
  dragMoveHandler (data, elsToBeDragged, orientation, limits) {
    dragMoveHandler(
      data, elsToBeDragged, orientation, limits
    );
    this.checkNodeVisibility();
  }

  /**
   * Method for scrolling a column of nodes when the scrollbar is dragged.
   *
   * @method  dragScrollbar
   * @author  Fritz Lekschas
   * @date    2016-09-12
   * @param   {Object}  event  D3's _mousemove_ event object.
   */
  dragScrollbar (event) {
    event.preventDefault();
    const data = this.activeScrollbar.datum();
    const deltaY = data.scrollbar.clientY - event.clientY;

    // Scroll scrollbar
    ListGraph.scrollElVertically(
      this.activeScrollbar.node(),
      Math.min(
        Math.max(
          data.scrollbar.scrollTop - deltaY,
          0
        ),
        data.scrollbar.scrollHeight
      )
    );

    // Scroll content
    const contentScrollTop = Math.max(
      Math.min(
        data.scrollTop +
        data.invertedHeightScale(deltaY),
        0
      ),
      -data.scrollHeight
    );

    ListGraph.scrollElVertically(
      data.nodes,
      contentScrollTop
    );

    // Scroll Links
    if (data.level !== this.visData.nodes.length) {
      this.links.scroll(
        data.linkSelections.outgoing,
        this.layout.offsetLinks(
          data.level,
          contentScrollTop,
          'source'
        )
      );
    }

    if (data.level > 0) {
      this.links.scroll(
        data.linkSelections.incoming,
        this.layout.offsetLinks(
          data.level - 1,
          contentScrollTop,
          'target'
        )
      );
    }

    if (this.showLinkLocation) {
      this.nodes.updateLinkLocationIndicators(
        data.level - 1, data.level + 1
      );
    }

    if (this.nodeContextMenu.opened) {
      this.nodeContextMenu.scrollY(contentScrollTop);
    }

    // Check if nodes are visible.
    this.checkNodeVisibility(data.level, contentScrollTop);
  }

  /**
   * Drag start handler
   *
   * @method  dragStartHandler
   * @author  Fritz Lekschas
   * @date    2016-10-02
   */
  dragStartHandler () {
    if (!this.dragging) {
      this.noInteractions = (this.dragging = true);
    }
  }

  /**
   * Helper method to get the top and left position of the base `svg`.
   *
   * @Description
   * Calling `getBoundingClientRect()` right at the beginning leads to errornous
   * values, probably because the function is called because HTML has been fully
   * rendered.
   *
   * @method  getBoundingRect
   * @author  Fritz Lekschas
   * @date    2016-02-24
   */
  getBoundingRect () {
    this.left = this.svgEl.getBoundingClientRect().left;
    this.top = this.svgEl.getBoundingClientRect().top;
  }

  /**
   * Get drag limits
   *
   * @method  dragLimits
   * @author  Fritz Lekschas
   * @date    2016-10-02
   * @return  {Object}  Min and max drag limits.
   */
  getDragLimits () {
    return {
      x: {
        min: this.dragMinX,
        max: 0
      }
    };
  }

  /**
   * Global _mouseUp_ event handler
   *
   * @method  globalMouseUp
   * @author  Fritz Lekschas
   * @date    2016-10-02
   * @param   {[type]}       event  [description]
   * @return  {[type]}              [description]
   */
  globalMouseUp (event) {
    this.noInteractions = false;
    this.mouseDownOnContextMenu = false;

    if (this.activeScrollbar) {
      const data = this.activeScrollbar.datum();
      const deltaY = data.scrollbar.clientY - event.clientY;

      // Save final vertical position
      // Scrollbar
      data.scrollbar.scrollTop = Math.min(
        Math.max(
          data.scrollbar.scrollTop - deltaY,
          0
        ),
        data.scrollbar.scrollHeight
      );

      // Content
      data.scrollTop = Math.max(
        Math.min(
          data.scrollTop +
          data.invertedHeightScale(deltaY),
          0
        ),
        -data.scrollHeight
      );

      this.activeScrollbar.classed('active', false);

      this.activeScrollbar = undefined;

      ListGraph.stopScrollBarMouseMove();
    }
  }

  /**
   * Show the complete graph by zooming out
   *
   * @method  globalView
   * @author  Fritz Lekschas
   * @date    2016-10-02
   * @param   {Object}  selectionInterst  D3 selection of nodes of interest,
   *   which restrict the amount of zoom-out. If `undefined` the whole graph
   *   will be shown.
   */
  globalView (selectionInterst) {
    if (!this.zoomedOut) {
      let x = 0;
      let y = 0;
      let width = 0;
      let height = 0;
      let cRect;
      const contBBox = this.container.node().getBBox();

      const globalCRect = this.svgD3.node().getBoundingClientRect();

      if (selectionInterst && !selectionInterst.empty()) {
        selectionInterst.each(function () {
          cRect = this.getBoundingClientRect();
          width = Math.max(
            width,
            cRect.left - (globalCRect.left + cRect.width)
          );
          height = Math.max(
            height,
            cRect.top - (globalCRect.top + cRect.height)
          );
        });
        width = this.width > width ? this.width : width;
        height = this.height > height ? this.height : height;
      } else {
        width = this.width > contBBox.width ? this.width : contBBox.width;
        height = this.height > contBBox.height ? this.height : contBBox.height;
      }

      x = contBBox.x + this.dragged.x;
      y = contBBox.y;

      this.nodes.makeAllTempVisible();
      this.links.makeAllTempVisible();

      this.svgD3
        .classed('zoomedOut', true)
        .transition()
        .duration(config.TRANSITION_SEMI_FAST)
        .attr('viewBox', x + ' ' + y + ' ' + width + ' ' + height);
    }
  }

  /**
   * Interaction wrapper
   *
   * @description
   * Cheks if interacctions are allowed first.
   *
   * @method  interactionWrapper
   * @author  Fritz Lekschas
   * @date    2016-10-02
   * @param   {Function}  callback  Callback function.
   * @param   {Object}    params    Parameters of the callback function.
   */
  interactionWrapper (callback, params) {
    if (!this.noInteractions) {
      callback.apply(this, params);
    }
  }

  /**
   * Check if an element is actually visible, i.e. within the boundaries of the
   * SVG element.
   *
   * @method  isHidden
   * @author  Fritz Lekschas
   * @date    2016-02-24
   * @param   {Object}    el  DOM element to be checked.
   * @return  {Boolean}       If `true` element is not visible.
   */
  isHidden (el) {
    const boundingRect = el.getBoundingClientRect();
    return (
      boundingRect.top + boundingRect.height <= this.top ||
      boundingRect.left + boundingRect.width <= this.left ||
      boundingRect.top >= this.top + this.height ||
      boundingRect.left >= this.left + this.width
    );
  }

  /**
   * Assesses whether a link's end points outwards
   *
   * @method  linkPointsOutside
   * @author  Fritz Lekschas
   * @date    2016-09-14
   * @param   {Object}  data  Link data.
   * @return  {Number}  If link ends inwards returns `0`, if it points outwards
   *   to the top returns `1` or `2` when it points to the bottom. If the node
   *   pointed to is hidden return `16`.
   */
  linkPointsOutside (data) {
    const y = data.node.y + data.offsetY;
    if (data.node.hidden) {
      return 16;
    }
    if (
      y + this.visData.global.row.height - this.visData.global.row.padding <= 0
    ) {
      return 1;
    }
    if (y + this.visData.global.row.padding >= this.height) {
      return 2;
    }
    return 0;
  }

  /**
   * Scroll column by the mouseWheel action
   *
   * @method  mousewheelColumn
   * @author  Fritz Lekschas
   * @date    2016-10-02
   * @param   {Object}  el     DOM element
   * @param   {Object}  event  jQuery event object.
   */
  mousewheelColumn (el, event) {
    event.preventDefault();

    const data = _d3.select(el).datum();

    if (data.scrollHeight > 0) {
      // Scroll nodes
      data.scrollTop = Math.max(
        Math.min(data.scrollTop + event.deltaY, 0),
        -data.scrollHeight
      );

      this.scrollY(data);
    }

    // Check if nodes are visible.
    this.checkNodeVisibility(data.level);
  }

  /**
   * Check if dragging should be disabled.
   *
   * @description
   * When the scrollbar or context menu is clicked the graph shouldn#t be
   * draggable.
   *
   * @method  noDragging
   * @author  Fritz Lekschas
   * @date    2016-10-02
   * @return  {Boolean}  If `true` the graph shouldn't be draggable.
   */
  noDragging () {
    return !!this.activeScrollbar || this.mouseDownOnContextMenu;
  }

  /**
   * Assesses any of the two ends of a link points outwards.
   *
   * @description
   * In order to be able to determine where a link points to, the output of
   * `linkPointsOutside` for the source and target location is shifted bitwise
   * in such a way that this method return 11 unique numbers.
   * - 0: link is completely inwards
   * - 1: source is outwards to the top
   * - 2: source is outwards to the bottom
   * - 4: target is outwards to the top
   * - 8: target is outwards to the bottom
   * - 5: source and target are outwards to the top
   * - 6: source is outwards to the bottom and target is outwards to the top
   * - 9: source is outwards to the top and target is outwards to the bottom
   * - 10: source and target are outwards to the bottom
   * - 16: source is invisible
   * - 64: target is invisible
   *
   * If you're asking yourself: "WAT?!?!!" Think of a 4x4 binary matrix:
   * |    target    |    source    |
   * | bottom | top | bottom | top |
   * |    0   |  0  |    0   |  0  | (=0)
   * |    0   |  0  |    0   |  1  | (=1)
   * |    0   |  0  |    1   |  0  | (=2)
   * |    0   |  1  |    0   |  0  | (=4)
   * |    1   |  0  |    0   |  0  | (=8)
   * |    0   |  1  |    0   |  1  | (=5)
   * |    0   |  1  |    1   |  0  | (=6)
   * |    1   |  0  |    0   |  1  | (=9)
   * |    1   |  0  |    1   |  0  | (=10)
   *
   * *Note: 16 and 64 are two special values when the source or target node is
   * hidden. The numbers are so hight just because that the bitwise-and with 4
   * and 8 results to 0.
   *
   * To check whether the source or target location is above, below or within
   * the global SVG container is very simple. For example, to find out if the
   * target location is above, all we need to do is `<VALUE> & 4 > 0`. This
   * performs a bit-wise AND operation with only two possible outcomes: 4 and 0.
   *
   * @method  pointsOutside
   * @author  Fritz Lekschas
   * @date    2016-09-14
   * @param   {Object}  data  Link data.
   * @return  {Number}  Numberical represenation of the links constallation. See
   *   description for details.
   */
  pointsOutside (data) {
    const source = this.linkPointsOutside(data.source);
    const target = this.linkPointsOutside(data.target) << 2;
    return source | target;
  }

  /**
   * Register an outside mouse click handler
   *
   * @method  registerOutSideClickHandler
   * @author  Fritz Lekschas
   * @date    2016-10-02
   * @param   {String}     id            ID of the handler to be removed.
   * @param   {Array}      els           Array of elements to be registered.
   * @param   {[type]}     elClassNames  Element class names.
   * @param   {Function}   callback      Callback function
   * @return  {Number}                   Return number of outside click
   *   handlers.
   */
  registerOutSideClickHandler (id, els, elClassNames, callback) {
    // We need to register a unique property to be able to efficiently identify
    // the element later.
    for (let i = els.length; i--;) {
      if (els[i].__id__) {
        els[i].__id__.push(id);
      } else {
        els[i].__id__ = [id];
      }
    }
    const newLength = this.outsideClickHandler[id] = {
      id, els, elClassNames, callback
    };
    for (let i = elClassNames.length; i--;) {
      this.outsideClickClassHandler[elClassNames[i]] =
        this.outsideClickHandler[id];
    }
    return newLength;
  }

  /**
   * Helper method to scroll all columns to the top.
   *
   * @method  resetAllScrollPositions
   * @author  Fritz Lekschas
   * @date    2016-10-02
   */
  resetAllScrollPositions () {
    return this.scrollYTo(this.levels.groups, 0);
  }

  /**
   * Scrollbar _mouseDown_ handler
   *
   * @method  scrollbarMouseDown
   * @author  Fritz Lekschas
   * @date    2016-10-02
   * @param   {Object}  el     DOM element.
   * @param   {Object}  event  D3 _mouseDown_ event object.
   */
  scrollbarMouseDown (el, event) {
    this.noInteractions = true;
    this.activeScrollbar = _d3.select(el).classed('active', true);
    this.activeScrollbar.datum().scrollbar.clientY = event.clientY;
    this.startScrollBarMouseMove();
  }

  /**
   * Scroll an element vertically
   *
   * @method  scrollElVertically
   * @author  Fritz Lekschas
   * @date    2016-10-02
   * @param   {Object}  el      DOM element to be scrolled.
   * @param   {Number}  offset  Number of pixel to be scrolled.
   */
  static scrollElVertically (el, offset) {
    _d3.select(el).attr(
      'transform',
      'translate(0, ' + offset + ')'
    );
  }

  /**
   * Scroll column of nodes.
   *
   * @method  scrollY
   * @author  Fritz Lekschas
   * @date    2016-10-02
   * @param   {Object}   columnData         D3 data object of the column.
   * @param   {Boolean}  scrollbarDragging  If `true` column is scrolled by
   *   dragging the scrollbar.
   */
  scrollY (columnData, scrollbarDragging) {
    ListGraph.scrollElVertically(columnData.nodes, columnData.scrollTop);

    if (!scrollbarDragging) {
      // Scroll scrollbar
      columnData.scrollbar.scrollTop = columnData.scrollbar.heightScale(
        -columnData.scrollTop
      );

      ListGraph.scrollElVertically(
        columnData.scrollbar.el,
        columnData.scrollbar.scrollTop
      );
    }

    // Scroll Links
    if (columnData.level !== this.visData.nodes.length) {
      this.links.scroll(
        columnData.linkSelections.outgoing,
        this.layout.offsetLinks(
          columnData.level,
          columnData.scrollTop,
          'source'
        )
      );
    }

    if (columnData.level > 0) {
      this.links.scroll(
        columnData.linkSelections.incoming,
        this.layout.offsetLinks(
          columnData.level - 1,
          columnData.scrollTop,
          'target'
        )
      );
    }

    if (this.showLinkLocation) {
      this.nodes.updateLinkLocationIndicators(
        columnData.level - 1, columnData.level + 1
      );
    }

    if (this.nodeContextMenu.isOpenSameColumn(columnData.level)) {
      this.nodeContextMenu.scrollY(columnData.scrollTop);
    }
  }

  /**
   * Scroll to a certain vertical position in a column
   *
   * @method  scrollYTo
   * @author  Fritz Lekschas
   * @date    2016-10-02
   * @param   {Object}  selection  D3 selection of columns.
   * @param   {Number}  positionY  Position in pixel to be scrolled to.
   */
  scrollYTo (selection, positionY) {
    return selection
      .transition()
      .duration(config.TRANSITION_SEMI_FAST)
      .tween('scrollY', (data) => {
        const scrollPositionY = _d3.interpolateNumber(data.scrollTop, positionY);
        return (time) => {
          data.scrollTop = scrollPositionY(time);
          this.scrollY(data);
        };
      });
  }

  /**
   * Select elements by column
   *
   * @method  selectByLevel
   * @author  Fritz Lekschas
   * @date    2016-10-02
   * @param   {Number}  level     Index of the column or level.
   * @param   {String}  selector  Query selector string.
   * @return  {Object}            D3 selection.
   */
  selectByLevel (level, selector) {
    return _d3.select(this.levels.groups._groups[0][level]).selectAll(selector);
  }

  /**
   * Sort all columns or levels
   *
   * @method  sortAllColumns
   * @author  Fritz Lekschas
   * @date    2016-10-02
   * @param   {String}   property     Node property to be sorted by.
   * @param   {Boolean}  newSortType  If `true` sorted by a new type.
   */
  sortAllColumns (property, newSortType) {
    this.currentSorting.global.order =
      this.currentSorting.global.order === -1 && !newSortType ? 1 : -1;

    this.nodes.sort(
      this.layout
        .sort(undefined, property, this.currentSorting.global.order)
        .updateNodesVisibility()
        .nodes(),
      newSortType
    );

    this.links.sort(this.layout.links());
    this.nodeContextMenu.updatePosition();
    this.checkNodeVisibility();
  }

  /**
   * Sort a column or level
   *
   * @method  sortColumn
   * @author  Fritz Lekschas
   * @date    2016-10-02
   * @param   {Integer}   level        Specifies the level which should be
   *   sorted.
   * @param   {String}    property     The property used for sorting. Can be one
   *   of ['precision', 'recall', 'name'].
   * @param   {Integer}   sortOrder    If `1` sort asc. If `-1` sort desc.
   * @param   {String}    newSortType  Property to be sorted by.
   */
  sortColumn (level, property, sortOrder, newSortType) {
    this.nodes.sort(
      this.layout
        .sort(level, property, sortOrder)
        .updateNodesVisibility()
        .nodes(level),
      newSortType
    );
    this.links.sort(this.layout.links(level - 1, level + 1));
    this.nodeContextMenu.updatePosition();
    this.checkNodeVisibility();
  }

  /**
   * Start listening to the _mouseMove_ event when the scroll drag is started
   *
   * @method  startScrollBarMouseMove
   * @author  Fritz Lekschas
   * @date    2016-10-02
   */
  startScrollBarMouseMove () {
    _d3.select(document)
      .on('mousemove', () => { this.dragScrollbar(_d3.event); });
  }

  /**
   * Stop listening to the _mouseMove_ event when the scroll bar drag is over
   *
   * @method  stopScrollBarMouseMove
   * @author  Fritz Lekschas
   * @date    2016-10-02
   */
  static stopScrollBarMouseMove () {
    _d3.select(document).on('mousemove', null);
  }

  /**
   * Switch node bar mode
   *
   * @method  switchBarMode
   * @author  Fritz Lekschas
   * @date    2016-10-02
   * @param   {String}  mode  Bar mode. Either "one" or "two".
   */
  switchBarMode (mode) {
    this.svgD3.classed('one-bar', mode === 'one');
    this.svgD3.classed('two-bar', mode === 'two');
    this.nodes.bars.switchMode(mode, this.currentSorting);
  }

  /**
   * Helper method to trigger an event
   *
   * @method  trigger
   * @author  Fritz Lekschas
   * @date    2016-10-02
   * @param   {[type]}    event  [description]
   * @param   {[type]}    data   [description]
   * @return  {[type]}           [description]
   */
  trigger (event, data) {
    this.events.trigger(event, data);
  }

  /**
   * Toggle between the global and zoomed graph view.
   *
   * @method  toggleView
   * @author  Fritz Lekschas
   * @date    2016-10-02
   */
  toggleView () {
    if (this.zoomedOut) {
      this.zoomedOut = false;
      this.zoomedView();
    } else {
      this.globalView();
      this.zoomedOut = true;
    }
  }

  /**
   * Remove outside mouse click handler
   *
   * @method  unregisterOutSideClickHandler
   * @author  Fritz Lekschas
   * @date    2016-10-02
   * @param   {String}  id  ID of the handler to be removed.
   */
  unregisterOutSideClickHandler (id) {
    const handler = this.outsideClickHandler[id];

    // Remove element `__id__` property.
    for (let i = handler.els.length; i--;) {
      handler.els[i].__id__ = undefined;
      delete handler.els[i].__id__;
    }

    // Remove handler.
    this.outsideClickHandler[id] = undefined;
    delete this.outsideClickHandler[id];
  }

  /**
   * Helper method to trigger an update of the columns' or levels' visibility
   *
   * @method  updateLevelsVisibility
   * @author  Fritz Lekschas
   * @date    2016-10-02
   */
  updateLevelsVisibility () {
    this.levels.updateVisibility();
  }

  /**
   * Update the scroll position and scroll-bar visibility.
   *
   * @description
   * This method needs to be called after hiding or showing nodes.
   *
   * @method  updateScrolling
   * @author  Fritz Lekschas
   * @date    2016-02-21
   */
  updateScrolling () {
    this.resetAllScrollPositions().call(allTransitionsEnded, () => {
      this.levels.updateScrollProperties();
      this.scrollbars.updateVisibility();
    });
  }

  /**
   * Update column sorting given the current sort settings.
   *
   * @method  updateSorting
   * @author  Fritz Lekschas
   * @date    2016-10-02
   */
  updateSorting () {
    const levels = Object.keys(this.currentSorting.local);
    for (let i = levels.length; i--;) {
      this.sortColumn(
        i,
        this.currentSorting.local[levels[i]].type,
        this.currentSorting.local[levels[i]].order,
        this.currentSorting.local[levels[i]].type
      );
    }
  }

  /**
   * Show original zoomed graph
   *
   * @method  zoomedView
   * @author  Fritz Lekschas
   * @date    2016-10-02
   */
  zoomedView () {
    if (!this.zoomedOut) {
      this.nodes.makeAllTempVisible(true);
      this.links.makeAllTempVisible(true);

      this.svgD3
        .classed('zoomedOut', false)
        .transition()
        .duration(config.TRANSITION_SEMI_FAST)
        .attr('viewBox', '0 0 ' + this.width + ' ' + this.height);
    }
  }
}

ListGraph.version = '0.17.0';

export default ListGraph;
