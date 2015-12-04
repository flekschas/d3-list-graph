'use strict';

import * as d3 from 'd3';
import * as config from './config';

const TOPBAR_EL = 'div';
const TOPBAR_CLASS = 'topbar';

const TOPBAR_CONTROL_EL = 'ul';
const TOPBAR_CONTROL_CLASS = 'controls';

class Topbar {
  constructor (vis, selection, visData) {
    let that = this;

    this.vis = vis;
    this.visData = visData;
    // Add base topbar element
    this.el = selection.append(TOPBAR_EL)
      .attr('class', TOPBAR_CLASS);

    this.controls = this.el.selectAll(TOPBAR_CONTROL_CLASS)
      .data(visData.nodes)
      .enter()
      .append(TOPBAR_CONTROL_EL)
        .classed(TOPBAR_CONTROL_CLASS, true)
        .style('width', this.visData.global.column.width + 'px');

    this.controls.append('li')
      .attr('class', 'toggle')
      .style('width', this.visData.global.column.padding + 'px')
      .on('click', this.toggleColumn);

    this.controls.append('li')
      .attr('class', 'sort-precision ease-all')
      .style({
        'width': this.visData.global.column.contentWidth / 2 + 'px',
        'left': this.visData.global.column.padding + 'px',
      })
      .on('click', function () {
        that.sortColumn(this, 'precision');
      })
      .on('mouseenter', function () {
        that.highlightBars(this.parentNode, 'precision');
        d3.select(this).style(
          'width',
          (that.visData.global.column.contentWidth - 16) + 'px'
        );
      })
      .on('mouseleave', function () {
        that.highlightBars(this.parentNode, 'precision', true);
        d3.select(this).style(
          'width',
          (that.visData.global.column.contentWidth / 2) + 'px'
        );
      })
      .html(
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

    this.controls.append('li')
      .attr('class', 'sort-recall ease-all')
      .style({
        'width': this.visData.global.column.contentWidth / 2 + 'px',
        'left': this.visData.global.column.contentWidth / 2 +
          this.visData.global.column.padding + 'px',
      })
      .on('click', function () {
        that.sortColumn(this, 'recall');
      })
      .on('mouseenter', function () {
        that.highlightBars(this.parentNode, 'recall');
        d3.select(this).style({
          'width': (that.visData.global.column.contentWidth - 16) + 'px',
          'left': (that.visData.global.column.padding + 16) + 'px'
        });
      })
      .on('mouseleave', function () {
        that.highlightBars(this.parentNode, 'recall', true);
        d3.select(this).style({
          'width': (that.visData.global.column.contentWidth) / 2 + 'px',
          'left': (that.visData.global.column.contentWidth / 2 +
            that.visData.global.column.padding) + 'px'
        });
      })
      .html(
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

    this.controls.append('li')
      .attr('class', 'options')
      .style('width', this.visData.global.column.padding + 'px')
      .on('click', this.toggleOptions)
      .html(
        '<svg class="icon-gear">' +
        '  <use xlink:href="/dist/icons.svg#gear"></use>' +
        '</svg>'
      );
  }

  toggleColumn () {
    console.log('Toggle column');
  }

  selectNodesColumn (el) {
    return this.vis.selectByColumn(d3.select(el).datum().level, '.node');
  }

  highlightBars (el, type, deHighlight) {
    let nodes = this.selectNodesColumn(el);
    nodes.selectAll('.bar.' + type)
      .classed('highlight', !deHighlight);
  }

  sortColumn (el, type) {
    let d3El = d3.select(el);
    let sorting = d3El.datum().sortStatus;

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

    let nodes = this.selectNodesColumn(el.parentNode);
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
        .duration(config.TRANSITION_SEMI_FAST)
        .attr('transform', (data, i) => {
          return 'translate(0, ' + (
              (i * this.visData.global.row.height) - data.y
            ) + ')';
        })
        .each('start', start)
        .each('end', end);
    } else {
      nodes
        .transition()
        .duration(config.TRANSITION_SEMI_FAST)
        .attr('transform', 'translate(0, 0)')
        .each('start', start)
        .each('end', end);
    }
  }

  toggleOptions () {
    console.log('Toggle options');
  }
}

export default Topbar;
