const BAR_CLASS = 'bar';

class Bar {
  /**
   * Bar constructor
   *
   * @method  constructor
   * @author  Fritz Lekschas
   * @date    2016-09-14
   * @param   {Object}  baseEl    D3 selection of the base element where bars
   *   should be appended to.
   * @param   {Object}  barData   Object with the bar properties.
   * @param   {Object}  nodeData  Object with the node properties.
   * @param   {Object}  visData   Object with the list graph app properties.
   * @param   {Object}  bars      Bars class.
   */
  constructor (baseEl, barData, nodeData, visData, bars) {
    this.data = barData;
    this.nodeData = nodeData;
    this.visData = visData;
    this.bars = bars;

    this.data.x = nodeData.x;
    this.data.level = nodeData.depth;

    this.height = (this.visData.global.row.contentHeight /
      (this.data.length * 2)) -
      (this.visData.global.cell.padding * 2);

    this.activeHeight = this.visData.global.row.contentHeight - 2;

    this.inactiveheight = (this.visData.global.cell.padding * 2) - 1;

    this.selection = baseEl.selectAll(BAR_CLASS)
      .data(this.data)
      .enter()
      .append('g')
        .attr('class', data => BAR_CLASS + ' ' + data.id)
        .classed('active', data =>
          data.id === this.visData.nodes[this.nodeData.depth].sortBy);

    // Local helper method to avoid code duplication.
    function setupMagnitude (selection) {
      const currentSorting = this.visData.nodes[this.nodeData.depth].sortBy;

      selection
        .attr('d', data => this.bars.generatePath(data, currentSorting))
        .classed('bar-magnitude', true);
    }

    this.selection
      .append('path')
        .call(setupMagnitude.bind(this));
  }
}

export default Bar;
