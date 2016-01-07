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

  var DEFAULT_SORT_ORDER = 'desc';

  var DEFAULT_BAR_MODE = 'one';

  var TRANSITION_SEMI_FAST = 250;
  // Gradient colors
  var COLOR_NEGATIVE_RED = '#e0001c';
  var COLOR_POSITIVE_GREEN = '#60bf00';

  function arrayToFakeObjs(arrayIds) {
    var fakeObjs = [];

    for (var i = arrayIds.length; i--;) {
      fakeObjs.push({ id: arrayIds[i] });
    }

    return fakeObjs;
  }

  /**
   * Collect all cloned nodes, including the original node.
   *
   * @method  collectInclClones
   * @author  Fritz Lekschas
   * @date    2015-12-30
   * @param   {Object}  node  Start node
   * @return  {Array}         Array of original and cloned nodes.
   */
  function collectInclClones(node) {
    var originalNode = node;

    if (node.clone) {
      originalNode = node.originalNode;
    }

    var clones = [originalNode];

    if (originalNode.clones.length) {
      clones = clones.concat(originalNode.clones);
    }

    return clones;
  }

  function up(node, callback, child) {
    var nodesInclClones = collectInclClones(node);

    for (var i = nodesInclClones.length; i--;) {
      if (child) {
        callback(nodesInclClones[i], child);
      }

      for (var j = nodesInclClones[i].parent.length; j--;) {
        up(nodesInclClones[i].parent[j], callback, nodesInclClones[i]);
      }
    }
  }

  function down(node, callback) {
    var nodesInclClones = collectInclClones(node);

    for (var i = nodesInclClones.length; i--;) {
      callback(nodesInclClones[i]);

      for (var j = nodesInclClones[i].childRefs.length; j--;) {
        down(nodesInclClones[i].childRefs[j], callback);
      }
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

  function roundRect(x, y, width, height, radius) {
    var topLeft = 0;
    var topRight = 0;
    var bottomLeft = 0;
    var bottomRight = 0;

    try {
      topLeft = radius.topLeft || 0;
      topRight = radius.topRight || 0;
      bottomLeft = radius.bottomLeft || 0;
      bottomRight = radius.bottomRight || 0;
    } catch (e) {}

    return 'M' + (x + topLeft) + ',' + y + 'h' + (width - topLeft - topRight) + 'a' + topRight + ',' + topRight + ' 0 0 1 ' + topRight + ',' + topRight + 'v' + (height - (topRight + bottomRight)) + 'a' + bottomRight + ',' + bottomRight + ' 0 0 1 ' + -bottomRight + ',' + bottomRight + 'h' + (bottomLeft - (width - bottomRight)) + 'a' + bottomLeft + ',' + bottomLeft + ' 0 0 1 ' + -bottomLeft + ',' + -bottomLeft + 'v' + (topLeft - (height - bottomLeft)) + 'a' + topLeft + ',' + topLeft + ' 0 0 1 ' + topLeft + ',' + -topLeft + 'z';
  }

  var BAR_CLASS = 'bar';

  var Bar = (function () {
    function Bar(selection, barData, nodeData, visData, barCollection) {
      var _this = this;

      babelHelpers.classCallCheck(this, Bar);

      var that = this;

      this.data = barData;
      this.nodeData = nodeData;
      this.visData = visData;
      this.barCollection = barCollection;

      this.data.x = nodeData.x;
      this.data.level = nodeData.depth;

      this.height = this.visData.global.row.contentHeight / (this.data.length * 2) - this.visData.global.cell.padding * 2;

      this.activeHeight = this.visData.global.row.contentHeight - 2;

      this.inactiveheight = this.visData.global.cell.padding * 2 - 1;

      this.selection = selection.selectAll(BAR_CLASS).data(this.data).enter().append('g').attr('class', function (data) {
        return BAR_CLASS + ' ' + data.id;
      }).classed('active', function (data) {
        return data.id === _this.visData.nodes[_this.nodeData.depth].sortBy;
      });

      // Local helper method to avoid code duplication.
      // Calling a class method from within the consructor is possible but `this`
      // is not available. Thus, we need to create local function and pass in
      // `this` as `that`, which feels very hacky but it works.
      function setupMagnitude(selection) {
        var currentSorting = that.visData.nodes[that.nodeData.depth].sortBy;

        selection.attr('d', function (data) {
          return Bar.generatePath(data, currentSorting, that.visData);
        }).classed('bar-magnitude', true);
      }

      function setupBorder(selection) {
        selection.attr('x', 0).attr('y', that.visData.global.row.padding).attr('width', that.visData.global.column.contentWidth).attr('height', that.visData.global.row.contentHeight).attr('rx', 2).attr('ry', 2).classed('bar-border', true);
      }

      function setupIndicator(selection) {
        selection.attr('d', function (data) {
          return Bar.generatePath(data, undefined, that.visData, data.value);
        }).classed('bar-indicator', true);
      }

      this.selection.append('rect').call(setupBorder);

      this.selection.append('path').call(setupMagnitude);

      this.selection.append('path').call(setupIndicator);
    }

    babelHelpers.createClass(Bar, null, [{
      key: 'generatePath',
      value: function generatePath(data, currentSorting, visData, indicator, adjustWidth, bottom) {
        if (this.barCollection.mode === 'two') {
          return this.generateTwoBarsPath(data, visData, bottom);
        } else {
          return this.generateOneBarPath(data, currentSorting, visData, indicator, adjustWidth);
        }
      }
    }, {
      key: 'generateOneBarPath',
      value: function generateOneBarPath(data, currentSorting, visData, indicator, adjustWidth) {
        var x = 0;

        var width = 2;

        var height = visData.global.row.contentHeight;

        var radius = {
          topLeft: 2,
          bottomLeft: 2
        };

        if (indicator) {
          radius = {};
        }

        if (data.id !== currentSorting && typeof indicator === 'undefined') {
          x = data.value * visData.global.column.contentWidth - 3;
          radius = {};
        } else if (indicator) {
          x = indicator * visData.global.column.contentWidth;
          if (adjustWidth) {
            if (data.value < indicator) {
              x = data.value * visData.global.column.contentWidth;
            }
            width = Math.min(Math.abs(indicator - data.value), 2) * visData.global.column.contentWidth;
          }
        } else {
          width = visData.global.column.contentWidth * data.value;
        }

        return roundRect(x, visData.global.row.padding, width, height, radius);
      }
    }, {
      key: 'generateTwoBarsPath',
      value: function generateTwoBarsPath(data, visData, bottom) {
        var height = visData.global.row.contentHeight / 2;

        var width = visData.global.column.contentWidth * data.value;

        var y = visData.global.row.padding;

        var radius = { topLeft: 2 };

        if (bottom) {
          radius = { bottomLeft: 2 };
          y += height;
        }

        return roundRect(0, y, width, height, radius);
      }
    }]);
    return Bar;
  })();

  var BARS_CLASS = 'bars';

  var Bars = (function () {
    function Bars(selection, mode, visData) {
      babelHelpers.classCallCheck(this, Bars);

      var that = this;

      this.mode = mode;
      this.visData = visData;

      this.selection = selection.append('g').attr('class', BARS_CLASS);

      this.selection.each(function (datum) {
        new Bar(d3.select(this), datum.data.bars, datum, that.visData, that);
      });
    }

    babelHelpers.createClass(Bars, [{
      key: 'update',
      value: function update(selection, sortBy) {
        var _this = this;

        selection.each(function () {
          var el = d3.select(this);

          if (el.classed('active')) {
            el.classed('active', false);
          } else {
            el.classed('active', true);
            // Ensure that the active bars we are places before any other bar,
            // thus placing them in the background
            this.parentNode.insertBefore(this, d3.select(this.parentNode).select('.bar').node());
          }
        });

        selection.selectAll('.bar-magnitude').transition().duration(TRANSITION_SEMI_FAST).attr('d', function (data) {
          return Bar.generatePath(data, sortBy, _this.visData);
        });
      }
    }, {
      key: 'updateIndicator',
      value: function updateIndicator(refBars, currentBar, referenceValue) {
        var _this2 = this;

        currentBar.transition().duration(0).attr('d', function (data) {
          return Bar.generatePath(data, undefined, _this2.visData);
        });

        refBars.attr('d', function (data) {
          return Bar.generatePath(data, undefined, _this2.visData, referenceValue);
        }).classed('positive', function (data) {
          return data.value >= referenceValue;
        });

        refBars.transition().duration(TRANSITION_SEMI_FAST).attr('d', function (data) {
          return Bar.generatePath(data, undefined, _this2.visData, referenceValue, true);
        });
      }
    }, {
      key: 'switchMode',
      value: function switchMode(mode, currentSorting) {
        var _this3 = this;

        if (this.mode !== mode) {
          if (mode === 'one') {
            if (currentSorting.global.type) {
              this.selection.selectAll('.bar').selectAll('.bar-magnitude').transition().duration(TRANSITION_SEMI_FAST).attr('d', function (data) {
                return Bar.generateOneBarPath(data, currentSorting.global.type, _this3.visData);
              });
              console.log('bratzen');
            } else {
              console.log('kacken');
            }
          }

          if (mode === 'two') {
            this.selection.selectAll('.bar.precision').selectAll('.bar-magnitude').transition().duration(TRANSITION_SEMI_FAST).attr('d', function (data) {
              return Bar.generateTwoBarsPath(data, _this3.visData);
            });

            this.selection.selectAll('.bar.recall').selectAll('.bar-magnitude').transition().duration(TRANSITION_SEMI_FAST).attr('d', function (data) {
              return Bar.generateTwoBarsPath(data, _this3.visData, true);
            });
          }

          this.mode = mode;
        }
      }
    }]);
    return Bars;
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
    function Nodes(baseSelection, visData, links, events, barMode) {
      var _this = this;

      babelHelpers.classCallCheck(this, Nodes);

      var that = this;

      // Helper
      function drawFullSizeRect(selection, className, shrinking) {
        if (!shrinking) {
          shrinking = 0;
        }

        selection.attr('x', function (data) {
          return shrinking;
        }).attr('y', function (data) {
          return that.visData.global.row.padding + shrinking;
        }).attr('width', that.visData.global.column.contentWidth - 2 * shrinking).attr('height', that.visData.global.row.contentHeight - 2 * shrinking).attr('rx', 2 - shrinking).attr('ry', 2 - shrinking).classed(className, true);
      }

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
        return 'translate(' + (data.x + _this.visData.global.column.padding) + ', ' + data.y + ')';
      });

      this.nodes.append('rect').call(drawFullSizeRect, 'bg', 1);

      this.nodes.on('click', function (data) {
        that.mouseClick(this, data);
      });

      this.nodes.on('mouseenter', function (data) {
        that.mouseEnter(this, data);
      });

      this.nodes.on('mouseleave', function (data) {
        that.mouseLeave(this, data);
      });

      this.bars = new Bars(this.nodes, barMode, this.visData);

      this.nodes.append('rect').call(drawFullSizeRect, 'border');

      // Add node label
      this.nodes.call(function (selection) {
        selection.append('foreignObject').attr('x', function (data) {
          return _this.visData.global.cell.padding;
        }).attr('y', function (data) {
          return _this.visData.global.row.padding + _this.visData.global.cell.padding;
        }).attr('width', _this.visData.global.column.contentWidth).attr('height', _this.visData.global.row.contentHeight - _this.visData.global.cell.padding * 2).attr('class', 'label-wrapper').append('xhtml:div').attr('class', 'label').attr('title', function (data) {
          return data.data.name;
        }).style('line-height', _this.visData.global.row.contentHeight - _this.visData.global.cell.padding * 2 + 'px').append('xhtml:span').text(function (data) {
          return data.data.name;
        });
      });
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

        var that = this;
        var currentNodeData = data;

        // Store link IDs
        this.currentlyHighlightedLinks = [];

        var currentActiveProperty = d3.select(el).selectAll('.bar.active .bar-magnitude').datum();

        var traverseCallbackUp = function traverseCallbackUp(data, childData) {
          data.hovering = 2;
          for (var i = data.links.length; i--;) {
            // Only push direct parent child connections. E.g.
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
          data.originalNode.hovering = 1;
        }

        data.hovering = 1;

        this.nodes.each(function (data) {
          var node = d3.select(this);

          if (data.hovering === 1) {
            node.classed('hovering-directly', true);
          } else if (data.hovering === 2) {
            node.classed('hovering-indirectly', true);
            node.selectAll('.bar.' + currentActiveProperty.id).classed('copy', function (data) {
              var id = data.id;

              if (data.clone) {
                id = data.originalNode.id;
              }

              if (id !== currentNodeData.id) {
                return true;
              }
            });

            var currentBar = d3.select(el).selectAll('.bar.' + currentActiveProperty.id).classed('reference', true);

            that.bars.updateIndicator(node.selectAll('.bar.copy .bar-indicator'), currentBar.selectAll('.bar-indicator'), currentActiveProperty.value);
          }
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
        }

        this.nodes.classed('hovering-directly', false);
        this.nodes.classed('hovering-indirectly', false);
        this.nodes.selectAll('.bar.reference').classed('reference', false);

        this.links.highlight(arrayToFakeObjs(this.currentlyHighlightedLinks), false);

        this.events.broadcast('d3ListGraphNodeLeave', { id: data.id });
      }
    }, {
      key: 'sort',
      value: function sort(update, newSortType) {
        var _this3 = this;

        for (var i = update.length; i--;) {
          var start = function start() {
            d3.select(this).classed('sorting', true);
          };
          var end = function end() {
            d3.select(this).classed('sorting', false);
          };

          var selection = this.nodes.data(update[i].rows, function (data) {
            return data.id;
          });

          selection.transition().duration(TRANSITION_SEMI_FAST).attr('transform', function (data) {
            return 'translate(' + (data.x + _this3.visData.global.column.padding) + ', ' + data.y + ')';
          }).each('start', start).each('end', end);

          if (newSortType) {
            this.bars.update(selection.selectAll('.bar'), update[i].sortBy);
          }
        }
      }
    }, {
      key: 'barMode',
      get: function get() {
        return this.bars.mode;
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
  var TOPBAR_GLOBAL_CONTROL_CLASS = 'global-controls';

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

      this.controlSwitch = this.el.append('div').attr('title', 'Toggle global / local topbar').style('width', this.visData.global.column.padding + 'px').classed('control-switch', true).on('click', this.switch.bind(this));

      this.switchArrow = this.controlSwitch.append('svg').append('use').attr('xlink:href', this.vis.iconPath + '#arrow-down').attr('class', 'switch-arrow');

      this.globalControls = this.el.append(TOPBAR_CONTROL_EL).classed(TOPBAR_GLOBAL_CONTROL_CLASS, true);

      this.globalPrecision = this.globalControls.append('li').attr('class', 'control-btn sort-precision').classed('active', function () {
        if (that.vis.currentSorting.global.type === 'precision') {
          // Save currently active element. Needed when when re-sorting for the
          // first time, to be able to de-highlight this element.
          that.vis.currentSorting.global.el = d3.select(this);
          return true;
        }
      }).on('click', function (data) {
        that.sortAllColumns(this, 'precision');
      }).on('mouseenter', function () {
        return _this.highlightBars(undefined, 'precision');
      }).on('mouseleave', function () {
        return _this.highlightBars(undefined, 'precision', true);
      });

      this.globalPrecisionWrapper = this.globalPrecision.append('div').attr('class', 'wrapper').text('Precision').style('margin', '0 ' + this.visData.global.column.padding + 'px');

      this.globalPrecisionWrapper.append('svg').attr('class', 'icon-unsort invisible-default').classed('visible', this.vis.currentSorting.global.type !== 'precision').append('use').attr('xlink:href', this.vis.iconPath + '#unsort');

      this.globalPrecisionWrapper.append('svg').attr('class', 'icon-sort-asc invisible-default').classed('visible', this.vis.currentSorting.global.type === 'precision' && this.vis.currentSorting.global.order === 1).append('use').attr('xlink:href', this.vis.iconPath + '#sort-asc');

      this.globalPrecisionWrapper.append('svg').attr('class', 'icon-sort-desc invisible-default').classed('visible', this.vis.currentSorting.global.type === 'precision' && this.vis.currentSorting.global.order !== 1).append('use').attr('xlink:href', this.vis.iconPath + '#sort-desc');

      this.globalRecall = this.globalControls.append('li').attr('class', 'control-btn sort-recall').classed('active', function () {
        if (that.vis.currentSorting.global.type === 'recall') {
          // See precision
          that.vis.currentSorting.global.el = d3.select(this);
          return true;
        }
      }).on('click', function (data) {
        that.sortAllColumns(this, 'recall');
      }).on('mouseenter', function () {
        return _this.highlightBars(undefined, 'recall');
      }).on('mouseleave', function () {
        return _this.highlightBars(undefined, 'recall', true);
      });

      this.globalRecallWrapper = this.globalRecall.append('div').attr('class', 'wrapper').text('Recall').style('margin', '0 ' + this.visData.global.column.padding + 'px');

      this.globalRecallWrapper.append('svg').attr('class', 'icon-unsort invisible-default').classed('visible', this.vis.currentSorting.global.type !== 'recall').append('use').attr('xlink:href', this.vis.iconPath + '#unsort');

      this.globalRecallWrapper.append('svg').attr('class', 'icon-sort-asc invisible-default').classed('visible', this.vis.currentSorting.global.type === 'recall' && this.vis.currentSorting.global.order === 1).append('use').attr('xlink:href', this.vis.iconPath + '#sort-asc');

      this.globalRecallWrapper.append('svg').attr('class', 'icon-sort-desc invisible-default').classed('visible', this.vis.currentSorting.global.type === 'recall' && this.vis.currentSorting.global.order !== 1).append('use').attr('xlink:href', this.vis.iconPath + '#sort-desc');

      this.globalName = this.globalControls.append('li').attr('class', 'control-btn sort-name').classed('active', function () {
        if (that.vis.currentSorting.global.type === 'name') {
          // See precision
          that.vis.currentSorting.global.el = d3.select(this);
          return true;
        }
      }).on('click', function (data) {
        that.sortAllColumns(this, 'name');
      }).on('mouseenter', function () {
        return _this.highlightLabels();
      }).on('mouseleave', function () {
        return _this.highlightLabels(true);
      });

      this.globalNameWrapper = this.globalName.append('div').attr('class', 'wrapper').text('Name').style('margin', '0 ' + this.visData.global.column.padding + 'px');

      this.globalNameWrapper.append('svg').attr('class', 'icon-unsort invisible-default').classed('visible', this.vis.currentSorting.global.type !== 'name').append('use').attr('xlink:href', this.vis.iconPath + '#unsort');

      this.globalNameWrapper.append('svg').attr('class', 'icon-sort-asc invisible-default').classed('visible', this.vis.currentSorting.global.type === 'name' && this.vis.currentSorting.global.order === 1).append('use').attr('xlink:href', this.vis.iconPath + '#sort-alpha-asc');

      this.globalNameWrapper.append('svg').attr('class', 'icon-sort-desc invisible-default').classed('visible', this.vis.currentSorting.global.type === 'name' && this.vis.currentSorting.global.order !== 1).append('use').attr('xlink:href', this.vis.iconPath + '#sort-alpha-desc');

      // One bar
      this.globalOneBar = this.globalControls.append('li').attr('class', 'control-btn one-bar').classed('active', this.vis.barMode === 'one').on('click', function () {
        that.switchBarMode(this, 'one');
      });

      this.globalOneBarWrapper = this.globalOneBar.append('div').attr('class', 'wrapper').text('One bar').style('margin', '0 ' + this.visData.global.column.padding + 'px');

      this.globalOneBarWrapper.append('svg').attr('class', 'icon-one-bar').append('use').attr('xlink:href', this.vis.iconPath + '#one-bar');

      // Two bars
      this.globalTwoBars = this.globalControls.append('li').attr('class', 'control-btn two-bars').classed('active', this.vis.barMode === 'two').on('click', function () {
        that.switchBarMode(this, 'two');
      });

      this.globalTwoBarsWrapper = this.globalTwoBars.append('div').attr('class', 'wrapper').text('Two bars').style('margin', '0 ' + this.visData.global.column.padding + 'px');

      this.globalTwoBarsWrapper.append('svg').attr('class', 'icon-two-bars').append('use').attr('xlink:href', this.vis.iconPath + '#two-bars');

      this.localControlWrapper = this.el.append('div').classed('local-controls', true);

      this.localControls = this.localControlWrapper.selectAll(TOPBAR_CONTROL_CLASS).data(visData.nodes).enter().append(TOPBAR_CONTROL_EL).classed(TOPBAR_CONTROL_CLASS, true).style('width', this.visData.global.column.width + 'px');

      this.localControls.each(function (data, index) {
        var control = d3.select(this);

        /*
         * Order:
         * 0 = unsorted
         * 1 = asc
         * -1 = desc
         */
        that.vis.currentSorting.local[index] = {
          type: data.sortBy,
          order: data.sortOrder,
          el: undefined
        };

        control.append('li').attr('class', 'control-btn toggle').style('width', that.visData.global.column.padding + 'px').on('click', that.toggleColumn);

        control.append('li').attr('class', 'control-btn sort-precision ease-all').style({
          'width': that.visData.global.column.contentWidth / 2 + 'px',
          'left': that.visData.global.column.padding + 'px'
        }).on('click', function (data) {
          that.sortColumn(this, data.level, 'precision');
        }).on('mouseenter', function () {
          that.highlightBars(this.parentNode, 'precision');
          d3.select(this).style('width', that.visData.global.column.contentWidth - 16 + 'px');
        }).on('mouseleave', function () {
          that.highlightBars(this.parentNode, 'precision', true);
          d3.select(this).style('width', that.visData.global.column.contentWidth / 2 + 'px');
        }).html('<div class="expandable-label">' + '  <span class="letter abbr">P</span>' + '  <span class="letter abbr">r</span>' + '  <span class="letter">e</span>' + '  <span class="letter abbr">c</span>' + '  <span class="letter">i</span>' + '  <span class="letter">s</span>' + '  <span class="letter">i</span>' + '  <span class="letter">o</span>' + '  <span class="letter">n</span>' + '</div>' + '<svg class="icon-unsort invisible-default ' + (that.vis.currentSorting.local[index].type !== 'precision' ? 'visible' : '') + '">' + '  <use xlink:href="' + that.vis.iconPath + '#unsort"></use>' + '</svg>' + '<svg class="icon-sort-asc invisible-default ' + (that.vis.currentSorting.local[index].type === 'precision' && that.vis.currentSorting.local[index].order === 1 ? 'visible' : '') + '">' + '  <use xlink:href="' + that.vis.iconPath + '#sort-asc"></use>' + '</svg>' + '<svg class="icon-sort-desc invisible-default ' + (that.vis.currentSorting.local[index].type === 'precision' && that.vis.currentSorting.local[index].order !== 1 ? 'visible' : '') + '">' + '  <use xlink:href="' + that.vis.iconPath + '#sort-desc"></use>' + '</svg>');

        control.append('li').attr('class', 'control-btn sort-recall ease-all').style({
          'width': that.visData.global.column.contentWidth / 2 + 'px',
          'left': that.visData.global.column.contentWidth / 2 + that.visData.global.column.padding + 'px'
        }).on('click', function (data) {
          that.sortColumn(this, data.level, 'recall');
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
        }).html('<div class="expandable-label">' + '  <span class="letter abbr">R</span>' + '  <span class="letter">e</span>' + '  <span class="letter abbr">c</span>' + '  <span class="letter">a</span>' + '  <span class="letter abbr">l</span>' + '  <span class="letter">l</span>' + '</div>' + '<svg class="icon-unsort invisible-default ' + (that.vis.currentSorting.local[index].type !== 'recall' ? 'visible' : '') + '">' + '  <use xlink:href="' + that.vis.iconPath + '#unsort"></use>' + '</svg>' + '<svg class="icon-sort-asc invisible-default ' + (that.vis.currentSorting.local[index].type === 'recall' && that.vis.currentSorting.local[index].order === 1 ? 'visible' : '') + '">' + '  <use xlink:href="' + that.vis.iconPath + '#sort-asc"></use>' + '</svg>' + '<svg class="icon-sort-desc invisible-default ' + (that.vis.currentSorting.local[index].type === 'recall' && that.vis.currentSorting.local[index].order !== 1 ? 'visible' : '') + '">' + '  <use xlink:href="' + that.vis.iconPath + '#sort-desc"></use>' + '</svg>');

        control.append('li').attr('class', 'control-btn options').style('width', that.visData.global.column.padding + 'px').on('click', that.toggleOptions).html('<svg class="icon-gear">' + '  <use xlink:href="' + that.vis.iconPath + '#gear"></use>' + '</svg>');

        if (that.vis.currentSorting.local[index].type) {
          that.vis.currentSorting.local[index].el = control.select('.sort-' + that.vis.currentSorting.local[index].type);
        }
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
      key: 'highlightLabels',
      value: function highlightLabels(deHighlight) {
        this.vis.baseElD3.selectAll('.node').classed('highlight-label', !deHighlight);
      }
    }, {
      key: 'highlightBars',
      value: function highlightBars(el, type, deHighlight) {
        var nodes = el ? this.selectNodesColumn(el) : this.vis.baseElD3.selectAll('.node');

        nodes.classed('highlight-bar', !deHighlight).selectAll('.bar.' + type).classed('highlight', !deHighlight);
      }
    }, {
      key: 'sortAllColumns',
      value: function sortAllColumns(el, type) {
        var newSortType = false;

        if (this.vis.currentSorting.global.type !== type) {
          newSortType = true;

          // Unset class of previous global sorting element
          if (this.vis.currentSorting.global.el) {
            this.resetSortEl(this.vis.currentSorting.global.el);
          }
        }

        this.vis.currentSorting.global.el = d3.select(el);
        this.vis.currentSorting.global.el.classed('active', true);
        this.vis.currentSorting.global.type = type;

        var columnKeys = Object.keys(this.vis.currentSorting.local);
        for (var i = 0, len = columnKeys.length; i < len; i++) {
          this.sortColumn(el, columnKeys[i], type, true);
        }
      }
    }, {
      key: 'sortColumn',
      value: function sortColumn(el, index, type, global) {
        // Reset global sorting
        if (!global) {
          this.vis.currentSorting.global.type = undefined;
          this.resetSortEl(this.vis.currentSorting.global.el);
        }

        var newSortType = false;

        if (this.vis.currentSorting.local[index].el) {
          if (this.vis.currentSorting.local[index].type !== type) {
            this.resetSortEl(this.vis.currentSorting.local[index].el);
          }
        }

        if (this.vis.currentSorting.local[index].type !== type) {
          newSortType = true;
          // Reset sort order
          this.vis.currentSorting.local[index].order = 0;
        }

        this.vis.currentSorting.local[index].el = d3.select(el);
        this.vis.currentSorting.local[index].type = type;

        // -1 = desc, 1 = asc
        if (this.vis.currentSorting.local[index].order === -1) {
          this.vis.currentSorting.local[index].order = 1;
          this.vis.currentSorting.local[index].el.select('.icon-sort-desc').classed('visible', false);
          this.vis.currentSorting.local[index].el.select('.icon-sort-asc').classed('visible', true);
        } else {
          this.vis.currentSorting.local[index].order = -1;
          this.vis.currentSorting.local[index].el.select('.icon-sort-asc').classed('visible', false);
          this.vis.currentSorting.local[index].el.select('.icon-sort-desc').classed('visible', true);
        }

        this.vis.currentSorting.local[index].el.select('.icon-unsort').classed('visible', false);

        this.vis.sortColumn(index, type, this.vis.currentSorting.local[index].order, newSortType);
      }
    }, {
      key: 'resetSortEl',
      value: function resetSortEl(el) {
        el.classed('active', false);
        el.select('.icon-sort-desc').classed('visible', false);
        el.select('.icon-sort-asc').classed('visible', false);
        el.select('.icon-unsort').classed('visible', true);
      }
    }, {
      key: 'toggleOptions',
      value: function toggleOptions() {
        console.log('Toggle options');
      }
    }, {
      key: 'switch',
      value: function _switch() {
        this.el.classed('details', !this.el.classed('details'));
      }
    }, {
      key: 'switchBarMode',
      value: function switchBarMode(el, mode) {
        if (this.vis.nodes.barMode !== mode) {
          if (mode === 'one') {
            this.globalOneBar.classed('active', true);
            this.globalTwoBars.classed('active', false);
          } else {
            this.globalOneBar.classed('active', false);
            this.globalTwoBars.classed('active', true);
          }
          this.vis.switchBarMode(mode);
        }
      }
    }]);
    return Topbar;
  })();

  /**
   * Creates and adds an interpolated exponential SVG gradient to an SVG element.
   *
   * @example
   * ```
   * exponentialGradient(
   *   d3.select('svg'),
   *   {
   *     color: #fff,
   *     offset: 10,
   *     opacity: 0.5,
   *     x: 0,
   *     y: 0
   *   },
   *   {
   *     color: #000,
   *     offset: 10,
   *     opacity: 1,
   *     x: 1,
   *     y: 1
   *   },
   *   'myFancyGradient',
   *   3,
   *   5
   * );
   * ```
   *
   * @method  exponentialGradient
   * @author  Fritz Lekschas
   * @date    2015-12-30
   * @param   {Object}  el     Element to which the `def` gradient should be
   *   added to.
   * @param   {Object}  start  Start properies.
   * @param   {Object}  end    End properies.
   * @param   {String}  name   Name of the gradient.
   * @param   {Number}  power  Exponential power.
   * @param   {Number}  steps  Interpolation steps.
   */
  function exponentialGradient(el, start, end, name, power, steps) {
    var scale = d3.scale.pow().exponent(power || 2);
    var stepSize = 1 / ((steps || 0) + 1);

    var gradient = el.append('defs').append('linearGradient').attr('id', name).attr('x1', start.x).attr('y1', start.y).attr('x2', end.x).attr('y2', end.y).attr('spreadMethod', 'pad');

    gradient.append('stop').attr('offset', start.offset + '%').attr('stop-color', start.color).attr('stop-opacity', start.opacity);

    for (var i = 0; i < steps; i++) {
      gradient.append('stop').attr('offset', start.offset + i * stepSize * (end.offset - start.offset) + '%').attr('stop-color', end.color).attr('stop-opacity', start.opacity + scale(i * stepSize) * (end.opacity - start.opacity));
    }

    gradient.append('stop').attr('offset', end.offset + '%').attr('stop-color', end.color).attr('stop-opacity', end.opacity);
  }

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

      this.sortBy = options.sortBy;
      this.sortOrder = options.sortOrder || DEFAULT_SORT_ORDER;

      this.events = new Events(this.baseEl, options.dispatcher);

      this.baseElJq.width(this.width).addClass(CLASSNAME);

      this.layout = new d3.layout.listGraph([this.width, this.height], [this.columns, this.rows]);

      this.data = data;
      this.visData = this.layout.process(this.data, this.rootNodes, {
        sortBy: this.sortBy,
        sortOrder: this.sortOrder
      });

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

      exponentialGradient(this.svgD3, {
        color: COLOR_NEGATIVE_RED,
        offset: 0,
        opacity: 0.2,
        x: 0,
        y: 0
      }, {
        afterOffsetOpacity: 1,
        color: COLOR_NEGATIVE_RED,
        offset: 99,
        opacity: 1,
        x: 1,
        y: 0
      }, 'negativeRed', 4, 10);

      exponentialGradient(this.svgD3, {
        beforeOffsetOpacity: 1,
        color: COLOR_POSITIVE_GREEN,
        offset: 1,
        opacity: 1,
        x: 0,
        y: 0
      }, {
        color: COLOR_POSITIVE_GREEN,
        offset: 100,
        opacity: 0.2,
        x: 1,
        y: 0
      }, 'positiveGreen', 0.25, 10);

      this.barMode = options.barMode || DEFAULT_BAR_MODE;
      this.svgD3.classed(this.barMode + '-bar', true);

      this.topbar = new Topbar(this, this.baseElD3, this.visData);

      this.svgD3.attr('viewBox', '0 0 ' + this.width + ' ' + this.height);

      this.container = this.svgD3.append('g');

      this.columns = new Columns(this.container, this.visData);

      this.links = new Links(this.columns.groups, this.visData, this.layout);
      this.nodes = new Nodes(this.columns.groups, this.visData, this.links, this.events, options.barMode || DEFAULT_BAR_MODE);
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
      value: function sortColumn(level, property, sortOrder, newSortType) {
        this.nodes.sort(this.layout.sort(level, property, sortOrder).nodes(level), newSortType);
        this.links.sort(this.layout.links(level - 1, level + 1));
      }
    }, {
      key: 'switchBarMode',
      value: function switchBarMode(mode) {
        this.svgD3.classed('one-bar', mode === 'one');
        this.svgD3.classed('two-bar', mode === 'two');
        this.nodes.bars.switchMode(mode, this.currentSorting);
      }
    }, {
      key: 'barMode',
      get: function get() {
        if (this.bars) {
          return this.nodes.bars.mode;
        }
        return this._barMode;
      },
      set: function set(mode) {
        if (this.bars) {
          this.nodes.bars.mode = mode;
        }
        this._barMode = mode;
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