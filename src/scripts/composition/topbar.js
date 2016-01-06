'use strict';

import * as d3 from 'd3';
import * as config from './config';

const TOPBAR_EL = 'div';
const TOPBAR_CLASS = 'top-bar';

const TOPBAR_CONTROL_EL = 'ul';
const TOPBAR_CONTROL_CLASS = 'controls';
const TOPBAR_GLOBAL_CONTROL_CLASS = 'global-controls';

class Topbar {
  constructor (vis, selection, visData) {
    let that = this;

    this.vis = vis;
    this.visData = visData;
    // Add base topbar element
    this.el = selection.select('.' + TOPBAR_CLASS);

    if (this.el.empty()) {
      this.el = selection.insert(TOPBAR_EL, ':first-child')
        .attr('class', TOPBAR_CLASS);
    }

    this.controlSwitch = this.el.append('div')
      .attr('title', 'Toggle global / local topbar')
      .style('width', this.visData.global.column.padding + 'px')
      .classed('control-switch', true)
      .on('click', this.switch.bind(this));

    this.switchArrow = this.controlSwitch.append('svg').append('use')
      .attr('xlink:href', this.vis.iconPath + '#arrow-down')
      .attr('class', 'switch-arrow');

    this.globalControls = this.el.append(TOPBAR_CONTROL_EL)
      .classed(TOPBAR_GLOBAL_CONTROL_CLASS, true);

    this.globalControls.append('li')
      .attr('class', 'control-btn sort-precision')
      .text('Precision')
      .on('click', function (data) {
        that.sortAllColumns(this, 'precision');
      });

    this.globalControls.append('li')
      .attr('class', 'control-btn sort-recall')
      .text('Recall');

    this.globalControls.append('li')
      .attr('class', 'control-btn sort-name')
      .text('Name');

    this.globalControls.append('li')
      .attr('class', 'control-btn bars-one')
      .text('One bar');

    this.globalControls.append('li')
      .attr('class', 'control-btn bars-two')
      .text('Two bar');

    this.localControlWrapper = this.el.append('div')
      .classed('local-controls', true);

    this.localControls = this.localControlWrapper.selectAll(TOPBAR_CONTROL_CLASS)
      .data(visData.nodes)
      .enter()
      .append(TOPBAR_CONTROL_EL)
        .classed(TOPBAR_CONTROL_CLASS, true)
        .style('width', this.visData.global.column.width + 'px');

    /**
     * Stores current sorting, e.g. type, order and a reference to the element.
     *
     * @type  {Object}
     */
    this.currentSorting = {
      global: {},
      local: {}
    };
    this.localControls.each(function (data, index) {
      let control = d3.select(this);

      /*
       * Order:
       * 0 = unsorted
       * 1 = asc
       * -1 = desc
       */
      that.currentSorting.local[index] = {
        type: data.sortBy,
        order: data.sortOrder,
        el: undefined
      };

      control.append('li')
        .attr('class', 'control-btn toggle')
        .style('width', that.visData.global.column.padding + 'px')
        .on('click', that.toggleColumn);

      control.append('li')
        .attr('class', 'control-btn sort-precision ease-all')
        .style({
          'width': that.visData.global.column.contentWidth / 2 + 'px',
          'left': that.visData.global.column.padding + 'px',
        })
        .on('click', function (data) {
          that.sortColumn(this, data.level, 'precision');
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
          '<svg class="icon-unsort invisible-default ' + (that.currentSorting.local[index].type !== 'precision' ? 'visible' : '') + '">' +
          '  <use xlink:href="' + that.vis.iconPath + '#unsort"></use>' +
          '</svg>' +
          '<svg class="icon-sort-asc invisible-default ' + ((that.currentSorting.local[index].type === 'precision' && that.currentSorting.local[index].order === 1) ? 'visible' : '') + '">' +
          '  <use xlink:href="' + that.vis.iconPath + '#sort-asc"></use>' +
          '</svg>' +
          '<svg class="icon-sort-desc invisible-default ' + ((that.currentSorting.local[index].type === 'precision' && that.currentSorting.local[index].order !== 1) ? 'visible' : '') + '">' +
          '  <use xlink:href="' + that.vis.iconPath + '#sort-desc"></use>' +
          '</svg>'
        );

      control.append('li')
        .attr('class', 'control-btn sort-recall ease-all')
        .style({
          'width': that.visData.global.column.contentWidth / 2 + 'px',
          'left': that.visData.global.column.contentWidth / 2 +
            that.visData.global.column.padding + 'px',
        })
        .on('click', function (data) {
          that.sortColumn(this, data.level, 'recall');
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
          '<svg class="icon-unsort invisible-default ' + (that.currentSorting.local[index].type !== 'recall' ? 'visible' : '') + '">' +
          '  <use xlink:href="' + that.vis.iconPath + '#unsort"></use>' +
          '</svg>' +
          '<svg class="icon-sort-asc invisible-default ' + ((that.currentSorting.local[index].type === 'recall' && that.currentSorting.local[index].order === 1) ? 'visible' : '') + '">' +
          '  <use xlink:href="' + that.vis.iconPath + '#sort-asc"></use>' +
          '</svg>' +
          '<svg class="icon-sort-desc invisible-default ' + ((that.currentSorting.local[index].type === 'recall' && that.currentSorting.local[index].order !== 1) ? 'visible' : '') + '">' +
          '  <use xlink:href="' + that.vis.iconPath + '#sort-desc"></use>' +
          '</svg>'
        );

      control.append('li')
        .attr('class', 'control-btn options')
        .style('width', that.visData.global.column.padding + 'px')
        .on('click', that.toggleOptions)
        .html(
          '<svg class="icon-gear">' +
          '  <use xlink:href="' + that.vis.iconPath + '#gear"></use>' +
          '</svg>'
        );

      if (that.currentSorting.local[index].type) {
        that.currentSorting.local[index].el = control.select(
          '.sort-' + that.currentSorting.local[index].type
        );
      }
    });
  }

  toggleColumn () {
    console.log('Toggle column');
  }

  selectNodesColumn (el) {
    return this.vis.selectByColumn(d3.select(el).datum().level, '.node');
  }

  highlightBars (el, type, deHighlight) {
    let nodes = this.selectNodesColumn(el);
    nodes.classed('highlight-bar', !deHighlight)
      .selectAll('.bar.' + type)
      .classed('highlight', !deHighlight);
  }

  sortAllColumns (el, type) {
    if (this.currentSorting.global.type !== type) {

    }
    for (let i = this.currentSorting.length; i--;) {
      sortColumn(el, this.currentSorting[i], type);
    }
  }

  sortColumn (el, index, type) {
    let newSortType = false;

    if (this.currentSorting.local[index].el) {
      if (this.currentSorting.local[index].type !== type) {
        this.currentSorting.local[index].el.select('.icon-sort-desc')
          .classed('visible', false);
        this.currentSorting.local[index].el.select('.icon-sort-asc')
          .classed('visible', false);
        this.currentSorting.local[index].el.select('.icon-unsort')
          .classed('visible', true);
      }
    }

    if (this.currentSorting.local[index].type !== type) {
      newSortType = true;
      // Reset sort order
      this.currentSorting.local[index].order = 0;
    }

    this.currentSorting.local[index].el = d3.select(el);
    this.currentSorting.local[index].type = type;

    // -1 = desc, 1 = asc
    if (this.currentSorting.local[index].order === -1) {
      this.currentSorting.local[index].order = 1;
      this.currentSorting.local[index].el.select('.icon-sort-desc')
        .classed('visible', false);
      this.currentSorting.local[index].el.select('.icon-sort-asc')
        .classed('visible', true);
    } else {
      this.currentSorting.local[index].order = -1;
      this.currentSorting.local[index].el.select('.icon-sort-asc')
        .classed('visible', false);
      this.currentSorting.local[index].el.select('.icon-sort-desc')
        .classed('visible', true);
    }

    this.currentSorting.local[index].el.select('.icon-unsort')
      .classed('visible', false);

    this.vis.sortColumn(index, type, this.currentSorting.local[index].order, newSortType);
  }

  toggleOptions () {
    console.log('Toggle options');
  }

  switch () {
    this.el.classed('details', !this.el.classed('details'));
  }
}

export default Topbar;
