// External
import * as d3 from 'd3';  // eslint-disable-line import/no-unresolved
import Promise from '../../../node_modules/es6-promise/lib/es6-promise/promise';
import debounce from '../../../node_modules/lodash-es/debounce';

// Internal
import * as config from './config';
import { dropMenu } from '../commons/charts';
import { requestNextAnimationFrame } from '../commons/animation-frame';
import { allTransitionsEnded } from '../commons/d3-utils';

/**
 * Class name assigned to the context menu's root element
 *
 * @type  {String}
 */
const CLASS_NAME = 'context-menu';

/**
 * Class name assigned to checkboxes.
 *
 * @type  {String}
 */
const CLASS_CHECKBOX = 'checkbox';

/**
 * Size of the dialog arrow in pixel.
 *
 * @type  {Number}
 */
const ARROW_SIZE = 6;

/**
 * General transition speed.
 *
 * @type  {Number}
 */
const TRANSITION_SPEED = 125;

/**
 * Time in milliseconds before the query button click actially triggers its
 * action.
 *
 * The time is resetted every time the user clicks on the button again within
 * the time interval.
 *
 * @type  {Number}
 */
const BUTTON_QUERY_DEBOUNCE = 666;

/**
 * Time in milliseconds before the root button click actially triggers its
 * action.
 *
 * The time is resetted every time the user clicks on the button again within
 * the time interval.
 *
 * @type  {Number}
 */
const BUTTON_ROOT_DEBOUNCE = 500;


/**
 * Default time in milliseconds before a button click actially triggers its
 * action.
 *
 * The time is resetted every time the user clicks on the button again within
 * the time interval.
 *
 * @type  {Number}
 */
const BUTTON_DEFAULT_DEBOUNCE = 150;

/**
 * [BUTTON_BAM_EFFECT_ANIMATION_TIME description]
 *
 * @type  {Number}
 */
const BUTTON_BAM_EFFECT_ANIMATION_TIME = 700;

