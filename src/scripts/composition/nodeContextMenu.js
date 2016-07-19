// External
import Promise from '../../../node_modules/es6-promise/lib/es6-promise/promise';
import debounce from '../../../node_modules/lodash-es/debounce';

// Internal
import { dropMenu } from '../commons/charts';
import { requestNextAnimationFrame } from '../commons/shims';
import { allTransitionsEnded } from '../commons/d3-utils';

const CLASS_NAME = 'context-menu';
const CLASS_CHECKBOX = 'checkbox';
const ARROW_SIZE = 6;
const TRANSITION_SPEED = 125;
const BUTTON_QUERY_DEBOUNCE = 666;
const BUTTON_ROOT_DEBOUNCE = 500;
const BUTTON_DEFAULT_DEBOUNCE = 150;
const BUTTON_BAM_EFFECT_ANIMATION_TIME = 700;

class NodeContextMenu {
  constructor (vis, visData, baseEl, events, querying, infoFields) {
    const that = this;

    this._x = 0;
    this._y = 0;
    this._yOffset = 0;
    this._scale = 0;

    this.vis = vis;
    this.visData = visData;
    this.baseEl = baseEl;
    this.events = events;
    this.querying = querying;
    this.infoFields = infoFields;

    this.numButtonRows = 1;
    this.numButtonRows = this.querying ?
      ++this.numButtonRows : this.numButtonRows;
    this.numButtonRows = this.infoFields && this.infoFields.length ?
      ++this.numButtonRows : this.numButtonRows;

    this.height = this.visData.global.row.height * this.numButtonRows;
    this.toBottom = false;

    this.nodeInfoId = 0;

    this.wrapper = this.baseEl.append('g')
      .attr('class', CLASS_NAME);

    this.updateAppearance();

    this.bgBorder = this.wrapper.append('path')
      .attr('class', 'bgBorder')
      .attr('d', dropMenu({
        x: -1,
        y: -1,
        width: this.visData.global.column.width + 2,
        height: this.height + 2,
        radius: ARROW_SIZE - 2,
        arrowSize: ARROW_SIZE
      }));

    this.bg = this.wrapper.append('path')
      .attr('class', 'bg')
      .attr('d', dropMenu({
        x: 0,
        y: 0,
        width: this.visData.global.column.width,
        height: this.height,
        radius: ARROW_SIZE - 1,
        arrowSize: ARROW_SIZE
      }))
      .style('filter', 'url(#drop-shadow-context-menu)');

    if (this.infoFields && this.infoFields.length) {
      this.textNodeInfo = this.wrapper.append('g')
        .call(this.createTextField.bind(this), {
          alignRight: false,
          classNames: [],
          distanceFromCenter: this.querying ? 2 : 1,
          fullWidth: true,
          labels: this.infoFields
        });

      if (this.infoFields.length > 1) {
        const toggler = this.textNodeInfo.append('g')
          .attr('class', 'toggler')
          .on('click', function () {
            that.clickNodeInfo.call(that, this);
          });

        const togglerX = this.visData.global.column.width -
          this.visData.global.row.contentHeight -
          this.visData.global.row.padding +
          this.visData.global.cell.padding;

        const togglerY = this.visData.global.row.padding +
          this.visData.global.cell.padding;

        toggler.append('rect')
          .attr('class', 'bg')
          .attr('x', togglerX)
          .attr('y', togglerY)
          .attr('width', this.visData.global.row.contentHeight)
          .attr('height', this.visData.global.row.contentHeight);

        toggler.append('use')
          .attr(
            'x', togglerX + ((this.visData.global.row.contentHeight - 10) / 2)
          )
          .attr(
            'y', togglerY + ((this.visData.global.row.contentHeight - 10) / 2)
          )
          .attr('width', 10)
          .attr('height', 10)
          .attr('xlink:href', this.vis.iconPath + '#arrow-right');
      }
    }

    if (this.querying) {
      this.buttonQuery = this.wrapper.append('g')
        .call(this.createButton.bind(this), {
          alignRight: false,
          classNames: [],
          distanceFromCenter: 1,
          fullWidth: true,
          label: 'Query',
          labelTwo: true,
          bamEffect: true
        })
        .on('click', function () {
          that.clickQueryHandler.call(that, this);
        });
      this.buttonQueryFill = this.buttonQuery.select('.bg-fill-effect');
      this.buttonQueryBamEffect = this.buttonQuery.select('.bg-bam-effect');
    }

    this.buttonRoot = this.wrapper.append('g')
      .call(this.createButton.bind(this), {
        alignRight: false,
        classNames: [],
        distanceFromCenter: 0,
        fullWidth: false,
        label: 'Root'
      })
      .on('click', function () {
        that.clickRootHandler.call(that, this);
      });
    this.buttonRootFill = this.buttonRoot.select('.bg-fill-effect');
    this.checkboxRoot = this.createCheckbox(this.buttonRoot);

    this.buttonLock = this.wrapper.append('g')
      .call(this.createButton.bind(this), {
        alignRight: true,
        classNames: [],
        distanceFromCenter: 0,
        fullWidth: false,
        label: 'Lock',
        bamEffect: true
      })
      .on('click', function () {
        that.clickLockHandler.call(that, this);
      });
    this.buttonLockFill = this.buttonLock.select('.bg-fill-effect');
    this.buttonLockBamEffect = this.buttonLock.select('.bg-bam-effect');
    this.checkboxLock = this.createCheckbox(this.buttonLock);

    this.components = this.wrapper.selectAll('.component');

    this.debouncedQueryHandler = debounce(
      this.queryHandler, BUTTON_QUERY_DEBOUNCE
    );
    this.debouncedRootHandler = debounce(
      this.rootHandler, BUTTON_ROOT_DEBOUNCE
    );
  }

