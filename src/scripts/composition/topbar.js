// External
import * as d3 from 'd3';  // eslint-disable-line import/no-unresolved

const TOPBAR_EL = 'div';
const TOPBAR_CLASS = 'top-bar';

const TOPBAR_CONTROL_EL = 'ul';
const TOPBAR_CONTROL_CLASS = 'controls';
const TOPBAR_GLOBAL_CONTROL_CLASS = 'global-controls';

class Topbar {
  /**
   * Topbar constructor
   *
   * @method  constructor
   * @author  Fritz Lekschas
   * @date    2016-10-02
   * @param   {Object}  vis      List Graph App.
   * @param   {Object}  baseEl   D3 base selection.
   * @param   {Object}  visData  List Graph App data.
   */
  constructor (vis, baseEl, visData) {
    const self = this;

    this.vis = vis;
    this.visData = visData;
    // Add base topbar element
    this.el = baseEl.select('.' + TOPBAR_CLASS);

    if (this.el.empty()) {
      this.el = baseEl.insert(TOPBAR_EL, ':first-child')
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
        if (self.vis.currentSorting.global.type === 'precision') {
          // Save currently active element. Needed when when re-sorting for the
          // first time, to be able to de-highlight this element.
          self.vis.currentSorting.global.el = d3.select(this);
          return true;
        }
        return false;
      })
      .on('click', function () {
        self.sortAllColumns(this, 'precision');
      })
      .on('mouseenter', () => {
        this.vis.interactionWrapper.call(this.vis, () => {
          this.highlightBars(undefined, 'precision');
        }, []);
      })
      .on('mouseleave', () => {
        this.vis.interactionWrapper.call(this.vis, () => {
          this.highlightBars(undefined, 'precision', true);
        }, []);
      });

    this.globalPrecisionWrapper = this.globalPrecision.append('div')
      .attr('class', 'wrapper');

