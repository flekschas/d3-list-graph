// External
import * as $ from '$';
import * as d3 from 'd3';

// Internal
import { LayoutNotAvailable } from './errors';
import * as config from './config';
import Topbar from './topbar';
import Levels from './levels';
import Links from './links';
import Nodes from './nodes';
import Scrollbars from './scrollbars';
import Events from './events';
import { onDragDrop, dragMoveHandler } from '../commons/event-handlers';
import { allTransitionsEnded } from '../commons/d3-utils';

function setOption (value, defaultValue, noFalsyValue) {
  if (noFalsyValue) {
    return value ? value : defaultValue;
  }

  return typeof value !== 'undefined' ? value : defaultValue;
}

class ListGraph {
  constructor (init) {
    if (!d3.layout.listGraph) {
      throw new LayoutNotAvailable();
    }

    const that = this;

    this.baseEl = init.element;
    this.baseElD3 = d3.select(this.baseEl);
    this.baseElJq = $(this.baseEl);
    this.svgD3 = this.baseElD3.select('svg.base');
    this.svgEl = this.svgD3.node();

    if (this.svgD3.empty()) {
      this.svgD3 = this.baseElD3.append('svg').attr('class', 'base');
      this.svgJq = $(this.svgD3.node());
    } else {
      this.svgJq = $(this.svgD3.node());
    }

    this.rootNodes = init.rootNodes;

    this.width = setOption(init.width, this.svgJq.width(), true);
    this.height = setOption(init.height, this.svgJq.height(), true);

    // Refresh top and left position of the base `svg` everytime the user enters
    // the element with his/her mouse cursor. This will avoid relying on complex
    // browser resize events and other layout manipulations as they most likely
    // won't happen when the user tries to interact with the visualization.
    this.svgD3.on('mouseenter', function () {
      that.getBoundingRect.call(that, this);
    });

    this.scrollbarWidth = setOption(
      init.scrollbarWidth, config.SCROLLBAR_WIDTH, true
    );
    this.columns = setOption(init.columns, config.COLUMNS, true);
    this.rows = setOption(init.rows, config.ROWS, true);
    this.iconPath = setOption(init.iconPath, config.ICON_PATH, true);
    this.querying = setOption(init.querying, config.QUERYING);

    this.highlightActiveLevel = setOption(
      init.highlightActiveLevel, config.HIGHLIGHT_ACTIVE_LEVEL
    );

    // Determines which level from the rooted node will be regarded as active.
    // Zero means that the level of the rooted node is regarded.
    this.activeLevel = setOption(init.activeLevel, config.ACTIVE_LEVEL);

    this.noRootActiveLevelDiff = setOption(
      init.noRootActiveLevelDiff, config.NO_ROOT_ACTIVE_LEVEL_DIFF
    );

    this.lessTransitionsJs = init.lessTransitions > 0;
    this.lessTransitionsCss = init.lessTransitions > 1;

    this.baseElD3.classed('less-animations', this.lessTransitionsCss);

    this.sortBy = init.sortBy;
    this.sortOrder = init.sortOrder === 'asc' ? 1 : config.DEFAULT_SORT_ORDER;

    this.events = new Events(this.baseEl, init.dispatcher);

    this.baseElJq.addClass(config.CLASSNAME);

    if (init.forceWidth) {
      this.baseElJq.width(this.width);
    }

    this.layout = new d3.layout.listGraph( // eslint-disable-line new-cap
      [
        this.width,
        this.height
      ],
      [
        this.columns,
        this.rows
      ]
    );

    this.data = init.data;
    this.visData = this.layout.process(
      this.data,
      this.rootNodes,
      {
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

    this.topbar = new Topbar(this, this.baseElD3, this.visData);

    this.svgD3.attr('viewBox', '0 0 ' + this.width + ' ' + this.height);

    this.container = this.svgD3.append('g').attr('class', 'main-container');

    this.levels = new Levels(this.container, this, this.visData);

    this.links = new Links(this.levels.groups, this.visData, this.layout);
    this.nodes = new Nodes(
      this,
      this.levels.groups,
      this.visData,
      this.links,
      this.events
    );
    this.levels.scrollPreparation(this, this.scrollbarWidth);
    this.scrollbars = new Scrollbars(
      this.levels.groups,
      this.visData,
      this.scrollbarWidth
    );

    // jQuery's mousewheel plugin is much nicer than D3's half-baked zoom event.
    // We are using delegated event listeners to provide better scaling
    this.svgJq.on('mousewheel', '.' + this.levels.className, function (event) {
      if (!that.zoomedOut) {
        that.mousewheelColumn(this, event);
      }
    });

    // Add jQuery delegated event listeners instead of direct listeners of D3.
    if (this.querying) {
      this.svgJq.on(
        'click',
        `.${this.nodes.classLabelWrapper}`,
        function () {
          that.nodes.toggleQueryMode.call(
            that.nodes, this.parentNode, d3.select(this).datum()
          );
        }
      );
    }

    this.svgJq.on(
      'click',
      `.${this.nodes.classFocusControls}.${this.nodes.classRoot}`,
      function () {
        that.nodes.rootHandler.call(that.nodes, this, d3.select(this).datum());
      }
    );

    if (this.querying) {
      this.svgJq.on(
        'click',
        `.${this.nodes.classFocusControls}.${this.nodes.classQuery}`,
        function () {
          that.nodes.toggleQueryMode.call(
            that.nodes, this.parentNode, d3.select(this).datum()
          );
        }
      );
    }

    this.svgJq.on(
      'click',
      `.${this.nodes.classFocusControls}.${this.nodes.classLock}`,
      function () {
        that.nodes.lockHandler.call(that.nodes, this, d3.select(this).datum());
      }
    );

    // Normally we would reference a named methods but since we need to access
    // the class' `this` property instead of the DOM element we need to use an
    // arrow function.
    this.scrollbars.all.on('mousedown', function () {
      that.scrollbarMouseDown(this, d3.event);
    });

    // We need to listen to `mouseup` and `mousemove` globally otherwise
    // scrolling will only work as long as the cursor hovers the actual
    // scrollbar, which is super annoying.
    d3.select(document)
      .on('mouseup', () => { this.globalMouseUp(d3.event); })
      .on('mousemove', () => { this.globalMouseMove(d3.event); });

    // Enable dragging of the whole graph.
    this.svgD3.call(
      onDragDrop,
      this.dragStartHandler.bind(this),
      dragMoveHandler,
      this.dragEndHandler.bind(this),
      [
        this.container,
        this.topbar.localControlWrapper
      ],
      'horizontal',
      this.getDragLimits.bind(this),
      [this.scrollbarDragging.bind(this)]
    );

    this.events.on(
      'd3ListGraphLevelFocus',
      levelId => this.levels.focus(levelId)
    );

    this.events.on(
      'd3ListGraphNodeRoot',
      () => {
        this.nodes.bars.updateAll(
          this.layout.updateBars(this.data), this.currentSorting.global.type
        );
        this.updateSorting();
      }
    );

    this.events.on(
      'd3ListGraphNodeUnroot',
      () => {
        this.nodes.bars.updateAll(
          this.layout.updateBars(this.data), this.currentSorting.global.type
        );
        this.updateSorting();
      }
    );

    this.events.on(
      'd3ListGraphUpdateBars',
      () => {
        this.nodes.bars.updateAll(
          this.layout.updateBars(this.data), this.currentSorting.global.type
        );
        this.updateSorting();
      }
    );

    this.events.on(
      'd3ListGraphActiveLevel',
      nextLevel => {
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
  }

  get area () {
    return this.container.node().getBoundingClientRect();
  }

  get dragMinX () {
    return Math.min(0, this.width - this.area.width);
  }

  getDragLimits () {
    return {
      x: {
        min: this.dragMinX,
        max: 0
      }
    };
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
   * @param   {Object}  el  Element on which `getBoundingClientRect` is called.
   */
  getBoundingRect (el) {
    this.top = el.getBoundingClientRect().top;
    this.left = el.getBoundingClientRect().left;
  }

  interactionWrapper (callback, params) {
    if (!this.noInteractions) {
      callback.apply(this, params);
    }
  }

  dragStartHandler () {
    this.noInteractions = true;
    this.baseElD3.classed('unselectable', true);
  }

  dragEndHandler () {
    this.noInteractions = false;
    this.baseElD3.classed('unselectable', false);
  }

  static scrollElVertically (el, offset) {
    d3.select(el).attr(
      'transform',
      'translate(0, ' + offset + ')'
    );
  }

  scrollbarDragging () {
    return !!this.activeScrollbar;
  }

  globalMouseUp (event) {
    this.noInteractions = false;
    if (this.activeScrollbar) {
      this.baseElD3.classed('unselectable', false);
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
    }
  }

  globalMouseMove (event) {
    if (this.activeScrollbar) {
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
      this.links.scroll(
        data.linkSelections.outgoing,
        this.layout.offsetLinks(
          data.level,
          contentScrollTop,
          'source'
        )
      );

      this.links.scroll(
        data.linkSelections.incoming,
        this.layout.offsetLinks(
          data.level - 1,
          contentScrollTop,
          'target'
        )
      );
    }
  }

  get barMode () {
    if (this.bars) {
      return this.nodes.bars.mode;
    }
    return this._barMode;
  }

  set barMode (mode) {
    if (this.bars) {
      this.nodes.bars.mode = mode;
    }
    this._barMode = mode;
  }

  scrollbarMouseDown (el, event) {
    this.noInteractions = true;
    this.baseElD3.classed('unselectable', true);
    this.activeScrollbar = d3.select(el).classed('active', true);
    this.activeScrollbar.datum().scrollbar.clientY = event.clientY;
  }

  mousewheelColumn (el, event) {
    event.preventDefault();

    const data = d3.select(el).datum();

    if (data.scrollHeight > 0) {
      // Scroll nodes
      data.scrollTop = Math.max(
        Math.min(data.scrollTop + event.deltaY, 0),
        -data.scrollHeight
      );

      this.scrollY(data);
    }
  }

  scrollY (columnData) {
    ListGraph.scrollElVertically(columnData.nodes, columnData.scrollTop);

    // Scroll scrollbar
    columnData.scrollbar.scrollTop = columnData.scrollbar.heightScale(
      -columnData.scrollTop
    );

    ListGraph.scrollElVertically(
      columnData.scrollbar.el,
      columnData.scrollbar.scrollTop
    );

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
  }

  scrollYTo (selection, positionY) {
    return selection
      .transition()
      .duration(config.TRANSITION_SEMI_FAST)
      .tween('scrollY', data => {
        const scrollPositionY = d3.interpolateNumber(data.scrollTop, positionY);
        return time => {
          data.scrollTop = scrollPositionY(time);
          this.scrollY(data);
        };
      });
  }

  resetAllScrollPositions () {
    return this.scrollYTo(this.levels.groups, 0);
  }

  selectByLevel (level, selector) {
    return d3.select(this.levels.groups[0][level]).selectAll(selector);
  }

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

  sortColumn (level, property, sortOrder, newSortType) {
    this.nodes.sort(
      this.layout
        .sort(level, property, sortOrder)
        .updateNodesVisibility()
        .nodes(level),
      newSortType
    );
    this.links.sort(this.layout.links(level - 1, level + 1));
  }

  sortAllColumns (property, newSortType) {
    this.currentSorting.global.order =
      this.currentSorting.global.order === -1 ? 1 : -1;

    this.nodes.sort(
      this.layout
        .sort(undefined, property, this.currentSorting.global.order)
        .updateNodesVisibility()
        .nodes(),
      newSortType
    );

    this.links.sort(this.layout.links());
  }

  switchBarMode (mode) {
    this.svgD3.classed('one-bar', mode === 'one');
    this.svgD3.classed('two-bar', mode === 'two');
    this.nodes.bars.switchMode(mode, this.currentSorting);
  }

  trigger (event, data) {
    this.events.trigger(event, data);
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

  updateLevelsVisibility () {
    this.levels.updateVisibility();
  }

  globalView (selectionInterst) {
    if (!this.zoomedOut) {
      let x = 0;
      let y = 0;
      let width = 0;
      let height = 0;
      let bBox;
      let cRect;

      const globalCRect = this.svgD3.node().getBoundingClientRect();

      if (selectionInterst && !selectionInterst.empty()) {
        selectionInterst.each(function () {
          bBox = this.getBBox();
          cRect = this.getBoundingClientRect();
          width = Math.max(width, cRect.left - globalCRect.left + cRect.width);
          height = Math.max(height, cRect.top - globalCRect.top + cRect.height);
        });
        width = this.width > width ? this.width : width;
        height = this.height > height ? this.height : height;
      } else {
        bBox = this.container.node().getBBox();
        width = this.width > bBox.width ? this.width : bBox.width;
        height = this.height > bBox.height ? this.height : bBox.height;
      }

      x = bBox.x;
      y = bBox.y;

      this.svgD3
        .classed('zoomedOut', true)
        .transition()
        .duration(config.TRANSITION_SEMI_FAST)
        .attr('viewBox', x + ' ' + y + ' ' + width + ' ' + height);
    }
  }

  zoomedView () {
    if (!this.zoomedOut) {
      this.svgD3
        .classed('zoomedOut', false)
        .transition()
        .duration(config.TRANSITION_SEMI_FAST)
        .attr('viewBox', '0 0 ' + this.width + ' ' + this.height);
    }
  }

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
}

export default ListGraph;
