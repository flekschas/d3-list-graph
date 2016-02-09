// External
import * as d3 from 'd3';

// Internal
import Bar from './bar';
import * as config from './config';

const BARS_CLASS = 'bars';

class Bars {
  constructor (vis, selection, mode, visData) {
    const that = this;

    this.vis = vis;
    this.mode = mode;
    this.visData = visData;

    this.selection = selection.append('g').attr('class', BARS_CLASS);

    this.selection.each(function (datum) {
      new Bar(d3.select(this), datum.data.bars, datum, that.visData, that);
    });
  }

  updateAll (update, sortBy) {
    this.selection.selectAll('.bar-magnitude')
      .data(update, data => data.barId)
      .transition()
      .duration(config.TRANSITION_SEMI_FAST)
      .attr('d', data => {
        return Bar.generatePath(data, this.mode, sortBy, this.visData);
      });
  }

  update (selection, sortBy) {
    selection.each(function (data) {
      const el = d3.select(this);

      if (data.id === sortBy && !el.classed('active')) {
        el.classed('active', true);
        // Ensure that the active bars we are places before any other bar,
        // thus placing them in the background
        this.parentNode.insertBefore(
          this,
          this.parentNode.children[0]
        );
      }

      if (data.id !== sortBy) {
        el.classed('active', false);
      }
    });

    selection.selectAll('.bar-magnitude')
      .transition()
      .duration(config.TRANSITION_SEMI_FAST)
      .attr('d', data => {
        return Bar.generatePath(data, this.mode, sortBy, this.visData);
      });
  }

  updateIndicator (refBars, refBarsBg, currentBar, referenceValue) {
    Bar.updateIndicator(
      currentBar,
      this.visData.global.column.contentWidth,
      referenceValue
    );

    Bar.updateIndicator(
      refBars,
      this.visData.global.column.contentWidth,
      referenceValue
    );

    refBarsBg
      .attr('d', data => {
        return Bar.generatePath(
          data,
          this.mode,
          undefined,
          this.visData,
          referenceValue
        );
      })
      .classed('positive', data => data.value >= referenceValue);

    let transition = refBarsBg;

    if (!this.vis.lessAnimations) {
      transition = refBarsBg.transition().duration(config.TRANSITION_SEMI_FAST);
    }

    transition
      .attr('d', data => {
        return Bar.generatePath(
          data, this.mode, undefined, this.visData, referenceValue, true
        );
      });
  }

  switchMode (mode, currentSorting) {
    if (this.mode !== mode) {
      if (mode === 'one') {
        if (currentSorting.global.type) {
          this.selection.selectAll('.bar').selectAll('.bar-magnitude')
            .transition()
            .duration(config.TRANSITION_SEMI_FAST)
            .attr('d', data => {
              return Bar.generateOneBarPath(
                data, currentSorting.global.type, this.visData
              );
            });
        } else {
          // console.error(
          //   'Switching magnitude visualization after individual sorting is ' +
          //   'not supported yet.'
          // );
        }
      }

      if (mode === 'two') {
        this.selection.selectAll('.bar.precision').selectAll('.bar-magnitude')
          .transition()
          .duration(config.TRANSITION_SEMI_FAST)
          .attr('d', data => {
            return Bar.generateTwoBarsPath(data, this.visData);
          });

        this.selection.selectAll('.bar.recall').selectAll('.bar-magnitude')
          .transition()
          .duration(config.TRANSITION_SEMI_FAST)
          .attr('d', data => {
            return Bar.generateTwoBarsPath(data, this.visData, true);
          });
      }

      this.mode = mode;
    }
  }
}

export default Bars;
