'use strict';

import d3 from 'd3';
import {TRANSITION_SEMI_FAST} from './config.js';

function scrollColumn (element, offset) {
  try {
    d3.select(element).attr(
      'transform',
      'translate(0, ' + offset + ')'
    );
  } catch (e) {
    console.err('ListGraph is not properly initialized!', e);
  }
}

function scrollLinks (graph, selection, level, scrollTop, nodeType) {
  selection
    .data(function () {
      return graph.offsetLinks(
        level,
        scrollTop,
        nodeType
      );
    })
    .attr('d', diagonal)
    .exit().remove();
}

function mousewheelColumn (e, listGraph) {
  e.preventDefault();

  if (this.__data__.scrollHeight > 0) {
    // Scroll nodes
    this.__data__.scrollTop = Math.max(
      Math.min(this.__data__.scrollTop + e.deltaY, 0),
      -this.__data__.scrollHeight
    );

    scrollColumn(
      this.__data__.scrollEl,
      this.__data__.scrollTop
    );

    // Scroll scrollbar
    this.__data__.scrollbar.el.__data__.scrollTop = this.__data__.scrollbar
      .heightScale(
        -this.__data__.scrollTop
      );

    scrollColumn(
      this.__data__.scrollbar.el,
      this.__data__.scrollbar.el.__data__.scrollTop
    );

    // Update links
    scrollLinks(
      listGraph,
      this.__data__.linkSelections.outgoing,
      this.__data__.level,
      this.__data__.scrollTop,
      'source'
    );
    scrollLinks(
      listGraph,
      this.__data__.linkSelections.incoming,
      this.__data__.level - 1,
      this.__data__.scrollTop,
      'target'
    );
  }
}

function prepareColumnForScrolling (data, global) {
  let scrollEl = this.querySelector('.nodes');
  let scrollbarEl = this.querySelector('.scrollbar');

  let columnHeight = scrollEl.getBoundingClientRect().height +
    2 * global.row.padding;
  let scrollHeight = columnHeight - height;
  let scrollbarHeight = scrollHeight > 0 ?
    Math.max((height * height / scrollHeight), 10) : 0;

  data.height = columnHeight;
  data.linkSelections = {
    incoming: this.previousSibling ?
      d3.select(this.previousSibling).selectAll('.link') : null,
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
    heightScale: d3.scale.linear()
      .domain([0, scrollHeight])
      .range([0, height - scrollbarHeight])
  };
}

function traverseUp (node, callback) {
  while (node.parent) {
    node = node.parent;
    callback(node);
  }
}

function traverseDown (node, callback) {
  for (let i = node.childRefs.length; i--;) {
    callback(node.childRefs[i]);
    traverseDown(node.childRefs[i], callback);
  }
}

function traverse (node, callback) {
  traverseUp(node, callback);
  traverseDown(node, callback);
  for (let i = node.childRefs.length; i--;) {
    callback(node.childRefs[i]);
    traverseDown(node.childRefs[i], callback);
  }
}

function addLabel (selection) {
  selection.append('foreignObject')
    .attr('x', function(data) {
      return data.x + visData.global.column.padding + visData.global.cell.padding;
    })
    .attr('y', function(data) {
      return data.y + visData.global.row.padding + visData.global.cell.padding;
    })
    .attr('width', visData.global.column.contentWidth)
    .attr('height', visData.global.row.contentHeight / 2 - visData.global.cell.padding * 2)
    .attr('class', 'label-wrapper')
    .append('xhtml:div')
      .attr('class', 'label')
      .attr('title', function(data) {
        return data.data.name;
      })
      .append('xhtml:span')
        .text(function(data) {
          return data.data.name;
        });
}

function setUpBar (selection, datum, barHeight, className, magnitude) {
  selection
    .attr('x', datum.x + visData.global.column.padding + visData.global.cell.padding)
    .attr('y', function (data, i) {
      return datum.y +
        visData.global.row.padding +
        visData.global.row.contentHeight / 2 +
        barHeight * i +
        visData.global.cell.padding * (1 + 2 * i);
    })
    .attr('width', function (data) {
      return (magnitude ? data.value : 1) *
        (visData.global.column.contentWidth - visData.global.cell.padding * 2);
    })
    .attr('height', barHeight)
    .classed(className, true);
}

