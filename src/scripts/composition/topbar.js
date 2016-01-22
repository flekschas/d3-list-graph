// External
import * as d3 from 'd3';

const TOPBAR_EL = 'div';
const TOPBAR_CLASS = 'top-bar';

const TOPBAR_CONTROL_EL = 'ul';
const TOPBAR_CONTROL_CLASS = 'controls';
const TOPBAR_GLOBAL_CONTROL_CLASS = 'global-controls';

class Topbar {
  constructor (vis, selection, visData) {
    const that = this;

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

    // Add button for sorting by precision
    this.globalPrecision = this.globalControls.append('li')
      .attr('class', 'control-btn sort-precision')
      .classed('active', function () {
        if (that.vis.currentSorting.global.type === 'precision') {
          // Save currently active element. Needed when when re-sorting for the
          // first time, to be able to de-highlight this element.
          that.vis.currentSorting.global.el = d3.select(this);
          return true;
        }
      })
      .on('click', function () {
        that.sortAllColumns(this, 'precision');
      })
      .on(
        'mouseenter',
        () => this.highlightBars(undefined, 'precision')
      )
      .on(
        'mouseleave',
        () => this.highlightBars(undefined, 'precision', true)
      );

    this.globalPrecisionWrapper = this.globalPrecision.append('div')
      .attr('class', 'wrapper')
      .text('Precision')
      .style('margin', '0 ' + this.visData.global.column.padding + 'px');

    this.globalPrecisionWrapper.append('svg')
      .attr('class', 'icon-unsort invisible-default')
      .classed('visible', this.vis.currentSorting.global.type !== 'precision')
      .append('use')
        .attr('xlink:href', this.vis.iconPath + '#unsort');

    this.globalPrecisionWrapper.append('svg')
      .attr('class', 'icon-sort-asc invisible-default')
      .classed(
        'visible',
        this.vis.currentSorting.global.type === 'precision' &&
          this.vis.currentSorting.global.order === 1
      )
      .append('use')
        .attr('xlink:href', this.vis.iconPath + '#sort-asc');

    this.globalPrecisionWrapper.append('svg')
      .attr('class', 'icon-sort-desc invisible-default')
      .classed(
        'visible',
        this.vis.currentSorting.global.type === 'precision' &&
          this.vis.currentSorting.global.order !== 1
        )
      .append('use')
        .attr('xlink:href', this.vis.iconPath + '#sort-desc');

    // Add button for sorting by recall
    this.globalRecall = this.globalControls.append('li')
      .attr('class', 'control-btn sort-recall')
      .classed('active', function () {
        if (that.vis.currentSorting.global.type === 'recall') {
          // See precision
          that.vis.currentSorting.global.el = d3.select(this);
          return true;
        }
      })
      .on('click', function () {
        that.sortAllColumns(this, 'recall');
      })
      .on(
        'mouseenter',
        () => this.highlightBars(undefined, 'recall')
      )
      .on(
        'mouseleave',
        () => this.highlightBars(undefined, 'recall', true)
      );

    this.globalRecallWrapper = this.globalRecall.append('div')
      .attr('class', 'wrapper')
      .text('Recall')
      .style('margin', '0 ' + this.visData.global.column.padding + 'px');

    this.globalRecallWrapper.append('svg')
      .attr('class', 'icon-unsort invisible-default')
      .classed('visible', this.vis.currentSorting.global.type !== 'recall')
      .append('use')
        .attr('xlink:href', this.vis.iconPath + '#unsort');

    this.globalRecallWrapper.append('svg')
      .attr('class', 'icon-sort-asc invisible-default')
      .classed(
        'visible',
        this.vis.currentSorting.global.type === 'recall' &&
          this.vis.currentSorting.global.order === 1
        )
      .append('use')
        .attr('xlink:href', this.vis.iconPath + '#sort-asc');

    this.globalRecallWrapper.append('svg')
      .attr('class', 'icon-sort-desc invisible-default')
      .classed(
        'visible',
        this.vis.currentSorting.global.type === 'recall' &&
          this.vis.currentSorting.global.order !== 1
        )
      .append('use')
        .attr('xlink:href', this.vis.iconPath + '#sort-desc');

    // Add button for sorting by name
    this.globalName = this.globalControls.append('li')
      .attr('class', 'control-btn sort-name')
      .classed('active', function () {
        if (that.vis.currentSorting.global.type === 'name') {
          // See precision
          that.vis.currentSorting.global.el = d3.select(this);
          return true;
        }
      })
      .on('click', function () {
        that.sortAllColumns(this, 'name');
      })
      .on(
        'mouseenter',
        () => this.highlightLabels()
      )
      .on(
        'mouseleave',
        () => this.highlightLabels(true)
      );

    this.globalNameWrapper = this.globalName.append('div')
      .attr('class', 'wrapper')
      .text('Name')
      .style('margin', '0 ' + this.visData.global.column.padding + 'px');

    this.globalNameWrapper.append('svg')
      .attr('class', 'icon-unsort invisible-default')
      .classed('visible', this.vis.currentSorting.global.type !== 'name')
      .append('use')
        .attr('xlink:href', this.vis.iconPath + '#unsort');

    this.globalNameWrapper.append('svg')
      .attr('class', 'icon-sort-asc invisible-default')
      .classed(
        'visible',
        this.vis.currentSorting.global.type === 'name' &&
          this.vis.currentSorting.global.order === 1
        )
      .append('use')
        .attr('xlink:href', this.vis.iconPath + '#sort-alpha-asc');

    this.globalNameWrapper.append('svg')
      .attr('class', 'icon-sort-desc invisible-default')
      .classed(
        'visible',
        this.vis.currentSorting.global.type === 'name' &&
          this.vis.currentSorting.global.order !== 1
        )
      .append('use')
        .attr('xlink:href', this.vis.iconPath + '#sort-alpha-desc');

    // Add button for switching to 'one bar'
    this.globalOneBar = this.globalControls.append('li')
      .attr('class', 'control-btn one-bar')
      .classed('active', this.vis.barMode === 'one')
      .on('click', function () {
        that.switchBarMode(this, 'one');
      });

    this.globalOneBarWrapper = this.globalOneBar.append('div')
      .attr('class', 'wrapper')
      .text('One bar')
      .style('margin', '0 ' + this.visData.global.column.padding + 'px');

    this.globalOneBarWrapper.append('svg')
      .attr('class', 'icon-one-bar')
      .append('use')
        .attr('xlink:href', this.vis.iconPath + '#one-bar');

    // Add button for switching to 'two bars'
    this.globalTwoBars = this.globalControls.append('li')
      .attr('class', 'control-btn two-bars')
      .classed('active', this.vis.barMode === 'two')
      .on('click', function () {
        that.switchBarMode(this, 'two');
      });

    this.globalTwoBarsWrapper = this.globalTwoBars.append('div')
      .attr('class', 'wrapper')
      .text('Two bars')
      .style('margin', '0 ' + this.visData.global.column.padding + 'px');

    this.globalTwoBarsWrapper.append('svg')
      .attr('class', 'icon-two-bars')
      .append('use')
        .attr('xlink:href', this.vis.iconPath + '#two-bars');

    this.localControlWrapper = this.el.append('div')
      .classed('local-controls', true);

    this.localControls = this.localControlWrapper
      .selectAll(TOPBAR_CONTROL_CLASS)
        .data(visData.nodes)
        .enter()
        .append(TOPBAR_CONTROL_EL)
          .classed(TOPBAR_CONTROL_CLASS, true)
          .style('width', this.visData.global.column.width + 'px');


    this.localControls.each(function (data, index) {
      const control = d3.select(this);

      /*
       * Order:
       * 0 = unsorted
       * 1 = asc
       * -1 = desc
       */
      that.vis.currentSorting.local[index] = {
        type: data.sortBy,
        order: data.sortOrder,
        el: undefined,
      };

      control.append('li')
        .attr('class', 'control-btn toggle')
        .style('width', that.visData.global.column.padding + 'px')
        .on('click', that.toggleColumn);

      control.append('li')
        .attr('class', 'control-btn sort-precision ease-all')
        .style({
          width: that.visData.global.column.contentWidth / 2 + 'px',
          left: that.visData.global.column.padding + 'px',
        })
        .on('click', function (controlData) {
          that.sortColumn(this, controlData.level, 'precision');
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
          '<svg class="icon-unsort invisible-default ' + (that.vis.currentSorting.local[index].type !== 'precision' ? 'visible' : '') + '">' +  // eslint-disable-line
          '  <use xlink:href="' + that.vis.iconPath + '#unsort"></use>' +
          '</svg>' +
          '<svg class="icon-sort-asc invisible-default ' + ((that.vis.currentSorting.local[index].type === 'precision' && that.vis.currentSorting.local[index].order === 1) ? 'visible' : '') + '">' +  // eslint-disable-line
          '  <use xlink:href="' + that.vis.iconPath + '#sort-asc"></use>' +
          '</svg>' +
          '<svg class="icon-sort-desc invisible-default ' + ((that.vis.currentSorting.local[index].type === 'precision' && that.vis.currentSorting.local[index].order !== 1) ? 'visible' : '') + '">' +  // eslint-disable-line
          '  <use xlink:href="' + that.vis.iconPath + '#sort-desc"></use>' +
          '</svg>'
        );

      control.append('li')
        .attr('class', 'control-btn sort-recall ease-all')
        .style({
          width: that.visData.global.column.contentWidth / 2 + 'px',
          left: that.visData.global.column.contentWidth / 2 +
            that.visData.global.column.padding + 'px',
        })
        .on('click', function (controlData) {
          that.sortColumn(this, controlData.level, 'recall');
        })
        .on('mouseenter', function () {
          that.highlightBars(this.parentNode, 'recall');
          d3.select(this).style({
            width: (that.visData.global.column.contentWidth - 16) + 'px',
            left: (that.visData.global.column.padding + 16) + 'px',
          });
        })
        .on('mouseleave', function () {
          that.highlightBars(this.parentNode, 'recall', true);
          d3.select(this).style({
            width: (that.visData.global.column.contentWidth) / 2 + 'px',
            left: (that.visData.global.column.contentWidth / 2 +
              that.visData.global.column.padding) + 'px',
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
          '<svg class="icon-unsort invisible-default ' + (that.vis.currentSorting.local[index].type !== 'recall' ? 'visible' : '') + '">' +  // eslint-disable-line
          '  <use xlink:href="' + that.vis.iconPath + '#unsort"></use>' +
          '</svg>' +
          '<svg class="icon-sort-asc invisible-default ' + ((that.vis.currentSorting.local[index].type === 'recall' && that.vis.currentSorting.local[index].order === 1) ? 'visible' : '') + '">' +  // eslint-disable-line
          '  <use xlink:href="' + that.vis.iconPath + '#sort-asc"></use>' +
          '</svg>' +
          '<svg class="icon-sort-desc invisible-default ' + ((that.vis.currentSorting.local[index].type === 'recall' && that.vis.currentSorting.local[index].order !== 1) ? 'visible' : '') + '">' +  // eslint-disable-line
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

      if (that.vis.currentSorting.local[index].type) {
        that.vis.currentSorting.local[index].el = control.select(
          '.sort-' + that.vis.currentSorting.local[index].type
        );
      }
    });
  }

  // toggleColumn () {
  //   console.log('Toggle column');
  // }

  selectNodesLevel (el) {
    return this.vis.selectByLevel(d3.select(el).datum().depth, '.node');
  }

  highlightLabels (deHighlight) {
    this.vis.baseElD3.selectAll('.node')
      .classed('highlight-label', !deHighlight);
  }

  highlightBars (el, type, deHighlight) {
    const nodes = el ?
      this.selectNodesLevel(el) : this.vis.baseElD3.selectAll('.node');

    nodes.classed('highlight-bar', !deHighlight)
      .selectAll('.bar.' + type)
      .classed('highlight', !deHighlight);
  }

  sortAllColumns (el, type) {
    if (this.vis.currentSorting.global.type !== type) {
      // Unset class of previous global sorting element
      if (this.vis.currentSorting.global.el) {
        this.resetSortEl(this.vis.currentSorting.global.el);
      }
    }

    this.vis.currentSorting.global.el = d3.select(el);
    this.vis.currentSorting.global.el.classed('active', true);
    this.vis.currentSorting.global.type = type;

    const columnKeys = Object.keys(this.vis.currentSorting.local);
    for (let i = 0, len = columnKeys.length; i < len; i++) {
      this.sortColumn(el, columnKeys[i], type, true);
    }
  }

  sortColumn (el, index, type, global) {
    // Reset global sorting
    if (!global) {
      this.vis.currentSorting.global.type = undefined;
      this.resetSortEl(this.vis.currentSorting.global.el);
    }

    let newSortType = false;

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
      this.vis.currentSorting.local[index].el.select('.icon-sort-desc')
        .classed('visible', false);
      this.vis.currentSorting.local[index].el.select('.icon-sort-asc')
        .classed('visible', true);
    } else {
      this.vis.currentSorting.local[index].order = -1;
      this.vis.currentSorting.local[index].el.select('.icon-sort-asc')
        .classed('visible', false);
      this.vis.currentSorting.local[index].el.select('.icon-sort-desc')
        .classed('visible', true);
    }

    this.vis.currentSorting.local[index].el.select('.icon-unsort')
      .classed('visible', false);

    this.vis.sortColumn(
      index,
      type,
      this.vis.currentSorting.local[index].order,
      newSortType
    );
  }

  resetSortEl (el) {
    el.classed('active', false);
    el.select('.icon-sort-desc').classed('visible', false);
    el.select('.icon-sort-asc').classed('visible', false);
    el.select('.icon-unsort').classed('visible', true);
  }

  // toggleOptions () {
  //   console.log('Toggle options');
  // }

  switch () {
    this.el.classed('details', !this.el.classed('details'));
  }

  switchBarMode (el, mode) {
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
}

export default Topbar;
