/* Copyright Fritz Lekschas: D3 example visualization app using list-based graphs */
var ListGraph = (function ($,d3) { 'use strict';

  var babelHelpers = {};

  babelHelpers.classCallCheck = function (instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  };

  babelHelpers.createClass = (function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  })();

  babelHelpers.inherits = function (subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  };

  babelHelpers.possibleConstructorReturn = function (self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  };

  babelHelpers;
  /**
   * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
   * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
   *
   * @static
   * @memberOf _
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an object, else `false`.
   * @example
   *
   * _.isObject({});
   * // => true
   *
   * _.isObject([1, 2, 3]);
   * // => true
   *
   * _.isObject(1);
   * // => false
   */
  function isObject(value) {
    // Avoid a V8 JIT bug in Chrome 19-20.
    // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
    var type = typeof value;
    return !!value && (type == 'object' || type == 'function');
  }

  var SCROLLBAR_CLASS = 'scrollbar';

  var Scrollbars = function Scrollbars(baseSelection, visData, width) {
    var _this = this;

    babelHelpers.classCallCheck(this, Scrollbars);

    this.visData = visData;
    this.width = width;

    // Add empty scrollbar element
    this.selection = baseSelection.append('rect').attr('class', SCROLLBAR_CLASS).call(function (selection) {
      selection.each(function (data, index) {
        d3.select(this.parentNode).datum().scrollbar.el = this;
      });
    }).attr('x', function (data) {
      return data.scrollbar.x;
    }).attr('y', function (data) {
      return data.scrollbar.y;
    }).attr('width', function (data) {
      return _this.width;
    }).attr('height', function (data) {
      return data.scrollbar.height;
    }).attr('rx', this.width / 2).attr('ry', this.width / 2).classed('ready', true);
  };

  function up(node, callback) {
    while (node.parent) {
      node = node.parent;
      callback(node);
    }
  }

  function down(node, callback) {
    for (var i = node.childRefs.length; i--;) {
      callback(node.childRefs[i]);
      down(node.childRefs[i], callback);
    }
  }

  function upAndDown(node, callback) {
    up(node, callback);
    down(node, callback);
  }

  var BAR_CLASS = 'bar';

  var Bar = function Bar(selection, barData, nodeData, visData) {
    babelHelpers.classCallCheck(this, Bar);

    var that = this;

    this.data = barData;
    this.nodeData = nodeData;
    this.visData = visData;

    this.height = this.visData.global.row.contentHeight / (this.nodeData.data.bars.length * 2) - this.visData.global.cell.padding * 2;

    this.selection = selection.selectAll(BAR_CLASS).data(this.data).enter().append('g').attr('class', function (data) {
      return BAR_CLASS + ' ' + data.id;
    });

    // Local helper method to avoid code duplication.
    // Calling a class method from within the consructor is possible but `this`
    // is not available. Thus, we need to create local function and pass in
    // `this` as `that`, which feels very hacky but it works.
    function setup(selection, className, magnitude) {
      selection.attr('x', that.nodeData.x + that.visData.global.column.padding + that.visData.global.cell.padding).attr('y', function (data, i) {
        return that.nodeData.y + that.visData.global.row.padding + that.visData.global.row.contentHeight / 2 + that.height * i + that.visData.global.cell.padding * (1 + 2 * i);
      }).attr('width', function (data) {
        return (magnitude ? data.value : 1) * (that.visData.global.column.contentWidth - that.visData.global.cell.padding * 2);
      }).attr('height', that.height).classed(className, true);
    }

    this.selection.append('rect').call(setup, 'bar-border');

    this.selection.append('rect').call(setup, 'bar-magnitude', true);
  };

  var BARS_CLASS = 'bars';

  var Bars = function Bars(selection, visData) {
    babelHelpers.classCallCheck(this, Bars);

    var that = this;

    this.visData = visData;

    selection.append('g').attr('class', BARS_CLASS).call(function (selection) {
      selection.each(function (datum) {
        new Bar(d3.select(this), datum.data.bars, datum, that.visData);
      });
    });
  };

  var NODES_CLASS = 'nodes';
  var NODE_CLASS = 'node';
  var CLONE_CLASS = 'clone';

  var Nodes = (function () {
    function Nodes(baseSelection, visData) {
      var _this = this;

      babelHelpers.classCallCheck(this, Nodes);

      var that = this;

      this.visData = visData;

      this.groups = baseSelection.append('g').attr('class', NODES_CLASS).call(function (selection) {
        selection.each(function (data, index) {
          d3.select(this.parentNode).datum().nodes = this;
        });
      });

      this.nodes = this.groups.selectAll('.' + NODE_CLASS).data(function (data) {
        return data.rows;
      }).enter().append('g').classed(NODE_CLASS, true).classed(CLONE_CLASS, function (data) {
        return data.clone;
      });

      this.nodes.append('rect').attr('x', function (data) {
        return data.x + _this.visData.global.column.padding;
      }).attr('y', function (data) {
        return data.y + _this.visData.global.row.padding;
      }).attr('width', this.visData.global.column.contentWidth).attr('height', this.visData.global.row.contentHeight).attr('rx', 2).attr('ry', 2).classed('bg', true);

      this.nodes.on('mouseenter', function (data) {
        that.mouseEnter(this, data);
      });

      this.nodes.on('mouseleave', function (data) {
        that.mouseLeave(this, data);
      });

      // Add node label
      this.nodes.call(function (selection) {
        selection.append('foreignObject').attr('x', function (data) {
          return data.x + _this.visData.global.column.padding + _this.visData.global.cell.padding;
        }).attr('y', function (data) {
          return data.y + _this.visData.global.row.padding + _this.visData.global.cell.padding;
        }).attr('width', _this.visData.global.column.contentWidth).attr('height', _this.visData.global.row.contentHeight / 2 - _this.visData.global.cell.padding * 2).attr('class', 'label-wrapper').append('xhtml:div').attr('class', 'label').attr('title', function (data) {
          return data.data.name;
        }).append('xhtml:span').text(function (data) {
          return data.data.name;
        });
      });

      this.bars = new Bars(this.nodes, this.visData);
    }

    babelHelpers.createClass(Nodes, [{
      key: 'mouseEnter',
      value: function mouseEnter(el, data) {
        data.hovering = 1;
        upAndDown(data, function (data) {
          return data.hovering = 2;
        });

        d3.select(el).classed('hovering-directly', true);
        this.nodes.classed('hovering-indirectly', function (data) {
          return data.hovering === 2;
        });
      }
    }, {
      key: 'mouseLeave',
      value: function mouseLeave(el, data) {
        data.hovering = 0;
        upAndDown(data, function (data) {
          return data.hovering = 0;
        });

        d3.select(el).classed('hovering-directly', false);
        this.nodes.classed('hovering-indirectly', false);
      }
    }]);
    return Nodes;
  })();

  var LINKS_CLASS = 'links';
  var LINK_CLASS = 'link';

  var Links = (function () {
    function Links(selection, visData, layout) {
      var _this = this;

      babelHelpers.classCallCheck(this, Links);

      this.visData = visData;
      this.layout = layout;

      this.groups = selection.append('g').attr('class', LINKS_CLASS).call(function (selection) {
        selection.each(function (data, index) {
          d3.select(this.parentNode).datum().links = this;
        });
      });

      this.links = this.groups.selectAll(LINK_CLASS).data(function (data, index) {
        return _this.layout.links(index);
      }).enter().append('path').attr('class', 'link').attr('d', this.diagonal);
    }

    babelHelpers.createClass(Links, [{
      key: 'scroll',
      value: function scroll(selection, data) {
        selection.data(data).attr('d', this.diagonal).exit().remove();
      }
    }, {
      key: 'diagonal',
      get: function get() {
        var _this2 = this;

        return d3.svg.diagonal().source(function (data) {
          return {
            x: data.source.y + data.source.offsetY + _this2.visData.global.row.height / 2,
            y: data.source.x + data.source.offsetX + _this2.visData.global.column.contentWidth + _this2.visData.global.column.padding
          };
        }).target(function (data) {
          return {
            x: data.target.y + data.target.offsetY + _this2.visData.global.row.height / 2,
            y: data.target.x + data.target.offsetX + _this2.visData.global.column.padding
          };
        }).projection(function (data) {
          return [data.y, data.x];
        });
      }
    }]);
    return Links;
  })();

  var COLUMN_CLASS = 'column';
  var SCROLL_CONTAINER_CLASS = 'scroll-container';

  var Columns = (function () {
    function Columns(selection, visData) {
      var _this = this;

      babelHelpers.classCallCheck(this, Columns);

      this.visData = visData;
      this.groups = selection.selectAll('g').data(this.visData.nodes).enter().append('g').attr('class', COLUMN_CLASS);

      // We need to add an empty rectangle that fills up the whole column to ensure
      // that the `g`'s size is at a maximum, otherwise scrolling will be halted
      // when the cursor leaves an actually drawn element.
      this.groups.append('rect').attr('class', SCROLL_CONTAINER_CLASS).attr('x', function (data) {
        return data.x;
      }).attr('y', function (data) {
        return data.y;
      }).attr('width', function (data) {
        return _this.visData.global.column.width;
      }).attr('height', function (data) {
        return _this.visData.global.column.height;
      });
    }

    babelHelpers.createClass(Columns, [{
      key: 'scrollPreparation',
      value: function scrollPreparation(vis, scrollbarWidth) {
        var _this2 = this;

        this.groups.each(function (data, index) {
          var contentHeight = data.nodes.getBoundingClientRect().height + 2 * _this2.visData.global.row.padding;
          var scrollHeight = contentHeight - _this2.visData.global.column.height;
          var scrollbarHeight = scrollHeight > 0 ? Math.max(_this2.visData.global.column.height * _this2.visData.global.column.height / contentHeight, 10) : 0;

          data.height = contentHeight;
          data.linkSelections = {
            incoming: index > 0 ? vis.selectByColumn(index - 1, '.link') : null,
            outgoing: vis.selectByColumn(index, '.link')
          };
          data.scrollHeight = scrollHeight;
          data.scrollTop = 0;
          data.scrollbar = {
            el: undefined,
            x: data.x + _this2.visData.global.column.width - scrollbarWidth,
            y: 0,
            width: scrollbarWidth,
            height: scrollbarHeight,
            scrollHeight: _this2.visData.global.column.height - scrollbarHeight,
            scrollTop: 0,
            heightScale: d3.scale.linear().domain([0, scrollHeight]).range([0, _this2.visData.global.column.height - scrollbarHeight])
          };
          data.invertedHeightScale = data.scrollbar.heightScale.invert;
        });
      }
    }, {
      key: 'height',
      get: function get() {
        return this.visData.global.column.height;
      }
    }]);
    return Columns;
  })();

  var CLASSNAME = 'list-graph';

  var WIDTH = 800;
  var HEIGHT = 200;
  var SCROLLBAR_WIDTH = 6;
  var COLUMNS = 5;
  var ROWS = 5;

  var TRANSITION_SEMI_FAST = 250;

  var TOPBAR_EL = 'div';
  var TOPBAR_CLASS = 'topbar';

  var TOPBAR_CONTROL_EL = 'ul';
  var TOPBAR_CONTROL_CLASS = 'controls';

  var Topbar = (function () {
    function Topbar(vis, selection, visData) {
      babelHelpers.classCallCheck(this, Topbar);

      var that = this;

      this.vis = vis;
      this.visData = visData;
      // Add base topbar element
      this.el = selection.append(TOPBAR_EL).attr('class', TOPBAR_CLASS);

      this.controls = this.el.selectAll(TOPBAR_CONTROL_CLASS).data(visData.nodes).enter().append(TOPBAR_CONTROL_EL).classed(TOPBAR_CONTROL_CLASS, true).style('width', this.visData.global.column.width + 'px');

      this.controls.append('li').attr('class', 'toggle').style('width', this.visData.global.column.padding + 'px').on('click', this.toggleColumn);

      this.controls.append('li').attr('class', 'sort-precision ease-all').style({
        'width': this.visData.global.column.contentWidth / 2 + 'px',
        'left': this.visData.global.column.padding + 'px'
      }).on('click', function () {
        that.sortColumn(this, 'precision');
      }).on('mouseenter', function () {
        that.highlightBars(this.parentNode, 'precision');
        d3.select(this).style('width', that.visData.global.column.contentWidth - 16 + 'px');
      }).on('mouseleave', function () {
        that.highlightBars(this.parentNode, 'precision', true);
        d3.select(this).style('width', that.visData.global.column.contentWidth / 2 + 'px');
      }).html('<div class="expandable-label">' + '  <span class="letter abbr">P</span>' + '  <span class="letter abbr">r</span>' + '  <span class="letter">e</span>' + '  <span class="letter abbr">c</span>' + '  <span class="letter">i</span>' + '  <span class="letter">s</span>' + '  <span class="letter">i</span>' + '  <span class="letter">o</span>' + '  <span class="letter">n</span>' + '</div>' + '<svg class="icon-unsort invisible-default visible">' + '  <use xlink:href="/dist/icons.svg#unsort"></use>' + '</svg>' + '<svg class="icon-sort-asc invisible-default">' + '  <use xlink:href="/dist/icons.svg#sort-asc"></use>' + '</svg>' + '<svg class="icon-sort-desc invisible-default">' + '  <use xlink:href="/dist/icons.svg#sort-desc"></use>' + '</svg>');

      this.controls.append('li').attr('class', 'sort-recall ease-all').style({
        'width': this.visData.global.column.contentWidth / 2 + 'px',
        'left': this.visData.global.column.contentWidth / 2 + this.visData.global.column.padding + 'px'
      }).on('click', function () {
        that.sortColumn(this, 'recall');
      }).on('mouseenter', function () {
        that.highlightBars(this.parentNode, 'recall');
        d3.select(this).style({
          'width': that.visData.global.column.contentWidth - 16 + 'px',
          'left': that.visData.global.column.padding + 16 + 'px'
        });
      }).on('mouseleave', function () {
        that.highlightBars(this.parentNode, 'recall', true);
        d3.select(this).style({
          'width': that.visData.global.column.contentWidth / 2 + 'px',
          'left': that.visData.global.column.contentWidth / 2 + that.visData.global.column.padding + 'px'
        });
      }).html('<div class="expandable-label">' + '  <span class="letter abbr">R</span>' + '  <span class="letter">e</span>' + '  <span class="letter abbr">c</span>' + '  <span class="letter">a</span>' + '  <span class="letter abbr">l</span>' + '  <span class="letter">l</span>' + '</div>' + '<svg class="icon-unsort invisible-default visible">' + '  <use xlink:href="/dist/icons.svg#unsort"></use>' + '</svg>' + '<svg class="icon-sort-asc invisible-default">' + '  <use xlink:href="/dist/icons.svg#sort-asc"></use>' + '</svg>' + '<svg class="icon-sort-desc invisible-default">' + '  <use xlink:href="/dist/icons.svg#sort-desc"></use>' + '</svg>');

      this.controls.append('li').attr('class', 'options').style('width', this.visData.global.column.padding + 'px').on('click', this.toggleOptions).html('<svg class="icon-gear">' + '  <use xlink:href="/dist/icons.svg#gear"></use>' + '</svg>');
    }

    babelHelpers.createClass(Topbar, [{
      key: 'toggleColumn',
      value: function toggleColumn() {
        console.log('Toggle column');
      }
    }, {
      key: 'selectNodesColumn',
      value: function selectNodesColumn(el) {
        return this.vis.selectByColumn(d3.select(el).datum().level, '.node');
      }
    }, {
      key: 'highlightBars',
      value: function highlightBars(el, type, deHighlight) {
        var nodes = this.selectNodesColumn(el);
        nodes.selectAll('.bar.' + type).classed('highlight', !deHighlight);
      }
    }, {
      key: 'sortColumn',
      value: function sortColumn(el, type) {
        var _this = this;

        var d3El = d3.select(el);
        var sorting = d3El.datum().sortStatus;

        /*
         * 0 = unsorted
         * 1 = asc
         * -1 = desc
         */
        switch (sorting) {
          case 1:
            sorting = 0;
            d3El.select('.icon-sort-asc').classed('visible', false);
            d3El.select('.icon-unsort').classed('visible', true);
            break;
          case -1:
            sorting = 1;
            d3El.select('.icon-sort-desc').classed('visible', false);
            d3El.select('.icon-sort-asc').classed('visible', true);
            break;
          default:
            sorting = -1;
            d3El.select('.icon-unsort').classed('visible', false);
            d3El.select('.icon-sort-desc').classed('visible', true);
            break;
        }

        d3El.datum().sortStatus = sorting;

        var nodes = this.selectNodesColumn(el.parentNode);
        var dataset = nodes.data();

        dataset.sort(function (a, b) {
          var valueA = a.data.barRefs[type];
          var valueB = b.data.barRefs[type];
          return valueA > valueB ? sorting : valueA < valueB ? -sorting : 0;
        });

        var start = function start() {
          d3.select(this).classed('sorting', true);
        };
        var end = function end() {
          d3.select(this).classed('sorting', false);
        };

        if (sorting) {
          nodes.data(dataset, function (data) {
            return data.data.name;
          }).transition().duration(TRANSITION_SEMI_FAST).attr('transform', function (data, i) {
            return 'translate(0, ' + (i * _this.visData.global.row.height - data.y) + ')';
          }).each('start', start).each('end', end);
        } else {
          nodes.transition().duration(TRANSITION_SEMI_FAST).attr('transform', 'translate(0, 0)').each('start', start).each('end', end);
        }
      }
    }, {
      key: 'toggleOptions',
      value: function toggleOptions() {
        console.log('Toggle options');
      }
    }]);
    return Topbar;
  })();

  var ExtendableError = (function (_Error) {
    babelHelpers.inherits(ExtendableError, _Error);

    function ExtendableError(message) {
      babelHelpers.classCallCheck(this, ExtendableError);

      var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(ExtendableError).call(this, message));

      _this.name = _this.constructor.name;
      _this.message = message;
      Error.captureStackTrace(_this, _this.constructor.name);
      return _this;
    }

    return ExtendableError;
  })(Error);

  var LayoutNotAvailable = (function (_ExtendableError) {
    babelHelpers.inherits(LayoutNotAvailable, _ExtendableError);

    function LayoutNotAvailable(message) {
      babelHelpers.classCallCheck(this, LayoutNotAvailable);
      return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(LayoutNotAvailable).call(this, message || 'D3.layout.listGraph.js has not been loaded yet.'));
    }

    return LayoutNotAvailable;
  })(ExtendableError);

  var ListGraph = (function () {
    function ListGraph(baseEl, data, rootNodes, options) {
      var _this = this;

      babelHelpers.classCallCheck(this, ListGraph);

      if (!d3.layout.listGraph) {
        throw new LayoutNotAvailable('D3 list graph layout (d3.layout.listGraph.js) needs to be loaded ' + 'before creating the visualization.');
      }

      if (!isObject(options)) {
        options = {};
      }

      var that = this;

      this.baseEl = baseEl;
      this.baseElD3 = d3.select(baseEl);
      this.baseElJq = $(baseEl);

      this.rootNodes = rootNodes;

      this.width = options.width || WIDTH;
      this.height = options.height || HEIGHT;
      this.scrollbarWidth = options.scrollbarWidth || SCROLLBAR_WIDTH;
      this.columns = options.columns || COLUMNS;
      this.rows = options.rows || ROWS;

      this.baseElJq.width(this.width).addClass(CLASSNAME);

      this.layout = new d3.layout.listGraph([this.width, this.height], [this.columns, this.rows]);

      this.data = data;
      this.visData = this.layout.process(this.data, this.rootNodes);

      this.topbar = new Topbar(this, this.baseElD3, this.visData);

      this.svg = d3.select('.list-graph').append('svg').attr('width', this.width).attr('height', this.height);

      this.container = this.svg.append('g');

      this.columns = new Columns(this.container, this.visData);

      this.links = new Links(this.columns.groups, this.visData, this.layout);
      this.nodes = new Nodes(this.columns.groups, this.visData);
      this.columns.scrollPreparation(this, this.scrollbarWidth);
      this.scrollbars = new Scrollbars(this.columns.groups, this.visData, this.scrollbarWidth);

      // jQuery's mousewheel plugin is much nicer than D3's half-baked zoom event.
      this.$levels = $(this.columns.groups[0]).on('mousewheel', function (event) {
        that.mousewheelColumn(this, event);
      });

      // Normally we would reference a named methods but since we need to aceess
      // the class' `this` property instead of the DOM element we need to use an
      // arrow function.
      this.scrollbars.selection.on('mousedown', function () {
        that.scrollbarMouseDown(this, d3.event);
      });

      // We need to listen to `mouseup` and `mousemove` globally otherwise scrolling
      // will only work as long as the cursor hovers the actual scrollbar, which is
      // super annoying.
      d3.select(document).on('mouseup', function () {
        _this.globalMouseUp(d3.event);
      }).on('mousemove', function () {
        _this.globalMouseMove(d3.event);
      });
    }

    babelHelpers.createClass(ListGraph, [{
      key: 'globalMouseUp',
      value: function globalMouseUp(event) {
        if (this.activeScrollbar) {
          var data = this.activeScrollbar.datum();
          var deltaY = data.scrollbar.clientY - event.clientY;

          // Save final vertical position
          // Scrollbar
          data.scrollbar.scrollTop = Math.min(Math.max(data.scrollbar.scrollTop - deltaY, 0), data.scrollbar.scrollHeight);

          // Content
          data.scrollTop = Math.max(Math.min(data.scrollTop + data.invertedHeightScale(deltaY), 0), -data.scrollHeight);

          this.activeScrollbar.classed('active', false);

          this.activeScrollbar = undefined;
        }
      }
    }, {
      key: 'globalMouseMove',
      value: function globalMouseMove(event) {
        if (this.activeScrollbar) {
          var data = this.activeScrollbar.datum();
          var deltaY = data.scrollbar.clientY - event.clientY;

          // Scroll scrollbar
          ListGraph.scrollY(this.activeScrollbar.node(), Math.min(Math.max(data.scrollbar.scrollTop - deltaY, 0), data.scrollbar.scrollHeight));

          // Scroll content
          var contentScrollTop = Math.max(Math.min(data.scrollTop + data.invertedHeightScale(deltaY), 0), -data.scrollHeight);

          ListGraph.scrollY(data.nodes, contentScrollTop);

          // Scroll Links
          this.links.scroll(data.linkSelections.outgoing, this.layout.offsetLinks(data.level, contentScrollTop, 'source'));

          this.links.scroll(data.linkSelections.incoming, this.layout.offsetLinks(data.level - 1, contentScrollTop, 'target'));
        }
      }
    }, {
      key: 'scrollbarMouseDown',
      value: function scrollbarMouseDown(el, event) {
        this.activeScrollbar = d3.select(el).classed('active', true);
        this.activeScrollbar.datum().scrollbar.clientY = event.clientY;
      }
    }, {
      key: 'mousewheelColumn',
      value: function mousewheelColumn(el, event) {
        event.preventDefault();

        var data = d3.select(el).datum();

        if (data.scrollHeight > 0) {
          // Scroll nodes
          data.scrollTop = Math.max(Math.min(data.scrollTop + event.deltaY, 0), -data.scrollHeight);

          ListGraph.scrollY(data.nodes, data.scrollTop);

          // Scroll scrollbar
          data.scrollbar.scrollTop = data.scrollbar.heightScale(-data.scrollTop);

          ListGraph.scrollY(data.scrollbar.el, data.scrollbar.scrollTop);

          // Scroll Links
          this.links.scroll(data.linkSelections.outgoing, this.layout.offsetLinks(data.level, data.scrollTop, 'source'));

          this.links.scroll(data.linkSelections.incoming, this.layout.offsetLinks(data.level - 1, data.scrollTop, 'target'));
        }
      }
    }, {
      key: 'selectByColumn',
      value: function selectByColumn(index, selector) {
        return d3.select(this.columns.groups[0][index]).selectAll(selector);
      }
    }], [{
      key: 'scrollY',
      value: function scrollY(el, offset) {
        d3.select(el).attr('transform', 'translate(0, ' + offset + ')');
      }
    }]);
    return ListGraph;
  })();

  return ListGraph;

})($,d3);