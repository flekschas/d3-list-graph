/* Copyright Fritz Lekschas: D3 example visualization app using list-based graphs */
(function () { 'use strict';

  function scrollColumn(element, offset) {
    try {
      d3.select(element).attr('transform', 'translate(0, ' + offset + ')');
    } catch (e) {
      console.err('ListGraph is not properly initialized!', e);
    }
  }

  function scrollLinks(graph, selection, level, scrollTop, nodeType) {
    selection.data(function () {
      return graph.offsetLinks(level, scrollTop, nodeType);
    }).attr('d', diagonal).exit().remove();
  }

  function mousewheelColumn(e, listGraph) {
    e.preventDefault();

    if (this.__data__.scrollHeight > 0) {
      // Scroll nodes
      this.__data__.scrollTop = Math.max(Math.min(this.__data__.scrollTop + e.deltaY, 0), -this.__data__.scrollHeight);

      scrollColumn(this.__data__.scrollEl, this.__data__.scrollTop);

      // Scroll scrollbar
      this.__data__.scrollbar.el.__data__.scrollTop = this.__data__.scrollbar.heightScale(-this.__data__.scrollTop);

      scrollColumn(this.__data__.scrollbar.el, this.__data__.scrollbar.el.__data__.scrollTop);

      // Update links
      scrollLinks(listGraph, this.__data__.linkSelections.outgoing, this.__data__.level, this.__data__.scrollTop, 'source');
      scrollLinks(listGraph, this.__data__.linkSelections.incoming, this.__data__.level - 1, this.__data__.scrollTop, 'target');
    }
  }

  function prepareColumnForScrolling(data, global) {
    var scrollEl = this.querySelector('.nodes');
    var scrollbarEl = this.querySelector('.scrollbar');

    var columnHeight = scrollEl.getBoundingClientRect().height + 2 * global.row.padding;
    var scrollHeight = columnHeight - height;
    var scrollbarHeight = scrollHeight > 0 ? Math.max(height * height / scrollHeight, 10) : 0;

    data.height = columnHeight;
    data.linkSelections = {
      incoming: this.previousSibling ? d3.select(this.previousSibling).selectAll('.link') : null,
      outgoing: d3.select(this).selectAll('.link')
    };
    data.scrollEl = scrollEl;
    data.scrollHeight = scrollHeight;
    data.scrollTop = 0;
    data.scrollbar = {
      el: scrollbarEl,
      x: data.x + global.column.width - scrollbarWidth,
      y: 0,
      width: scrollbarWidth,
      height: scrollbarHeight,
      scrollHeight: height - scrollbarHeight,
      heightScale: d3.scale.linear().domain([0, scrollHeight]).range([0, height - scrollbarHeight])
    };
  }

  function traverseUp(node, callback) {
    while (node.parent) {
      node = node.parent;
      callback(node);
    }
  }

  function traverseDown(node, callback) {
    for (var i = node.childRefs.length; i--;) {
      callback(node.childRefs[i]);
      traverseDown(node.childRefs[i], callback);
    }
  }

  function traverse(node, callback) {
    traverseUp(node, callback);
    traverseDown(node, callback);
    for (var i = node.childRefs.length; i--;) {
      callback(node.childRefs[i]);
      traverseDown(node.childRefs[i], callback);
    }
  }

  function addLabel(selection) {
    selection.append('foreignObject').attr('x', function (data) {
      return data.x + visData.global.column.padding + visData.global.cell.padding;
    }).attr('y', function (data) {
      return data.y + visData.global.row.padding + visData.global.cell.padding;
    }).attr('width', visData.global.column.contentWidth).attr('height', visData.global.row.contentHeight / 2 - visData.global.cell.padding * 2).attr('class', 'label-wrapper').append('xhtml:div').attr('class', 'label').attr('title', function (data) {
      return data.data.name;
    }).append('xhtml:span').text(function (data) {
      return data.data.name;
    });
  }

  function setUpBar(selection, datum, barHeight, className, magnitude) {
    selection.attr('class', className).attr('x', datum.x + visData.global.column.padding + visData.global.cell.padding).attr('y', function (data, i) {
      return datum.y + visData.global.row.padding + visData.global.row.contentHeight / 2 + barHeight * i + visData.global.cell.padding * (1 + 2 * i);
    }).attr('width', function (data) {
      return (magnitude ? data.value : 1) * (visData.global.column.contentWidth - visData.global.cell.padding * 2);
    }).attr('height', barHeight);
  }

  function addBar(selection) {
    var datum = selection.datum();
    var bars = datum.data.bars;
    var barHeight = visData.global.row.contentHeight / (datum.data.bars.length * 2) - visData.global.cell.padding * 2;

    var newSelection = selection.selectAll('.bar').data(bars).enter().append('g').attr('class', 'bar');

    newSelection.append('rect').call(setUpBar, datum, barHeight, 'bar-border');

    newSelection.append('rect').call(setUpBar, datum, barHeight, 'bar-magnitude', true);
  }

  function addBars(selection) {
    selection.append('g').classed('bars', true).call(addBar);
  }

  var width = 800;
  var height = 200;
  var scrollbarWidth = 6;
  // var D3ListGraph = D3LayoutListGraph();

  var listGraph = new D3LayoutListGraph([width, height], [5, 5]);
  var visData;

  var diagonal = d3.svg.diagonal().projection(function (d) {
    return [d.y, d.x];
  });

  var svg = d3.select('body').append('svg').attr('width', width).attr('height', height);

  var container = svg.append('g');

  d3.json('data.json', function (error, data) {
    if (error) throw error;

    visData = listGraph.process(data, ['1', '2']);

    diagonal.source(function (data) {
      return {
        x: data.source.y + data.source.offsetY + visData.global.row.height / 2,
        y: data.source.x + data.source.offsetX + visData.global.column.contentWidth + visData.global.column.padding
      };
    }).target(function (data) {
      return {
        x: data.target.y + data.target.offsetY + visData.global.row.height / 2,
        y: data.target.x + data.target.offsetX + visData.global.column.padding
      };
    }).projection(function (data) {
      return [data.y, data.x];
    });

    var levels = container.selectAll('g').data(visData.nodes).enter().append('g').attr('class', 'level');

    // We need to add an empty rectangle that fills up the whole column to ensure
    // that the `g`'s size is at a maximum, otherwise scrolling will be halted
    // when the cursor leaves an actually drawn element.
    levels.append('rect').attr('class', 'scroll-container').attr('x', function (data) {
      return data.x;
    }).attr('y', function (data) {
      return data.y;
    }).attr('width', function (data) {
      return visData.global.column.width;
    }).attr('height', function (data) {
      return visData.global.column.height;
    });

    // We need an extra container which is transformed during scrolling. Otherwise
    // we "scroll away" the container that is listening to the mousehweel event.
    var linksGroups = levels.append('g').attr('class', 'links');

    var links = linksGroups.selectAll('.link').data(function (data, i) {
      return listGraph.links(i);
    }).enter().append('path').attr('class', 'link').attr('d', diagonal);

    var nodesGroups = levels.append('g').attr('class', 'nodes');

    var nodes = nodesGroups.selectAll('g.node').data(function (data) {
      return data.rows;
    }).enter().append('g').classed('node', true).classed('clone', function (data) {
      return data.clone;
    });

    nodes.append('rect').attr('x', function (data) {
      return data.x + visData.global.column.padding;
    }).attr('y', function (data) {
      return data.y + visData.global.row.padding;
    }).attr('width', visData.global.column.contentWidth).attr('height', visData.global.row.contentHeight).attr('rx', 2).attr('ry', 2).classed('bg', true);

    nodes.on('mouseover', function (data) {
      data.hovering = 1;
      traverse(data, function (data) {
        data.hovering = 2;
      });

      d3.select(this).classed('hovering-directly', true);
      nodes.classed('hovering-indirectly', function (data) {
        return data.hovering === 2;
      });
    });

    nodes.on('mouseout', function (data) {
      data.hovering = 0;
      traverse(data, function (data) {
        data.hovering = 0;
      });

      d3.select(this).classed('hovering-directly', false);
      nodes.classed('hovering-indirectly', false);
    });

    // Add label
    nodes.call(addLabel);

    nodes.each(function (data) {
      d3.select(this).call(addBars);
    });

    // Add bars
    // nodes.call(addBars);

    // Add empty scrollbar element
    var scrollbars = levels.append('rect').classed('scrollbar', true);

    // Store the height for each column to save computations when scrolling.
    levels.each(function (data) {
      prepareColumnForScrolling.call(this, data, visData.global);
    });

    // Adjust scrollbars
    scrollbars.attr('x', function (data) {
      return data.scrollbar.x;
    }).attr('y', function (data) {
      return data.scrollbar.y;
    }).attr('width', function (data) {
      return scrollbarWidth;
    }).attr('height', function (data) {
      return data.scrollbar.height;
    }).attr('rx', scrollbarWidth / 2).attr('ry', scrollbarWidth / 2).classed('ready', true);

    var $levels = $(levels[0]).on('mousewheel', function (e) {
      mousewheelColumn.call(this, e, listGraph);
    });

    // Reference to the currently active scrollbar. A scrollbar is active when
    // one clicked on the scrollbar and hold the mouse down.
    var activeScrollbar;

    var $scrollbars = $(scrollbars[0]).each(function () {
      this.__data__ = {
        clientY: null,
        scrollTop: 0
      };
      // Copy data over from the parent
      var keys = Object.keys(this.parentNode.__data__.scrollbar);
      for (var i = keys.length; i--;) {
        this.__data__[keys[i]] = this.parentNode.__data__.scrollbar[keys[i]];
      }
      // Invert scale
      this.__data__.invertedHeightScale = this.__data__.heightScale.invert;
      // Store a reference to the actual node list to be scrolled
      this.__data__.contentEl = this.parentNode.querySelector('.nodes');
    }).on('mousedown', function (e) {
      activeScrollbar = this;
      activeScrollbar.__data__.clientY = e.clientY;

      d3.select(activeScrollbar).classed('active', true);
    });

    // We need to listen to `mouseup` and `mousemove` globally otherwise scrolling
    // will only work as long as the cursor hovers the actual scrollbar, which is
    // super annoying.
    var $document = $(document).on('mouseup', function (e) {
      if (activeScrollbar) {
        var deltaY = activeScrollbar.__data__.clientY - e.clientY;
        // Save final vertical position
        // Scrollbar
        activeScrollbar.__data__.scrollTop = Math.min(Math.max(activeScrollbar.__data__.scrollTop - deltaY, 0), activeScrollbar.__data__.scrollHeight);
        // Content
        var contentEl = activeScrollbar.__data__.contentEl;
        contentEl.__data__.scrollTop = Math.max(Math.min(contentEl.__data__.scrollTop + activeScrollbar.__data__.invertedHeightScale(deltaY), 0), -contentEl.__data__.scrollHeight);

        d3.select(activeScrollbar).classed('active', false);

        activeScrollbar = undefined;
      }
    }).on('mousemove', function (e) {
      if (activeScrollbar) {
        var deltaY = activeScrollbar.__data__.clientY - e.clientY;
        // Scroll scrollbar
        scrollColumn(activeScrollbar, Math.min(Math.max(activeScrollbar.__data__.scrollTop - deltaY, 0), activeScrollbar.__data__.scrollHeight));
        // Scroll content
        var contentEl = activeScrollbar.__data__.contentEl,
            contentScrollTop = Math.max(Math.min(contentEl.__data__.scrollTop + activeScrollbar.__data__.invertedHeightScale(deltaY), 0), -contentEl.__data__.scrollHeight);
        scrollColumn(contentEl, contentScrollTop);
        // Scroll links
        scrollLinks(listGraph, contentEl.__data__.linkSelections.outgoing, contentEl.__data__.level, contentScrollTop, 'source');
        scrollLinks(listGraph, contentEl.__data__.linkSelections.incoming, contentEl.__data__.level - 1, contentScrollTop, 'target');
      }
    });
  });

})();