function addBar (selection) {
  var datum = selection.datum();
  var bars = datum.data.bars;
  var barHeight = visData.global.row.contentHeight /
  (datum.data.bars.length * 2) -
  visData.global.cell.padding * 2;

  var newSelection = selection.selectAll('.bar')
    .data(bars)
    .enter()
    .append('g')
      .attr('class', function (data) {
        return 'bar ' + data.id;
      });

  newSelection
    .append('rect')
      .call(setUpBar, datum, barHeight, 'bar-border');

  newSelection
    .append('rect')
      .call(setUpBar, datum, barHeight, 'bar-magnitude', true);
}

function addBars (selection) {
  selection
    .append('g')
      .classed('bars', true)
      .call(addBar);
}

let width = 800,
    height = 200,
    scrollbarWidth = 6;

$('.list-graph').width(width);

var listGraph = new D3LayoutListGraph([width, height], [5,5]);
var visData;

var diagonal = d3.svg.diagonal()
  .projection(function(d) { return [d.y, d.x]; });

var topbarEl = d3.select('.list-graph')
  .append('div')
    .attr('class', 'topbar');

var svg = d3.select('.list-graph')
  .append('svg')
    .attr('width', width)
    .attr('height', height);

var container = svg.append('g');

d3.json('data.json', function(error, data) {
  if (error) throw error;

  // Initialize tree with root IDs '1' and '2'.
  visData = listGraph.process(data, ['1', '2']);

  diagonal
    .source(function (data) {
      return {
        x: data.source.y + data.source.offsetY + visData.global.row.height / 2,
        y: data.source.x + data.source.offsetX + visData.global.column.contentWidth + visData.global.column.padding
      };
    })
    .target(function (data) {
      return {
        x: data.target.y + data.target.offsetY+ visData.global.row.height / 2,
        y: data.target.x + data.target.offsetX+ visData.global.column.padding
      };
    })
    .projection(function (data) {
      return [data.y, data.x];
    });

  var levels = container
    .selectAll('g')
    .data(visData.nodes)
    .enter()
    .append('g')
      .attr('class', 'level');

  // We need to add an empty rectangle that fills up the whole column to ensure
  // that the `g`'s size is at a maximum, otherwise scrolling will be halted
  // when the cursor leaves an actually drawn element.
  levels
    .append('rect')
      .attr('class', 'scroll-container')
      .attr('x', function (data) {
        return data.x;
      })
      .attr('y', function (data) {
        return data.y;
      })
      .attr('width', function (data) {
        return visData.global.column.width;
      })
      .attr('height', function (data) {
        return visData.global.column.height;
      });

  // We need an extra container which is transformed during scrolling. Otherwise
  // we "scroll away" the container that is listening to the mousehweel event.
  let linksGroups = levels.append('g').attr('class', 'links');

  let links = linksGroups.selectAll('.link')
    .data(function (data, i) {
      return listGraph.links(i);
    })
    .enter()
    .append('path')
      .attr('class', 'link')
      .attr('d', diagonal);

  let nodesGroups = levels.append('g').attr('class', 'nodes');

  let nodes = nodesGroups
    .selectAll('g.node')
    .data(function(data) { return data.rows; })
    .enter()
    .append('g')
      .classed('node', true)
      .classed('clone', function (data) {
        return data.clone;
      });

  nodes
    .append('rect')
      .attr('x', function(data) {
        return data.x + visData.global.column.padding;
      })
      .attr('y', function(data) {
        return data.y + visData.global.row.padding;
      })
      .attr('width', visData.global.column.contentWidth)
      .attr('height', visData.global.row.contentHeight)
      .attr('rx', 2)
      .attr('ry', 2)
      .classed('bg', true);

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

  // Add bars
  nodes.each(function (data) {
    d3.select(this).call(addBars);
  });

  // Add empty scrollbar element
  let scrollbars = levels
    .append('rect')
      .classed('scrollbar', true);

  // Store the height for each column to save computations when scrolling.
  levels.each(function (data) {
    prepareColumnForScrolling.call(
      this,
      data,
      visData.global
    );
  });

  // Adjust scrollbars
  scrollbars
    .attr('x', function (data) {
      return data.scrollbar.x;
    })
    .attr('y', function (data) {
      return data.scrollbar.y;
    })
    .attr('width', function (data) {
      return scrollbarWidth;
    })
    .attr('height', function (data) {
      return data.scrollbar.height;
    })
    .attr('rx', scrollbarWidth / 2)
    .attr('ry', scrollbarWidth / 2)
    .classed('ready', true);

  let $levels = $(levels[0]).on('mousewheel', function (e) {
    mousewheelColumn.call(this, e, listGraph);
  });

  // Reference to the currently active scrollbar. A scrollbar is active when
  // one clicked on the scrollbar and hold the mouse down.
  let activeScrollbar;

  let $scrollbars = $(scrollbars[0])
    .each(function () {
      this.__data__ = {
        clientY: null,
        scrollTop: 0
      };
      // Copy data over from the parent
      let keys = Object.keys(this.parentNode.__data__.scrollbar);
      for (let i = keys.length; i--;) {
        this.__data__[keys[i]] = this.parentNode.__data__.scrollbar[keys[i]];
      }
      // Invert scale
      this.__data__.invertedHeightScale = this.__data__.heightScale.invert;
      // Store a reference to the actual node list to be scrolled
      this.__data__.contentEl = this.parentNode.querySelector('.nodes');
    })
    .on('mousedown', function (e) {
      activeScrollbar = this;
      activeScrollbar.__data__.clientY = e.clientY;

      d3.select(activeScrollbar).classed('active', true);
    });

  // We need to listen to `mouseup` and `mousemove` globally otherwise scrolling
  // will only work as long as the cursor hovers the actual scrollbar, which is
  // super annoying.
  var $document = $(document)
    .on('mouseup', function (e) {
      if (activeScrollbar) {
        let deltaY = activeScrollbar.__data__.clientY - e.clientY;
        // Save final vertical position
        // Scrollbar
        activeScrollbar.__data__.scrollTop = Math.min(
          Math.max(
            activeScrollbar.__data__.scrollTop - deltaY,
            0
          ),
          activeScrollbar.__data__.scrollHeight
        );
        // Content
        let contentEl = activeScrollbar.__data__.contentEl;
        contentEl.__data__.scrollTop = Math.max(
          Math.min(
            contentEl.__data__.scrollTop +
            activeScrollbar.__data__.invertedHeightScale(deltaY),
            0
          ),
          -contentEl.__data__.scrollHeight
        );

        d3.select(activeScrollbar).classed('active', false);

        activeScrollbar = undefined;
      }
    })
    .on('mousemove', function (e) {
      if (activeScrollbar) {
        let deltaY = activeScrollbar.__data__.clientY - e.clientY;
        // Scroll scrollbar
        scrollColumn(
          activeScrollbar,
          Math.min(
            Math.max(
              activeScrollbar.__data__.scrollTop - deltaY,
              0
            ),
            activeScrollbar.__data__.scrollHeight
          )
        );
        // Scroll content
        let contentEl = activeScrollbar.__data__.contentEl,
            contentScrollTop = Math.max(
                Math.min(
                  contentEl.__data__.scrollTop +
                  activeScrollbar.__data__.invertedHeightScale(deltaY),
                  0
                ),
                -contentEl.__data__.scrollHeight
              );
        scrollColumn(
          contentEl,
          contentScrollTop
        );
        // Scroll links
        scrollLinks(
          listGraph,
          contentEl.__data__.linkSelections.outgoing,
          contentEl.__data__.level,
          contentScrollTop,
          'source'
        );
        scrollLinks(
          listGraph,
          contentEl.__data__.linkSelections.incoming,
          contentEl.__data__.level - 1,
          contentScrollTop,
          'target'
        );
      }
    });

  function toggleColumn () {
    console.log('Toggle column');
  }

  function selectNodesColumn (el) {
    return d3.select(levels[0][d3.select(el).data()[0].level])
      .selectAll('.node');
  }

  function highlightBars (el, type, deHighlight) {
    let nodes = selectNodesColumn(el);
    nodes.selectAll('.bar.' + type)
      .classed('highlight', !deHighlight);
  }

  function sortColumn (type, globalVisData) {
    let $el = $(this);
    let d3El = d3.select(this);
    let sorting = $el.data('sortStatus');

    console.log(d3El.select('.icon-sort-unsort'));
    console.log(d3El.select('.icon-unsort').classed('visible', false));
    console.log(d3El.select('.icon-unsort').attr('class'));

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

    $el.data('sortStatus', sorting);

    let nodes = selectNodesColumn(this.parentNode);
    let dataset = nodes.data();

    dataset.sort((a, b) => {
      let valueA = a.data.barRefs[type];
      let valueB = b.data.barRefs[type];
      return valueA > valueB ? sorting : (valueA < valueB ? -sorting : 0);
    });

    let start = function () { d3.select(this).classed('sorting', true); };
    let end = function () { d3.select(this).classed('sorting', false); };

    if (sorting) {
      nodes
        .data(dataset, data => data.data.name)
        .transition()
        .duration(TRANSITION_SEMI_FAST)
        .attr('transform', (data, i) => {
          return 'translate(0, ' + (
              (i * globalVisData.row.height) - data.y
            ) + ')';
        })
        .each('start', start)
        .each('end', end);
    } else {
      nodes
        .transition()
        .duration(TRANSITION_SEMI_FAST)
        .attr('transform', 'translate(0, 0)')
        .each('start', start)
        .each('end', end);
    }
  }

  function toggleOptions () {
    console.log('Toggle options');
  }

  function addColumnControls (selection, globalVisData) {
    let controls = $(selection[0])
      .addClass('controls')
      .width(globalVisData.column.width);

    $('<li/>')
      .addClass('toggle')
      .width(globalVisData.column.padding)
      .on('click', toggleColumn)
      .appendTo(controls);

    $('<li/>')
      .addClass('sort-precision ease-all')
      .css({
        'width': globalVisData.column.contentWidth / 2,
        'left': globalVisData.column.padding,
      })
      .on('click', function () {
        sortColumn.call(this, 'precision', globalVisData);
      })
      .on('mouseenter', function () {
        highlightBars(this.parentNode, 'precision');
        $(this).css({
          'width': globalVisData.column.contentWidth - 16,
        });
      })
      .on('mouseleave', function () {
        highlightBars(this.parentNode, 'precision', true);
        $(this).css({
          'width': globalVisData.column.contentWidth / 2,
        });
      })
      .appendTo(controls)
      .append(
        '<div class="expandable-label">' +
        '  <span class="letter abbr">P</span>' +
        '  <span class="letter abbr">r</span>' +
        '  <span class="letter">e</span>' +
        '  <span class="letter abbr">c</span>' +
        '  <span class="letter">i</span>' +
        '  <span class="letter">s</span>' +
        '  <span class="letter">i</span>' +
        '  <span class="letter">o</span>' +
        '  <span class="letter">n</span>' +
        '</div>' +
        '<svg class="icon-unsort invisible-default visible">' +
        '  <use xlink:href="/dist/icons.svg#unsort"></use>' +
        '</svg>' +
        '<svg class="icon-sort-asc invisible-default">' +
        '  <use xlink:href="/dist/icons.svg#sort-asc"></use>' +
        '</svg>' +
        '<svg class="icon-sort-desc invisible-default">' +
        '  <use xlink:href="/dist/icons.svg#sort-desc"></use>' +
        '</svg>'
      );

    $('<li/>')
      .addClass('sort-recall ease-all')
      .css({
        'width': globalVisData.column.contentWidth / 2,
        'left': globalVisData.column.contentWidth / 2 +
          globalVisData.column.padding,
      })
      .on('click', function () {
        sortColumn.call(this, 'recall', globalVisData);
      })
      .on('mouseenter', function () {
        highlightBars(this.parentNode, 'recall');
        $(this).css({
          'width': globalVisData.column.contentWidth - 16,
          'left': globalVisData.column.padding + 16,
        });
      })
      .on('mouseleave', function () {
        highlightBars(this.parentNode, 'recall', true);
        $(this).css({
          'width': globalVisData.column.contentWidth / 2,
          'left': globalVisData.column.contentWidth / 2 +
            globalVisData.column.padding,
        });
      })
      .appendTo(controls)
      .append(
        '<div class="expandable-label">' +
        '  <span class="letter abbr">R</span>' +
        '  <span class="letter">e</span>' +
        '  <span class="letter abbr">c</span>' +
        '  <span class="letter">a</span>' +
        '  <span class="letter abbr">l</span>' +
        '  <span class="letter">l</span>' +
        '</div>' +
        '<svg class="icon-unsort invisible-default visible">' +
        '  <use xlink:href="/dist/icons.svg#unsort"></use>' +
        '</svg>' +
        '<svg class="icon-sort-asc invisible-default">' +
        '  <use xlink:href="/dist/icons.svg#sort-asc"></use>' +
        '</svg>' +
        '<svg class="icon-sort-desc invisible-default">' +
        '  <use xlink:href="/dist/icons.svg#sort-desc"></use>' +
        '</svg>'
      );

    $('<li/>')
      .addClass('options')
      .width(globalVisData.column.padding)
      .on('click', toggleOptions)
      .appendTo(controls)
      .append(
        '<svg class="icon-gear">' +
        '  <use xlink:href="/dist/icons.svg#gear"></use>' +
        '</svg>'
      );
  }

  // Add topbar
  let topbarControls = topbarEl.selectAll('.controls')
    .data(visData.nodes)
    .enter()
    .append('ul')
      .call(addColumnControls, visData.global);
});
