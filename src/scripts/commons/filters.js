// Adapted from: http://bl.ocks.org/cpbotha/5200394
export function dropShadow (el, name, dx, dy, blur) {
  let defs = el.select('defs');

  if (defs.empty()) {
    defs = el.append('defs');
  }

  // create filter with id #drop-shadow
  // height = 130% so that the shadow is not clipped
  const filter = defs.append('filter')
    .attr('id', 'drop-shadow' + (name ? `-${name}` : ''))
    .attr('height', '130%');

  // SourceAlpha refers to opacity of graphic that this filter will be applied to
  // convolve that with a Gaussian with standard deviation 3 and store result
  // in blur
  filter.append('feGaussianBlur')
    .attr('in', 'SourceAlpha')
    .attr('stdDeviation', blur);

  // translate output of Gaussian blur to the right and downwards with 2px
  // store result in offsetBlur
  filter.append('feOffset')
    .attr('dx', dx)
    .attr('dy', dy)
    .attr('result', 'offsetBlur');

  // overlay original SourceGraphic over translated blurred opacity by using
  // feMerge filter. Order of specifying inputs is important!
  const feMerge = filter.append('feMerge');

  feMerge.append('feMergeNode');
  feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
}
