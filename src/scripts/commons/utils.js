/**
 * Helper method to set a value if available and otherwise fall back to a
 * default value
 *
 * @method  setOption
 * @author  Fritz Lekschas
 * @date    2016-09-12
 * @param   {*}        value  Value to be set if available.
 * @param   {*}        defaultValue  Default value to be set when `value` is
 *   not available.
 * @param   {Boolean}  noFalsyValue  No falsy values are allowed. E.g., an empty
 *   string or the number zero are regarded as falsy.
 */
export function setOption (value, defaultValue, noFalsyValue) {
  if (noFalsyValue) {
    return value || defaultValue;
  }

  return typeof value !== 'undefined' ? value : defaultValue;
}