class NodeContextMenu {
  /**
   * Node context menu constructor
   *
   * @description
   * The `init` object must contain the follow properties:
   *  - visData: the List Graph App's data. [Object]
   *  - baseEl: D3 selection of the base element. [Object]
   *  - events: the List Graph App's event library. [Object]
   *  - nodes: the List Graph App's nodes. [Object]
   *  - infoFields: the List Graph App's info field definition. [Object]
   *  - iconPath: the List Graph App's `iconPath`. [String]
   *  - isQueryable: If `true` the query button will be shown. [Boolean]
   *  - isDebounced: If `true` the menu will be debounced. [Boolean]
   *
   * @example
   * ```
   *  const nodeContextMenu = new NodeContextMenu({
   *   visData: {...},
   *   baseEl: {...},
   *   events: {...},
   *   nodes: {...},
   *   infoFields: {...},
   *   iconPath: '...',
   *   isQueryable: true,
   *   isDebounced: true
   * });
   * ```
   *
   * @method  constructor
   * @author  Fritz Lekschas
   * @date    2016-09-13
   * @param   {Object}   init  Initialization object. See example.
   */
  constructor (init) {
    const self = this;

    this._x = 0;
    this._y = 0;
    this._yOffset = 0;
    this._scale = 0;

    this.visData = init.visData;
    this.baseEl = init.baseEl;
    this.events = init.events;
    this.nodes = init.nodes;
    this.isQueryable = init.isQueryable;
    this.infoFields = init.infoFields;
    this.isDebounced = init.isDebounced;
    this.iconPath = init.iconPath;

    this.numButtonRows = 1;
    this.numButtonRows = this.isQueryable ?
      ++this.numButtonRows : this.numButtonRows;
    this.numButtonRows = this.infoFields && this.infoFields.length ?
      ++this.numButtonRows : this.numButtonRows;

    this.height = this.visData.global.row.height * this.numButtonRows;
    this.toBottom = false;

    this.nodeInfoId = 0;

    this.wrapper = this.baseEl.append('g')
      .attr('class', CLASS_NAME);

    this.updateAppearance();

    this.bgWrapper = this.wrapper.append('g')
      .classed('bg-outer-wrapper', true)
      .attr(
        'transform',
        'translate(' +
        (this.visData.global.column.width / 2) + ' ' + (this.height / 2) +
        ')'
      )
      .append('g')
        .classed('bg-inner-wrapper', true);

    this.bgBorder = this.bgWrapper.append('path')
      .attr('class', 'bgBorder')
      .attr('d', dropMenu({
        x: -1,
        y: -1,
        width: this.visData.global.column.width + 2,
        height: this.height + 2,
        radius: ARROW_SIZE - 2,
        arrowSize: ARROW_SIZE
      }))
      .attr(
        'transform',
        'translate(' +
        (-this.visData.global.column.width / 2) + ' ' + (-this.height / 2) +
        ')'
      );

    this.bg = this.bgWrapper.append('path')
      .attr('class', 'bg')
      .attr('d', dropMenu({
        x: 0,
        y: 0,
        width: this.visData.global.column.width,
        height: this.height,
        radius: ARROW_SIZE - 1,
        arrowSize: ARROW_SIZE
      }))
      .style('filter', 'url(#drop-shadow-context-menu)')
      .attr(
        'transform',
        'translate(' +
        (-this.visData.global.column.width / 2) + ' ' + (-this.height / 2) +
        ')'
      );

    if (this.infoFields && this.infoFields.length) {
      this.textNodeInfo = this.wrapper.append('g')
        .call(this.createTextField.bind(this), {
          alignRight: false,
          classNames: [],
          distanceFromCenter: this.isQueryable ? 2 : 1,
          fullWidth: true,
          labels: this.infoFields
        }, this.infoFields.length > 1);

      if (this.infoFields.length > 1) {
        const toggler = this.textNodeInfo.append('g')
          .attr('class', 'toggler')
          .on('click', function () {
            self.clickNodeInfo.call(self, this);
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
          .attr('xlink:href', this.iconPath + '#arrow-right');
      }
    }

    if (this.isQueryable) {
      this.buttonQuery = this.wrapper.append('g')
        .call(this.createButton.bind(this), {
          alignRight: false,
          classNames: [],
          distanceFromCenter: 1,
          fullWidth: true,
          label: 'Query',
          labelTwo: true,
          bamEffect: true,
          unselectable: true
        })
        .on('click', function () {
          self.clickQueryHandler.call(self, this);
        });
      this.buttonQueryFill = this.buttonQuery.select('.bg-fill-effect');
      this.buttonQueryBamEffect = this.buttonQuery.select('.bam-effect');
    }

    this.buttonRoot = this.wrapper.append('g')
      .call(this.createButton.bind(this), {
        alignRight: false,
        classNames: [],
        distanceFromCenter: 0,
        fullWidth: false,
        label: 'Root',
        unselectable: true
      })
      .on('click', function () {
        self.clickRootHandler.call(self, this);
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
        bamEffect: true,
        unselectable: true
      })
      .on('click', function () {
        self.clickLockHandler.call(self, this);
      });
    this.buttonLockFill = this.buttonLock.select('.bg-fill-effect');
    this.buttonLockBamEffect = this.buttonLock.select('.bam-effect');
    this.checkboxLock = this.createCheckbox(this.buttonLock);

    this.components = this.wrapper.selectAll('.component');

    this.debouncedQueryHandler = debounce(
      this.queryHandler, BUTTON_QUERY_DEBOUNCE
    );
    this.debouncedRootHandler = debounce(
      this.rootHandler, BUTTON_ROOT_DEBOUNCE
    );

    this.events.on('d3ListGraphNodeLock', () => {
      if (this.node) { this.clickLockHandler(); }
    });

    this.events.on('d3ListGraphNodeUnlock', () => this.updateStates());

    this.events.on('d3ListGraphNodeRoot', () => this.close());

    this.events.on('d3ListGraphNodeUnroot', () => this.close());

    this.events.on('d3ListGraphNodeQuery', () => requestNextAnimationFrame(
      () => { this.updateStates(); })
    );

    this.events.on('d3ListGraphNodeUnquery', () => requestNextAnimationFrame(
      () => { this.updateStates(); })
    );
  }

  /* ---------------------------------------------------------------------------
   * Getter / Setter
   * ------------------------------------------------------------------------ */

  /**
   * Generates CSS string for scaling.
   *
   * @method  scale
   * @author  Fritz Lekschas
   * @date    2016-09-13
   * @return  {String}  CSS formatted string containing the scale.
   */
  get scale () {
    return 'scale(' + (this.opened ? 1 : 0.5) + ')';
  }

  /**
   * Generates a CSS string for translation
   *
   * @method  translate
   * @author  Fritz Lekschas
   * @date    2016-09-13
   * @return  {String}  CSS formatted string containing the translate.
   */
  get translate () {
    const y = this.toBottom ?
      this._y + this.height + this.visData.global.row.height - ARROW_SIZE :
      this._y;

    return 'translate(' + this._x + 'px,' + (y + this._yOffset) + 'px)';
  }

  /**
   * Set x and y values.
   *
   * @method  translate
   * @author  Fritz Lekschas
   * @date    2016-09-13
   * @param   {Object}  position  Object containing x and y coordinates.
   */
  set translate (position) {
    this._x = position.x;
    this._y = position.y;
  }

  /* ---------------------------------------------------------------------------
   * Methods
   * ------------------------------------------------------------------------ */

  /* ---------------------------------- A ----------------------------------- */

  /**
   * Adds a XHTML-based text elements for labelling.
   *
   * @method  addLabel
   * @author  Fritz Lekschas
   * @date    2016-09-15
   * @param   {Object}   selection      D3 selection where the label should be
   *   added to.
   * @param   {Boolean}  fullWidth      If `true` the label is drawn over the
   *   full width.
   * @param   {String}   label          First label text.
   * @param   {String}   labelTwo       Second label text.
   * @param   {Boolean}  isToggable     If `true` substracts the toggler width.
   *   This is only needed because the because Firefox's layering system seems
   *   to be buggy when it comes to `foreignObject`s. For whatever reason the
   *   `foreignObject` is drawn on top of the following `g` even though in SVG
   *   it should be the other way around.
   * @param   {Boolean}  isUnselectable  If `true` adds a class for making the
   *   div unselectable.
   */
  addLabel (selection, fullWidth, label, labelTwo, isToggable, isUnselectable) {
    const width = (
        this.visData.global.column.width *
        (fullWidth ? 1 : 0.5)
      ) -
      (this.visData.global.row.padding * 4) -
      (isToggable ? this.visData.global.row.contentHeight : 0);

    const height = this.visData.global.row.contentHeight -
        (this.visData.global.cell.padding * 2);

    const div = selection.append('foreignObject')
      .attr('x', this.visData.global.row.padding * 2)
      .attr('y', this.visData.global.row.padding +
        this.visData.global.cell.padding)
      .attr('width', width)
      .attr('height', height)
      .classed('label-wrapper', true)
      .classed('unselectable', isUnselectable)
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

  /**
   * Check the state of the lock button and alter its appearance accordingly.
   *
   * @method  checkLock
   * @author  Fritz Lekschas
   * @date    2016-11-02
   * @param   {Boolean}  debounced  If `true` the root button will be debounced.
   * @return  {Boolean}             If `true` the lock button is active.
   */
  checkLock (debounced) {
    const checked = this.node.datum().data.state.lock;

    this.buttonLock.classed('semi-active', checked);
    this.buttonLock.classed('active', !debounced);
    this.checkboxLock.style(
      'transform',
      'translateX(' + (checked ? this.checkBoxMovement : 0) + 'px)'
    );

    if (checked) {
      NodeContextMenu.fillButton(this.buttonLockFill);
    } else {
      NodeContextMenu.emptyButton(this.buttonLockFill);
    }

    return checked;
  }

  /**
   * Check how the menu needs to be oriented, i.e., above or below the node.
   *
   * @method  checkOrientation
   * @author  Fritz Lekschas
   * @date    2016-09-13
   */
  checkOrientation () {
    if (this._y + this._yOffset >= 0) {
      this.toBottom = false;
    } else {
      this.toBottom = true;
    }
    this.components.call(this.positionComponent.bind(this));
    this.bgWrapper.classed('is-mirrored-horizontally', this.toBottom);

    const translate = 'translate(' +
      (-this.visData.global.column.width / 2) + ' ' +
      (-((this.height / 2) + (this.toBottom ? ARROW_SIZE : 0))) +
      ')';

    this.bg
      .attr('transform', translate)
      .style(
        'filter',
        'url(#drop-shadow-context-menu' + (
          this.toBottom ? '-inverted' : ''
        ) + ')'
      );

    this.bgBorder.attr('transform', translate);
  }

  /**
   * Check state of the root button and alter appearance accordingly.
   *
   * @method  checkRoot
   * @author  Fritz Lekschas
   * @date    2016-09-13
   * @param   {Boolean}  debounced  If `true` the root button will be debounced
   *   by `time`.
   * @param   {Number}   time       Debounce time in milliseconds.
   */
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
          NodeContextMenu.fillButton(this.buttonRootFill, time);
        } else {
          NodeContextMenu.hideElement(this.buttonRootFill);
        }
      } else {
        NodeContextMenu.emptyButton(this.buttonRootFill, time);
      }
    } else {
      if (debounced) {
        if (!checked) {
          NodeContextMenu.emptyButton(this.buttonRootFill, time);
        } else {
          NodeContextMenu.showElement(this.buttonRootFill);
        }
      } else {
        NodeContextMenu.fillButton(this.buttonRootFill, time);
      }
    }