    this.globalPrecisionWrapper.append('span')
      .attr('class', 'label')
      .text('Precision');

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
        if (self.vis.currentSorting.global.type === 'recall') {
          // See precision
          self.vis.currentSorting.global.el = d3.select(this);
          return true;
        }
        return false;
      })
      .on('click', function () {
        self.sortAllColumns(this, 'recall');
      })
      .on('mouseenter', () => {
        this.vis.interactionWrapper.call(this.vis, () => {
          this.highlightBars(undefined, 'recall');
        }, []);
      })
      .on('mouseleave', () => {
        this.vis.interactionWrapper.call(this.vis, () => {
          this.highlightBars(undefined, 'recall', true);
        }, []);
      });

    this.globalRecallWrapper = this.globalRecall.append('div')
      .attr('class', 'wrapper');

    this.globalRecallWrapper.append('span')
      .attr('class', 'label')
      .text('Recall');

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
        if (self.vis.currentSorting.global.type === 'name') {
          // See precision
          self.vis.currentSorting.global.el = d3.select(this);
          return true;
        }
        return false;
      })
      .on('click', function () {
        self.sortAllColumns(this, 'name');
      })
      .on('mouseenter', () => {
        this.vis.interactionWrapper.call(this.vis, () => {
          this.highlightLabels();
        }, []);
      })
      .on('mouseleave', () => {
        this.vis.interactionWrapper.call(this.vis, () => {
          this.highlightLabels(true);
        }, []);
      });

    this.globalNameWrapper = this.globalName.append('div')
      .attr('class', 'wrapper');

    this.globalNameWrapper.append('span')
      .attr('class', 'label')
      .text('Name');

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
        self.switchBarMode(this, 'one');
      });

    this.globalOneBarWrapper = this.globalOneBar.append('div')
      .attr('class', 'wrapper')
      .text('One bar');

    this.globalOneBarWrapper.append('svg')
      .attr('class', 'icon-one-bar')
      .append('use')
        .attr('xlink:href', this.vis.iconPath + '#one-bar');

    // Add button for switching to 'two bars'
    this.globalTwoBars = this.globalControls.append('li')
      .attr('class', 'control-btn two-bars')
      .classed('active', this.vis.barMode === 'two')
      .on('click', function () {
        self.switchBarMode(this, 'two');
      });

    this.globalTwoBarsWrapper = this.globalTwoBars.append('div')
      .attr('class', 'wrapper')
      .text('Two bars');

    this.globalTwoBarsWrapper.append('svg')
      .attr('class', 'icon-two-bars')
      .append('use')
        .attr('xlink:href', this.vis.iconPath + '#two-bars');

    // Add button for zoom-out
    this.globalZoomOut = this.globalControls.append('li')
      .attr('class', 'control-btn zoom-out')
      .classed('active', this.vis.zoomedOut)
      .on('mouseenter', () => {
        this.vis.interactionWrapper.call(this.vis, () => {
          this.vis.globalView.call(this.vis);
        }, []);
      })
      .on('mouseleave', () => {
        this.vis.interactionWrapper.call(this.vis, () => {
          this.vis.zoomedView.call(this.vis);
        }, []);
      })
      .on('click', function () {
        self.vis.toggleView.call(self.vis);
        d3.select(this).classed('active', self.vis.zoomedOut);
      });

    this.globalZoomOutWrapper = this.globalZoomOut.append('div')
      .attr('class', 'wrapper')
      .text('Zoom Out');

    this.globalZoomOutWrapper.append('svg')
      .attr('class', 'icon-zoom-out')
      .append('use')
        .attr('xlink:href', this.vis.iconPath + '#zoom-out');

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
      self.vis.currentSorting.local[index] = {
        type: data.sortBy,
        order: data.sortOrder,
        el: undefined
      };

      control.append('li')
        .attr('class', 'control-btn toggle')
        .style('width', self.visData.global.column.padding + 'px')
        .on('click', self.toggleColumn);

      control.append('li')
        .attr('class', 'control-btn sort-precision ease-all')
        .classed('active', function () {
          if (self.vis.currentSorting.local[index].type === 'precision') {
            // See precision
            self.vis.currentSorting.local[index].el = d3.select(this);
            return true;
          }
          return false;
        })
        .style('width', (self.visData.global.column.contentWidth / 2) + 'px')
        .style('left', self.visData.global.column.padding + 'px')
        .on('click', function (controlData) {
          self.sortColumn(this, controlData.level, 'precision');
        })
        .on('mouseenter', function () {
          self.highlightBars(this.parentNode, 'precision');
          d3.select(this).style(
            'width',
            (self.visData.global.column.contentWidth - 16) + 'px'
          );
        })
        .on('mouseleave', function () {
          self.highlightBars(this.parentNode, 'precision', true);
          d3.select(this).style(
            'width',
            (self.visData.global.column.contentWidth / 2) + 'px'
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
          '<svg class="icon-unsort invisible-default ' + (self.vis.currentSorting.local[index].type !== 'precision' ? 'visible' : '') + '">' +  // eslint-disable-line
          '  <use xlink:href="' + self.vis.iconPath + '#unsort"></use>' +
          '</svg>' +
          '<svg class="icon-sort-asc invisible-default ' + ((self.vis.currentSorting.local[index].type === 'precision' && self.vis.currentSorting.local[index].order === 1) ? 'visible' : '') + '">' +  // eslint-disable-line
          '  <use xlink:href="' + self.vis.iconPath + '#sort-asc"></use>' +
          '</svg>' +
          '<svg class="icon-sort-desc invisible-default ' + ((self.vis.currentSorting.local[index].type === 'precision' && self.vis.currentSorting.local[index].order !== 1) ? 'visible' : '') + '">' +  // eslint-disable-line
          '  <use xlink:href="' + self.vis.iconPath + '#sort-desc"></use>' +
          '</svg>'
        );

      control.append('li')
        .attr('class', 'control-btn sort-recall ease-all')
        .classed('active', function () {
          if (self.vis.currentSorting.local[index].type === 'recall') {
            // See recall
            self.vis.currentSorting.local[index].el = d3.select(this);
            return true;
          }
          return false;
        })
        .style('width', (self.visData.global.column.contentWidth / 2) + 'px')
        .style(
          'left',
          (self.visData.global.column.contentWidth / 2) +
            self.visData.global.column.padding + 'px'
        )
        .on('click', function (controlData) {
          self.sortColumn(this, controlData.level, 'recall');
        })
        .on('mouseenter', function () {
          self.highlightBars(this.parentNode, 'recall');
          d3.select(this)
          .style('width', (self.visData.global.column.contentWidth - 16) + 'px')
          .style('left', (self.visData.global.column.padding + 16) + 'px');
        })
        .on('mouseleave', function () {
          self.highlightBars(this.parentNode, 'recall', true);
          d3.select(this)
            .style('width', (self.visData.global.column.contentWidth / 2) + 'px')
            .style('left', ((self.visData.global.column.contentWidth / 2) +
                self.visData.global.column.padding) + 'px'
            );
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
          '<svg class="icon-unsort invisible-default ' + (self.vis.currentSorting.local[index].type !== 'recall' ? 'visible' : '') + '">' +  // eslint-disable-line
          '  <use xlink:href="' + self.vis.iconPath + '#unsort"></use>' +
          '</svg>' +
          '<svg class="icon-sort-asc invisible-default ' + ((self.vis.currentSorting.local[index].type === 'recall' && self.vis.currentSorting.local[index].order === 1) ? 'visible' : '') + '">' +  // eslint-disable-line
          '  <use xlink:href="' + self.vis.iconPath + '#sort-asc"></use>' +
          '</svg>' +
          '<svg class="icon-sort-desc invisible-default ' + ((self.vis.currentSorting.local[index].type === 'recall' && self.vis.currentSorting.local[index].order !== 1) ? 'visible' : '') + '">' +  // eslint-disable-line
          '  <use xlink:href="' + self.vis.iconPath + '#sort-desc"></use>' +
          '</svg>'
        );

      control.append('li')
        .attr('class', 'control-btn options')
        .style('width', self.visData.global.column.padding + 'px')
        .on('click', self.toggleOptions)
        .html(
          '<svg class="icon-gear">' +
          '  <use xlink:href="' + self.vis.iconPath + '#gear"></use>' +
          '</svg>'
        );

      if (self.vis.currentSorting.local[index].type) {
        self.vis.currentSorting.local[index].el = control.select(
          '.sort-' + self.vis.currentSorting.local[index].type
        );
      }
    });
  }

  /**
   * Select nodes by level by button.
   *
   * @method  selectNodesLevel
   * @author  Fritz Lekschas
   * @date    2016-10-02
   * @param   {Object}  el  DOM element.
   * @return  {Object}      D3 selection of nodes.
   */
  selectNodesLevel (el) {
    return this.vis.selectByLevel(d3.select(el).datum().level, '.node');
  }

  /**
   * Highlight node labels
   *
   * @method  highlightLabels
   * @author  Fritz Lekschas
   * @date    2016-10-02
   * @param   {Boolean}  deHighlight  If `true` the highlighting will be reset.
   */
  highlightLabels (deHighlight) {
    this.vis.baseElD3.selectAll('.node')
      .classed('highlight-label', !deHighlight);
  }

  /**
   * Highlight bars.
   *
   * @method  highlightBars
   * @author  Fritz Lekschas
   * @date    2016-10-02
   * @param   {Object}   el           DOM element.
   * @param   {String}   type         Name of the nodes to be highlighted.
   * @param   {Boolean}  deHighlight  If `true` the highlighting will be reset.
   */
  highlightBars (el, type, deHighlight) {
    const nodes = el ?
      this.selectNodesLevel(el) : this.vis.baseElD3.selectAll('.node');

    nodes.classed('highlight-bar', !deHighlight)
      .selectAll('.bar.' + type)
      .classed('highlight', !deHighlight);
  }

  /**
   * Sort all columns
   *
   * @method  sortAllColumns
   * @author  Fritz Lekschas
   * @date    2016-10-02
   * @param   {Object}  el    DOM element.
   * @param   {String}  type  Property to be sorted by.
   */
  sortAllColumns (el, type) {
    const newSortType = this.vis.currentSorting.global.type !== type;

    if (newSortType) {
      if (this.semiActiveSortingEls) {
        this.resetSemiActiveSortingEls();
      }
      // Unset class of previous global sorting element
      if (this.vis.currentSorting.global.el) {
        this.resetSortEl(this.vis.currentSorting.global.el, type);
      }
    }

    this.vis.currentSorting.global.el = d3.select(el);
    this.vis.currentSorting.global.el.classed('active', true);
    this.vis.currentSorting.global.type = type;

    const columnKeys = Object.keys(this.vis.currentSorting.local);
    for (let i = 0, len = columnKeys.length; i < len; i++) {
      // Update local sorting properties and buttons but do **not** sort
      // locally!
      this.sortColumn(el, columnKeys[i], type, true);
    }

    this.vis.sortAllColumns(type, newSortType);
  }

  /**
   * Sort a column of nodes.
   *
   * @method  sortColumn
   * @author  Fritz Lekschas
   * @date    2016-10-02
   * @param   {Object}   el      DOM element.
   * @param   {Number}   index   Index of the column.
   * @param   {String}   type    Property to be sorted by.
   * @param   {Boolean}  global  If `true` its global sorting.
   */
  sortColumn (el, index, type, global) {
    // Reset global sorting
    if (!global) {
      if (this.semiActiveSortingEls) {
        this.resetSemiActiveSortingEls();
      }
      if (this.vis.currentSorting.global.type) {
        this.resetSortEl(this.vis.currentSorting.global.el, type);
      }
      this.vis.currentSorting.global.type = undefined;
    }

    let newSortType = false;

    if (this.vis.currentSorting.local[index].el) {
      if (this.vis.currentSorting.local[index].type !== type) {
        this.resetSortEl(this.vis.currentSorting.local[index].el, type);
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

    this.vis.currentSorting.local[index].el.classed('active', true);

    if (!global) {
      this.vis.sortColumn(
        index,
        type,
        this.vis.currentSorting.local[index].order,
        newSortType
      );
    }
  }

  /**
   * Reset the visual status of the sort button
   *
   * @method  resetSortEl
   * @author  Fritz Lekschas
   * @date    2016-10-02
   * @param   {Object}   el       DOM element.
   * @param   {String}   newType  New sort type.
   */
  resetSortEl (el, newType) {
    el.classed('active', false);
    el.select('.icon-sort-desc').classed('visible', false);
    el.select('.icon-sort-asc').classed('visible', false);
    el.select('.icon-unsort').classed('visible', true);
    if (newType === 'name') {
      el.classed('semi-active', true);
      this.semiActiveSortingEls = true;
    }
  }

  /**
   * Reset semi-active sort button
   *
   * @method  resetSemiActiveSortingEls
   * @author  Fritz Lekschas
   * @date    2016-10-02
   */
  resetSemiActiveSortingEls () {
    this.el.selectAll('.semi-active').classed('semi-active', false);
  }

  /**
   * Toggle between the global topbar buttons and the local sort buttons.
   *
   * @method  switch
   * @author  Fritz Lekschas
   * @date    2016-10-02
   */
  switch () {
    this.el.classed('details', !this.el.classed('details'));
  }

  /**
   * Switch bar mode.
   *
   * @method  switchBarMode
   * @author  Fritz Lekschas
   * @date    2016-10-02
   * @param   {Object}  el    DOM element.
   * @param   {String}  mode  Bar mode to be switched to. Can be ['one', 'two'].
   */
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