  /* ---------------------------------------------------------------------------
   * Getter / Setter
   * ------------------------------------------------------------------------ */

  get scale () {
    return 'scale(' + (this.opened ? 1 : 0.5) + ')';
  }

  get translate () {
    const y = this.toBottom ?
      this._y + this.height + this.visData.global.row.height - ARROW_SIZE :
      this._y;

    return 'translate(' + this._x + 'px,' + (y + this._yOffset) + 'px)';
  }

  set translate (position) {
    this._x = position.x;
    this._y = position.y;
  }

  /* ---------------------------------------------------------------------------
   * Methods
   * ------------------------------------------------------------------------ */

  /* ---------------------------------- A ----------------------------------- */

  addLabel (selection, fullWidth, label, labelTwo) {
    const width = this.visData.global.column.width *
      (fullWidth ? 1 : 0.5) - this.visData.global.row.padding * 4;
    const height = this.visData.global.row.contentHeight -
        this.visData.global.cell.padding * 2;

    const div = selection.append('foreignObject')
      .attr('x', this.visData.global.row.padding * 2)
      .attr('y', this.visData.global.row.padding +
        this.visData.global.cell.padding)
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'label-wrapper')
      .append('xhtml:div')
        .style('line-height', (height - 2) + 'px')
        .style('width', width + 'px');

    div.append('xhtml:span').attr('class', 'label').text(label);

