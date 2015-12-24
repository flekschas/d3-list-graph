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

  var CLASSNAME = 'list-graph';

  var SCROLLBAR_WIDTH = 6;
  var COLUMNS = 5;
  var ROWS = 5;

  // An empty path is equal to inline SVG.
  var ICON_PATH = '';

  var TRANSITION_SEMI_FAST = 250;

  function arrayToFakeObjs(arrayIds) {
    var fakeObjs = [];

    for (var i = arrayIds.length; i--;) {
      fakeObjs.push({ id: arrayIds[i] });
    }

    return fakeObjs;
  }

  function up(node, callback) {
    function traverse(node, child, callback) {
      callback(node, child);
      for (var i = node.parent.length; i--;) {
        traverse(node.parent[i], node, callback);
      }
    }

    for (var i = node.parent.length; i--;) {
      traverse(node.parent[i], node, callback);
    }
  }

  function down(node, callback) {
    callback(node);
    for (var i = node.childRefs.length; i--;) {
      down(node.childRefs[i], callback);
    }
  }

  function upAndDown(node, callbackUp, callbackDown) {
    if (callbackDown) {
      up(node, callbackUp);
      down(node, callbackDown);
    } else {
      up(node, callbackUp);
      down(node, callbackUp);
    }
  }

  var BAR_CLASS = 'bar';

  var Bar = function Bar(selection, barData, nodeData, visData) {
    babelHelpers.classCallCheck(this, Bar);

    var that = this;

    this.data = barData;
    this.nodeData = nodeData;
    this.visData = visData;

    this.height = this.visData.global.row.contentHeight / (this.data.length * 2) - this.visData.global.cell.padding * 2;

    this.selection = selection.selectAll(BAR_CLASS).data(this.data).enter().append('g').attr('class', function (data) {
      return BAR_CLASS + ' ' + data.id;
    });

    // Local helper method to avoid code duplication.
    // Calling a class method from within the consructor is possible but `this`
    // is not available. Thus, we need to create local function and pass in
    // `this` as `that`, which feels very hacky but it works.
    function setup(selection, className, magnitude) {
      selection.attr('x', that.nodeData.x + that.visData.global.column.padding + that.visData.global.cell.padding).attr('y', function (data, i) {
        return that.visData.global.row.padding + that.visData.global.row.contentHeight / 2 + that.height * i + that.visData.global.cell.padding * (1 + 2 * i);
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
      key: 'highlight',
      value: function highlight(nodeIds, _highlight) {
        this.links.data(nodeIds, function (data) {
          return data.id;
        }).classed('highlight', _highlight === false ? false : true);
      }
    }, {
      key: 'scroll',
      value: function scroll(selection, data) {
        selection.data(data).attr('d', this.diagonal).exit().remove();
      }
    }, {
      key: 'sort',
      value: function sort(update) {
        var start = function start() {
          d3.select(this).classed('sorting', true);
        };
        var end = function end() {
          d3.select(this).classed('sorting', false);
        };

        this.links.data(update, function (data) {
          return data.id;
        }).transition().duration(TRANSITION_SEMI_FAST).attr('d', this.diagonal).each('start', start).each('end', end);
      }
    }, {
      key: 'diagonal',
      get: function get() {
        var _this2 = this;

        return d3.svg.diagonal().source(function (data) {
          return {
            x: data.source.node.y + data.source.offsetY + _this2.visData.global.row.height / 2,
            y: data.source.node.x + data.source.offsetX + _this2.visData.global.column.contentWidth + _this2.visData.global.column.padding
          };
        }).target(function (data) {
          return {
            x: data.target.node.y + data.target.offsetY + _this2.visData.global.row.height / 2,
            y: data.target.node.x + data.target.offsetX + _this2.visData.global.column.padding
          };
        }).projection(function (data) {
          return [data.y, data.x];
        });
      }
    }]);
    return Links;
  })();

  var NODES_CLASS = 'nodes';
  var NODE_CLASS = 'node';
  var CLONE_CLASS = 'clone';

  var Nodes = (function () {
    function Nodes(baseSelection, visData, links, events) {
      var _this = this;

      babelHelpers.classCallCheck(this, Nodes);

      var that = this;

      this.visData = visData;
      this.links = links;
      this.events = events;

      this.groups = baseSelection.append('g').attr('class', NODES_CLASS).call(function (selection) {
        selection.each(function (data, index) {
          d3.select(this.parentNode).datum().nodes = this;
        });
      });

      this.nodes = this.groups.selectAll('.' + NODE_CLASS).data(function (data) {
        return data.rows;
      }).enter().append('g').classed(NODE_CLASS, true).classed(CLONE_CLASS, function (data) {
        return data.clone;
      }).attr('transform', function (data) {
        return 'translate(0, ' + data.y + ')';
      });

      this.nodes.append('rect').attr('x', function (data) {
        return data.x + _this.visData.global.column.padding;
      }).attr('y', function (data) {
        return _this.visData.global.row.padding;
      }).attr('width', this.visData.global.column.contentWidth).attr('height', this.visData.global.row.contentHeight).attr('rx', 2).attr('ry', 2).classed('bg', true);

      this.nodes.on('click', function (data) {
        that.mouseClick(this, data);
      });

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
          return _this.visData.global.row.padding + _this.visData.global.cell.padding;
        }).attr('width', _this.visData.global.column.contentWidth).attr('height', _this.visData.global.row.contentHeight / 2 - _this.visData.global.cell.padding * 2).attr('class', 'label-wrapper').append('xhtml:div').attr('class', 'label').attr('title', function (data) {
          return data.data.name;
        }).append('xhtml:span').text(function (data) {
          return data.data.name;
        });
      });

      this.bars = new Bars(this.nodes, this.visData);
    }

    babelHelpers.createClass(Nodes, [{
      key: 'mouseClick',
      value: function mouseClick(el, data) {
        this.events.broadcast('d3ListGraphNodeClick', { id: data.id });
      }
    }, {
      key: 'mouseEnter',
      value: function mouseEnter(el, data) {
        var _this2 = this;

        // Store link IDs
        this.currentlyHighlightedLinks = [];

        var traverseCallbackUp = function traverseCallbackUp(data, childData) {
          data.hovering = 2;
          for (var i = data.links.length; i--;) {
            // Only push direct connection to the node we are coming from. E.g.
            // Store: (parent)->(child)
            // Ignore: (parent)->(siblings of child)
            if (data.links[i].target.node.id === childData.id) {
              _this2.currentlyHighlightedLinks.push(data.links[i].id);
            }
          }
        };

        var traverseCallbackDown = function traverseCallbackDown(data) {
          data.hovering = 2;
          for (var i = data.links.length; i--;) {
            _this2.currentlyHighlightedLinks.push(data.links[i].id);
          }
        };
        upAndDown(data, traverseCallbackUp, traverseCallbackDown);

        if (data.clone) {
          upAndDown(data.originalNode, traverseCallbackUp, traverseCallbackDown);
          data.originalNode.hovering = 1;
        }

        data.hovering = 1;
        this.nodes.classed('hovering-directly', function (data) {
          return data.hovering === 1;
        });
        this.nodes.classed('hovering-indirectly', function (data) {
          return data.hovering === 2;
        });

        this.links.highlight(arrayToFakeObjs(this.currentlyHighlightedLinks));

        this.events.broadcast('d3ListGraphNodeEnter', { id: data.id });
      }
    }, {
      key: 'mouseLeave',
      value: function mouseLeave(el, data) {
        var traverseCallback = function traverseCallback(data) {
          return data.hovering = 0;
        };

        data.hovering = 0;
        upAndDown(data, traverseCallback);

        if (data.clone) {
          data.originalNode.hovering = 0;
          upAndDown(data.originalNode, traverseCallback);
        }

        this.nodes.classed('hovering-directly', false);
        this.nodes.classed('hovering-indirectly', false);

        this.links.highlight(arrayToFakeObjs(this.currentlyHighlightedLinks), false);

        this.events.broadcast('d3ListGraphNodeLeave', { id: data.id });
      }
    }, {
      key: 'sort',
      value: function sort(update) {
        for (var i = update.length; i--;) {
          var start = function start() {
            d3.select(this).classed('sorting', true);
          };
          var end = function end() {
            d3.select(this).classed('sorting', false);
          };

          this.nodes.data(update[i].rows, function (data) {
            return data.id;
          }).transition().duration(TRANSITION_SEMI_FAST).attr('transform', function (data) {
            return 'translate(0, ' + data.y + ')';
          }).each('start', start).each('end', end);
        }
      }
    }]);
    return Nodes;
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

  var TOPBAR_EL = 'div';
  var TOPBAR_CLASS = 'top-bar';

  var TOPBAR_CONTROL_EL = 'ul';
  var TOPBAR_CONTROL_CLASS = 'controls';

  var Topbar = (function () {
    function Topbar(vis, selection, visData) {
      var _this = this;

      babelHelpers.classCallCheck(this, Topbar);

      var that = this;

      this.vis = vis;
      this.visData = visData;
      // Add base topbar element
      this.el = selection.select('.' + TOPBAR_CLASS);

      if (this.el.empty()) {
        this.el = selection.insert(TOPBAR_EL, ':first-child').attr('class', TOPBAR_CLASS);
      }

      this.controls = this.el.selectAll(TOPBAR_CONTROL_CLASS).data(visData.nodes).enter().append(TOPBAR_CONTROL_EL).classed(TOPBAR_CONTROL_CLASS, true).style('width', this.visData.global.column.width + 'px');

      this.controls.append('li').attr('class', 'toggle').style('width', this.visData.global.column.padding + 'px').on('click', this.toggleColumn);

      this.controls.append('li').attr('class', 'sort-precision ease-all').style({
        'width': this.visData.global.column.contentWidth / 2 + 'px',
        'left': this.visData.global.column.padding + 'px'
      }).on('click', function (data, index) {
        that.sortColumn(this, index, 'precision');
      }).on('mouseenter', function () {
        that.highlightBars(this.parentNode, 'precision');
        d3.select(this).style('width', that.visData.global.column.contentWidth - 16 + 'px');
      }).on('mouseleave', function () {
        that.highlightBars(this.parentNode, 'precision', true);
        d3.select(this).style('width', that.visData.global.column.contentWidth / 2 + 'px');
      }).html('<div class="expandable-label">' + '  <span class="letter abbr">P</span>' + '  <span class="letter abbr">r</span>' + '  <span class="letter">e</span>' + '  <span class="letter abbr">c</span>' + '  <span class="letter">i</span>' + '  <span class="letter">s</span>' + '  <span class="letter">i</span>' + '  <span class="letter">o</span>' + '  <span class="letter">n</span>' + '</div>' + '<svg class="icon-unsort invisible-default visible">' + '  <use xlink:href="' + this.vis.iconPath + '#unsort"></use>' + '</svg>' + '<svg class="icon-sort-asc invisible-default">' + '  <use xlink:href="' + this.vis.iconPath + '#sort-asc"></use>' + '</svg>' + '<svg class="icon-sort-desc invisible-default">' + '  <use xlink:href="' + this.vis.iconPath + '#sort-desc"></use>' + '</svg>');

      this.controls.append('li').attr('class', 'sort-recall ease-all').style({
        'width': this.visData.global.column.contentWidth / 2 + 'px',
        'left': this.visData.global.column.contentWidth / 2 + this.visData.global.column.padding + 'px'
      }).on('click', function (data, index) {
        that.sortColumn(this, index, 'recall');
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
      }).html('<div class="expandable-label">' + '  <span class="letter abbr">R</span>' + '  <span class="letter">e</span>' + '  <span class="letter abbr">c</span>' + '  <span class="letter">a</span>' + '  <span class="letter abbr">l</span>' + '  <span class="letter">l</span>' + '</div>' + '<svg class="icon-unsort invisible-default visible">' + '  <use xlink:href="' + this.vis.iconPath + '#unsort"></use>' + '</svg>' + '<svg class="icon-sort-asc invisible-default">' + '  <use xlink:href="' + this.vis.iconPath + '#sort-asc"></use>' + '</svg>' + '<svg class="icon-sort-desc invisible-default">' + '  <use xlink:href="' + this.vis.iconPath + '#sort-desc"></use>' + '</svg>');

      this.controls.append('li').attr('class', 'options').style('width', this.visData.global.column.padding + 'px').on('click', this.toggleOptions).html('<svg class="icon-gear">' + '  <use xlink:href="' + this.vis.iconPath + '#gear"></use>' + '</svg>');

      /**
       * Stores current sorting, e.g. type, order and a reference to the element.
       *
       * @type  {Object}
       */
      this.sorting = {};
      this.controls.each(function (data, index) {
        /*
         * Order:
         * 0 = unsorted
         * 1 = asc
         * -1 = desc
         */
        _this.sorting[index] = {
          type: undefined,
          order: 0,
          el: undefined
        };
      });
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
      value: function sortColumn(el, index, type) {
        if (this.sorting[index].el) {
          if (this.sorting[index].type !== type) {
            this.sorting[index].el.select('.icon-sort-desc').classed('visible', false);
            this.sorting[index].el.select('.icon-sort-asc').classed('visible', false);
            this.sorting[index].el.select('.icon-unsort').classed('visible', true);
          }
        }

        this.sorting[index].el = d3.select(el);
        this.sorting[index].type = type;

        // -1 = desc, 1 = asc
        if (this.sorting[index].order === -1) {
          this.sorting[index].order = 1;
          this.sorting[index].el.select('.icon-sort-desc').classed('visible', false);
          this.sorting[index].el.select('.icon-sort-asc').classed('visible', true);
        } else {
          this.sorting[index].order = -1;
          this.sorting[index].el.select('.icon-sort-asc').classed('visible', false);
          this.sorting[index].el.select('.icon-sort-desc').classed('visible', true);
        }

        this.sorting[index].el.select('.icon-unsort').classed('visible', false);

        this.vis.sortColumn(index, type, this.sorting[index].order);
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

  var EventDispatcherNoFunction = (function (_ExtendableError2) {
    babelHelpers.inherits(EventDispatcherNoFunction, _ExtendableError2);

    function EventDispatcherNoFunction(message) {
      babelHelpers.classCallCheck(this, EventDispatcherNoFunction);
      return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(EventDispatcherNoFunction).call(this, message || 'Dispatcher needs to be a function.'));
    }

    return EventDispatcherNoFunction;
  })(ExtendableError);

  var Events = (function () {
    function Events(el, broadcast) {
      babelHelpers.classCallCheck(this, Events);

      if (broadcast && typeof broadcast !== 'function') {
        throw new EventDispatcherNoFunction();
      }

      this.el = el;
      this.dispatch = broadcast ? broadcast : this._dispatchEvent;
    }

    babelHelpers.createClass(Events, [{
      key: '_dispatchEvent',
      value: function _dispatchEvent(eventName, data) {
        var event = document.createEvent('CustomEvent');
        event.initCustomEvent(eventName, false, false, data);
        this.el.dispatchEvent(event);
      }
    }, {
      key: 'broadcast',
      value: function broadcast(event, data) {
        this.dispatch(event, data);
      }
    }]);
    return Events;
  })();

  var ListGraph = (function () {
    function ListGraph(baseEl, data, rootNodes, options) {
      var _this = this;

      babelHelpers.classCallCheck(this, ListGraph);

      if (!d3.layout.listGraph) {
        throw new LayoutNotAvailable();
      }

      if (!isObject(options)) {
        options = {};
      }

      var that = this;

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
      this.scrollbarWidth = options.scrollbarWidth || SCROLLBAR_WIDTH;
      this.columns = options.columns || COLUMNS;
      this.rows = options.rows || ROWS;
      this.iconPath = options.iconPath || ICON_PATH;

      this.events = new Events(this.baseEl, options.dispatcher);

      this.baseElJq.width(this.width).addClass(CLASSNAME);

      this.layout = new d3.layout.listGraph([this.width, this.height], [this.columns, this.rows]);

      this.data = data;
      this.visData = this.layout.process(this.data, this.rootNodes);

      this.topbar = new Topbar(this, this.baseElD3, this.visData);

      this.svgD3.attr('viewBox', '0 0 ' + this.width + ' ' + this.height);

      this.container = this.svgD3.append('g');

      this.columns = new Columns(this.container, this.visData);

      this.links = new Links(this.columns.groups, this.visData, this.layout);
      this.nodes = new Nodes(this.columns.groups, this.visData, this.links, this.events);
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

      // We need to listen to `mouseup` and `mousemove` globally otherwise
      // scrolling will only work as long as the cursor hovers the actual
      // scrollbar, which is super annoying.
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
    }, {
      key: 'sortColumn',
      value: function sortColumn(level, property, sortOrder) {
        this.nodes.sort(this.layout.sort(level, property, sortOrder).nodes(level));
        this.links.sort(this.layout.links(level - 1, level + 1));
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