    this.buttonRoot.classed('semi-active', checked);
    this.buttonRoot.classed('active', !debounced);
    this.checkboxRoot.style(
      'transform',
      'translateX(' + (checked ? this.checkBoxMovement : 0) + 'px)'
    );
  }

  /**
   * Click handler of the lock button.
   *
   * @method  clickLockHandler
   * @author  Fritz Lekschas
   * @date    2016-09-13
   */
  clickLockHandler () {
    this.buttonLock.classed('fill-effect', true);
    this.nodes.lockHandler(this.node);

    const checked = this.checkLock(BUTTON_DEFAULT_DEBOUNCE);

    setTimeout(() => {
      if (checked) {
        NodeContextMenu.triggerButtonBamEffect(this.buttonLockBamEffect);
        this.buttonLock.classed('active', true);
      }
      this.buttonLock.classed('fill-effect', false);
    }, BUTTON_DEFAULT_DEBOUNCE);
  }

  /**
   * Click handler of the info button.
   *
   * @method  clickNodeInfo
   * @author  Fritz Lekschas
   * @date    2016-09-13
   */
  clickNodeInfo () {
    this.nodeInfoId = (this.nodeInfoId + 1) % this.infoFields.length;

    const wrapper = this.textNodeInfo.select('.label-wrapper');

    wrapper
      .attr('opacity', 1)
      .transition()
      .duration(config.TRANSITION_LIGHTNING_FAST)
      .attr('opacity', 0)
      .call(allTransitionsEnded, () => {
        this.textNodeInfo.select('.label').text(
          this.infoFields[this.nodeInfoId].label
        );

        this.textNodeInfo.select('.label-two').text(
          this.getNodeProperty(this.infoFields[this.nodeInfoId].property)
        );

        wrapper
          .transition()
          .duration(config.TRANSITION_LIGHTNING_FAST)
          .attr('opacity', 1);
      });
  }

  /**
   * Click handler of the query button.
   *
   * @method  clickQueryHandler
   * @author  Fritz Lekschas
   * @date    2016-09-13
   */
  clickQueryHandler () {
    this.buttonQuery.classed('fill-effect', true);
    this.updateQuery(true, BUTTON_QUERY_DEBOUNCE);
    if (this.isDebounced) {
      this.debouncedQueryHandler(true);
    } else {
      this.queryHandler();
    }
  }

  /**
   * Click handler of the root button.
   *
   * @method  clickRootHandler
   * @author  Fritz Lekschas
   * @date    2016-09-13
   */
  clickRootHandler () {
    this.buttonRoot.classed('fill-effect', true);
    this.checkRoot(true, BUTTON_ROOT_DEBOUNCE);
    if (this.isDebounced) {
      this.debouncedRootHandler(true);
    } else {
      this.rootHandler();
    }
  }

  /**
   * Closes the menu.
   *
   * @method  close
   * @author  Fritz Lekschas
   * @date    2016-09-13
   * @return  {Object}  Promise resolving to `true` when the menu is closed.
   */
  close () {
    if (this.node && !this.closing) {
      this.closing = new Promise((resolve) => {
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

  /**
   * Helper method to create and append a button.
   *
   * @description
   * The `properties` variable needs to contain the following properties:
   *  - fullWidth: If `true` draws the button over the full width. [Boolean]
   *  - label: The first label. Considered the main label if `labelTwo` is
   *    `undefined`. [String]
   *  - labelTwo: Second label. Considered the main label when given.
   *
   * @method  createButton
   * @author  Fritz Lekschas
   * @date    2016-09-13
   * @param   {Object}  selection   D3 selection where the button should be
   *   appended to.
   * @param   {Object}  properties  The button's properties.
   */
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
        properties.labelTwo,
        false,
        properties.unselectable
      )
      .call(
        this.positionComponent.bind(this),
        properties.distanceFromCenter,
        properties.alignRight
      );
  }

  /**
   * Helper method to create and append a button background.
   *
   * @description
   * The `properties` variable needs to contain the following properties:
   *  - fullWidth: If `true` draws the button over the full width. [Boolean]
   *  - bamEffect: If `true` adds an extra element for the click-bam-effect.
   *
   * @method  createButtonBg
   * @author  Fritz Lekschas
   * @date    2016-09-13
   * @param   {Object}  selection   D3 selection where the background element
   *   should be appended to.
   * @param   {Object}  properties  The background element's properties.
   */
  createButtonBg (selection, properties) {
    selection.datum((data) => {
      data.x = this.visData.global.row.padding;
      data.y = this.visData.global.row.padding;
      data.width = (
          this.visData.global.column.width *
          (properties.fullWidth ? 1 : 0.5)
        ) - (this.visData.global.row.padding * 2);
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

    if (properties.bamEffect) {
      selection
        .append('g')
        .attr(
          'transform',
          data => 'translate(' + (data.width / 2) + ' ' + (data.height / 2) + ')'
        )
        .append('g')
          .attr('class', 'bam-effect')
          .append('rect')
            .attr('class', 'bam-effect-bg')
            .attr('x', data => data.x)
            .attr('y', data => data.y)
            .attr('width', data => data.width)
            .attr('height', data => data.height)
            .attr('rx', data => data.rx)
            .attr('ry', data => data.ry)
            .attr(
              'transform',
              data => 'translate(' + (-data.width / 2) + ' ' + (-data.height / 2) + ')'
            );
    }
  }

  /**
   * Helper method to create and append a checkbox-like button.
   *
   * @method  createCheckbox
   * @author  Fritz Lekschas
   * @date    2016-09-13
   * @param   {Object}  selection  D3 selection where the checkbox element
   *   should be appended to.
   */
  createCheckbox (selection) {
    const height = Math.round(selection.datum().height / 2);
    const x = (-1.75 * height) + this.visData.global.row.padding;

    const container = selection.append('g').attr('class', CLASS_CHECKBOX);

    container.append('rect')
      .attr('class', 'checkbox-bg')
      .attr('x', data => data.width + x)
      .attr('y', (height / 2) + this.visData.global.row.padding)
      .attr('width', height * 1.5)
      .attr('height', height)
      .attr('rx', height / 2)
      .attr('ry', height / 2);

    this.checkBoxMovement = (height - 2) / 2;

    return container.append('rect')
      .attr('class', 'checkbox-knob')
      .attr('x', data => data.width + x + 1)
      .attr('y', (height / 2) + this.visData.global.row.padding + 1)
      .attr('width', height - 2)
      .attr('height', height - 2)
      .attr('rx', height - 2);
  }

  /**
   * Helper method to create and append a text field.
   *
   * @method  createTextField
   * @author  Fritz Lekschas
   * @date    2016-09-15
   * @param   {Object}  selection   D3 selection where the text field should be
   *   appended to.
   * @param   {Object}  properties  The text field's properties.
   * @param   {Boolean}  isToggable  If `true` substracts the toggler width.
   *   This is only needed because the because Firefox's layering system seems
   *   to be buggy when it comes to `foreignObject`s. For whatever reason the
   *   `foreignObject` is drawn on top of the following `g` even though in SVG
   *   it should be the other way around.
   */
  createTextField (selection, properties, isToggable) {
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
        true,
        isToggable
      )
      .call(
        this.positionComponent.bind(this),
        properties.distanceFromCenter,
        properties.alignRight
      );
  }

  /* ---------------------------------- D ----------------------------------- */

  /**
   * Destroy the node context menu
   *
   * @description
   * Removes the DOM elements and all related event listeners
   *
   * @method  destroy
   * @author  Fritz Lekschas
   * @date    2017-01-17
   */
  destroy () {
    // Clone the old elements first, which will remove all existing event
    // handlers
    const newEl = this.wrapper.node().cloneNode(true);

    // Replace the old DOM elements with new ones
    this.baseEl.node().replaceChild(newEl, this.wrapper.node());

    // Remove all DOM elements
    this.baseEl.node().removeChild(newEl);
  }

  /* ---------------------------------- E ----------------------------------- */

  /**
   * Transitions out an element top down.
   *
   * @method  emptyButton
   * @author  Fritz Lekschas
   * @date    2016-09-13
   * @param   {Object}  selection   D3 selection of the element to be
   *   transitioned.
   * @param   {Number}  time       Transition time in milliseconds.
   */
  static emptyButton (selection, time) {
    selection
      .transition()
      .duration(0)
      .attr('y', data => data.y)
      .attr('height', data => data.height)
      .call(allTransitionsEnded, () => {
        selection
          .transition()
          .duration(time || BUTTON_DEFAULT_DEBOUNCE)
          .ease(d3.easeLinear)
          .attr('y', data => data.height)
          .attr('height', 0);
      });
  }

  /* ---------------------------------- F ----------------------------------- */

  /**
   * Transitions in an element top down.
   *
   * @method  fillButton
   * @author  Fritz Lekschas
   * @date    2016-09-13
   * @param   {Object}  selection   D3 selection of the element to be
   *   transitioned.
   * @param   {Number}  time       Transition time in milliseconds.
   */
  static fillButton (selection, time) {
    selection
      .transition()
      .duration(0)
      .attr('y', data => data.y)
      .attr('height', 0)
      .call(allTransitionsEnded, () => {
        selection
          .transition()
          .duration(time || BUTTON_DEFAULT_DEBOUNCE)
          .ease(d3.easeLinear)
          .attr('height', data => data.height);
      });
  }

  /* ---------------------------------- G ----------------------------------- */

  /**
   * Helper method to access a node property.
   *
   * @method  getNodeProperty
   * @author  Fritz Lekschas
   * @date    2016-09-13
   * @param   {Function}  callback  Callback returning a property of the node.
   * @return  {*}                   The value returned by the callback.
   */
  getNodeProperty (callback) {
    try {
      return callback(this.node.datum());
    } catch (e) {
      return undefined;
    }
  }

  /* ---------------------------------- H ----------------------------------- */

  /**
   * Hide an element by setting the height to zero.
   *
   * @method  hideElement
   * @author  Fritz Lekschas
   * @date    2016-09-13
   * @param   {Object}  selection  D3 selection of element to be hidden.
   */
  static hideElement (selection) {
    selection.transition().duration(0).attr('height', 0);
  }

  /* ---------------------------------- I ----------------------------------- */

  /**
   * Check if menu is opened in the same column already.
   *
   * @method  isOpenSameColumn
   * @author  Fritz Lekschas
   * @date    2016-09-13
   * @param   {Number}   columnNum  Column number.
   * @return  {Boolean}             If `true` menu is opened and in the same
   *   column.
   */
  isOpenSameColumn (columnNum) {
    return this.opened && this.node.datum().depth === columnNum;
  }

  /* ---------------------------------- O ----------------------------------- */

  /**
   * Opens the menu.
   *
   * @method  open
   * @author  Fritz Lekschas
   * @date    2016-09-13
   * @param   {Object}  node  D3 selection of the node the menu relates to.
   */
  open (node) {
    return new Promise((resolve) => {
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

  /**
   * Positions component.
   *
   * @method  positionComponent
   * @author  Fritz Lekschas
   * @date    2016-09-13
   * @param   {Object}   selection           D3 selection of the element to be
   *   positioned.
   * @param   {Boolean}  distanceFromCenter  If `true` positions component from
   *   the center.
   * @param   {Boolean}  alignRight          If `true` aligns component to the
   *   right.
   * @return  {String}                       CSS-formatted translation string.
   */
  positionComponent (selection, distanceFromCenter, alignRight) {
    selection.datum((data) => {
      // Lets cache some values to make our lives easier when checking the
      // position again in `checkOrientation`.
      if (distanceFromCenter) {
        data.distanceFromCenter = distanceFromCenter;
      }
      if (alignRight) {
        data.alignRight = alignRight;
      }
      return data;
    }).attr('transform', (data) => {
      const x = data.alignRight ? this.visData.global.column.width / 2 : 0;
      // When the buttons are created I assume self the menu is positioned
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

  /**
   * Handle the four different query states: none, or, and, and not.
   *
   * @method  queryHandler
   * @author  Fritz Lekschas
   * @date    2016-09-13
   * @param   {Boolean}  debounced  If `true` the handler will debounce.
   */
  queryHandler (debounced) {
    if (debounced) {
      if (this.tempQueryMode !== this.currentQueryMode) {
        if (this.tempQueryMode) {
          this.nodes.queryHandler(this.node, 'query', this.tempQueryMode);
          NodeContextMenu.triggerButtonBamEffect(this.buttonQueryBamEffect);
          this.buttonQuery.classed('active', true);
        } else {
          this.nodes.queryHandler(this.node, 'unquery');
          this.buttonQuery.classed('active', false);
        }
      }
    } else {
      this.nodes.queryHandler(this.node);
    }

    // Reset temporary query modes.
    this.tempQueryMode = undefined;
    this.currentQueryMode = undefined;
    this.buttonQuery.classed('fill-effect', false);
  }

  /* ---------------------------------- R ----------------------------------- */

  /**
   * Handle re-rooting of the graph.
   *
   * @method  rootHandler
   * @author  Fritz Lekschas
   * @date    2016-09-13
   */
  rootHandler (debounced) {
    if (!debounced || this.tempRoot !== this.currentRootState) {
      this.close();
      this.nodes.rootHandler(this.node);
    }

    // Reset temporary root values.
    this.tempRoot = undefined;
    this.currentRootState = undefined;
    this.buttonRoot.classed('fill-effect', false);

    // this.buttonRoot.classed('active', this.node.datum().data.state.root);
  }

  /* ---------------------------------- S ----------------------------------- */

  /**
   * Scrolls the menu vertically.
   *
   * @method  scrollY
   * @author  Fritz Lekschas
   * @date    2016-09-13
   * @param   {Number}  offset  Scroll related offset.
   */
  scrollY (offset) {
    this._yOffset = offset;
    this.updateAppearance();
  }

  /**
   * Transition element in by resetting its original height.
   *
   * @method  showElement
   * @author  Fritz Lekschas
   * @date    2016-09-13
   * @param   {Object}  selection  D3 selection to be transitioned in.
   */
  static showElement (selection) {
    selection.transition().duration(0)
      .attr('y', data => data.y)
      .attr('height', data => data.height);
  }

  /* ---------------------------------- T ----------------------------------- */

  /**
   * Toggle menu visibility
   *
   * @method  toggle
   * @author  Fritz Lekschas
   * @date    2016-09-13
   * @param   {Object}  node  D3 selection of the related node.
   */
  toggle (node) {
    return new Promise((resolve) => {
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

  /**
   * Call button BAM effect.
   *
   * @method  triggerButtonBamEffect
   * @author  Fritz Lekschas
   * @date    2016-09-13
   * @param   {Object}  node  D3 selection of the button to be BAM-effected.
   */
  static triggerButtonBamEffect (button) {
    button.classed('trigger', true);
    setTimeout(() => {
      button.classed('trigger', false);
    }, BUTTON_BAM_EFFECT_ANIMATION_TIME);
  }

  /* ---------------------------------- U ----------------------------------- */

  /**
   * Update appearance of the menu.
   *
   * @method  updateAppearance
   * @author  Fritz Lekschas
   * @date    2016-09-13
   */
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

  /**
   * Toggle through the info text fields.
   *
   * @method  updateInfoText
   * @author  Fritz Lekschas
   * @date    2016-09-13
   */
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

  /**
   * Open menu on another node.
   *
   * @description
   * Updates the position of the menu and its content.
   *
   * @method  updatePosition
   * @author  Fritz Lekschas
   * @date    2016-09-13
   */
  updatePosition () {
    if (this.node && this.opened) {
      this.open(this.node);
    }
  }

  /**
   * Update querying when toggling through different query options.
   *
   * @method  updateQuery
   * @author  Fritz Lekschas
   * @date    2016-09-13
   * @param   {Boolean}  debounced  If `true` debounces querying.
   * @param   {Number}   time       Debounce time in milliseconds.
   */
  updateQuery (debounced, time) {
    if (!this.isQueryable) {
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
          NodeContextMenu.showElement(this.buttonQueryFill);
        } else {
          NodeContextMenu.fillButton(this.buttonQueryFill, time);
        }
      } else {
        if (state) {
          NodeContextMenu.emptyButton(this.buttonQueryFill, time);
        } else {
          NodeContextMenu.hideElement(this.buttonQueryFill);
        }
      }
    } else {
      NodeContextMenu.emptyButton(this.buttonQueryFill, time);
    }

    this.buttonQuery
      .classed('semi-active', !!queryMode)
      .classed('active', !!state)
      .select('.label-two')
        .text(queryMode || 'not queried')
        .classed('inactive', !queryMode);
  }

  /**
   * Helper method to trigger a check of all buttons and text fields.
   *
   * @method  updateStates
   * @author  Fritz Lekschas
   * @date    2016-09-13
   */
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
