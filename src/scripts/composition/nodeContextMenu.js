// External
import Promise from '../../../node_modules/es6-promise/lib/es6-promise/Promise';

// Internal
import { dropMenu } from '../commons/charts';
import { requestNextAnimationFrame } from '../commons/shims';

const CLASS_NAME = 'context-menu';
const CLASS_CHECKBOX = 'checkbox';
const TRANSITION_SPEED = 125;

class NodeContextMenu {
  constructor (vis, visData, baseEl, events, querying) {
    const that = this;

    this._x = 0;
    this._y = 0;
    this._yOffset = 0;
    this._scale = 0;

    this.vis = vis;
    this.visData = visData;
    this.baseEl = baseEl;
    this.events = events;

    this.wrapper = this.baseEl.append('g')
      .attr('class', CLASS_NAME)
      .call(this.updateAppearance.bind(this));

    this.numButtonRows = querying ? 2 : 3;
    this.height = this.visData.global.row.height * this.numButtonRows;

    this.bg = this.wrapper.append('path')
      .attr('class', 'bgBorder')
      .attr('d', dropMenu({
        x: -1,
        y: -1,
        width: this.visData.global.column.width + 2,
        height: this.height + 2,
        radius: 5,
        arrowSize: 6
      }))
      .style('filter', 'url(#drop-shadow-context-menu)');

    this.bg = this.wrapper.append('path')
      .attr('class', 'bg')
      .attr('d', dropMenu({
        x: 0,
        y: 0,
        width: this.visData.global.column.width,
        height: this.height,
        radius: 4,
        arrowSize: 6
      }))
      .style('filter', 'url(#drop-shadow-context-menu)');

    this.buttonQuery = this.wrapper.append('g')
      .call(this.createButton.bind(this), {
        alignRight: false,
        classNames: [],
        distanceFromCenter: 1,
        fullWidth: true,
        label: 'Query:',
        labelTwo: 'query-mode'
      })
      .on('click', function () {
        that.clickQueryHandler.call(that, this);
      });

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
    this.checkboxRoot = this.createCheckbox(this.buttonRoot);

    this.buttonLock = this.wrapper.append('g')
      .call(this.createButton.bind(this), {
        alignRight: true,
        classNames: [],
        distanceFromCenter: 0,
        fullWidth: false,
        label: 'Focus'
      })
      .on('click', function () {
        that.clickLockHandler.call(that, this);
      });
    this.checkboxLock = this.createCheckbox(this.buttonLock);
  }

  createButton (selection, properties) {
    let classNames = 'button';
    if (properties.classNames && properties.classNames.length) {
      classNames += ' ' + properties.classNames.join(' ');
    }
    selection.attr('class', classNames);

    selection
      .datum(properties)
      .call(
        this.createButtonBg.bind(this),
        properties.fullWidth
      )
      .call(
        this.addLabel.bind(this),
        properties.label,
        properties.labelTwo
      )
      .call(
        this.positionButton.bind(this),
        properties.distanceFromCenter,
        properties.alignRight
      );
  }

  clickQueryHandler () {
    this.vis.nodes.toggleQueryMode(this.node);
    this.updateQuery();
  }

  clickRootHandler () {
    this.vis.nodes.toggleRoot(this.node);
    this.close();
  }

  clickLockHandler () {
    this.vis.nodes.toggleLock(this.node);
    this.checkLock();
  }

  createButtonBg (selection, fullWidth) {
    selection.datum(data => {
      data.x = this.visData.global.row.padding;
      data.y = this.visData.global.row.padding;
      data.width = this.visData.global.column.width * (fullWidth ? 1 : 0.5) -
        this.visData.global.row.padding * 2;
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

  positionButton (selection, distanceFromCenter, alignRight) {
    const x = alignRight ? this.visData.global.column.width / 2 : 0;
    // When the buttons are created I assume that the menu is positioned
    // above the node; i.e. `distanceFromCenter` needs to be inverted.
    const y = this.visData.global.row.height *
      (this.numButtonRows - distanceFromCenter - 1);

    selection.attr('transform', `translate(${x}, ${y})`);
  }

  addLabel (selection, label, labelTwo) {
    const div = selection.append('foreignObject')
      .attr('x', this.visData.global.row.padding * 2)
      .attr('y', this.visData.global.row.padding +
        this.visData.global.cell.padding)
      .attr('width', this.visData.global.column.contentWidth)
      .attr('height', this.visData.global.row.contentHeight -
        this.visData.global.cell.padding * 2)
      .attr('class', 'label-wrapper')
      .append('xhtml:div')
        .style('line-height', (this.visData.global.row.contentHeight -
          this.visData.global.cell.padding * 2) + 'px');

    div.append('xhtml:span')
      .attr('class', 'label')
      .attr('title', label)
      .text(label);

    if (labelTwo) {
      div.append('xhtml:span').attr('class', `label-two ${labelTwo}`);
    }
  }

  get translate () {
    return 'translate(' + this._x + 'px,' + (this._y + this._yOffset) + 'px)';
  }

  set translate (position) {
    this._x = position.x;
    this._y = position.y;
  }

  get scale () {
    return 'scale(' + (this.opened ? 1 : 0.5) + ')';
  }

  updateAppearance (selection) {
    selection
      .classed('transitionable', this.visible)
      .classed('open', this.opened)
      .style('transform', this.translate + ' ' + this.scale)
      .style(
        'transform-origin',
        (this.visData.global.column.width / 2) + 'px ' +
        (this.height + this.visData.global.row.height) + 'px'
      );
  }

  open (node) {
    return new Promise(resolve => {
      this.node = node;

      this.updateStates();
      this.translate = {
        x: this.node.datum().x,
        y: this.node.datum().y - this.height
      };
      this._yOffset = this.visData.nodes[this.node.datum().depth].scrollTop;
      this.wrapper.call(this.updateAppearance.bind(this));
      this.opened = true;
      this.visible = true;

      requestNextAnimationFrame(() => {
        this.wrapper.call(this.updateAppearance.bind(this));
        setTimeout(() => { resolve(true); }, TRANSITION_SPEED);
      });
    });
  }

  close () {
    return new Promise(resolve => {
      this.opened = false;
      this.wrapper.call(this.updateAppearance.bind(this));

      setTimeout(() => {
        this.visible = false;
        this.wrapper.call(this.updateAppearance.bind(this));
        resolve(this.node.datum().id);
        this.node = undefined;
      }, TRANSITION_SPEED);
    });
  }

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

  scrollY (offset) {
    this._yOffset = offset;
    this.wrapper.call(this.updateAppearance.bind(this));
  }

  updateStates () {
    this.checkLock();
    this.checkRoot();
    this.updateQuery();
  }

  checkLock () {
    const checked = this.node.datum().data.state.lock;
    this.buttonLock.classed('active', checked);
    this.checkboxLock.style(
      'transform',
      'translateX(' + (checked ? this.checkBoxMovement : 0) + 'px)'
    );
  }

  checkRoot () {
    const checked = this.node.datum().data.state.root;
    this.buttonRoot.classed('active', checked);
    this.checkboxRoot.style(
      'transform',
      'translateX(' + (checked ? this.checkBoxMovement : 0) + 'px)'
    );
  }

  updateQuery () {
    const queryMode = this.node.datum().data.state.query;

    this.buttonQuery
      .classed('active', !!queryMode)
      .select('.query-mode')
        .text(queryMode || 'not queried')
        .classed('inactive', !queryMode);
  }
}

export default NodeContextMenu;
