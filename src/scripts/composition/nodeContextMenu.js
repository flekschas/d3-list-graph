// Internal
import { dropMenu } from '../commons/charts';

const CLASS_NAME = 'context-menu';

class NodeContextMenu {
  constructor (vis, visData, baseEl, events, querying) {
    // const that = this;

    this.vis = vis;
    this.visData = visData;
    this.baseEl = baseEl;
    this.events = events;

    this.el = this.baseEl.append('g').attr('class', CLASS_NAME);

    this.numButtonRows = querying ? 2 : 3;
    this.height = this.visData.global.row.height * this.numButtonRows;

    this.bg = this.el.append('path')
      .attr('class', 'bg')
      .attr('d', dropMenu(
        0, 0, this.visData.global.column.width, this.height, 4, 6
      ))
      .style('filter', 'url(#drop-shadow-context-menu)');

    this.buttonQuery = this.el.append('g')
      .call(this.createButton.bind(this), {
        alignRight: false,
        classNames: [],
        distanceFromCenter: 1,
        fullWidth: true,
        label: 'Query'
      });

    this.buttonRoot = this.el.append('g')
      .call(this.createButton.bind(this), {
        alignRight: false,
        classNames: [],
        distanceFromCenter: 0,
        fullWidth: false,
        label: 'Root'
      });

    this.buttonLock = this.el.append('g')
      .call(this.createButton.bind(this), {
        alignRight: true,
        classNames: [],
        distanceFromCenter: 0,
        fullWidth: false,
        label: 'Focus'
      });
  }

  createButton (selection, properties) {
    let classNames = 'button';
    if (properties.classNames && properties.classNames.length) {
      classNames += ' ' + properties.classNames.join(' ');
    }
    selection.attr('class', classNames);

    selection
      .call(
        this.createButtonBg.bind(this),
        properties.fullWidth
      )
      .call(
        this.addLabel.bind(this),
        properties.label
      )
      .call(
        this.positionButton.bind(this),
        properties.distanceFromCenter,
        properties.alignRight
      );
  }

  createButtonBg (selection, fullWidth) {
    selection.append('rect').attr({
      class: 'bg',
      x: this.visData.global.row.padding,
      y: this.visData.global.row.padding,
      width: this.visData.global.column.width * (fullWidth ? 1 : 0.5) -
        this.visData.global.row.padding * 2,
      height: this.visData.global.row.contentHeight,
      rx: 2,
      ry: 2
    });
  }

  positionButton (selection, distanceFromCenter, alignRight) {
    const x = alignRight ? this.visData.global.column.width / 2 : 0;
    // When the buttons are created I assume that the menu is positioned
    // above the node; i.e. `distanceFromCenter` needs to be inverted.
    const y = this.visData.global.row.height *
      (this.numButtonRows - distanceFromCenter - 1);

    selection.attr('transform', `translate(${x}, ${y})`);
  }

  addLabel (selection, label) {
    selection.append('foreignObject')
      .attr('x', this.visData.global.row.padding * 2)
      .attr('y', this.visData.global.row.padding +
        this.visData.global.cell.padding)
      .attr('width', this.visData.global.column.contentWidth)
      .attr('height', this.visData.global.row.contentHeight -
        this.visData.global.cell.padding * 2)
      .attr('class', 'label-wrapper')
      .append('xhtml:div')
        .attr('class', 'label')
        .attr('title', label)
        .style('line-height', (this.visData.global.row.contentHeight -
          this.visData.global.cell.padding * 2) + 'px')
        .append('xhtml:span')
          .text(label);
  }
}

export default NodeContextMenu;
