'use strict';

// External
import * as $ from '$';
import * as d3 from 'd3';
import isObject from '../../../node_modules/lodash-es/lang/isObject';

// Internal
import {LayoutNotAvailable} from './errors';
import {exponentialGradient} from './gradients';
import * as config from './config';
import Topbar from './topbar';
import Levels from './levels';
import Links from './links';
import Nodes from './nodes';
import Scrollbars from './scrollbars';
import Events from './events';
import {onDragDrop, dragMoveHandler} from '../commons/event-handlers';

class ListGraph {
  constructor (baseEl, data, rootNodes, options) {
    if (!d3.layout.listGraph) {
      throw new LayoutNotAvailable();
    }

    if (!isObject(options)) {
      options = {};
    }

    let that = this;

    this.baseEl = baseEl;
    this.baseElD3 = d3.select(baseEl);
    this.baseElJq = $(baseEl);
    this.svgD3 = this.baseElD3.select('svg.base');

    if (this.svgD3.empty()) {
      this.svgD3 = this.baseElD3.append('svg').attr('class', 'base');
      this.svgJq = $(this.svgD3[0]);
    } else {
      this.svgJq = $(this.svgD3[0]);
    }

    this.rootNodes = rootNodes;

    this.width = options.width || this.svgJq.width();
    this.height = options.height || this.svgJq.height();
    this.scrollbarWidth = options.scrollbarWidth || config.SCROLLBAR_WIDTH;
    this.columns = options.columns || config.COLUMNS;
    this.rows = options.rows || config.ROWS;
    this.iconPath = options.iconPath || config.ICON_PATH;

    this.sortBy = options.sortBy;
    this.sortOrder = options.sortOrder || config.DEFAULT_SORT_ORDER;

    this.events = new Events(this.baseEl, options.dispatcher);

    this.baseElJq.addClass(config.CLASSNAME);

    if (options.forceWidth) {
      this.baseElJq.width(this.width);
    }

    this.layout = new d3.layout.listGraph(
      [
        this.width,
        this.height
      ],
      [
        this.columns,
        this.rows
      ]
    );

    this.data = data;
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

    exponentialGradient(
      this.svgD3,
      {
        color: config.COLOR_NEGATIVE_RED,
        offset: 0,
        opacity: 0.2,
        x: 0,
        y: 0
      },
      {
        afterOffsetOpacity: 1,
        color: config.COLOR_NEGATIVE_RED,
        offset: 99,
        opacity: 1,
        x: 1,
        y: 0
      },
      'negativeRed',
      4,
      10
    );

    exponentialGradient(
      this.svgD3,
      {
        beforeOffsetOpacity: 1,
        color: config.COLOR_POSITIVE_GREEN,
        offset: 1,
        opacity: 1,
        x: 0,
        y: 0
      },
      {
        color: config.COLOR_POSITIVE_GREEN,
        offset: 100,
        opacity: 0.2,
        x: 1,
        y: 0
      },
      'positiveGreen',
      0.25,
      10
    );

    this.barMode = options.barMode || config.DEFAULT_BAR_MODE;
    this.svgD3.classed(this.barMode + '-bar', true);

    this.topbar = new Topbar(this, this.baseElD3, this.visData);

    this.svgD3.attr('viewBox', '0 0 ' + this.width + ' ' + this.height);

    this.container = this.svgD3.append('g').attr('class', 'main-container');

    this.levels = new Levels(this.container, this.visData);

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
    this.$levels = $(this.levels.groups[0]).on('mousewheel', function (event) {
      that.mousewheelColumn(this, event);
    });

    // Normally we would reference a named methods but since we need to aceess
    // the class' `this` property instead of the DOM element we need to use an
    // arrow function.
    this.scrollbars.selection.on('mousedown', function () {
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
      dragMoveHandler,
      undefined,
      [
        this.container,
        this.topbar.localControlWrapper
      ],
      'horizontal',
      {
        x: {
          min: Math.min(0, this.width - this.container.node().getBBox().width),
          max: 0
        }
      }
    );
  }

  static scrollY (el, offset) {
    d3.select(el).attr(
      'transform',
      'translate(0, ' + offset + ')'
    );
  }

  globalMouseUp (event) {
    if (this.activeScrollbar) {
      let data = this.activeScrollbar.datum();
      let deltaY = data.scrollbar.clientY - event.clientY;

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
      let data = this.activeScrollbar.datum();
      let deltaY = data.scrollbar.clientY - event.clientY;

      // Scroll scrollbar
      ListGraph.scrollY(
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
      let contentScrollTop = Math.max(
        Math.min(
          data.scrollTop +
          data.invertedHeightScale(deltaY),
          0
        ),
        -data.scrollHeight
      );

      ListGraph.scrollY(
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
    this.activeScrollbar = d3.select(el).classed('active', true);
    this.activeScrollbar.datum().scrollbar.clientY = event.clientY;
  }

  mousewheelColumn (el, event) {
    event.preventDefault();

    let data = d3.select(el).datum();

    if (data.scrollHeight > 0) {
      // Scroll nodes
      data.scrollTop = Math.max(
        Math.min(data.scrollTop + event.deltaY, 0),
        -data.scrollHeight
      );

      ListGraph.scrollY(data.nodes, data.scrollTop);

      // Scroll scrollbar
      data.scrollbar.scrollTop = data.scrollbar.heightScale(
        -data.scrollTop
      );

      ListGraph.scrollY(
        data.scrollbar.el,
        data.scrollbar.scrollTop
      );

      // Scroll Links
      this.links.scroll(
        data.linkSelections.outgoing,
        this.layout.offsetLinks(
          data.level,
          data.scrollTop,
          'source'
        )
      );

      this.links.scroll(
        data.linkSelections.incoming,
        this.layout.offsetLinks(
          data.level - 1,
          data.scrollTop,
          'target'
        )
      );
    }
  }

  selectByLevel (level, selector) {
    return d3.select(this.levels.groups[0][level]).selectAll(selector);
  }

  sortColumn (level, property, sortOrder, newSortType) {
    this.nodes.sort(
      this.layout.sort(level, property, sortOrder).nodes(level), newSortType
    );
    this.links.sort(this.layout.links(level - 1, level + 1));
  }

  switchBarMode (mode) {
    this.svgD3.classed('one-bar', mode === 'one');
    this.svgD3.classed('two-bar', mode === 'two');
    this.nodes.bars.switchMode(mode, this.currentSorting);
  }

  trigger (event, data) {
    this.events.trigger(event, data);
  }
}

export default ListGraph;