    if (labelTwo) {
      div.append('xhtml:span').attr('class', 'separator').text(':');
      div.append('xhtml:span').attr('class', 'label-two');
    }
  }

  /* ---------------------------------- C ----------------------------------- */

  checkLock () {
    const checked = this.node.datum().data.state.lock;
    this.buttonLock.classed('semi-active', checked);
    this.checkboxLock.style(
      'transform',
      'translateX(' + (checked ? this.checkBoxMovement : 0) + 'px)'
    );
    if (checked) {
      this.fillButton(this.buttonLockFill);
    } else {
      this.emptyButton(this.buttonLockFill);
    }
    return checked;
  }

  checkOrientation () {
    if (this._y + this._yOffset >= 0) {
      this.toBottom = false;
    } else {
      this.toBottom = true;
    }
    this.components.call(this.positionComponent.bind(this));
    this.bgBorder.classed('is-mirrored-horizontally', this.toBottom);
    this.bg
      .classed('is-mirrored-horizontally', this.toBottom)
      .style(
        'filter',
        'url(#drop-shadow-context-menu' + (
          this.toBottom ? '-inverted' : ''
        ) + ')'
      );
  }

  checkRoot (debounced, time) {
    const state = this.node.datum().data.state.root;
    let checked = state;

    if (debounced) {
      if (typeof this.currentRootState === 'undefined') {
        this.currentRootState = !!state;
      }
      if (typeof this.tempRoot === 'undefined') {
        this.tempRoot = this.currentRootState;
      }
      this.tempRoot = !this.tempRoot;
      checked = this.tempRoot;
    }

    if (!state) {
      if (debounced) {
        if (checked) {
          this.fillButton(this.buttonRootFill, time);
        } else {
          this.hideFillButton(this.buttonRootFill);
        }
      } else {
        this.emptyButton(this.buttonRootFill, time);
      }
    } else {
      if (debounced) {
        if (!checked) {
          this.emptyButton(this.buttonRootFill, time);
        } else {
          this.showFillButton(this.buttonRootFill);
        }
      } else {
        this.fillButton(this.buttonRootFill, time);
      }
    }

    this.buttonRoot.classed('semi-active', checked);
    this.checkboxRoot.style(
      'transform',
      'translateX(' + (checked ? this.checkBoxMovement : 0) + 'px)'
    );
  }

  clickLockHandler () {
    this.buttonLock.classed('fill-effect', true);
    this.vis.nodes.lockHandler(this.node);
    const checked = this.checkLock();
    if (checked) {
      this.buttonLock.classed('active', true);
    } else {
      this.buttonLock.classed('active', false);
    }
    setTimeout(() => {
      if (checked) {
        this.triggerButtonBamEffect(this.buttonLockBamEffect);
      }
      this.buttonLock.classed('fill-effect', false);
    }, BUTTON_DEFAULT_DEBOUNCE);
  }

  clickNodeInfo () {
    this.nodeInfoId = (this.nodeInfoId + 1) % this.infoFields.length;

    this.textNodeInfo.select('.label').text(
      this.infoFields[this.nodeInfoId].label
    );

    this.textNodeInfo.select('.label-two').text(
      this.getNodeProperty(this.infoFields[this.nodeInfoId].property)
    );
  }

  clickQueryHandler () {
    this.buttonQuery.classed('fill-effect', true);
    this.updateQuery(true, BUTTON_QUERY_DEBOUNCE);
    if (!this.vis.disableDebouncedContextMenu) {
      this.debouncedQueryHandler(true);
    } else {
      this.queryHandler();
    }
  }

  clickRootHandler () {
    this.buttonRoot.classed('fill-effect', true);
    this.checkRoot(true, BUTTON_ROOT_DEBOUNCE);
    if (!this.vis.disableDebouncedContextMenu) {
      this.debouncedRootHandler(true);
    } else {
      this.rootHandler();
    }
  }

  close () {
    if (!this.closing) {
      this.closing = new Promise(resolve => {
        this.opened = false;
        this.updateAppearance();

        setTimeout(() => {
          this.visible = false;
          this.updateAppearance();
          resolve(this.node.datum().id);
          this.node = undefined;
        }, TRANSITION_SPEED);
      });
    }
    return this.closing;
  }

  createButton (selection, properties) {
    let classNames = 'component button';
    if (properties.classNames && properties.classNames.length) {
      classNames += ' ' + properties.classNames.join(' ');
    }
    selection.attr('class', classNames);

    selection
      .datum(properties)
      .call(
        this.createButtonBg.bind(this), {
          bamEffect: properties.bamEffect,
          fullWidth: properties.fullWidth
        }
      )
      .call(
        this.addLabel.bind(this),
        properties.fullWidth,
        properties.label,
        properties.labelTwo
      )
      .call(
        this.positionComponent.bind(this),
        properties.distanceFromCenter,
        properties.alignRight
      );
  }

  createButtonBg (selection, params) {
    selection.datum(data => {
      data.x = this.visData.global.row.padding;
      data.y = this.visData.global.row.padding;
      data.width = this.visData.global.column.width *
        (params.fullWidth ? 1 : 0.5) - this.visData.global.row.padding * 2;
      data.height = this.visData.global.row.contentHeight;
      data.rx = 2;
      data.ry = 2;

      return data;
    }).append('rect')
      .attr('class', 'bg')
      .attr('x', data => data.x)
      .attr('y', data => data.y)
      .attr('width', data => data.width)
      .attr('height', data => data.height)
      .attr('rx', data => data.rx)
      .attr('ry', data => data.ry);

    selection.append('rect')
      .attr('class', 'bg-fill-effect')
      .attr('x', data => data.x)
      .attr('y', data => data.y)
      .attr('width', data => data.width)
      .attr('height', 0)
      .attr('rx', data => data.rx)
      .attr('ry', data => data.ry);

    if (params.bamEffect) {
      selection.append('rect')
        .attr('class', 'bg-bam-effect')
        .attr('x', data => data.x)
        .attr('y', data => data.y)
        .attr('width', data => data.width)
        .attr('height', data => data.height)
        .attr('rx', data => data.rx)
        .attr('ry', data => data.ry);
    }
  }

  createCheckbox (selection) {
    const height = Math.round(selection.datum().height / 2);
    const x = -1.75 * height + this.visData.global.row.padding;

    const container = selection.append('g').attr('class', CLASS_CHECKBOX);

    container.append('rect')
      .attr('class', 'checkbox-bg')
      .attr('x', data => data.width + x)
      .attr('y', height / 2 + this.visData.global.row.padding)
      .attr('width', height * 1.5)
      .attr('height', height)
      .attr('rx', height / 2)
      .attr('ry', height / 2);

    this.checkBoxMovement = (height - 2) / 2;

    return container.append('rect')
      .attr('class', 'checkbox-knob')
      .attr('x', data => data.width + x + 1)
      .attr('y', height / 2 + this.visData.global.row.padding + 1)
      .attr('width', height - 2)
      .attr('height', height - 2)
      .attr('rx', height - 2);
  }

  createTextField (selection, properties) {
    let classNames = 'component text-field';
    if (properties.classNames && properties.classNames.length) {
      classNames += ' ' + properties.classNames.join(' ');
    }
    selection.attr('class', classNames);

    selection
      .datum(properties)
      .call(
        this.addLabel.bind(this),
        true,
        properties.labels[this.nodeInfoId].label,
        true
      )
      .call(
        this.positionComponent.bind(this),
        properties.distanceFromCenter,
        properties.alignRight
      );
  }

  /* ---------------------------------- E ----------------------------------- */

  emptyButton (selection, time) {
    selection
      .transition()
      .duration(0)
      .attr('y', data => data.y)
      .attr('height', data => data.height)
      .call(allTransitionsEnded, () => {
        selection
          .transition()
          .duration(time || BUTTON_DEFAULT_DEBOUNCE)
          .ease('linear')
          .attr('y', data => data.height)
          .attr('height', 0);
      });
  }

  /* ---------------------------------- F ----------------------------------- */

  fillButton (selection, time) {
    selection
      .transition()
      .duration(0)
      .attr('y', data => data.y)
      .attr('height', 0)
      .call(allTransitionsEnded, () => {
        selection
          .transition()
          .duration(time || BUTTON_DEFAULT_DEBOUNCE)
          .ease('linear')
          .attr('height', data => data.height);
      });
  }

  /* ---------------------------------- G ----------------------------------- */

  getNodeProperty (property) {
    try {
      return property(this.node.datum());
    } catch (e) {
      return undefined;
    }
  }

  /* ---------------------------------- H ----------------------------------- */

  hideFillButton (selection) {
    selection.transition().duration(0).attr('height', 0);
  }

  /* ---------------------------------- I ----------------------------------- */

  isOpenSameColumn (columnNum) {
    return this.opened && this.node.datum().depth === columnNum;
  }

  /* ---------------------------------- O ----------------------------------- */

  open (node) {
    return new Promise(resolve => {
      this.node = node;
      this.closing = undefined;

      this.updateStates();

      this._yOffset = this.visData.nodes[this.node.datum().depth].scrollTop;
      this.translate = {
        x: this.node.datum().x,
        y: this.node.datum().y - this.height
      };
      this.checkOrientation();

      this.updateAppearance();
      this.opened = true;
      this.visible = true;

      requestNextAnimationFrame(() => {
        this.updateAppearance();
        setTimeout(() => { resolve(true); }, TRANSITION_SPEED);
      });
    });
  }

  /* ---------------------------------- P ----------------------------------- */

  positionComponent (selection, distanceFromCenter, alignRight) {
    selection.datum(data => {
      // Lets cache some values to make our lifes easier when checking the
      // position again in `checkOrientation`.
      if (distanceFromCenter) {
        data.distanceFromCenter = distanceFromCenter;
      }
      if (alignRight) {
        data.alignRight = alignRight;
      }
      return data;
    }).attr('transform', data => {
      const x = data.alignRight ? this.visData.global.column.width / 2 : 0;
      // When the buttons are created I assume that the menu is positioned
      // above the node; i.e. `distanceFromCenter` needs to be inverted.
      const y = (this.visData.global.row.height * (
        this.toBottom ?
        data.distanceFromCenter : (
          this.numButtonRows - data.distanceFromCenter - 1
        )
      )) + (this.toBottom ? ARROW_SIZE : 0);

      return `translate(${x}, ${y})`;
    });
  }

  /* ---------------------------------- Q ----------------------------------- */

  queryHandler (debounced) {
    if (debounced) {
      if (this.tempQueryMode !== this.currentQueryMode) {
        if (this.tempQueryMode) {
          this.vis.nodes.queryHandler(this.node, 'query', this.tempQueryMode);
          this.triggerButtonBamEffect(this.buttonQueryBamEffect);
          this.buttonQuery.classed('active', true);
        } else {
          this.vis.nodes.queryHandler(this.node, 'unquery');
          this.buttonQuery.classed('active', false);
        }
      }
    } else {
      this.vis.nodes.queryHandler(this.node);
    }

    // Reset temporary query modes.
    this.tempQueryMode = undefined;
    this.currentQueryMode = undefined;
    this.buttonQuery.classed('fill-effect', false);
  }

  /* ---------------------------------- R ----------------------------------- */

  rootHandler (debounced) {
    if (!debounced || this.tempRoot !== this.currentRootState) {
      this.close();
      this.vis.nodes.rootHandler(this.node);
    }

    // Reset temporary root values.
    this.tempRoot = undefined;
    this.currentRootState = undefined;
    this.buttonRoot.classed('fill-effect', false);

    this.buttonRoot.classed('active', this.node.datum().data.state.root);
  }

  /* ---------------------------------- S ----------------------------------- */

  scrollY (offset) {
    this._yOffset = offset;
    this.updateAppearance();
  }

  showFillButton (selection) {
    selection.transition().duration(0)
      .attr('y', data => data.y)
      .attr('height', data => data.height);
  }

  /* ---------------------------------- T ----------------------------------- */

  toggle (node) {
    return new Promise(resolve => {
      const nodeId = node.datum().id;
      let closed = Promise.resolve();

      if (this.visible) {
        closed = this.close();
      }

      closed.then((previousNodeId) => {
        if (nodeId !== previousNodeId) {
          this.open(node).then(() => { resolve(nodeId); });
        } else {
          resolve(nodeId);
        }
      });
    });
  }

  triggerButtonBamEffect (button) {
    button.classed('active', true);
    setTimeout(() => {
      button.classed('active', false);
    }, BUTTON_BAM_EFFECT_ANIMATION_TIME);
  }

  /* ---------------------------------- U ----------------------------------- */

  updateAppearance () {
    const centerY = this.toBottom ?
      0 : this.height + this.visData.global.row.height;

    this.wrapper
      .classed('transitionable', this.visible)
      .classed('open', this.opened)
      .style('transform', this.translate + ' ' + this.scale)
      .style(
        'transform-origin',
        (this.visData.global.column.width / 2) + 'px ' + centerY + 'px'
      );
  }

  updateInfoText () {
    if (!this.infoFields || !this.infoFields.length) {
      return;
    }

    this.textNodeInfo.select('.label').text(
      this.infoFields[this.nodeInfoId].label
    );

    this.textNodeInfo.select('.label-two').text(
      this.getNodeProperty(this.infoFields[this.nodeInfoId].property)
    );
  }

  updatePosition () {
    if (this.node && this.opened) {
      this.open(this.node);
    }
  }

  updateQuery (debounced, time) {
    if (!this.querying) {
      return;
    }

    const state = this.node.datum().data.state.query;
    let queryMode = state;

    function nextQueryMode (mode) {
      switch (mode) {
        case 'or':
          return 'and';
        case 'and':
          return 'not';
        case 'not':
          return null;
        default:
          return 'or';
      }
    }

    if (debounced) {
      if (typeof this.currentQueryMode === 'undefined') {
        this.currentQueryMode = state;
      }
      if (typeof this.tempQueryMode === 'undefined') {
        this.tempQueryMode = this.currentQueryMode;
      }
      this.tempQueryMode = nextQueryMode(this.tempQueryMode);
      queryMode = this.tempQueryMode;
    }

    if (debounced) {
      if (queryMode) {
        if (queryMode === state) {
          this.showFillButton(this.buttonQueryFill);
        } else {
          this.fillButton(this.buttonQueryFill, time);
        }
      } else {
        if (state) {
          this.emptyButton(this.buttonQueryFill, time);
        } else {
          this.hideFillButton(this.buttonQueryFill);
        }
      }
    } else {
      this.emptyButton(this.buttonQueryFill, time);
    }

    this.buttonQuery
      .classed('semi-active', !!queryMode)
      .classed('active', !!state)
      .select('.label-two')
        .text(queryMode || 'not queried')
        .classed('inactive', !queryMode);
  }

  updateStates () {
    if (this.node) {
      this.checkLock();
      this.checkRoot();
      this.updateQuery();
      this.updateInfoText();
    }
  }
}

export default NodeContextMenu;
