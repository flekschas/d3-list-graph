/* Copyright Fritz Lekschas: D3 example visualization app using the list-like graph layout */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('$'), require('d3')) :
  typeof define === 'function' && define.amd ? define(['$', 'd3'], factory) :
  (global.ListGraph = factory(global.$,global.d3));
}(this, (function ($$1,d3) { 'use strict';

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray = Array.isArray;

/**
 * Removes all key-value entries from the list cache.
 *
 * @private
 * @name clear
 * @memberOf ListCache
 */
function listCacheClear() {
  this.__data__ = [];
  this.size = 0;
}

/**
 * Performs a
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * comparison between two values to determine if they are equivalent.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.eq(object, object);
 * // => true
 *
 * _.eq(object, other);
 * // => false
 *
 * _.eq('a', 'a');
 * // => true
 *
 * _.eq('a', Object('a'));
 * // => false
 *
 * _.eq(NaN, NaN);
 * // => true
 */
function eq(value, other) {
  return value === other || (value !== value && other !== other);
}

/**
 * Gets the index at which the `key` is found in `array` of key-value pairs.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} key The key to search for.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function assocIndexOf(array, key) {
  var length = array.length;
  while (length--) {
    if (eq(array[length][0], key)) {
      return length;
    }
  }
  return -1;
}

/** Used for built-in method references. */
var arrayProto = Array.prototype;

/** Built-in value references. */
var splice = arrayProto.splice;

/**
 * Removes `key` and its value from the list cache.
 *
 * @private
 * @name delete
 * @memberOf ListCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function listCacheDelete(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    return false;
  }
  var lastIndex = data.length - 1;
  if (index == lastIndex) {
    data.pop();
  } else {
    splice.call(data, index, 1);
  }
  --this.size;
  return true;
}

/**
 * Gets the list cache value for `key`.
 *
 * @private
 * @name get
 * @memberOf ListCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function listCacheGet(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  return index < 0 ? undefined : data[index][1];
}

/**
 * Checks if a list cache value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf ListCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function listCacheHas(key) {
  return assocIndexOf(this.__data__, key) > -1;
}

/**
 * Sets the list cache `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf ListCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the list cache instance.
 */
function listCacheSet(key, value) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    ++this.size;
    data.push([key, value]);
  } else {
    data[index][1] = value;
  }
  return this;
}

/**
 * Creates an list cache object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function ListCache(entries) {
  var index = -1,
      length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `ListCache`.
ListCache.prototype.clear = listCacheClear;
ListCache.prototype['delete'] = listCacheDelete;
ListCache.prototype.get = listCacheGet;
ListCache.prototype.has = listCacheHas;
ListCache.prototype.set = listCacheSet;

/**
 * Removes all key-value entries from the stack.
 *
 * @private
 * @name clear
 * @memberOf Stack
 */
function stackClear() {
  this.__data__ = new ListCache;
  this.size = 0;
}

/**
 * Removes `key` and its value from the stack.
 *
 * @private
 * @name delete
 * @memberOf Stack
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function stackDelete(key) {
  var data = this.__data__,
      result = data['delete'](key);

  this.size = data.size;
  return result;
}

/**
 * Gets the stack value for `key`.
 *
 * @private
 * @name get
 * @memberOf Stack
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function stackGet(key) {
  return this.__data__.get(key);
}

/**
 * Checks if a stack value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Stack
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function stackHas(key) {
  return this.__data__.has(key);
}

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return value != null && (type == 'object' || type == 'function');
}

/** `Object#toString` result references. */
var funcTag$1 = '[object Function]';
var genTag$1 = '[object GeneratorFunction]';

/** Used for built-in method references. */
var objectProto$1 = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto$1.toString;

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 8-9 which returns 'object' for typed array and other constructors.
  var tag = isObject(value) ? objectToString.call(value) : '';
  return tag == funcTag$1 || tag == genTag$1;
}

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

/** Used to detect overreaching core-js shims. */
var coreJsData = root['__core-js_shared__'];

/** Used to detect methods masquerading as native. */
var maskSrcKey = (function() {
  var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
  return uid ? ('Symbol(src)_1.' + uid) : '';
}());

/**
 * Checks if `func` has its source masked.
 *
 * @private
 * @param {Function} func The function to check.
 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
 */
function isMasked(func) {
  return !!maskSrcKey && (maskSrcKey in func);
}

/** Used for built-in method references. */
var funcProto$1 = Function.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString$1 = funcProto$1.toString;

/**
 * Converts `func` to its source code.
 *
 * @private
 * @param {Function} func The function to process.
 * @returns {string} Returns the source code.
 */
function toSource(func) {
  if (func != null) {
    try {
      return funcToString$1.call(func);
    } catch (e) {}
    try {
      return (func + '');
    } catch (e) {}
  }
  return '';
}

/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
 */
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

/** Used to detect host constructors (Safari). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Used for built-in method references. */
var funcProto = Function.prototype;
var objectProto = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/**
 * The base implementation of `_.isNative` without bad shim checks.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function,
 *  else `false`.
 */
function baseIsNative(value) {
  if (!isObject(value) || isMasked(value)) {
    return false;
  }
  var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
  return pattern.test(toSource(value));
}

/**
 * Gets the value at `key` of `object`.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function getValue(object, key) {
  return object == null ? undefined : object[key];
}

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = getValue(object, key);
  return baseIsNative(value) ? value : undefined;
}

/* Built-in method references that are verified to be native. */
var Map = getNative(root, 'Map');

/* Built-in method references that are verified to be native. */
var nativeCreate = getNative(Object, 'create');

/**
 * Removes all key-value entries from the hash.
 *
 * @private
 * @name clear
 * @memberOf Hash
 */
function hashClear() {
  this.__data__ = nativeCreate ? nativeCreate(null) : {};
  this.size = 0;
}

/**
 * Removes `key` and its value from the hash.
 *
 * @private
 * @name delete
 * @memberOf Hash
 * @param {Object} hash The hash to modify.
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function hashDelete(key) {
  var result = this.has(key) && delete this.__data__[key];
  this.size -= result ? 1 : 0;
  return result;
}

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/** Used for built-in method references. */
var objectProto$2 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$1 = objectProto$2.hasOwnProperty;

/**
 * Gets the hash value for `key`.
 *
 * @private
 * @name get
 * @memberOf Hash
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function hashGet(key) {
  var data = this.__data__;
  if (nativeCreate) {
    var result = data[key];
    return result === HASH_UNDEFINED ? undefined : result;
  }
  return hasOwnProperty$1.call(data, key) ? data[key] : undefined;
}

/** Used for built-in method references. */
var objectProto$3 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$2 = objectProto$3.hasOwnProperty;

/**
 * Checks if a hash value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Hash
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function hashHas(key) {
  var data = this.__data__;
  return nativeCreate ? data[key] !== undefined : hasOwnProperty$2.call(data, key);
}

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED$1 = '__lodash_hash_undefined__';

/**
 * Sets the hash `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Hash
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the hash instance.
 */
function hashSet(key, value) {
  var data = this.__data__;
  this.size += this.has(key) ? 0 : 1;
  data[key] = (nativeCreate && value === undefined) ? HASH_UNDEFINED$1 : value;
  return this;
}

/**
 * Creates a hash object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Hash(entries) {
  var index = -1,
      length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `Hash`.
Hash.prototype.clear = hashClear;
Hash.prototype['delete'] = hashDelete;
Hash.prototype.get = hashGet;
Hash.prototype.has = hashHas;
Hash.prototype.set = hashSet;

/**
 * Removes all key-value entries from the map.
 *
 * @private
 * @name clear
 * @memberOf MapCache
 */
function mapCacheClear() {
  this.size = 0;
  this.__data__ = {
    'hash': new Hash,
    'map': new (Map || ListCache),
    'string': new Hash
  };
}

/**
 * Checks if `value` is suitable for use as unique object key.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
 */
function isKeyable(value) {
  var type = typeof value;
  return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
    ? (value !== '__proto__')
    : (value === null);
}

/**
 * Gets the data for `map`.
 *
 * @private
 * @param {Object} map The map to query.
 * @param {string} key The reference key.
 * @returns {*} Returns the map data.
 */
function getMapData(map, key) {
  var data = map.__data__;
  return isKeyable(key)
    ? data[typeof key == 'string' ? 'string' : 'hash']
    : data.map;
}

/**
 * Removes `key` and its value from the map.
 *
 * @private
 * @name delete
 * @memberOf MapCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function mapCacheDelete(key) {
  var result = getMapData(this, key)['delete'](key);
  this.size -= result ? 1 : 0;
  return result;
}

/**
 * Gets the map value for `key`.
 *
 * @private
 * @name get
 * @memberOf MapCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function mapCacheGet(key) {
  return getMapData(this, key).get(key);
}

/**
 * Checks if a map value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf MapCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function mapCacheHas(key) {
  return getMapData(this, key).has(key);
}

/**
 * Sets the map `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf MapCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the map cache instance.
 */
function mapCacheSet(key, value) {
  var data = getMapData(this, key),
      size = data.size;

  data.set(key, value);
  this.size += data.size == size ? 0 : 1;
  return this;
}

/**
 * Creates a map cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function MapCache(entries) {
  var index = -1,
      length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `MapCache`.
MapCache.prototype.clear = mapCacheClear;
MapCache.prototype['delete'] = mapCacheDelete;
MapCache.prototype.get = mapCacheGet;
MapCache.prototype.has = mapCacheHas;
MapCache.prototype.set = mapCacheSet;

/** Used as the size to enable large array optimizations. */
var LARGE_ARRAY_SIZE = 200;

/**
 * Sets the stack `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Stack
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the stack cache instance.
 */
function stackSet(key, value) {
  var data = this.__data__;
  if (data instanceof ListCache) {
    var pairs = data.__data__;
    if (!Map || (pairs.length < LARGE_ARRAY_SIZE - 1)) {
      pairs.push([key, value]);
      this.size = ++data.size;
      return this;
    }
    data = this.__data__ = new MapCache(pairs);
  }
  data.set(key, value);
  this.size = data.size;
  return this;
}

/**
 * Creates a stack cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Stack(entries) {
  var data = this.__data__ = new ListCache(entries);
  this.size = data.size;
}

// Add methods to `Stack`.
Stack.prototype.clear = stackClear;
Stack.prototype['delete'] = stackDelete;
Stack.prototype.get = stackGet;
Stack.prototype.has = stackHas;
Stack.prototype.set = stackSet;

/**
 * A specialized version of `_.forEach` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns `array`.
 */
function arrayEach(array, iteratee) {
  var index = -1,
      length = array ? array.length : 0;

  while (++index < length) {
    if (iteratee(array[index], index, array) === false) {
      break;
    }
  }
  return array;
}

/** Built-in value references. */
var defineProperty = Object.defineProperty;

/**
 * The base implementation of `assignValue` and `assignMergeValue` without
 * value checks.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function baseAssignValue(object, key, value) {
  if (key == '__proto__' && defineProperty) {
    defineProperty(object, key, {
      'configurable': true,
      'enumerable': true,
      'value': value,
      'writable': true
    });
  } else {
    object[key] = value;
  }
}

/** Used for built-in method references. */
var objectProto$4 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$3 = objectProto$4.hasOwnProperty;

/**
 * Assigns `value` to `key` of `object` if the existing value is not equivalent
 * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * for equality comparisons.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function assignValue(object, key, value) {
  var objValue = object[key];
  if (!(hasOwnProperty$3.call(object, key) && eq(objValue, value)) ||
      (value === undefined && !(key in object))) {
    baseAssignValue(object, key, value);
  }
}

/**
 * Copies properties of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy properties from.
 * @param {Array} props The property identifiers to copy.
 * @param {Object} [object={}] The object to copy properties to.
 * @param {Function} [customizer] The function to customize copied values.
 * @returns {Object} Returns `object`.
 */
function copyObject(source, props, object, customizer) {
  var isNew = !object;
  object || (object = {});

  var index = -1,
      length = props.length;

  while (++index < length) {
    var key = props[index];

    var newValue = customizer
      ? customizer(object[key], source[key], key, object, source)
      : undefined;

    if (newValue === undefined) {
      newValue = source[key];
    }
    if (isNew) {
      baseAssignValue(object, key, newValue);
    } else {
      assignValue(object, key, newValue);
    }
  }
  return object;
}

/**
 * The base implementation of `_.times` without support for iteratee shorthands
 * or max array length checks.
 *
 * @private
 * @param {number} n The number of times to invoke `iteratee`.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the array of results.
 */
function baseTimes(n, iteratee) {
  var index = -1,
      result = Array(n);

  while (++index < n) {
    result[index] = iteratee(index);
  }
  return result;
}

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This method is loosely based on
 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */
function isLength(value) {
  return typeof value == 'number' &&
    value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * _.isArrayLike([1, 2, 3]);
 * // => true
 *
 * _.isArrayLike(document.body.children);
 * // => true
 *
 * _.isArrayLike('abc');
 * // => true
 *
 * _.isArrayLike(_.noop);
 * // => false
 */
function isArrayLike(value) {
  return value != null && isLength(value.length) && !isFunction(value);
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return value != null && typeof value == 'object';
}

/**
 * This method is like `_.isArrayLike` except that it also checks if `value`
 * is an object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array-like object,
 *  else `false`.
 * @example
 *
 * _.isArrayLikeObject([1, 2, 3]);
 * // => true
 *
 * _.isArrayLikeObject(document.body.children);
 * // => true
 *
 * _.isArrayLikeObject('abc');
 * // => false
 *
 * _.isArrayLikeObject(_.noop);
 * // => false
 */
function isArrayLikeObject(value) {
  return isObjectLike(value) && isArrayLike(value);
}

/** `Object#toString` result references. */
var argsTag$1 = '[object Arguments]';

/** Used for built-in method references. */
var objectProto$6 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$5 = objectProto$6.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString$1 = objectProto$6.toString;

/** Built-in value references. */
var propertyIsEnumerable = objectProto$6.propertyIsEnumerable;

/**
 * Checks if `value` is likely an `arguments` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 *  else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
function isArguments(value) {
  // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
  return isArrayLikeObject(value) && hasOwnProperty$5.call(value, 'callee') &&
    (!propertyIsEnumerable.call(value, 'callee') || objectToString$1.call(value) == argsTag$1);
}

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER$1 = 9007199254740991;

/** Used to detect unsigned integer values. */
var reIsUint = /^(?:0|[1-9]\d*)$/;

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  length = length == null ? MAX_SAFE_INTEGER$1 : length;
  return !!length &&
    (typeof value == 'number' || reIsUint.test(value)) &&
    (value > -1 && value % 1 == 0 && value < length);
}

/** Used for built-in method references. */
var objectProto$5 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$4 = objectProto$5.hasOwnProperty;

/**
 * Creates an array of the enumerable property names of the array-like `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @param {boolean} inherited Specify returning inherited property names.
 * @returns {Array} Returns the array of property names.
 */
function arrayLikeKeys(value, inherited) {
  // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
  // Safari 9 makes `arguments.length` enumerable in strict mode.
  var result = (isArray(value) || isArguments(value))
    ? baseTimes(value.length, String)
    : [];

  var length = result.length,
      skipIndexes = !!length;

  for (var key in value) {
    if ((inherited || hasOwnProperty$4.call(value, key)) &&
        !(skipIndexes && (key == 'length' || isIndex(key, length)))) {
      result.push(key);
    }
  }
  return result;
}

/** Used for built-in method references. */
var objectProto$8 = Object.prototype;

/**
 * Checks if `value` is likely a prototype object.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
 */
function isPrototype(value) {
  var Ctor = value && value.constructor,
      proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto$8;

  return value === proto;
}

/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */
function overArg(func, transform) {
  return function(arg) {
    return func(transform(arg));
  };
}

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeKeys = overArg(Object.keys, Object);

/** Used for built-in method references. */
var objectProto$7 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$6 = objectProto$7.hasOwnProperty;

/**
 * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeys(object) {
  if (!isPrototype(object)) {
    return nativeKeys(object);
  }
  var result = [];
  for (var key in Object(object)) {
    if (hasOwnProperty$6.call(object, key) && key != 'constructor') {
      result.push(key);
    }
  }
  return result;
}

/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * for more details.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keys(new Foo);
 * // => ['a', 'b'] (iteration order is not guaranteed)
 *
 * _.keys('hi');
 * // => ['0', '1']
 */
function keys(object) {
  return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
}

/**
 * The base implementation of `_.assign` without support for multiple sources
 * or `customizer` functions.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @returns {Object} Returns `object`.
 */
function baseAssign(object, source) {
  return object && copyObject(source, keys(source), object);
}

/** Detect free variable `exports`. */
var freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule = freeExports && typeof module == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/** Built-in value references. */
var Buffer = moduleExports ? root.Buffer : undefined;
var allocUnsafe = Buffer ? Buffer.allocUnsafe : undefined;

/**
 * Creates a clone of  `buffer`.
 *
 * @private
 * @param {Buffer} buffer The buffer to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Buffer} Returns the cloned buffer.
 */
function cloneBuffer(buffer, isDeep) {
  if (isDeep) {
    return buffer.slice();
  }
  var length = buffer.length,
      result = allocUnsafe ? allocUnsafe(length) : new buffer.constructor(length);

  buffer.copy(result);
  return result;
}

/**
 * Copies the values of `source` to `array`.
 *
 * @private
 * @param {Array} source The array to copy values from.
 * @param {Array} [array=[]] The array to copy values to.
 * @returns {Array} Returns `array`.
 */
function copyArray(source, array) {
  var index = -1,
      length = source.length;

  array || (array = Array(length));
  while (++index < length) {
    array[index] = source[index];
  }
  return array;
}

/**
 * This method returns a new empty array.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {Array} Returns the new empty array.
 * @example
 *
 * var arrays = _.times(2, _.stubArray);
 *
 * console.log(arrays);
 * // => [[], []]
 *
 * console.log(arrays[0] === arrays[1]);
 * // => false
 */
function stubArray() {
  return [];
}

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeGetSymbols = Object.getOwnPropertySymbols;

/**
 * Creates an array of the own enumerable symbol properties of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of symbols.
 */
var getSymbols = nativeGetSymbols ? overArg(nativeGetSymbols, Object) : stubArray;

/**
 * Copies own symbol properties of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy symbols from.
 * @param {Object} [object={}] The object to copy symbols to.
 * @returns {Object} Returns `object`.
 */
function copySymbols(source, object) {
  return copyObject(source, getSymbols(source), object);
}

/**
 * Appends the elements of `values` to `array`.
 *
 * @private
 * @param {Array} array The array to modify.
 * @param {Array} values The values to append.
 * @returns {Array} Returns `array`.
 */
function arrayPush(array, values) {
  var index = -1,
      length = values.length,
      offset = array.length;

  while (++index < length) {
    array[offset + index] = values[index];
  }
  return array;
}

/**
 * The base implementation of `getAllKeys` and `getAllKeysIn` which uses
 * `keysFunc` and `symbolsFunc` to get the enumerable property names and
 * symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @param {Function} symbolsFunc The function to get the symbols of `object`.
 * @returns {Array} Returns the array of property names and symbols.
 */
function baseGetAllKeys(object, keysFunc, symbolsFunc) {
  var result = keysFunc(object);
  return isArray(object) ? result : arrayPush(result, symbolsFunc(object));
}

/**
 * Creates an array of own enumerable property names and symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names and symbols.
 */
function getAllKeys(object) {
  return baseGetAllKeys(object, keys, getSymbols);
}

/* Built-in method references that are verified to be native. */
var DataView = getNative(root, 'DataView');

/* Built-in method references that are verified to be native. */
var Promise$1 = getNative(root, 'Promise');

/* Built-in method references that are verified to be native. */
var Set = getNative(root, 'Set');

/* Built-in method references that are verified to be native. */
var WeakMap = getNative(root, 'WeakMap');

/** Used for built-in method references. */
var objectProto$10 = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString$3 = objectProto$10.toString;

/**
 * The base implementation of `getTag`.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag(value) {
  return objectToString$3.call(value);
}

/** `Object#toString` result references. */
var mapTag$1 = '[object Map]';
var objectTag$1 = '[object Object]';
var promiseTag = '[object Promise]';
var setTag$1 = '[object Set]';
var weakMapTag$1 = '[object WeakMap]';

var dataViewTag$1 = '[object DataView]';

/** Used for built-in method references. */
var objectProto$9 = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString$2 = objectProto$9.toString;

/** Used to detect maps, sets, and weakmaps. */
var dataViewCtorString = toSource(DataView);
var mapCtorString = toSource(Map);
var promiseCtorString = toSource(Promise$1);
var setCtorString = toSource(Set);
var weakMapCtorString = toSource(WeakMap);

/**
 * Gets the `toStringTag` of `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
var getTag = baseGetTag;

// Fallback for data views, maps, sets, and weak maps in IE 11 and promises in Node.js < 6.
if ((DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag$1) ||
    (Map && getTag(new Map) != mapTag$1) ||
    (Promise$1 && getTag(Promise$1.resolve()) != promiseTag) ||
    (Set && getTag(new Set) != setTag$1) ||
    (WeakMap && getTag(new WeakMap) != weakMapTag$1)) {
  getTag = function(value) {
    var result = objectToString$2.call(value),
        Ctor = result == objectTag$1 ? value.constructor : undefined,
        ctorString = Ctor ? toSource(Ctor) : undefined;

    if (ctorString) {
      switch (ctorString) {
        case dataViewCtorString: return dataViewTag$1;
        case mapCtorString: return mapTag$1;
        case promiseCtorString: return promiseTag;
        case setCtorString: return setTag$1;
        case weakMapCtorString: return weakMapTag$1;
      }
    }
    return result;
  };
}

var getTag$1 = getTag;

/** Used for built-in method references. */
var objectProto$11 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$7 = objectProto$11.hasOwnProperty;

/**
 * Initializes an array clone.
 *
 * @private
 * @param {Array} array The array to clone.
 * @returns {Array} Returns the initialized clone.
 */
function initCloneArray(array) {
  var length = array.length,
      result = array.constructor(length);

  // Add properties assigned by `RegExp#exec`.
  if (length && typeof array[0] == 'string' && hasOwnProperty$7.call(array, 'index')) {
    result.index = array.index;
    result.input = array.input;
  }
  return result;
}

/** Built-in value references. */
var Uint8Array = root.Uint8Array;

/**
 * Creates a clone of `arrayBuffer`.
 *
 * @private
 * @param {ArrayBuffer} arrayBuffer The array buffer to clone.
 * @returns {ArrayBuffer} Returns the cloned array buffer.
 */
function cloneArrayBuffer(arrayBuffer) {
  var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
  new Uint8Array(result).set(new Uint8Array(arrayBuffer));
  return result;
}

/**
 * Creates a clone of `dataView`.
 *
 * @private
 * @param {Object} dataView The data view to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned data view.
 */
function cloneDataView(dataView, isDeep) {
  var buffer = isDeep ? cloneArrayBuffer(dataView.buffer) : dataView.buffer;
  return new dataView.constructor(buffer, dataView.byteOffset, dataView.byteLength);
}

/**
 * Adds the key-value `pair` to `map`.
 *
 * @private
 * @param {Object} map The map to modify.
 * @param {Array} pair The key-value pair to add.
 * @returns {Object} Returns `map`.
 */
function addMapEntry(map, pair) {
  // Don't return `map.set` because it's not chainable in IE 11.
  map.set(pair[0], pair[1]);
  return map;
}

/**
 * A specialized version of `_.reduce` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {*} [accumulator] The initial value.
 * @param {boolean} [initAccum] Specify using the first element of `array` as
 *  the initial value.
 * @returns {*} Returns the accumulated value.
 */
function arrayReduce(array, iteratee, accumulator, initAccum) {
  var index = -1,
      length = array ? array.length : 0;

  if (initAccum && length) {
    accumulator = array[++index];
  }
  while (++index < length) {
    accumulator = iteratee(accumulator, array[index], index, array);
  }
  return accumulator;
}

/**
 * Converts `map` to its key-value pairs.
 *
 * @private
 * @param {Object} map The map to convert.
 * @returns {Array} Returns the key-value pairs.
 */
function mapToArray(map) {
  var index = -1,
      result = Array(map.size);

  map.forEach(function(value, key) {
    result[++index] = [key, value];
  });
  return result;
}

/**
 * Creates a clone of `map`.
 *
 * @private
 * @param {Object} map The map to clone.
 * @param {Function} cloneFunc The function to clone values.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned map.
 */
function cloneMap(map, isDeep, cloneFunc) {
  var array = isDeep ? cloneFunc(mapToArray(map), true) : mapToArray(map);
  return arrayReduce(array, addMapEntry, new map.constructor);
}

/** Used to match `RegExp` flags from their coerced string values. */
var reFlags = /\w*$/;

/**
 * Creates a clone of `regexp`.
 *
 * @private
 * @param {Object} regexp The regexp to clone.
 * @returns {Object} Returns the cloned regexp.
 */
function cloneRegExp(regexp) {
  var result = new regexp.constructor(regexp.source, reFlags.exec(regexp));
  result.lastIndex = regexp.lastIndex;
  return result;
}

/**
 * Adds `value` to `set`.
 *
 * @private
 * @param {Object} set The set to modify.
 * @param {*} value The value to add.
 * @returns {Object} Returns `set`.
 */
function addSetEntry(set, value) {
  // Don't return `set.add` because it's not chainable in IE 11.
  set.add(value);
  return set;
}

/**
 * Converts `set` to an array of its values.
 *
 * @private
 * @param {Object} set The set to convert.
 * @returns {Array} Returns the values.
 */
function setToArray(set) {
  var index = -1,
      result = Array(set.size);

  set.forEach(function(value) {
    result[++index] = value;
  });
  return result;
}

/**
 * Creates a clone of `set`.
 *
 * @private
 * @param {Object} set The set to clone.
 * @param {Function} cloneFunc The function to clone values.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned set.
 */
function cloneSet(set, isDeep, cloneFunc) {
  var array = isDeep ? cloneFunc(setToArray(set), true) : setToArray(set);
  return arrayReduce(array, addSetEntry, new set.constructor);
}

/** Built-in value references. */
var Symbol$1 = root.Symbol;

/** Used to convert symbols to primitives and strings. */
var symbolProto = Symbol$1 ? Symbol$1.prototype : undefined;
var symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;

/**
 * Creates a clone of the `symbol` object.
 *
 * @private
 * @param {Object} symbol The symbol object to clone.
 * @returns {Object} Returns the cloned symbol object.
 */
function cloneSymbol(symbol) {
  return symbolValueOf ? Object(symbolValueOf.call(symbol)) : {};
}

/**
 * Creates a clone of `typedArray`.
 *
 * @private
 * @param {Object} typedArray The typed array to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned typed array.
 */
function cloneTypedArray(typedArray, isDeep) {
  var buffer = isDeep ? cloneArrayBuffer(typedArray.buffer) : typedArray.buffer;
  return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
}

/** `Object#toString` result references. */
var boolTag$1 = '[object Boolean]';
var dateTag$1 = '[object Date]';
var mapTag$2 = '[object Map]';
var numberTag$1 = '[object Number]';
var regexpTag$1 = '[object RegExp]';
var setTag$2 = '[object Set]';
var stringTag$1 = '[object String]';
var symbolTag$1 = '[object Symbol]';

var arrayBufferTag$1 = '[object ArrayBuffer]';
var dataViewTag$2 = '[object DataView]';
var float32Tag$1 = '[object Float32Array]';
var float64Tag$1 = '[object Float64Array]';
var int8Tag$1 = '[object Int8Array]';
var int16Tag$1 = '[object Int16Array]';
var int32Tag$1 = '[object Int32Array]';
var uint8Tag$1 = '[object Uint8Array]';
var uint8ClampedTag$1 = '[object Uint8ClampedArray]';
var uint16Tag$1 = '[object Uint16Array]';
var uint32Tag$1 = '[object Uint32Array]';

/**
 * Initializes an object clone based on its `toStringTag`.
 *
 * **Note:** This function only supports cloning values with tags of
 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
 *
 * @private
 * @param {Object} object The object to clone.
 * @param {string} tag The `toStringTag` of the object to clone.
 * @param {Function} cloneFunc The function to clone values.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the initialized clone.
 */
function initCloneByTag(object, tag, cloneFunc, isDeep) {
  var Ctor = object.constructor;
  switch (tag) {
    case arrayBufferTag$1:
      return cloneArrayBuffer(object);

    case boolTag$1:
    case dateTag$1:
      return new Ctor(+object);

    case dataViewTag$2:
      return cloneDataView(object, isDeep);

    case float32Tag$1: case float64Tag$1:
    case int8Tag$1: case int16Tag$1: case int32Tag$1:
    case uint8Tag$1: case uint8ClampedTag$1: case uint16Tag$1: case uint32Tag$1:
      return cloneTypedArray(object, isDeep);

    case mapTag$2:
      return cloneMap(object, isDeep, cloneFunc);

    case numberTag$1:
    case stringTag$1:
      return new Ctor(object);

    case regexpTag$1:
      return cloneRegExp(object);

    case setTag$2:
      return cloneSet(object, isDeep, cloneFunc);

    case symbolTag$1:
      return cloneSymbol(object);
  }
}

/** Built-in value references. */
var objectCreate = Object.create;

/**
 * The base implementation of `_.create` without support for assigning
 * properties to the created object.
 *
 * @private
 * @param {Object} proto The object to inherit from.
 * @returns {Object} Returns the new object.
 */
var baseCreate = (function() {
  function object() {}
  return function(proto) {
    if (!isObject(proto)) {
      return {};
    }
    if (objectCreate) {
      return objectCreate(proto);
    }
    object.prototype = prototype;
    var result = new object;
    object.prototype = undefined;
    return result;
  };
}());

/** Built-in value references. */
var getPrototype = overArg(Object.getPrototypeOf, Object);

/**
 * Initializes an object clone.
 *
 * @private
 * @param {Object} object The object to clone.
 * @returns {Object} Returns the initialized clone.
 */
function initCloneObject(object) {
  return (typeof object.constructor == 'function' && !isPrototype(object))
    ? baseCreate(getPrototype(object))
    : {};
}

/**
 * This method returns `false`.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {boolean} Returns `false`.
 * @example
 *
 * _.times(2, _.stubFalse);
 * // => [false, false]
 */
function stubFalse() {
  return false;
}

/** Detect free variable `exports`. */
var freeExports$1 = typeof exports == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule$1 = freeExports$1 && typeof module == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports$1 = freeModule$1 && freeModule$1.exports === freeExports$1;

/** Built-in value references. */
var Buffer$1 = moduleExports$1 ? root.Buffer : undefined;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeIsBuffer = Buffer$1 ? Buffer$1.isBuffer : undefined;

/**
 * Checks if `value` is a buffer.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
 * @example
 *
 * _.isBuffer(new Buffer(2));
 * // => true
 *
 * _.isBuffer(new Uint8Array(2));
 * // => false
 */
var isBuffer = nativeIsBuffer || stubFalse;

/** `Object#toString` result references. */
var argsTag = '[object Arguments]';
var arrayTag = '[object Array]';
var boolTag = '[object Boolean]';
var dateTag = '[object Date]';
var errorTag = '[object Error]';
var funcTag = '[object Function]';
var genTag = '[object GeneratorFunction]';
var mapTag = '[object Map]';
var numberTag = '[object Number]';
var objectTag = '[object Object]';
var regexpTag = '[object RegExp]';
var setTag = '[object Set]';
var stringTag = '[object String]';
var symbolTag = '[object Symbol]';
var weakMapTag = '[object WeakMap]';

var arrayBufferTag = '[object ArrayBuffer]';
var dataViewTag = '[object DataView]';
var float32Tag = '[object Float32Array]';
var float64Tag = '[object Float64Array]';
var int8Tag = '[object Int8Array]';
var int16Tag = '[object Int16Array]';
var int32Tag = '[object Int32Array]';
var uint8Tag = '[object Uint8Array]';
var uint8ClampedTag = '[object Uint8ClampedArray]';
var uint16Tag = '[object Uint16Array]';
var uint32Tag = '[object Uint32Array]';

/** Used to identify `toStringTag` values supported by `_.clone`. */
var cloneableTags = {};
cloneableTags[argsTag] = cloneableTags[arrayTag] =
cloneableTags[arrayBufferTag] = cloneableTags[dataViewTag] =
cloneableTags[boolTag] = cloneableTags[dateTag] =
cloneableTags[float32Tag] = cloneableTags[float64Tag] =
cloneableTags[int8Tag] = cloneableTags[int16Tag] =
cloneableTags[int32Tag] = cloneableTags[mapTag] =
cloneableTags[numberTag] = cloneableTags[objectTag] =
cloneableTags[regexpTag] = cloneableTags[setTag] =
cloneableTags[stringTag] = cloneableTags[symbolTag] =
cloneableTags[uint8Tag] = cloneableTags[uint8ClampedTag] =
cloneableTags[uint16Tag] = cloneableTags[uint32Tag] = true;
cloneableTags[errorTag] = cloneableTags[funcTag] =
cloneableTags[weakMapTag] = false;

/**
 * The base implementation of `_.clone` and `_.cloneDeep` which tracks
 * traversed objects.
 *
 * @private
 * @param {*} value The value to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @param {boolean} [isFull] Specify a clone including symbols.
 * @param {Function} [customizer] The function to customize cloning.
 * @param {string} [key] The key of `value`.
 * @param {Object} [object] The parent object of `value`.
 * @param {Object} [stack] Tracks traversed objects and their clone counterparts.
 * @returns {*} Returns the cloned value.
 */
function baseClone(value, isDeep, isFull, customizer, key, object, stack) {
  var result;
  if (customizer) {
    result = object ? customizer(value, key, object, stack) : customizer(value);
  }
  if (result !== undefined) {
    return result;
  }
  if (!isObject(value)) {
    return value;
  }
  var isArr = isArray(value);
  if (isArr) {
    result = initCloneArray(value);
    if (!isDeep) {
      return copyArray(value, result);
    }
  } else {
    var tag = getTag$1(value),
        isFunc = tag == funcTag || tag == genTag;

    if (isBuffer(value)) {
      return cloneBuffer(value, isDeep);
    }
    if (tag == objectTag || tag == argsTag || (isFunc && !object)) {
      result = initCloneObject(isFunc ? {} : value);
      if (!isDeep) {
        return copySymbols(value, baseAssign(result, value));
      }
    } else {
      if (!cloneableTags[tag]) {
        return object ? value : {};
      }
      result = initCloneByTag(value, tag, baseClone, isDeep);
    }
  }
  // Check for circular references and return its corresponding clone.
  stack || (stack = new Stack);
  var stacked = stack.get(value);
  if (stacked) {
    return stacked;
  }
  stack.set(value, result);

  if (!isArr) {
    var props = isFull ? getAllKeys(value) : keys(value);
  }
  arrayEach(props || value, function(subValue, key) {
    if (props) {
      key = subValue;
      subValue = value[key];
    }
    // Recursively populate clone (susceptible to call stack limits).
    assignValue(result, key, baseClone(subValue, isDeep, isFull, customizer, key, value, stack));
  });
  return result;
}

/**
 * This method is like `_.clone` except that it recursively clones `value`.
 *
 * @static
 * @memberOf _
 * @since 1.0.0
 * @category Lang
 * @param {*} value The value to recursively clone.
 * @returns {*} Returns the deep cloned value.
 * @see _.clone
 * @example
 *
 * var objects = [{ 'a': 1 }, { 'b': 2 }];
 *
 * var deep = _.cloneDeep(objects);
 * console.log(deep[0] === objects[0]);
 * // => false
 */
function cloneDeep(value) {
  return baseClone(value, true, true);
}

var asyncGenerator = function () {
  function AwaitValue(value) {
    this.value = value;
  }

  function AsyncGenerator(gen) {
    var front, back;

    function send(key, arg) {
      return new Promise(function (resolve, reject) {
        var request = {
          key: key,
          arg: arg,
          resolve: resolve,
          reject: reject,
          next: null
        };

        if (back) {
          back = back.next = request;
        } else {
          front = back = request;
          resume(key, arg);
        }
      });
    }

    function resume(key, arg) {
      try {
        var result = gen[key](arg);
        var value = result.value;

        if (value instanceof AwaitValue) {
          Promise.resolve(value.value).then(function (arg) {
            resume("next", arg);
          }, function (arg) {
            resume("throw", arg);
          });
        } else {
          settle(result.done ? "return" : "normal", result.value);
        }
      } catch (err) {
        settle("throw", err);
      }
    }

    function settle(type, value) {
      switch (type) {
        case "return":
          front.resolve({
            value: value,
            done: true
          });
          break;

        case "throw":
          front.reject(value);
          break;

        default:
          front.resolve({
            value: value,
            done: false
          });
          break;
      }

      front = front.next;

      if (front) {
        resume(front.key, front.arg);
      } else {
        back = null;
      }
    }

    this._invoke = send;

    if (typeof gen.return !== "function") {
      this.return = undefined;
    }
  }

  if (typeof Symbol === "function" && Symbol.asyncIterator) {
    AsyncGenerator.prototype[Symbol.asyncIterator] = function () {
      return this;
    };
  }

  AsyncGenerator.prototype.next = function (arg) {
    return this._invoke("next", arg);
  };

  AsyncGenerator.prototype.throw = function (arg) {
    return this._invoke("throw", arg);
  };

  AsyncGenerator.prototype.return = function (arg) {
    return this._invoke("return", arg);
  };

  return {
    wrap: function (fn) {
      return function () {
        return new AsyncGenerator(fn.apply(this, arguments));
      };
    },
    await: function (value) {
      return new AwaitValue(value);
    }
  };
}();





var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();







var get$1 = function get$1(object, property, receiver) {
  if (object === null) object = Function.prototype;
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent === null) {
      return undefined;
    } else {
      return get$1(parent, property, receiver);
    }
  } else if ("value" in desc) {
    return desc.value;
  } else {
    var getter = desc.get;

    if (getter === undefined) {
      return undefined;
    }

    return getter.call(receiver);
  }
};

var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};











var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};



var set$1 = function set$1(object, property, value, receiver) {
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent !== null) {
      set$1(parent, property, value, receiver);
    }
  } else if ("value" in desc && desc.writable) {
    desc.value = value;
  } else {
    var setter = desc.set;

    if (setter !== undefined) {
      setter.call(receiver, value);
    }
  }

  return value;
};

/**
 * Base error class.
 */
var ExtendableError = function (_Error) {
  inherits(ExtendableError, _Error);

  /**
   * Constructor.
   *
   * @method  constructor
   * @author  Fritz Lekschas
   * @date    2016-09-12
   * @param   {String}  message  Custom error message.
   */
  function ExtendableError(message) {
    classCallCheck(this, ExtendableError);

    var _this = possibleConstructorReturn(this, (ExtendableError.__proto__ || Object.getPrototypeOf(ExtendableError)).call(this, message));

    _this.name = _this.constructor.name;
    _this.message = message;
    Error.captureStackTrace(_this, _this.constructor.name);
    return _this;
  }

  return ExtendableError;
}(Error);

/**
 * D3 version 4 not found error.
 */
var D3VersionFourRequired = function (_ExtendableError) {
  inherits(D3VersionFourRequired, _ExtendableError);

  /**
   * Constructor
   *
   * @method  constructor
   * @author  Fritz Lekschas
   * @date    2016-09-12
   * @param   {String}  versionFound  D3 version string.
   */
  function D3VersionFourRequired(versionFound) {
    classCallCheck(this, D3VersionFourRequired);
    return possibleConstructorReturn(this, (D3VersionFourRequired.__proto__ || Object.getPrototypeOf(D3VersionFourRequired)).call(this, 'D3 version 4 is required to run the code. Found version ' + versionFound));
  }

  return D3VersionFourRequired;
}(ExtendableError);

/**
 * When varible is no object
 */
var NoObject = function (_ExtendableError2) {
  inherits(NoObject, _ExtendableError2);

  /**
   * Constructor
   *
   * @method  constructor
   * @author  Fritz Lekschas
   * @date    2016-09-12
   * @param   {String}  variableName  Name of the variable that ought to be an
   *   object.
   */
  function NoObject(variableName) {
    classCallCheck(this, NoObject);
    return possibleConstructorReturn(this, (NoObject.__proto__ || Object.getPrototypeOf(NoObject)).call(this, 'The "' + variableName + '" must be an object.'));
  }

  return NoObject;
}(ExtendableError);

// Internal
var LayoutNotAvailable = function (_ExtendableError) {
  inherits(LayoutNotAvailable, _ExtendableError);

  function LayoutNotAvailable(message) {
    classCallCheck(this, LayoutNotAvailable);
    return possibleConstructorReturn(this, (LayoutNotAvailable.__proto__ || Object.getPrototypeOf(LayoutNotAvailable)).call(this, message || 'D3.layout.listGraph.js has not been loaded yet.'));
  }

  return LayoutNotAvailable;
}(ExtendableError);

var EventDispatcherNoFunction = function (_ExtendableError2) {
  inherits(EventDispatcherNoFunction, _ExtendableError2);

  function EventDispatcherNoFunction(message) {
    classCallCheck(this, EventDispatcherNoFunction);
    return possibleConstructorReturn(this, (EventDispatcherNoFunction.__proto__ || Object.getPrototypeOf(EventDispatcherNoFunction)).call(this, message || 'Dispatcher needs to be a function.'));
  }

  return EventDispatcherNoFunction;
}(ExtendableError);

var CLASSNAME = 'list-graph';

/**
 * Width of the scrollbar in pixel.
 *
 * @type  {Number}
 */
var SCROLLBAR_WIDTH = 6;

/**
 * Default number of columns
 *
 * @type  {Number}
 */
var COLUMNS = 5;

/**
 * Default number of rows.
 *
 * @type  {Number}
 */
var ROWS = 5;

/**
 * Path to the icon file. An empty path is equal to inline SVG.
 *
 * @type  {String}
 */
var ICON_PATH = '';

/**
 * Default sort order.
 *
 * @description
 * -1 = desc, 1 = asc
 *
 * @type  {Number}
 */
var DEFAULT_SORT_ORDER = -1;

/**
 * Default bar display mode.
 *
 * @type  {String}
 */
var DEFAULT_BAR_MODE = 'one';

/**
 * Default highlighting of the active level.
 *
 * @type  {Boolean}
 */
var HIGHLIGHT_ACTIVE_LEVEL = true;

/**
 * Default active level.
 *
 * @type  {Number}
 */
var ACTIVE_LEVEL = 0;

/**
 * Default difference when no custom root is queried for.
 *
 * @type  {Number}
 */
var NO_ROOT_ACTIVE_LEVEL_DIFF = 0;

/**
 * Default querying.
 *
 * @type  {Boolean}
 */
var QUERYING = false;

/**
 * Default value for hiding links pointing to nodes outside the visible area.
 *
 * @type  {Boolean}
 */
var HIDE_OUTWARDS_LINKS = false;

/**
 * Default value for showing the link indicator bar when links to hidden nodes
 * are hidden.
 *
 * @type  {Boolean}
 */
var SHOW_LINK_LOCATION = false;

/**
 * Default for disabling debouncing of the node context menu.
 *
 * @type  {Boolean}
 */
var DISABLE_DEBOUNCED_CONTEXT_MENU = false;

/**
 * Show title
 *
 * @type  {Boolean}
 */
var SHOW_TITLE = false;

/**
 * Default transition speed in milliseconds for super fast transition.
 *
 * @type  {Number}
 */
var TRANSITION_LIGHTNING_FAST = 150;

/**
 * Default transition speed in milliseconds for fast transition.
 *
 * @type  {Number}
 */


/**
 * Default transition speed in milliseconds for semi-fast transition.
 *
 * @type  {Number}
 */
var TRANSITION_SEMI_FAST = 250;

/**
 * Default transition speed in milliseconds for normal transition.
 *
 * @type  {Number}
 */


/**
 * Default transition speed in milliseconds for slow transition.
 *
 * @type  {Number}
 */


/**
 * Default transition speed in milliseconds for slow transition.
 *
 * @type  {Number}
 */


/**
 * Strength of how much links should be bundled.
 *
 * @description
 * The value ranges from 0 (no bundling at all) to 1 (move line through every
 * controll point).
 *
 * @type  {Number}
 */
var LINK_BUNDLING_STRENGTH = 0.95;

/**
 * Stretch out factor for link bundling.
 *
 * @description
 * The value ranges from 0 (no stretch out at all) to 1 (which means the two
 * middle control points defining the B-Spline are identical).
 *
 * @type  {Number}
 */

// External
var TOPBAR_EL = 'div';
var TOPBAR_CLASS = 'top-bar';

var TOPBAR_CONTROL_EL = 'ul';
var TOPBAR_CONTROL_CLASS = 'controls';
var TOPBAR_GLOBAL_CONTROL_CLASS = 'global-controls';

var Topbar = function () {
  /**
   * Topbar constructor
   *
   * @method  constructor
   * @author  Fritz Lekschas
   * @date    2016-10-02
   * @param   {Object}   vis                  List Graph App.
   * @param   {Object}   baseEl               D3 base selection.
   * @param   {Object}   visData              List Graph App data.
   * @param   {Array}    customTopbarButtons  Array of custom topbar buttons.
   * @param   {Boolean}  showTitle            If `true` show title.
   */
  function Topbar(vis, baseEl, visData, customTopbarButtons, showTitle) {
    var _this = this;

    classCallCheck(this, Topbar);

    var self = this;

    this.vis = vis;
    this.visData = visData;
    this.customTopbarButtons = customTopbarButtons;
    this.showTitle = showTitle;

    // Add base topbar element
    this.el = baseEl.select('.' + TOPBAR_CLASS);

    if (this.el.empty()) {
      this.el = baseEl.insert(TOPBAR_EL, ':first-child').attr('class', TOPBAR_CLASS);
    }

    this.controlSwitch = this.el.append('div').attr('title', 'Toggle global / local topbar').style('width', this.visData.global.column.padding + 'px').classed('control-switch', true).on('click', this.switch.bind(this));

    this.switchArrow = this.controlSwitch.append('svg').append('use').attr('xlink:href', this.vis.iconPath + '#arrow-down').attr('class', 'switch-arrow');

    this.globalControls = this.el.append(TOPBAR_CONTROL_EL).classed(TOPBAR_GLOBAL_CONTROL_CLASS, true);

    this.globalPrecision = this.globalControls.append('li').attr('class', 'title').text('List Graph').classed('show', this.showTitle);

    // Add button for sorting by precision
    this.globalPrecision = this.globalControls.append('li').attr('class', 'control-btn sort-precision').classed('active', function () {
      if (self.vis.currentSorting.global.type === 'precision') {
        // Save currently active element. Needed when when re-sorting for the
        // first time, to be able to de-highlight this element.
        self.vis.currentSorting.global.el = d3.select(this);
        return true;
      }
      return false;
    }).on('click', function () {
      self.sortAllColumns(this, 'precision');
    }).on('mouseenter', function () {
      _this.vis.interactionWrapper.call(_this.vis, function () {
        _this.highlightBars(undefined, 'precision');
      }, []);
    }).on('mouseleave', function () {
      _this.vis.interactionWrapper.call(_this.vis, function () {
        _this.highlightBars(undefined, 'precision', true);
      }, []);
    });

    this.globalPrecisionWrapper = this.globalPrecision.append('div').attr('class', 'wrapper');

    this.globalPrecisionWrapper.append('span').attr('class', 'label').text('Precision');

    this.globalPrecisionWrapper.append('svg').attr('class', 'icon-unsort invisible-default').classed('visible', this.vis.currentSorting.global.type !== 'precision').append('use').attr('xlink:href', this.vis.iconPath + '#unsort');

    this.globalPrecisionWrapper.append('svg').attr('class', 'icon-sort-asc invisible-default').classed('visible', this.vis.currentSorting.global.type === 'precision' && this.vis.currentSorting.global.order === 1).append('use').attr('xlink:href', this.vis.iconPath + '#sort-asc');

    this.globalPrecisionWrapper.append('svg').attr('class', 'icon-sort-desc invisible-default').classed('visible', this.vis.currentSorting.global.type === 'precision' && this.vis.currentSorting.global.order !== 1).append('use').attr('xlink:href', this.vis.iconPath + '#sort-desc');

    // Add button for sorting by recall
    this.globalRecall = this.globalControls.append('li').attr('class', 'control-btn sort-recall').classed('active', function () {
      if (self.vis.currentSorting.global.type === 'recall') {
        // See precision
        self.vis.currentSorting.global.el = d3.select(this);
        return true;
      }
      return false;
    }).on('click', function () {
      self.sortAllColumns(this, 'recall');
    }).on('mouseenter', function () {
      _this.vis.interactionWrapper.call(_this.vis, function () {
        _this.highlightBars(undefined, 'recall');
      }, []);
    }).on('mouseleave', function () {
      _this.vis.interactionWrapper.call(_this.vis, function () {
        _this.highlightBars(undefined, 'recall', true);
      }, []);
    });

    this.globalRecallWrapper = this.globalRecall.append('div').attr('class', 'wrapper');

    this.globalRecallWrapper.append('span').attr('class', 'label').text('Recall');

    this.globalRecallWrapper.append('svg').attr('class', 'icon-unsort invisible-default').classed('visible', this.vis.currentSorting.global.type !== 'recall').append('use').attr('xlink:href', this.vis.iconPath + '#unsort');

    this.globalRecallWrapper.append('svg').attr('class', 'icon-sort-asc invisible-default').classed('visible', this.vis.currentSorting.global.type === 'recall' && this.vis.currentSorting.global.order === 1).append('use').attr('xlink:href', this.vis.iconPath + '#sort-asc');

    this.globalRecallWrapper.append('svg').attr('class', 'icon-sort-desc invisible-default').classed('visible', this.vis.currentSorting.global.type === 'recall' && this.vis.currentSorting.global.order !== 1).append('use').attr('xlink:href', this.vis.iconPath + '#sort-desc');

    // Add button for sorting by name
    this.globalName = this.globalControls.append('li').attr('class', 'control-btn sort-name').classed('active', function () {
      if (self.vis.currentSorting.global.type === 'name') {
        // See precision
        self.vis.currentSorting.global.el = d3.select(this);
        return true;
      }
      return false;
    }).on('click', function () {
      self.sortAllColumns(this, 'name');
    }).on('mouseenter', function () {
      _this.vis.interactionWrapper.call(_this.vis, function () {
        _this.highlightLabels();
      }, []);
    }).on('mouseleave', function () {
      _this.vis.interactionWrapper.call(_this.vis, function () {
        _this.highlightLabels(true);
      }, []);
    });

    this.globalNameWrapper = this.globalName.append('div').attr('class', 'wrapper');

    this.globalNameWrapper.append('span').attr('class', 'label').text('Name');

    this.globalNameWrapper.append('svg').attr('class', 'icon-unsort invisible-default').classed('visible', this.vis.currentSorting.global.type !== 'name').append('use').attr('xlink:href', this.vis.iconPath + '#unsort');

    this.globalNameWrapper.append('svg').attr('class', 'icon-sort-asc invisible-default').classed('visible', this.vis.currentSorting.global.type === 'name' && this.vis.currentSorting.global.order === 1).append('use').attr('xlink:href', this.vis.iconPath + '#sort-alpha-asc');

    this.globalNameWrapper.append('svg').attr('class', 'icon-sort-desc invisible-default').classed('visible', this.vis.currentSorting.global.type === 'name' && this.vis.currentSorting.global.order !== 1).append('use').attr('xlink:href', this.vis.iconPath + '#sort-alpha-desc');

    // Add button for switching to 'one bar'
    this.globalOneBar = this.globalControls.append('li').attr('class', 'control-btn one-bar').classed('active', this.vis.barMode === 'one').on('click', function () {
      self.switchBarMode(this, 'one');
    });

    this.globalOneBarWrapper = this.globalOneBar.append('div').attr('class', 'wrapper').text('One bar');

    this.globalOneBarWrapper.append('svg').attr('class', 'icon-one-bar').append('use').attr('xlink:href', this.vis.iconPath + '#one-bar');

    // Add button for switching to 'two bars'
    this.globalTwoBars = this.globalControls.append('li').attr('class', 'control-btn two-bars').classed('active', this.vis.barMode === 'two').on('click', function () {
      self.switchBarMode(this, 'two');
    });

    this.globalTwoBarsWrapper = this.globalTwoBars.append('div').attr('class', 'wrapper').text('Two bars');

    this.globalTwoBarsWrapper.append('svg').attr('class', 'icon-two-bars').append('use').attr('xlink:href', this.vis.iconPath + '#two-bars');

    // Add button for zoom-out
    this.globalZoomOut = this.globalControls.append('li').attr('class', 'control-btn zoom-out').classed('active', this.vis.zoomedOut).on('click', function () {
      self.vis.toggleView.call(self.vis);
      d3.select(this).classed('active', self.vis.zoomedOut);
    });

    this.globalZoomOutWrapper = this.globalZoomOut.append('div').attr('class', 'wrapper').text('Zoom Out');

    this.globalZoomOutWrapper.append('svg').attr('class', 'icon-zoom-out').append('use').attr('xlink:href', this.vis.iconPath + '#zoom-out');

    // Add custom button
    for (var i = 0; i < this.customTopbarButtons.length; i++) {
      var btn = this.globalControls.append('li').attr('class', 'control-btn').on('click', this.customTopbarButtons[i].callback);

      var wrapper = btn.append('div').attr('class', 'wrapper').text(this.customTopbarButtons[i].label);

      if (this.customTopbarButtons[i].iconSvg) {
        wrapper.append('svg').attr('class', 'icon').append('use').attr('xlink:href', this.customTopbarButtons[i].iconSvg);
      }

      if (this.customTopbarButtons[i].iconSpan) {
        wrapper.append('span').attr('class', 'icon ' + this.customTopbarButtons[i].iconSpan);
      }
    }

    this.localControlWrapper = this.el.append('div').classed('local-controls', true);

    this.localControls = this.localControlWrapper.selectAll(TOPBAR_CONTROL_CLASS).data(visData.nodes).enter().append(TOPBAR_CONTROL_EL).classed(TOPBAR_CONTROL_CLASS, true).style('width', this.visData.global.column.width + 'px');

    this.localControls.each(function (data, index) {
      var control = d3.select(this);

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

      control.append('li').attr('class', 'control-btn').style('width', self.visData.global.column.padding + 'px');

      control.append('li').attr('class', 'control-btn sort-precision ease-all').classed('active', function () {
        if (self.vis.currentSorting.local[index].type === 'precision') {
          // See precision
          self.vis.currentSorting.local[index].el = d3.select(this);
          return true;
        }
        return false;
      }).style('width', self.visData.global.column.contentWidth / 2 + 'px').style('left', self.visData.global.column.padding + 'px').on('click', function (controlData) {
        self.sortColumn(this, controlData.level, 'precision');
      }).on('mouseenter', function () {
        self.highlightBars(this.parentNode, 'precision');
        d3.select(this).style('width', self.visData.global.column.contentWidth - 16 + 'px');
      }).on('mouseleave', function () {
        self.highlightBars(this.parentNode, 'precision', true);
        d3.select(this).style('width', self.visData.global.column.contentWidth / 2 + 'px');
      }).html('<div class="expandable-label">' + '  <span class="letter abbr">P</span>' + '  <span class="letter abbr">r</span>' + '  <span class="letter">e</span>' + '  <span class="letter abbr">c</span>' + '  <span class="letter">i</span>' + '  <span class="letter">s</span>' + '  <span class="letter">i</span>' + '  <span class="letter">o</span>' + '  <span class="letter">n</span>' + '</div>' + '<svg class="icon-unsort invisible-default ' + (self.vis.currentSorting.local[index].type !== 'precision' ? 'visible' : '') + '">' + // eslint-disable-line
      '  <use xlink:href="' + self.vis.iconPath + '#unsort"></use>' + '</svg>' + '<svg class="icon-sort-asc invisible-default ' + (self.vis.currentSorting.local[index].type === 'precision' && self.vis.currentSorting.local[index].order === 1 ? 'visible' : '') + '">' + // eslint-disable-line
      '  <use xlink:href="' + self.vis.iconPath + '#sort-asc"></use>' + '</svg>' + '<svg class="icon-sort-desc invisible-default ' + (self.vis.currentSorting.local[index].type === 'precision' && self.vis.currentSorting.local[index].order !== 1 ? 'visible' : '') + '">' + // eslint-disable-line
      '  <use xlink:href="' + self.vis.iconPath + '#sort-desc"></use>' + '</svg>');

      control.append('li').attr('class', 'control-btn sort-recall ease-all').classed('active', function () {
        if (self.vis.currentSorting.local[index].type === 'recall') {
          // See recall
          self.vis.currentSorting.local[index].el = d3.select(this);
          return true;
        }
        return false;
      }).style('width', self.visData.global.column.contentWidth / 2 + 'px').style('left', self.visData.global.column.contentWidth / 2 + self.visData.global.column.padding + 'px').on('click', function (controlData) {
        self.sortColumn(this, controlData.level, 'recall');
      }).on('mouseenter', function () {
        self.highlightBars(this.parentNode, 'recall');
        d3.select(this).style('width', self.visData.global.column.contentWidth - 16 + 'px').style('left', self.visData.global.column.padding + 16 + 'px');
      }).on('mouseleave', function () {
        self.highlightBars(this.parentNode, 'recall', true);
        d3.select(this).style('width', self.visData.global.column.contentWidth / 2 + 'px').style('left', self.visData.global.column.contentWidth / 2 + self.visData.global.column.padding + 'px');
      }).html('<div class="expandable-label">' + '  <span class="letter abbr">R</span>' + '  <span class="letter">e</span>' + '  <span class="letter abbr">c</span>' + '  <span class="letter">a</span>' + '  <span class="letter abbr">l</span>' + '  <span class="letter">l</span>' + '</div>' + '<svg class="icon-unsort invisible-default ' + (self.vis.currentSorting.local[index].type !== 'recall' ? 'visible' : '') + '">' + // eslint-disable-line
      '  <use xlink:href="' + self.vis.iconPath + '#unsort"></use>' + '</svg>' + '<svg class="icon-sort-asc invisible-default ' + (self.vis.currentSorting.local[index].type === 'recall' && self.vis.currentSorting.local[index].order === 1 ? 'visible' : '') + '">' + // eslint-disable-line
      '  <use xlink:href="' + self.vis.iconPath + '#sort-asc"></use>' + '</svg>' + '<svg class="icon-sort-desc invisible-default ' + (self.vis.currentSorting.local[index].type === 'recall' && self.vis.currentSorting.local[index].order !== 1 ? 'visible' : '') + '">' + // eslint-disable-line
      '  <use xlink:href="' + self.vis.iconPath + '#sort-desc"></use>' + '</svg>');

      control.append('li').attr('class', 'control-btn').style('width', self.visData.global.column.padding + 'px');

      if (self.vis.currentSorting.local[index].type) {
        self.vis.currentSorting.local[index].el = control.select('.sort-' + self.vis.currentSorting.local[index].type);
      }
    });
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


  createClass(Topbar, [{
    key: 'highlightBars',
    value: function highlightBars(el, type, deHighlight) {
      var nodes = el ? this.selectNodesLevel(el) : this.vis.baseElD3.selectAll('.node');

      nodes.classed('highlight-bar', !deHighlight).selectAll('.bar.' + type).classed('highlight', !deHighlight);
    }

    /**
     * Highlight node labels
     *
     * @method  highlightLabels
     * @author  Fritz Lekschas
     * @date    2016-10-02
     * @param   {Boolean}  deHighlight  If `true` the highlighting will be reset.
     */

  }, {
    key: 'highlightLabels',
    value: function highlightLabels(deHighlight) {
      this.vis.baseElD3.selectAll('.node').classed('highlight-label', !deHighlight);
    }

    /**
     * Reset semi-active sort button
     *
     * @method  resetSemiActiveSortingEls
     * @author  Fritz Lekschas
     * @date    2016-10-02
     */

  }, {
    key: 'resetSemiActiveSortingEls',
    value: function resetSemiActiveSortingEls() {
      this.el.selectAll('.semi-active').classed('semi-active', false);
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

  }, {
    key: 'resetSortEl',
    value: function resetSortEl(el, newType) {
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
     * Re-render
     *
     * @method  reRender
     * @author  Fritz Lekschas
     * @date    2017-01-16
     * @param   {Object}  newVisData  New vid data.
     */

  }, {
    key: 'reRender',
    value: function reRender(newVisData) {
      if (newVisData) {
        this.visData = newVisData;
      }

      this.controlSwitch.style('width', this.visData.global.column.padding + 'px');

      this.localControls.style('width', this.visData.global.column.width + 'px');

      this.localControls.selectAll('.control-btn').style('width', this.visData.global.column.padding + 'px');

      this.localControls.selectAll('.control-btn.sort-precision').style('width', this.visData.global.column.contentWidth / 2 + 'px').style('left', this.visData.global.column.padding + 'px');

      this.localControls.selectAll('.control-btn.sort-recall').style('width', this.visData.global.column.contentWidth / 2 + 'px').style('left', this.visData.global.column.contentWidth / 2 + this.visData.global.column.padding + 'px');
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

  }, {
    key: 'selectNodesLevel',
    value: function selectNodesLevel(el) {
      return this.vis.selectByLevel(d3.select(el).datum().level, '.node');
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

  }, {
    key: 'sortAllColumns',
    value: function sortAllColumns(el, type) {
      var newSortType = this.vis.currentSorting.global.type !== type;

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

      var columnKeys = Object.keys(this.vis.currentSorting.local);
      for (var i = 0, len = columnKeys.length; i < len; i++) {
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

  }, {
    key: 'sortColumn',
    value: function sortColumn(el, index, type, global) {
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

      var newSortType = false;

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
        this.vis.currentSorting.local[index].el.select('.icon-sort-desc').classed('visible', false);
        this.vis.currentSorting.local[index].el.select('.icon-sort-asc').classed('visible', true);
      } else {
        this.vis.currentSorting.local[index].order = -1;
        this.vis.currentSorting.local[index].el.select('.icon-sort-asc').classed('visible', false);
        this.vis.currentSorting.local[index].el.select('.icon-sort-desc').classed('visible', true);
      }

      this.vis.currentSorting.local[index].el.select('.icon-unsort').classed('visible', false);

      this.vis.currentSorting.local[index].el.classed('active', true);

      if (!global) {
        this.vis.sortColumn(index, type, this.vis.currentSorting.local[index].order, newSortType);
      }
    }

    /**
     * Toggle between the global topbar buttons and the local sort buttons.
     *
     * @method  switch
     * @author  Fritz Lekschas
     * @date    2016-10-02
     */

  }, {
    key: 'switch',
    value: function _switch() {
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

  }, {
    key: 'switchBarMode',
    value: function switchBarMode(el, mode) {
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
  }]);
  return Topbar;
}();

// External
/**
 * Class name of columns.
 *
 * @type  {String}
 */
var COLUMN_CLASS = 'column';

/**
 * Class name of scroll containers.
 *
 * @type  {String}
 */
var SCROLL_CONTAINER_CLASS = 'scroll-container';

var Levels = function () {
  /**
   * Level / column constructor.
   *
   * @method  constructor
   * @author  Fritz Lekschas
   * @date    2016-09-14
   * @param   {Object}  selection  D3 selection of element the levels should be
   *   appended to.
   * @param   {Object}  vis        List Graph App.
   * @param   {Object}  visData    List Graph App data.
   */
  function Levels(selection, vis, visData) {
    var _this = this;

    classCallCheck(this, Levels);

    this.vis = vis;
    this.visData = visData;
    this.groups = selection.selectAll('g').data(this.visData.nodes).enter().append('g').attr('class', COLUMN_CLASS).classed('active', function (data, index) {
      if (_this.vis.highlightActiveLevel) {
        if (!_this.vis.nodes || !_this.vis.nodes.rootedNode) {
          return index === _this.vis.activeLevel - _this.vis.noRootActiveLevelDiff;
        }
        return index === _this.vis.activeLevel;
      }
      return false;
    }).each(function (data) {
      data.scrollTop = 0;
    });

    // We need to add an empty rectangle that fills up the whole column to ensure
    // that the `g`'s size is at a maximum, otherwise scrolling will be halted
    // when the cursor leaves an actually drawn element.
    this.scrollHelper = this.groups.append('rect').attr('class', SCROLL_CONTAINER_CLASS).attr('x', function (data) {
      return data.x;
    }).attr('y', function (data) {
      return data.y;
    }).attr('width', this.visData.global.column.width + 1).attr('height', this.visData.global.column.height);
  }

  /**
   * Re-render
   *
   * @method  reRender
   * @author  Fritz Lekschas
   * @date    2017-01-16
   * @param   {Object}  newVisData  New vid data.
   */


  createClass(Levels, [{
    key: 'reRender',
    value: function reRender(newVisData) {
      if (newVisData) {
        this.visData = newVisData;
      }

      this.groups.data(this.visData.nodes);

      this.scrollHelper.data(this.visData.nodes).attr('x', function (data) {
        return data.x;
      }).attr('y', function (data) {
        return data.y;
      }).attr('width', this.visData.global.column.width + 1).attr('height', this.visData.global.column.height);
    }

    /**
     * Prepare column for scrolling.
     *
     * @method  scrollPreparation
     * @author  Fritz Lekschas
     * @date    2016-09-14
     * @param   {Number}  scrollbarWidth  Width of the scrollbar in pixel.
     */

  }, {
    key: 'scrollPreparation',
    value: function scrollPreparation(scrollbarWidth) {
      var _this2 = this;

      this.groups.each(function (data, index) {
        var contentHeight = data.nodes.getBoundingClientRect().height + 2 * _this2.visData.global.row.padding;
        var scrollHeight = contentHeight - _this2.visData.global.column.height;
        var scrollbarHeight = scrollHeight > 0 ? Math.max(_this2.visData.global.column.height * _this2.visData.global.column.height / contentHeight, 10) : 0;

        data.height = contentHeight;
        data.linkSelections = {
          incoming: index > 0 ? _this2.vis.selectByLevel(index - 1, '.link') : null,
          outgoing: _this2.vis.selectByLevel(index, '.link')
        };
        data.scrollHeight = scrollHeight;
        data.scrollTop = 0;
        data.scrollbar = {
          el: undefined,
          x: data.x + (_this2.visData.global.column.width - scrollbarWidth) - 1,
          y: 0,
          width: scrollbarWidth,
          height: scrollbarHeight,
          scrollHeight: _this2.visData.global.column.height - scrollbarHeight,
          scrollTop: 0,
          heightScale: d3.scaleLinear().domain([0, scrollHeight]).range([0, _this2.visData.global.column.height - scrollbarHeight])
        };
        data.invertedHeightScale = data.scrollbar.heightScale.invert;
      });
    }

    /**
     * Update the properties for column scrolling.
     *
     * @method  updateScrollProperties
     * @author  Fritz Lekschas
     * @date    2016-09-14
     */

  }, {
    key: 'updateScrollProperties',
    value: function updateScrollProperties() {
      var _this3 = this;

      this.groups.each(function (data) {
        var contentHeight = data.nodes.getBoundingClientRect().height + 2 * _this3.visData.global.row.padding;
        var scrollHeight = contentHeight - _this3.visData.global.column.height;
        var scrollbarHeight = scrollHeight > 0 ? Math.max(_this3.visData.global.column.height * _this3.visData.global.column.height / contentHeight, 10) : 0;

        data.height = contentHeight;
        data.scrollHeight = scrollHeight;
        data.scrollTop = 0;
        data.scrollbar.x = data.x + (_this3.visData.global.column.width - data.scrollbar.width) - 1;
        data.scrollbar.y = 0;
        data.scrollbar.height = scrollbarHeight;
        data.scrollbar.scrollHeight = _this3.visData.global.column.height - scrollbarHeight;
        data.scrollbar.scrollTop = 0;
        data.scrollbar.heightScale = d3.scaleLinear().domain([0, scrollHeight]).range([0, _this3.visData.global.column.height - scrollbarHeight]);
      });
    }

    /**
     * Check if column should be hidden when it's not in the visible area.
     *
     * @method  updateVisibility
     * @author  Fritz Lekschas
     * @date    2016-09-14
     */

  }, {
    key: 'updateVisibility',
    value: function updateVisibility() {
      this.groups.each(function () {
        var group = d3.select(this);

        group.classed('hidden', group.selectAll('.node').filter(function (data) {
          return !data.hidden;
        }).empty());
      });
    }

    /**
     * Get the column's class name.
     *
     * @method  className
     * @author  Fritz Lekschas
     * @date    2016-09-14
     * @return  {String}  Class name of the column.
     */

  }, {
    key: 'focus',


    /**
     * Focus a level.
     *
     * @method  focus
     * @author  Fritz Lekschas
     * @date    2016-09-14
     * @param   {Number}  level  ID of the column.
     */
    value: function focus(level) {
      if (this.vis.highlightActiveLevel) {
        this.groups.filter(function (data) {
          return data.level === level;
        }).classed('active', true);
      }
    }

    /**
     * Blur a level.
     *
     * @method  blur
     * @author  Fritz Lekschas
     * @date    2016-09-14
     * @param   {Number}  level  ID of the column.
     */

  }, {
    key: 'blur',
    value: function blur(level) {
      if (this.vis.highlightActiveLevel) {
        if (level) {
          this.groups.filter(function (data) {
            return data.level === level;
          }).classed('active', false);
        } else {
          this.groups.classed('active', false);
        }
      }
    }
  }, {
    key: 'height',


    /**
     * Get the column's height.
     *
     * @method  height
     * @author  Fritz Lekschas
     * @date    2016-09-14
     * @return  {Number}  Column height in pixel.
     */
    get: function get() {
      return this.visData.global.column.height;
    }
  }], [{
    key: 'className',
    get: function get() {
      return COLUMN_CLASS;
    }
  }]);
  return Levels;
}();

// External
// Internal
/**
 * Class name of the group of link container.
 *
 * @type  {String}
 */
var LINKS_CLASS = 'links';

/**
 * Class name of a link element.
 *
 * @type  {String}
 */
var LINK_CLASS = 'link';

var Links = function () {
  /**
   * [constructor description]
   *
   * @method  constructor
   * @author  Fritz Lekschas
   * @date    2016-09-14
   * @param   {Object}   vis      List Graph App.
   * @param   {Object}   levels   List Graph App's levels.
   * @param   {Object}   visData  List Graph App's data.
   * @param   {Object}   layout   List Graph Layout.
   */
  function Links(vis, levels, visData, layout) {
    var _this = this;

    classCallCheck(this, Links);

    this.vis = vis;
    this.visData = visData;
    this.layout = layout;

    this.groups = levels.append('g').attr('class', LINKS_CLASS).call(function (selection) {
      selection.each(function () {
        d3.select(this.parentNode).datum().links = this;
      });
    });

    this.links = this.groups.selectAll(LINK_CLASS).data(function (data, index) {
      return _this.layout.links(index);
    }).enter().append('g').attr('class', LINK_CLASS).classed('visible', !this.vis.hideOutwardsLinks || this.linkVisibility.bind(this));

    this.links.append('path').attr('class', LINK_CLASS + '-bg').attr('d', this.diagonal.bind(this));

    this.links.append('path').attr('class', LINK_CLASS + '-direct').attr('d', this.diagonal.bind(this));
  }

  /**
   * Creates a SVG path string for links based on B-splines.
   *
   * @method  diagonal
   * @author  Fritz Lekschas
   * @date    2016-09-22
   * @return  {String}  SVG path string.
   */


  createClass(Links, [{
    key: 'linkVisibility',


    /**
     * Assess link visibility
     *
     * @method  linkVisibility
     * @author  Fritz Lekschas
     * @date    2016-09-14
     * @param   {Object}  data  D3 selection data object of links.
     */
    value: function linkVisibility(data) {
      // Cache visibility.
      data.hidden = this.vis.pointsOutside.call(this.vis, data);
      return data.hidden === 0;
    }

    /**
     * [highlight description]
     *
     * @method  highlight
     * @author  Fritz Lekschas
     * @date    2016-09-14
     * @param   {Array}    nodeIds    Array of Node IDs.
     * @param   {Boolean}  highlight  If `true` highlights links.
     * @param   {String}   className  Class name added for CSS-based highlighting.
     */

  }, {
    key: 'highlight',
    value: function highlight(nodeIds, _highlight, className) {
      this.links.filter(function (data) {
        return nodeIds[data.id];
      }).classed(className, _highlight);
    }

    /**
     * Make links temporarily visible.
     *
     * @method  makeAllTempVisible
     * @author  Fritz Lekschas
     * @date    2016-09-22
     * @param   {Boolean}  unset  If `true` reverts the temporal visibility.
     */

  }, {
    key: 'makeAllTempVisible',
    value: function makeAllTempVisible(unset) {
      if (unset) {
        this.links.classed('visible', this.linkVisibility.bind(this));
      } else {
        this.links.classed('visible', true);
      }
    }

    /**
     * Re-render
     *
     * @method  reRender
     * @author  Fritz Lekschas
     * @date    2017-01-16
     * @param   {Object}  newVisData  New vid data.
     */

  }, {
    key: 'reRender',
    value: function reRender(newVisData) {
      var _this2 = this;

      if (newVisData) {
        this.visData = newVisData;

        this.groups.data(this.visData.nodes);

        this.links.data(function (data, index) {
          return _this2.layout.links(index);
        });
      }

      this.links.selectAll('path').attr('d', this.diagonal);

      this.makeAllTempVisible(true);
    }

    /**
     * Scroll links when the container is scrolled.
     *
     * @method  scroll
     * @author  Fritz Lekschas
     * @date    2016-09-14
     * @param   {Object}  selection  D3 selection of links.
     * @param   {Object}  data       Updated link data depending on scroll
     *   position.
     */

  }, {
    key: 'scroll',
    value: function scroll(selection, data) {
      // Update data of `g`.
      selection.data(data);

      if (this.vis.hideOutwardsLinks) {
        // Check if links point outwards.
        selection.classed('visible', this.linkVisibility.bind(this));
      }

      // Next, update all paths according to the new data.
      selection.selectAll('path').attr('d', this.diagonal);
    }

    /**
     * Sort links by applying updated data and transitioning to the new position.
     *
     * @method  sort
     * @author  Fritz Lekschas
     * @date    2016-09-14
     * @param   {[type]}    update  [description]
     * @return  {[type]}            [description]
     */

  }, {
    key: 'sort',
    value: function sort(update) {
      var start = function start() {
        d3.select(this).classed('sorting', true);
      };
      var end = function end() {
        d3.select(this).classed('sorting', false);
      };

      // Update data of `g`.
      this.links.data(update, function (data) {
        return data.id;
      });

      // Next update all paths according to the new data.
      this.links.selectAll('path').transition().duration(TRANSITION_SEMI_FAST).attr('d', this.diagonal).on('start', start).on('end', end);
    }

    /**
     * Update the visual state of the link according to the current state of data.
     *
     * @description
     * This method differs from checking whether a source or target node is
     * visible as it purely depends on the `hidden` property of the node data. It
     * is primarily used to hide links of hidden nodes, e.g., when nodes are
     * hidden manually.
     *
     * @method  updateVisibility
     * @author  Fritz Lekschas
     * @date    2016-09-22
     */

  }, {
    key: 'updateVisibility',
    value: function updateVisibility() {
      this.links.classed('hidden', function (data) {
        return data.target.node.hidden || data.source.node.hidden;
      });

      this.links.selectAll('path').transition().duration(TRANSITION_SEMI_FAST).attr('d', this.diagonal);
    }
  }, {
    key: 'diagonal',
    get: function get() {
      var _this3 = this;

      var extraOffsetX = this.vis.showLinkLocation ? 6 : 0;

      function getSourceX(source) {
        return source.node.x + source.offsetX + this.visData.global.column.contentWidth + this.visData.global.column.padding;
      }

      function getTargetX(source) {
        return source.node.x + source.offsetX + this.visData.global.column.padding;
      }

      function getY(source) {
        return source.node.y + source.offsetY + this.visData.global.row.height / 2;
      }

      function addStraightOffset(path) {
        var lineStart = path.indexOf('L');
        var lineEnd = path.lastIndexOf('L');

        var startPoint = path.substr(1, lineStart - 1).split(',');
        var endPoint = path.substr(lineEnd + 1).split(',');

        return 'M' + (parseInt(startPoint[0], 10) - extraOffsetX) + ',' + startPoint[1] + 'L' + startPoint[0] + ',' + startPoint[1] + path.substring(lineStart, lineEnd) + 'L' + endPoint[0] + ',' + endPoint[1] + 'L' + (parseInt(endPoint[0], 10) + extraOffsetX) + ',' + endPoint[1];
      }

      var getLine = d3.line().x(function (data) {
        return data.x;
      }).y(function (data) {
        return data.y;
      }).curve(d3.curveBundle.beta(LINK_BUNDLING_STRENGTH));

      return function (data) {
        var points = [];

        var sourceX = getSourceX.call(_this3, data.source);
        var sourceY = getY.call(_this3, data.source);

        var targetX = getTargetX.call(_this3, data.target);
        var targetY = getY.call(_this3, data.target);

        var middleX = (sourceX + targetX) / 2;
        var relMiddleX = (targetX - (sourceX + targetX) / 2) * 2 / 3;

        // Push the start point
        points.push({
          x: sourceX + extraOffsetX,
          y: sourceY
        });

        points.push({
          x: middleX,
          y: sourceY
        });

        // Push a control point
        points.push({
          x: targetX - relMiddleX,
          y: targetY
        });

        // Push a control point
        points.push({
          x: targetX - extraOffsetX,
          y: targetY
        });

        return addStraightOffset(getLine(points));
      };
    }
  }]);
  return Links;
}();

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeIsFinite = root.isFinite;

/**
 * Checks if `value` is a finite primitive number.
 *
 * **Note:** This method is based on
 * [`Number.isFinite`](https://mdn.io/Number/isFinite).
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a finite number, else `false`.
 * @example
 *
 * _.isFinite(3);
 * // => true
 *
 * _.isFinite(Number.MIN_VALUE);
 * // => true
 *
 * _.isFinite(Infinity);
 * // => false
 *
 * _.isFinite('3');
 * // => false
 */
function isFinite(value) {
  return typeof value == 'number' && nativeIsFinite(value);
}

/**
 * Collect all cloned nodes, including the original node.
 *
 * @method  collectInclClones
 * @author  Fritz Lekschas
 * @date    2016-03-20
 * @param   {Object}   node                 Start node
 * @param   {Boolean}  onlyForOriginalNode  If `true` only collect clones when
 *   `node` is not a clone itself.
 * @return  {Array}                         Array of original and cloned nodes.
 */
function collectInclClones(node, onlyForOriginalNode) {
  var originalNode = node;

  if (node.clone) {
    originalNode = node.originalNode;
    if (onlyForOriginalNode) {
      return [];
    }
  }

  var clones = [originalNode];

  if (originalNode.clones.length) {
    clones = clones.concat(originalNode.clones);
  }

  return clones;
}

// External
// Internal
function _up(node, callback, depth, includeClones, child, visitedNodes) {
  if (visitedNodes[node.id]) {
    if (!visitedNodes[node.id][child.id]) {
      callback(node, child);
    }
    return;
  }

  var nodes = includeClones ? collectInclClones(node) : [node];

  for (var i = nodes.length; i--;) {
    visitedNodes[nodes[i].id] = {};

    if (child) {
      callback(nodes[i], child);
      visitedNodes[nodes[i].id][child.id] = true;
    }

    if (!isFinite(depth) || depth > 0) {
      var parentsId = Object.keys(nodes[i].parents);
      for (var j = parentsId.length; j--;) {
        _up(nodes[i].parents[parentsId[j]], callback, depth - 1, includeClones, nodes[i], visitedNodes);
      }
    }
  }
}

/**
 * Traverse the graph upwards from a given node until a certain depth.
 *
 * @method  up
 * @author  Fritz Lekschas
 * @date    2016-09-12
 * @param   {Object}    node           D3 data object of a selected DOM element.
 * @param   {Function}  callback       Method to be called on every traversed
 *   node.
 * @param   {Number}    depth          Max steps to traverse upwards. If
 *   `undefined` will traverse till the root node.
 * @param   {Boolean}   includeClones  If `true` cloned nodes will be traversed
 *   as well.
 */
function up(node, callback, depth, includeClones) {
  var visitedNodes = {};
  _up(node, callback, depth, includeClones, undefined, visitedNodes);
}

function _down(node, callback, depth, includeClones, visitedNodes) {
  if (visitedNodes[node.id]) {
    return;
  }

  var nodes = includeClones ? collectInclClones(node) : [node];

  for (var i = nodes.length; i--;) {
    callback(nodes[i]);

    visitedNodes[nodes[i].id] = true;

    // We only need to recursivly traverse the graph for the original node as
    // the clones do not have any children (i.e. the have the same children as
    // the original node)
    if (i === 0 && (!isFinite(depth) || depth > 0)) {
      for (var j = nodes[i].childRefs.length; j--;) {
        _down(nodes[i].childRefs[j], callback, depth - 1, includeClones, visitedNodes);
      }
    }
  }
}

/**
 * Traverse the graph downwards from a given node until a certain depth.
 *
 * @method  down
 * @author  Fritz Lekschas
 * @date    2016-09-12
 * @param   {Object}    node           D3 data object of a selected DOM element.
 * @param   {Function}  callback       Method to be called on every traversed
 *   node.
 * @param   {Number}    depth          Max steps to traverse downwards. If
 *   `undefined` will traverse till leaf nodes.
 * @param   {Boolean}   includeClones  If `true` cloned nodes will be traversed
 *   as well.
 */
function down(node, callback, depth, includeClones) {
  var visitedNodes = {};
  _down(node, callback, depth, includeClones, visitedNodes);
}

/**
 * Traverse the graph up- and downwards from a given node until a certain depth.
 *
 * @method  upAndDown
 * @author  Fritz Lekschas
 * @date    2016-09-12
 * @param   {Object}    node           D3 data object of a selected DOM element.
 * @param   {Function}  callback       Method to be called on every upwards
 *   traversed node.
 * @param   {Function}  callback       Method to be called on every downwards
 *   traversed node.
 * @param   {Number}    depth          Max steps to traverse downwards. If
 *   `undefined` will traverse till leaf nodes.
 * @param   {Boolean}   includeClones  If `true` cloned nodes will be traversed
 *   as well.
 */
function upAndDown(node, callbackUp, callbackDown, depth, includeClones) {
  if (callbackDown) {
    up(node, callbackUp, depth, includeClones);
    down(node, callbackDown, depth, includeClones);
  } else {
    var visitedNodes = {};
    up(node, callbackUp, depth, includeClones, visitedNodes);
    down(node, callbackUp, depth, includeClones, visitedNodes);
  }
}

/**
 * Traverse siblings from a given nodes.
 *
 * @method  siblings
 * @author  Fritz Lekschas
 * @date    2016-09-12
 * @param   {Object}    node      D3 data object of a selected DOM element.
 * @param   {Function}  callback   Method to be called on every visited node.
 */
function siblings(node, callback) {
  var parentsId = Object.keys(node.parents);
  for (var i = parentsId.length; i--;) {
    for (var j = node.parents[parentsId[i]].childRefs.length; j--;) {
      callback(node.parents[parentsId[i]].childRefs[j]);
    }
  }
  // The root node doesn't have a `parents` property but might have `siblings`.
  if (node.siblings) {
    var siblingsId = Object.keys(node.siblings);
    for (var _i = siblingsId.length; _i--;) {
      callback(node.siblings[siblingsId[_i]]);
    }
  }
}

var BAR_CLASS = 'bar';

var Bar =
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
function Bar(baseEl, barData, nodeData, visData, bars) {
  var _this = this;

  classCallCheck(this, Bar);

  this.data = barData;
  this.nodeData = nodeData;
  this.visData = visData;
  this.bars = bars;

  this.data.x = nodeData.x;
  this.data.level = nodeData.depth;

  this.height = this.visData.global.row.contentHeight / (this.data.length * 2) - this.visData.global.cell.padding * 2;

  this.activeHeight = this.visData.global.row.contentHeight - 2;

  this.inactiveheight = this.visData.global.cell.padding * 2 - 1;

  this.selection = baseEl.selectAll(BAR_CLASS).data(this.data).enter().append('g').attr('class', function (data) {
    return BAR_CLASS + ' ' + data.id;
  }).classed('active', function (data) {
    return data.id === _this.visData.nodes[_this.nodeData.depth].sortBy;
  });

  // Local helper method to avoid code duplication.
  function setupMagnitude(selection) {
    var _this2 = this;

    var currentSorting = this.visData.nodes[this.nodeData.depth].sortBy;

    selection.attr('d', function (data) {
      return _this2.bars.generatePath(data, currentSorting);
    }).classed('bar-magnitude', true);
  }

  this.selection.append('path').call(setupMagnitude.bind(this));
};

/**
 * Returns the path for a rounded rectangle
 *
 * Credits go to Mike Bostock: http://bl.ocks.org/mbostock/3468167
 *
 * @method  roundRect
 * @author  Fritz Lekschas
 * @date    2016-09-12
 * @param   {Number}    x       X coordinate.
 * @param   {Number}    y       Y coordinate.
 * @param   {Number}    width   Width of the rectangle.
 * @param   {Number}    height  Height of the rectangle.
 * @param   {Number}    radius  Radius.
 * @return  {String}            Path string of the rounded rectangle.
 */
function roundRect(x, y, width, height, radius) {
  var topLeft = radius.topLeft || 0;
  var topRight = radius.topRight || 0;
  var bottomLeft = radius.bottomLeft || 0;
  var bottomRight = radius.bottomRight || 0;

  return 'M' + (x + topLeft) + ',' + y + 'h' + (width - topLeft - topRight) + 'a' + topRight + ',' + topRight + ' 0 0 1 ' + topRight + ',' + topRight + 'v' + (height - (topRight + bottomRight)) + 'a' + bottomRight + ',' + bottomRight + ' 0 0 1 ' + -bottomRight + ',' + bottomRight + 'h' + (bottomLeft - (width - bottomRight)) + 'a' + bottomLeft + ',' + bottomLeft + ' 0 0 1 ' + -bottomLeft + ',' + -bottomLeft + 'v' + (topLeft - (height - bottomLeft)) + 'a' + topLeft + ',' + topLeft + ' 0 0 1 ' + topLeft + ',' + -topLeft + 'z';
}

/**
 * Creates a path that looks like a drop menu
 *
 * @example
 * The following is an example how to create a drop menu path:
 * ```javascript
 * import { dropMenu } from './charts';
 * const dropMenuPath = dropMenu({
 *   x: 0,
 *   y: 0,
 *   width: 50,
 *   height: 100,
 *   radius: 5,
 *   arrowSize: 5
 * });
 * ```
 *
 * @method  dropMenu
 * @author  Fritz Lekschas
 * @date    2016-03-03
 * @param   {Object}  c  Config object that needs to contain the following
 *   properties: x, y, width, height, radius and arrowSize.
 */
function dropMenu(c) {
  return 'M' + (c.x + c.radius) + ',' + c.y + 'h' + (c.width - c.radius * 2) + 'a' + c.radius + ',' + c.radius + ' 0 0 1 ' + c.radius + ',' + c.radius + 'v' + (c.height - c.radius * 2) + 'a' + c.radius + ',' + c.radius + ' 0 0 1 ' + -c.radius + ',' + c.radius + 'h' + -(c.width - c.radius * 2 - c.arrowSize * 2) / 2 + 'l' + -c.arrowSize + ',' + c.arrowSize + 'l' + -c.arrowSize + ',' + -c.arrowSize + 'h' + -(c.width - c.radius * 2 - c.arrowSize * 2) / 2 + 'a' + c.radius + ',' + c.radius + ' 0 0 1 ' + -c.radius + ',' + -c.radius + 'v' + (c.radius - (c.height - c.radius)) + 'a' + c.radius + ',' + c.radius + ' 0 0 1 ' + c.radius + ',' + -c.radius + 'z';
}

// External
// Internal
var BARS_CLASS = 'bars';

var Bars = function () {
  /**
   * [constructor description]
   *
   * @method  constructor
   * @author  Fritz Lekschas
   * @date    2016-09-14
   * @param   {Object}  baseEl   D3 selection where the group of bars should be
   *   appended to.
   * @param   {String}  mode     Display more. Can be either `one` or `two`.
   * @param   {Object}  visData  Object with the list graph app data.
   */
  function Bars(baseEl, mode, visData) {
    classCallCheck(this, Bars);

    var self = this;

    this.mode = mode;
    this.visData = visData;

    this.xScale = d3.scaleLinear().domain([0, 1]).range([1, this.visData.global.column.contentWidth - 3]);

    this.baseEl = baseEl.append('g').attr('class', BARS_CLASS);

    this.baseEl.each(function (datum) {
      new Bar(d3.select(this), datum.data.bars, datum, self.visData, self);
    });
  }

  /**
   * Re-render
   *
   * @method  reRender
   * @author  Fritz Lekschas
   * @date    2017-01-16
   * @param   {Object}  newVisData  New vid data.
   * @param   {String}  sortBy  Name of the poperty to be sorted by.
   */


  createClass(Bars, [{
    key: 'reRender',
    value: function reRender(newVisData, sortBy) {
      var _this = this;

      if (newVisData) {
        this.visData = newVisData;
      }

      this.baseEl.selectAll('.bar-magnitude').attr('d', function (data) {
        return _this.generatePath(data, sortBy);
      });
    }

    /**
     * Updates all bar magnitude elements.
     *
     * @method  updateAll
     * @author  Fritz Lekschas
     * @date    2016-09-14
     * @param   {Object}  update  Object with the current data.
     * @param   {String}  sortBy  Name of the poperty to be sorted by.
     */

  }, {
    key: 'updateAll',
    value: function updateAll(update, sortBy) {
      var _this2 = this;

      this.baseEl.selectAll('.bar-magnitude').data(update, function (data) {
        return data.barId;
      }).transition().duration(TRANSITION_SEMI_FAST).attr('d', function (data) {
        return _this2.generatePath(data, sortBy);
      });
    }

    /**
     * Update bars when switching the bar mode.
     *
     * @method  update
     * @author  Fritz Lekschas
     * @date    2016-09-14
     * @param   {Object}  selection  D3 selection
     * @param   {String}  sortBy     Name of the poperty to be sorted by.
     */

  }, {
    key: 'update',
    value: function update(selection, sortBy) {
      var _this3 = this;

      selection.each(function (data) {
        var el = d3.select(this);

        if (data.id === sortBy && !el.classed('active')) {
          el.classed('active', true);
          // Ensure that the active bars we are places before any other bar,
          // thus placing them in the background
          this.parentNode.insertBefore(this, this.parentNode.children[0]);
        }

        if (data.id !== sortBy) {
          el.classed('active', false);
        }
      });

      selection.selectAll('.bar-magnitude').transition().duration(TRANSITION_SEMI_FAST).attr('d', function (data) {
        return _this3.generatePath(data, sortBy);
      });
    }

    /**
     * Switch one and two-bar display mode.
     *
     * @method  switchMode
     * @author  Fritz Lekschas
     * @date    2016-09-14
     * @param   {String}  mode            Name of the display mode. Can either be
     *   `one` or `two`.
     * @param   {String}  currentSorting  Name if the property currently sorted
     *   by.
     */

  }, {
    key: 'switchMode',
    value: function switchMode(mode, currentSorting) {
      var _this4 = this;

      if (this.mode !== mode) {
        if (mode === 'one') {
          if (currentSorting.global.type) {
            this.baseEl.selectAll('.bar').selectAll('.bar-magnitude').transition().duration(TRANSITION_SEMI_FAST).attr('d', function (data) {
              return _this4.generateOneBarPath(data, currentSorting.global.type);
            });
          } else {
            // console.error(
            //   'Switching magnitude visualization after individual sorting is ' +
            //   'not supported yet.'
            // );
          }
        }

        if (mode === 'two') {
          this.baseEl.selectAll('.bar.precision').selectAll('.bar-magnitude').transition().duration(TRANSITION_SEMI_FAST).attr('d', function (data) {
            return _this4.generateTwoBarsPath(data);
          });

          this.baseEl.selectAll('.bar.recall').selectAll('.bar-magnitude').transition().duration(TRANSITION_SEMI_FAST).attr('d', function (data) {
            return _this4.generateTwoBarsPath(data, true);
          });
        }

        this.mode = mode;
      }
    }

    /**
     * Helper method to generate path used as a bar.
     *
     * @method  generatePath
     * @author  Fritz Lekschas
     * @date    2016-09-14
     * @param   {Object}   data             Data object.
     * @param   {String}   sortBy           Name of the property currently sorted
     *   by.
     */

  }, {
    key: 'generatePath',
    value: function generatePath(data, sortBy) {
      if (this.mode === 'two') {
        return this.generateTwoBarsPath(data);
      }
      return this.generateOneBarPath(data, sortBy);
    }

    /**
     * Generates a bar when one-bar display mode is active.
     *
     * @method  generateOneBarPath
     * @author  Fritz Lekschas
     * @date    2016-09-14
     * @param   {Object}   data    Data object.
     * @param   {String}   sortBy  Name of the property currently sorted by.
     */

  }, {
    key: 'generateOneBarPath',
    value: function generateOneBarPath(data, sortBy) {
      var height = this.visData.global.row.contentHeight;
      var normValue = Math.min(data.value, 1) || 0;

      var x = 0;
      var width = 2;

      var radius = {
        topLeft: 2,
        bottomLeft: 2
      };

      if (data.id !== sortBy) {
        x = this.xScale(normValue);
        radius = {};
      } else {
        width = this.visData.global.column.contentWidth * normValue;
      }

      x = Math.min(x, this.visData.global.column.contentWidth - 2);

      return roundRect(x, this.visData.global.row.padding, width, height, radius);
    }

    /**
     * Generates a bar when two-bar display mode is active.
     *
     * @method  generateTwoBarsPath
     * @author  Fritz Lekschas
     * @date    2016-09-14
     * @param   {Object}   data      Data object.
     * @param   {Boolean}  isBottom  If `true` then the bottom bar should be
     *   generated.
     */

  }, {
    key: 'generateTwoBarsPath',
    value: function generateTwoBarsPath(data, isBottom) {
      var normValue = Math.min(data.value, 1);
      var height = this.visData.global.row.contentHeight / 2;
      var width = this.visData.global.column.contentWidth * normValue;

      var y = this.visData.global.row.padding;
      var radius = { topLeft: 2 };

      if (isBottom) {
        radius = { bottomLeft: 2 };
        y += height;
      }

      return roundRect(0, y, width, height, radius);
    }
  }]);
  return Bars;
}();

// External
/**
 * Merges multiple distinct D3 selection objects.
 *
 * @description
 * First an empty selection is created by querying for a non-existing element.
 *
 * @method  mergeSelections
 * @author  Fritz Lekschas
 * @date    2016-09-12
 * @param   {Array}   selections  Array of multiple D3 selection objects.
 * @return  {Object}              Single D3 selection object containing all the
 *   selected elements from `selections`.
 */
function mergeSelections(selections) {
  // Create a new empty selection
  var mergedSelection = d3.selectAll('.d3-list-graph-not-existent');

  for (var i = selections.length; i--;) {
    mergedSelection._groups = mergedSelection._groups.concat(selections[i]._groups);
  }

  return mergedSelection;
}

/**
 * Detects when an array of transitions has ended.
 *
 * @method  allTransitionsEnded
 * @author  Fritz Lekschas
 * @date    2016-09-12
 * @param   {Object}    transition  D3 transition object.
 * @param   {Function}  callback    Callback function to be triggered when all
 *   transitions have ended.
 */
function allTransitionsEnded(transition, callback) {
  if (transition.size() === 0) {
    callback();
  }

  var n = 0;

  transition.each(function () {
    return ++n;
  }).on('interrupt end', function end() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    if (! --n) callback.apply(this, args);
  });
}

// External
// Internal
/**
 * CSS class name of grou of nodes.
 *
 * @type  {String}
 */
var CLASS_NODES = 'nodes';

/**
 * CSS class name of node group.
 *
 * @type  {String}
 */
var CLASS_NODE = 'node';

/**
 * CSS class name of visible nodes.
 *
 * @type  {String}
 */
var CLASS_NODE_VISIBLE = 'visible-node';

/**
 * CSS class name of cloned nodes.
 *
 * @type  {String}
 */
var CLASS_CLONE = 'clone';

/**
 * CSS class name of label wrappers of nodes.
 *
 * @type  {String}
 */
var CLASS_LABEL_WRAPPER = 'label-wrapper';

/**
 * CSS class name of focus controls that appear to the left and right of a node
 * when being active.
 *
 * @type  {String}
 */
var CLASS_FOCUS_CONTROLS = 'focus-controls';

/**
 * CSS class name of the root focus button.
 *
 * @type  {String}
 */
var CLASS_ROOT = 'root';

/**
 * CSS class name of the query focus button.
 *
 * @type  {String}
 */
var CLASS_QUERY = 'query';

/**
 * CSS class name of the link indicator.
 *
 * @type  {String}
 */
var CLASS_INDICATOR_BAR = 'link-indicator';

/**
 * CSS class name of the link location indicator.
 *
 * @type  {String}
 */
var CLASS_INDICATOR_LOCATION = 'link-location-indicator';

/**
 * CSS class name for identifying incoming link location indicators.
 *
 * @type  {String}
 */
var CLASS_INDICATOR_INCOMING = 'incoming';

/**
 * CSS class name for identifying outgoing link location indicators.
 *
 * @type  {String}
 */
var CLASS_INDICATOR_OUTGOING = 'outgoing';

/**
 * CSS class name for identifying link location indicators above the visible
 * container.
 *
 * @type  {String}
 */
var CLASS_INDICATOR_ABOVE = 'above';

/**
 * CSS class name for identifying link location indicators below the visible
 * container.
 *
 * @type  {String}
 */
var CLASS_INDICATOR_BELOW = 'below';

var Nodes = function () {
  /**
   * Nodes constructor
   *
   * @method  constructor
   * @author  Fritz Lekschas
   * @date    2016-09-22
   * @param   {Object}  vis      List Graph App.
   * @param   {Object}  baseEl   D3 base selection.
   * @param   {Object}  visData  List Graph App data.
   * @param   {Object}  links    Links class.
   * @param   {Object}  events   Event class.
   */
  function Nodes(vis, baseEl, visData, links, events) {
    var _this = this;

    classCallCheck(this, Nodes);

    this.vis = vis;
    this.visData = visData;
    this.links = links;
    this.events = events;
    this.currentLinks = {};
    this.iconDimension = Math.min(this.visData.global.row.contentHeight / 2 - this.visData.global.cell.padding * 2, this.visData.global.column.padding / 2 - 4);

    this.linkDensityBg = d3.scaleLinear().domain([1, this.vis.rows]).range(['#ccc', '#000']);

    this.groups = baseEl.append('g').attr('class', CLASS_NODES).call(function (selection) {
      selection.each(function storeLinkToGroupNode() {
        d3.select(this.parentNode).datum().nodes = this;
      });
    });

    this.nodes = this.groups.selectAll('.' + CLASS_NODE).data(function (data) {
      return data.rows;
    }).enter().append('g').classed(CLASS_NODE, true).classed(CLASS_CLONE, function (data) {
      return data.clone;
    }).attr('transform', function (data) {
      return 'translate(' + (data.x + _this.visData.global.column.padding) + ', ' + data.y + ')';
    });

    this.nodes.append('rect').call(this.drawMaxSizedRect.bind(this));

    this.visNodes = this.nodes.append('g').attr('class', CLASS_NODE_VISIBLE);

    this.visNodes.append('rect').call(this.drawFullSizeRect.bind(this), 'bg-border');

    this.visNodes.append('rect').call(this.drawFullSizeRect.bind(this), 'bg', 1, true);

    if (this.vis.showLinkLocation) {
      this.nodes.append('rect').call(this.drawLinkLocationIndicator.bind(this), 'incoming', 'above');
      this.nodes.append('rect').call(this.drawLinkLocationIndicator.bind(this), 'incoming', 'bottom');
      this.nodes.append('rect').call(this.drawLinkLocationIndicator.bind(this), 'outgoing', 'above');
      this.nodes.append('rect').call(this.drawLinkLocationIndicator.bind(this), 'outgoing', 'bottom');

      this.nodes.append('path').call(this.drawLinkIndicator.bind(this), 'incoming');
      this.nodes.append('path').call(this.drawLinkIndicator.bind(this), 'outgoing');

      // Set all the link location indicator bars.
      this.groups.each(function (data, index) {
        _this.calcHeightLinkLocationIndicator(index, true, true);
      });
    }

    // Rooting icons
    this.nodeRooted = this.nodes.append('g').attr('class', CLASS_FOCUS_CONTROLS + ' ' + CLASS_ROOT);

    this.nodeRooted.append('rect').call(this.setUpFocusControls.bind(this), 'left', 0.6, 'hover-helper', 'hover-helper');

    this.nodeRooted.append('svg').call(this.setUpFocusControls.bind(this), 'left', 0.6, 'icon', 'ease-all state-active invisible-default icon').append('use').attr('xlink:href', this.vis.iconPath + '#locked');

    // Querying icons
    if (this.vis.querying) {
      this.nodeQuery = this.nodes.append('g').attr('class', CLASS_FOCUS_CONTROLS + ' ' + CLASS_QUERY);

      this.nodeQuery.append('rect').call(this.setUpFocusControls.bind(this), 'right', 0.6, 'hover-helper', 'hover-helper');

      this.nodeQuery.append('svg').call(this.setUpFocusControls.bind(this), 'right', 0.6, 'icon', 'ease-all state-and-or invisible-default icon').append('use').attr('xlink:href', this.vis.iconPath + '#union');

      this.nodeQuery.append('svg').call(this.setUpFocusControls.bind(this), 'right', 0.6, 'icon', 'ease-all state-not invisible-default icon').append('use').attr('xlink:href', this.vis.iconPath + '#not');
    }

    this.bars = new Bars(this.visNodes, this.vis.barMode, this.visData);

    this.visNodes.append('rect').call(this.drawFullSizeRect.bind(this), 'border');

    // Add node label
    this.visNodes.append('foreignObject').attr('x', this.visData.global.cell.padding).attr('y', this.visData.global.row.padding + this.visData.global.cell.padding).attr('width', this.visData.global.column.contentWidth).attr('height', this.visData.global.row.contentHeight - this.visData.global.cell.padding * 2).attr('class', CLASS_LABEL_WRAPPER).append('xhtml:div').attr('class', 'label').attr('title', function (data) {
      return data.data.name;
    }).style('line-height', Math.floor(this.visData.global.row.contentHeight - this.visData.global.cell.padding * 2) + 'px').append('xhtml:span').text(function (data) {
      return data.data.name;
    });

    if (isFunction(this.events.on)) {
      this.events.on('d3ListGraphFocusNodes', function (event$$1) {
        return _this.focusNodes(event$$1);
      });

      this.events.on('d3ListGraphBlurNodes', function (event$$1) {
        return _this.blurNodes(event$$1);
      });

      this.events.on('d3ListGraphNodeEnter', function (nodeIds) {
        return _this.eventHelper(nodeIds, _this.highlightNodes);
      });

      this.events.on('d3ListGraphNodeLeave', function (nodeIds) {
        return _this.eventHelper(nodeIds, _this.unhighlightNodes);
      });

      this.events.on('d3ListGraphNodeLock', function (nodeIds) {
        return _this.eventHelper(nodeIds, _this.toggleLock, []);
      });

      this.events.on('d3ListGraphNodeUnlock', function (nodeIds) {
        return _this.eventHelper(nodeIds, _this.toggleLock, [true]);
      });

      this.events.on('d3ListGraphNodeRoot', function (nodeIds) {
        return _this.eventHelper(nodeIds, _this.toggleRoot, [false, true]);
      });

      this.events.on('d3ListGraphNodeUnroot', function (nodeIds) {
        return _this.eventHelper(nodeIds, _this.toggleRoot, [true, true]);
      });

      this.events.on('d3ListGraphNodeQuery', function (data) {
        return _this.eventHelper(data.nodeIds, _this.queryHandler, ['query', data.mode, true]);
      });

      this.events.on('d3ListGraphNodeUnquery', function (data) {
        return _this.eventHelper(data.nodeIds, _this.queryHandler, ['unquery', undefined, true]);
      });
    }

    this.nodes.call(this.isInvisible.bind(this));
  }

  /**
   * Get the current bar mode.
   *
   * @method  barMode
   * @author  Fritz Lekschas
   * @date    2016-09-22
   * @return  {String}  Bar mode string.
   */


  createClass(Nodes, [{
    key: 'batchQueryHandler',


    /**
     * Handle multiple queries as once.
     *
     * @description
     * Useful when the custom root node is changed as this involves "un-querying"
     * and querying.
     *
     * @method  batchQueryHandler
     * @author  Fritz Lekschas
     * @date    2016-09-23
     * @param   {Array}    els             Array of D3 selections of nodes to be
     *   queried.
     * @param   {Boolean}  noNotification  If `true` notifications are suppressed.
     */
    value: function batchQueryHandler(els, noNotification) {
      var actions = [];
      for (var i = els.length; i--;) {
        actions.push(this.queryHandler(els[i].d3El, els[i].action, els[i].mode, true));
      }

      if (!noNotification) {
        this.events.broadcast('d3ListGraphBatchQuery', actions);
      }
    }

    /**
     * Visually blur a node.
     *
     * @method  blurNodes
     * @author  Fritz Lekschas
     * @date    2016-09-22
     * @param   {Object}  event  Event object.
     */

  }, {
    key: 'blurNodes',
    value: function blurNodes(event$$1) {
      this.eventHelper(event$$1.nodeIds, this.unhighlightNodes, ['focus', 'directParentsOnly', !!event$$1.excludeClones]);

      if (event$$1.zoomIn) {
        this.vis.zoomedView();
      }

      if (this.tempHidingUnrelatedNodes) {
        this.hideUnrelatedNodes(undefined, true);
      }
    }

    /**
     * Calculates the height of all incoming or outgoing link location indicators
     * for a given level.
     *
     * @method  calcHeightLinkLocationIndicator
     * @author  Fritz Lekschas
     * @date    2016-09-22
     * @param   {Number}   level     Index of the level / column.
     * @param   {Boolean}  outgoing  If `true` outgoing link location indicator
     *   heights are calculated. Otherwise incoming link location indicator
     *   heights are calculated.
     */

  }, {
    key: 'calcHeightLinkLocationIndicator',
    value: function calcHeightLinkLocationIndicator(level, outgoing) {
      var nodes = this.nodes.filter(function (data) {
        return data.depth === level;
      });
      nodes.each(function (data) {
        if (outgoing) {
          data.links.outgoing.above = 0;
          data.links.outgoing.below = 0;
          for (var i = data.links.outgoing.total; i--;) {
            // We are checking the target location of the outgoing link. The
            // source location is the location of the node of the column being
            // scrolled.
            if ((data.links.outgoing.refs[i].hidden & 4) > 0) {
              data.links.outgoing.above++;
            }
            if ((data.links.outgoing.refs[i].hidden & 8) > 0) {
              data.links.outgoing.below++;
            }
          }
        } else {
          data.links.incoming.above = 0;
          data.links.incoming.below = 0;
          for (var _i = data.links.incoming.total; _i--;) {
            // We are checking the source location of the incoming link. The
            // source location is the location of the node of the column being
            // scrolled.
            if ((data.links.incoming.refs[_i].hidden & 1) > 0) {
              data.links.incoming.above++;
            }
            if ((data.links.incoming.refs[_i].hidden & 2) > 0) {
              data.links.incoming.below++;
            }
          }
        }
      });

      if (outgoing) {
        this.updateHeightLinkLocationIndicatorBars(nodes, true);
      } else {
        this.updateHeightLinkLocationIndicatorBars(nodes);
      }
    }

    /**
     * Tests if the event-related node list is identical.
     *
     * @method  checkNodeFocusSameEvent
     * @author  Fritz Lekschas
     * @date    2016-09-22
     * @param   {Array}  nodeIds  Array of node IDs.
     * @return  {Boolean}         If `true` the event node ID list is identical to
     *   the current focus node ID list.
     */

  }, {
    key: 'checkNodeFocusSameEvent',
    value: function checkNodeFocusSameEvent(nodeIds) {
      if (!this.nodeFocusIds) {
        return false;
      }
      if (nodeIds.length !== this.nodeFocusIds.length) {
        return false;
      }
      for (var i = nodeIds.length; i--;) {
        if (nodeIds[i] !== this.nodeFocusIds[i]) {
          return false;
        }
      }
      return true;
    }

    /**
     * Get the CSS class of the node group.
     *
     * @method  classNodeVisible
     * @author  Fritz Lekschas
     * @date    2016-09-22
     * @return  {String}  CSS name.
     */

  }, {
    key: 'drawLinkIndicator',


    /**
     * Draw link indicator
     *
     * @method  drawLinkIndicator
     * @author  Fritz Lekschas
     * @date    2017-01-16
     * @param   {Object}  selection  D3 selection
     * @param   {String}  direction  Direction: incoming or outgoing
     */
    value: function drawLinkIndicator(selection, direction) {
      var _this2 = this;

      var incoming = direction === 'incoming';

      selection.attr('class', CLASS_INDICATOR_BAR + ' ' + (incoming ? CLASS_INDICATOR_INCOMING : CLASS_INDICATOR_OUTGOING)).attr('d', roundRect(incoming ? -7 : this.visData.global.column.contentWidth, this.visData.global.row.height / 2 - 1, 7, 2, {
        topLeft: incoming ? 1 : 0,
        topRight: incoming ? 0 : 1,
        bottomLeft: incoming ? 1 : 0,
        bottomRight: incoming ? 0 : 1
      })).attr('fill', function (data) {
        return _this2.linkDensityBg(data.links[direction].refs.length);
      }).classed('visible', function (data) {
        return data.links[direction].refs.length > 0;
      }).style('transform-origin', (incoming ? 0 : this.visData.global.column.contentWidth) + 'px ' + this.visData.global.row.height / 2 + 'px');
    }

    /**
     * Draw link location indicator
     *
     * @method  drawLinkLocationIndicator
     * @author  Fritz Lekschas
     * @date    2017-01-16
     * @param   {Object}   selection  D3 selection
     * @param   {String}   direction  Direction: incoming or outgoing
     * @param   {String}   position   Position: above or below
     * @param   {Boolean}  update     If `true` only updates
     */

  }, {
    key: 'drawLinkLocationIndicator',
    value: function drawLinkLocationIndicator(selection, direction, position, update) {
      var _this3 = this;

      var above = position === 'above';
      var incoming = direction === 'incoming';

      var className = CLASS_INDICATOR_LOCATION + ' ' + (incoming ? CLASS_INDICATOR_INCOMING : CLASS_INDICATOR_OUTGOING) + ' ' + (above ? CLASS_INDICATOR_ABOVE : CLASS_INDICATOR_BELOW);

      if (!update) {
        selection.datum(function (data) {
          return data.links[direction];
        });
      }

      selection.attr('class', className).attr('x', incoming ? -5 : this.visData.global.column.contentWidth + 2).attr('y', above ? this.visData.global.row.height / 2 - 1 : this.visData.global.row.height / 2 + 1).attr('width', 3).attr('height', 0).attr('fill', function (data) {
        return _this3.linkDensityBg(data.refs.length);
      });
    }

    /**
     * Draw full sized rectangle
     *
     * @method  drawFullSizeRect
     * @author  Fritz Lekschas
     * @date    2017-01-16
     * @param   {Object}   selection      D3 selection
     * @param   {String}   className      Class name
     * @param   {Number}   shrinking      Shrinking amount
     * @param   {Boolean}  noRoundBorder  If `true` no round border
     */

  }, {
    key: 'drawFullSizeRect',
    value: function drawFullSizeRect(selection, className, shrinking, noRoundBorder) {
      var shrinkingAmount = shrinking || 0;

      selection.attr('x', shrinkingAmount).attr('y', this.visData.global.row.padding + shrinkingAmount).attr('width', this.visData.global.column.contentWidth - 2 * shrinkingAmount).attr('height', this.visData.global.row.contentHeight - 2 * shrinkingAmount).attr('rx', noRoundBorder ? 0 : 2 - shrinkingAmount).attr('ry', noRoundBorder ? 0 : 2 - shrinkingAmount).classed(className, true);
    }

    /**
     * Draw a maximal sized rectangle
     *
     * @method  drawMaxSizedRect
     * @author  Fritz Lekschas
     * @date    2017-01-16
     * @param   {Object}  selection  D3 selection
     */

  }, {
    key: 'drawMaxSizedRect',
    value: function drawMaxSizedRect(selection) {
      selection.attr('x', 0).attr('y', 0).attr('width', this.visData.global.column.contentWidth).attr('height', this.visData.global.row.height).attr('class', 'invisible-container');
    }

    /**
     * Node _mouse enter_ handler.
     *
     * @method  enterHandler
     * @author  Fritz Lekschas
     * @date    2016-09-22
     * @param   {Object}  el    DOM element.
     * @param   {Object}  data  D3 data object of the DOM element.
     */

  }, {
    key: 'enterHandler',
    value: function enterHandler(el, data) {
      this.highlightNodes(d3.select(el));

      var eventData = {
        id: data.clone ? data.originalNode.id : data.id
      };

      this.events.broadcast('d3ListGraphNodeEnter', eventData);
    }

    /**
     * Event helper.
     *
     * @method  eventHelper
     * @author  Fritz Lekschas
     * @date    2016-09-22
     * @param   {Array}     nodeIds            Array of node IDs.
     * @param   {Function}  callback           Call back function of the actual
     *   event.
     * @param   {Array}     optionalParams     Array of optional parameters to be
     *   passed to the callback.
     * @param   {String}    subSelectionClass  Sub-selection of certain elements
     *   based on a CSS class. The selection will be passed to the callback.
     */

  }, {
    key: 'eventHelper',
    value: function eventHelper(nodeIds, callback, optionalParams, subSelectionClass) {
      var self = this;

      this.nodes
      // Filter by node ID
      .filter(function (data) {
        return !!~nodeIds.indexOf(data.id);
      }).each(function triggerCallback() {
        var d3El = d3.select(this);

        if (subSelectionClass) {
          d3El = d3El.select(subSelectionClass);
        }

        callback.apply(self, [d3El].concat(optionalParams || []));
      });
    }

    /**
     * Visually focus a node.
     *
     * @method  focusNodes
     * @author  Fritz Lekschas
     * @date    2016-09-22
     * @param   {Object}  event  Event object.
     */

  }, {
    key: 'focusNodes',
    value: function focusNodes(event$$1) {
      var same = this.checkNodeFocusSameEvent(event$$1.nodeIds);
      if (this.nodeFocusIds && !same) {
        // Show unrelated nodes first before we hide them again.
        this.blurNodes({
          nodeIds: this.nodeFocusIds
        });
      }

      this.nodeFocusIds = event$$1.nodeIds;

      this.eventHelper(event$$1.nodeIds, this.highlightNodes, ['focus', 'directParentsOnly', !!event$$1.excludeClones, event$$1.zoomOut || event$$1.hideUnrelatedNodes]);

      if (event$$1.zoomOut) {
        this.vis.globalView(this.nodes.filter(function (data) {
          return data.hovering > 0;
        }));
      } else {
        this.vis.zoomedView();
      }

      if (event$$1.hideUnrelatedNodes) {
        if (!same || !this.tempHidingUnrelatedNodes) {
          this.hideUnrelatedNodes(event$$1.nodeIds);
        }
      } else if (this.tempHidingUnrelatedNodes) {
        this.hideUnrelatedNodes(undefined, true);
      }
    }

    /**
     * Helper method to hide nodes.
     *
     * @method  hideNodes
     * @author  Fritz Lekschas
     * @date    2016-09-22
     * @param   {Object}   data  Node data object.
     */

  }, {
    key: 'hideNodes',
    value: function hideNodes(data) {
      this.nodesVisibility(data);
    }

    /**
     * Hide unrelated nodes temporarily.
     *
     * @method  hideUnrelatedNodes
     * @author  Fritz Lekschas
     * @date    2016-09-22
     * @param   {Array}    nodeIds    Array of node IDs.
     * @param   {Boolean}  showAgain  If `true` displays hidden nows again.
     */

  }, {
    key: 'hideUnrelatedNodes',
    value: function hideUnrelatedNodes(nodeIds, showAgain) {
      this.tempHidingUnrelatedNodes = showAgain ? undefined : nodeIds;

      this.nodes.filter(function (data) {
        return !data.hovering;
      }).classed('hidden', function (data) {
        return showAgain ? data._hidden : true;
      }).each(function (data) {
        if (showAgain) {
          // Reset old hiding state
          data.hidden = data._hidden;
          data._hidden = undefined;
        } else {
          // Store old value for `hidden` temporarily
          data._hidden = data.hidden;
          data.hidden = true;
        }
      });

      this.updateVisibility();
    }

    /**
     * Visually highlight nodes.
     *
     * @method  highlightNodes
     * @author  Fritz Lekschas
     * @date    2016-09-23
     * @param   {Object}   d3El               D3 selection of the node where to
     *   start highlighting from.
     * @param   {String}   className          CSS class name to be assigned to the
     *   highlighted nodes.
     * @param   {String}   restriction        Specify a restriction. Currently
     *   only "directParentsOnly" is supported.
     * @param   {Boolean}  excludeClones      If `true` exclude cloned nodes.
     * @param   {Boolean}  noVisibilityCheck  If `true` don't check the nodes'
     *   visibility states.
     */

  }, {
    key: 'highlightNodes',
    value: function highlightNodes(d3El, className, restriction, excludeClones, noVisibilityCheck) {
      var _this4 = this;

      var self = this;
      var data = d3El.datum();
      var nodeId = data.id;
      var currentNodeData = data.clone ? data.originalNode : data;
      var includeParents = true;
      var appliedClassName = className || 'hovering';
      var includeClones = !excludeClones;
      var includeChildren = restriction !== 'directParentsOnly';

      // Store link IDs
      if (!this.currentLinks[appliedClassName]) {
        this.currentLinks[appliedClassName] = {};
      }
      this.currentLinks[appliedClassName][nodeId] = {};

      var currentlyActiveBar = d3El.selectAll('.bar.active .bar-magnitude');
      if (!currentlyActiveBar.empty()) {
        currentlyActiveBar = currentlyActiveBar.datum();
      } else {
        currentlyActiveBar = undefined;
      }

      var traverseCallbackUp = function traverseCallbackUp(nodeData, childData) {
        nodeData.hovering = 2;
        for (var i = nodeData.links.outgoing.refs.length; i--;) {
          // Only push direct parent child connections. E.g.
          // Store: (parent)->(child)
          // Ignore: (parent)->(siblings of child)
          if (nodeData.links.outgoing.refs[i].target.node.id === childData.id) {
            _this4.currentLinks[appliedClassName][nodeId][nodeData.links.outgoing.refs[i].id] = true;
          }
        }
      };

      var traverseCallbackDown = function traverseCallbackDown(nodeData) {
        nodeData.hovering = 2;
        for (var i = nodeData.links.outgoing.refs.length; i--;) {
          _this4.currentLinks[appliedClassName][nodeId][nodeData.links.outgoing.refs[i].id] = true;
        }
      };

      if (includeParents && includeChildren) {
        upAndDown(data.clone ? data.originalNode : data, traverseCallbackUp, traverseCallbackDown, undefined, includeClones);
      }
      if (includeParents && !includeChildren) {
        up(data, traverseCallbackUp, undefined, includeClones);
      }
      if (!includeParents && includeChildren) {
        down(data.clone ? data.originalNode : data, traverseCallbackUp, undefined, includeClones);
      }

      currentNodeData.hovering = 1;

      if (includeClones) {
        for (var i = currentNodeData.clones.length; i--;) {
          currentNodeData.clones[i].hovering = 1;
        }
      }

      /**
       * Helper method to assess the node visibility.
       *
       * @method  checkNodeVisibility
       * @author  Fritz Lekschas
       * @date    2016-02-25
       * @param   {Object}  _el    [description]
       * @param   {Object}  _data  [description]
       * @return  {Boolean}        If `true` element is hidden.
       */
      function checkNodeVisibility(_el, _data) {
        return noVisibilityCheck || !_data.hidden && !self.vis.isHidden.call(self.vis, _el);
      }

      /**
       * Helper method to filter out directly hovered nodes.
       *
       * @method  checkNodeDirect
       * @author  Fritz Lekschas
       * @date    2016-02-25
       * @param   {Object}  nodeData  The node's data object.
       * @return  {Boolean}           If `true` element will not be filtered out.
       */
      function checkNodeDirect(nodeData) {
        return nodeData.hovering === 1 && checkNodeVisibility(this, nodeData);
      }

      /**
       * Helper method to filter out indirectly hovered nodes.
       *
       * @method  checkNodeIndirect
       * @author  Fritz Lekschas
       * @date    2016-02-25
       * @param   {Object}  nodeData  The node's data object.
       * @return  {Boolean}           If `true` element will not be filtered out.
       */
      function checkNodeIndirect(nodeData) {
        return nodeData.hovering === 2 && checkNodeVisibility(this, nodeData);
      }

      this.nodes.filter(checkNodeDirect).classed(appliedClassName + '-directly', true);
      this.nodes.filter(checkNodeIndirect).classed(appliedClassName + '-indirectly', true);

      this.links.highlight(this.currentLinks[appliedClassName][data.id], true, appliedClassName);
    }

    /**
     * Marks nodes as being invisible via assigning a class depending on the
     * custom scroll top position or the columns scroll top position.
     *
     * @method  isInvisible
     * @author  Fritz Lekschas
     * @date    2016-09-12
     * @param   {Object}  selection        D3 selection of nodes to be checked.
     * @param   {Number}  customScrollTop  Custom scroll top position. Used when
     *   column is actively scrolled.
     */

  }, {
    key: 'isInvisible',
    value: function isInvisible(selection, customScrollTop) {
      var _this5 = this;

      selection.classed('invisible', function (data) {
        var scrollTop = customScrollTop || _this5.visData.nodes[data.depth].scrollTop;

        // Node is right to the visible container
        if (data.x + _this5.vis.dragged.x >= _this5.vis.width) {
          return data.invisible = true;
        }
        // Node is below the visible container
        if (data.y + scrollTop >= _this5.vis.height) {
          return data.invisible = true;
        }
        // Node is above the visible container
        if (data.y + _this5.visData.global.row.height + scrollTop <= 0) {
          return data.invisible = true;
        }
        // Node is left to the visible container
        if (data.x + _this5.vis.dragged.x + _this5.visData.global.column.width <= 0) {
          return data.invisible = true;
        }
        return data.invisible = false;
      });
    }

    /**
     * Node _mouse leave handler.
     *
     * @method  leaveHandler
     * @author  Fritz Lekschas
     * @date    2016-09-22
     * @param   {Object}  el    DOM element.
     * @param   {Object}  data  D3 data object of the DOM element.
     */

  }, {
    key: 'leaveHandler',
    value: function leaveHandler(el, data) {
      this.unhighlightNodes(d3.select(el));

      var eventData = {
        id: data.clone ? data.originalNode.id : data.id
      };

      this.events.broadcast('d3ListGraphNodeLeave', eventData);
    }

    /**
     * Handler managing visual _lock_ events.
     *
     * @method  lockHandler
     * @author  Fritz Lekschas
     * @date    2016-09-22
     * @param   {Object}  d3El  D3 selection of the element to be visually locked.
     */

  }, {
    key: 'lockHandler',
    value: function lockHandler(d3El) {
      var events = this.toggleLock(d3El);

      if (events.locked && events.unlocked) {
        this.events.broadcast('d3ListGraphNodeLockChange', {
          lock: {
            id: events.locked.id
          },
          unlock: {
            id: events.unlocked.id
          }
        });
      } else {
        if (events.locked) {
          this.events.broadcast('d3ListGraphNodeLock', {
            id: events.locked.id
          });
        }

        if (events.unlocked) {
          this.events.broadcast('d3ListGraphNodeUnlock', {
            id: events.unlocked.id
          });
        }
      }
    }

    /**
     * Lock a node(s) by ID.
     *
     * @description
     * The reason for not just passing the selected node element in the DOM is
     * because the node might have been cloned. Hence, multiple copies of the same
     * node exist.
     *
     * @method  lockNode
     * @author  Fritz Lekschas
     * @date    2016-09-23
     * @param   {Number}  id  ID of node(s) to be locked.
     */

  }, {
    key: 'lockNode',
    value: function lockNode(id) {
      var self = this;
      var els = this.nodes.filter(function (data) {
        return data.id === id;
      });

      els.each(function (data) {
        self.highlightNodes(d3.select(this), 'lock', undefined);
        data.data.state.lock = true;
      });
    }

    /**
     * Temporarily make all nodes visible.
     *
     * @method  makeAllTempVisible
     * @author  Fritz Lekschas
     * @date    2016-09-23
     * @param   {Boolean}  unset  If `true` reverts back to the old state of
     *   visibility.
     */

  }, {
    key: 'makeAllTempVisible',
    value: function makeAllTempVisible(unset) {
      if (unset) {
        this.nodes.classed('invisible', function (data) {
          var prevInvisible = data._invisible;
          data._invisible = undefined;

          return prevInvisible;
        });
      } else {
        this.nodes.classed('invisible', function (data) {
          data._invisible = data.invisible;
          return false;
        });
      }
    }

    /**
     * Only show the subtree and siblings of the node `data`.
     *
     * @method  nodesVisibility
     * @author  Fritz Lekschas
     * @date    2016-09-22
     * @param   {Object}   data  Node data object.
     * @param   {Boolean}  show  If `true` nodes will be shown again.
     */

  }, {
    key: 'nodesVisibility',
    value: function nodesVisibility(data, show) {
      if (show) {
        this.nodes.classed('hidden', false).each(function (nodeData) {
          nodeData.hidden = false;
        });
      } else {
        // First we set all nodes to `hidden` except those that are currently
        // queried for.
        this.nodes.each(function (nodeData) {
          nodeData.hidden = !nodeData.data.state.query;
        });

        // Then we set direct child and parent nodes of the current node visible.
        upAndDown(data, function (nodeData) {
          nodeData.hidden = false;
        });

        // We also show sibling nodes.
        siblings(data, function (nodeData) {
          nodeData.hidden = false;
        });

        // Assign CSS class to actually hide the nodes.
        this.nodes.classed('hidden', function (nodeData) {
          return nodeData.hidden;
        });
      }
      this.updateVisibility();
    }

    /**
     * Query handler.
     *
     * @method  queryHandler
     * @author  Fritz Lekschas
     * @date    2016-09-23
     * @param   {Object}   d3El            D3 selection of the node to be inspected.
     * @param   {String}   action          Specific query action. Can be ['query',
     *   'unquery', undefined].
     * @param   {String}   mode            If `action == 'query'`, string name of
     *   the query mode. Can be [or, and, not].
     * @param   {Boolean}  noNotification  If `true` notifications are suppressed.
     */

  }, {
    key: 'queryHandler',
    value: function queryHandler(d3El, action, mode, noNotification) {
      var data = d3El.datum();
      var previousMode = data.data.state.query;
      var event$$1 = {};

      if (!previousMode && action === 'unquery') {
        // We haven't queried anything so there's nothing to "un-query".
        return undefined;
      }

      switch (action) {
        case 'query':
          Nodes.setNodeQueryState(d3El, mode);
          break;
        case 'unquery':
          this.unsetNodeQueryState(d3El);
          break;
        default:
          this.toggleNodeQueryStates(d3El);
          break;
      }

      if (data.data.state.query) {
        if (data.data.state.query !== previousMode) {
          event$$1.name = 'd3ListGraphNodeQuery';
          event$$1.data = {
            id: data.clone ? data.originalNode.id : data.id,
            mode: data.data.state.query,
            name: data.clone ? data.originalNode.data.name : data.data.name
          };
        }
      } else {
        event$$1.name = 'd3ListGraphNodeUnquery';
        event$$1.data = {
          id: data.clone ? data.originalNode.id : data.id
        };
      }

      if (event$$1.name && !noNotification) {
        this.events.broadcast(event$$1.name, event$$1.data);
      }

      return event$$1.name ? event$$1 : undefined;
    }

    /**
     * Re-render
     *
     * @method  reRender
     * @author  Fritz Lekschas
     * @date    2017-01-16
     * @param   {Object}  newVisData  New vid data.
     */

  }, {
    key: 'reRender',
    value: function reRender(newVisData) {
      var _this6 = this;

      if (newVisData) {
        this.visData = newVisData;

        this.groups.data(this.visData.nodes).call(function (selection) {
          selection.each(function storeLinkToGroupNode() {
            d3.select(this.parentNode).datum().nodes = this;
          });
        });
      }

      this.nodes = this.groups.selectAll('.' + CLASS_NODE).data(function (data) {
        return data.rows;
      }).attr('transform', function (data) {
        return 'translate(' + (data.x + _this6.visData.global.column.padding) + ', ' + data.y + ')';
      });

      this.nodes.selectAll('.invisible-container').call(this.drawMaxSizedRect.bind(this));

      this.visNodes.selectAll('.bg-border').call(this.drawFullSizeRect.bind(this), 'bg-border');

      this.visNodes.selectAll('.bg').call(this.drawFullSizeRect.bind(this), 'bg', 1, true);

      this.visNodes.selectAll('.border').call(this.drawFullSizeRect.bind(this), 'border');

      if (this.vis.showLinkLocation) {
        this.nodes.selectAll('.link-location-indicator.incoming.above').call(this.drawLinkLocationIndicator.bind(this), 'incoming', 'above', true);

        this.nodes.selectAll('.link-location-indicator.incoming.below').call(this.drawLinkLocationIndicator.bind(this), 'incoming', 'bottom', true);

        this.nodes.selectAll('.link-location-indicator.outgoing.above').call(this.drawLinkLocationIndicator.bind(this), 'outgoing', 'above', true);

        this.nodes.selectAll('.link-location-indicator.outgoing.below').call(this.drawLinkLocationIndicator.bind(this), 'outgoing', 'bottom', true);

        this.nodes.selectAll('.link-indicator.incoming').call(this.drawLinkIndicator.bind(this), 'incoming');

        this.nodes.selectAll('.link-indicator.outgoing').call(this.drawLinkIndicator.bind(this), 'outgoing');

        this.groups.each(function (data, index) {
          _this6.calcHeightLinkLocationIndicator(index, true, true);
        });
      }

      // selection, location, position, mode, className
      this.nodes.selectAll('.' + CLASS_FOCUS_CONTROLS + '.' + CLASS_ROOT + ' .hover-helper').call(this.setUpFocusControls.bind(this), 'left', 0.6, 'hover-helper', 'hover-helper');

      this.nodes.selectAll('.' + CLASS_FOCUS_CONTROLS + '.' + CLASS_ROOT + ' .icon').call(this.setUpFocusControls.bind(this), 'left', 0.6, 'icon', 'ease-all state-active invisible-default icon');

      if (this.vis.querying) {
        this.nodes.selectAll('.' + CLASS_FOCUS_CONTROLS + '.' + CLASS_QUERY + ' .hover-helper').call(this.setUpFocusControls.bind(this), 'right', 0.6, 'hover-helper', 'hover-helper');

        this.nodes.selectAll('.' + CLASS_FOCUS_CONTROLS + '.' + CLASS_QUERY + ' .state-and-or.icon').call(this.setUpFocusControls.bind(this), 'right', 0.6, 'icon', 'ease-all state-and-or invisible-default icon');

        this.nodes.selectAll('.' + CLASS_FOCUS_CONTROLS + '.' + CLASS_QUERY + ' .state-not.icon').call(this.setUpFocusControls.bind(this), 'right', 0.6, 'icon', 'ease-all state-not invisible-default icon');
      }

      this.bars.reRender(this.visData, this.vis.currentSorting.global.type);

      // Add node label
      this.visNodes.selectAll('.' + CLASS_LABEL_WRAPPER).attr('x', this.visData.global.cell.padding).attr('y', this.visData.global.row.padding + this.visData.global.cell.padding).attr('width', this.visData.global.column.contentWidth).attr('height', this.visData.global.row.contentHeight - this.visData.global.cell.padding * 2);

      this.visNodes.selectAll('.' + CLASS_LABEL_WRAPPER + ' .label').style('line-height', Math.floor(this.visData.global.row.contentHeight - this.visData.global.cell.padding * 2) + 'px');

      this.nodes.call(this.isInvisible.bind(this));
    }

    /**
     * Handler managing _root_ events.
     *
     * @method  rootHandler
     * @author  Fritz Lekschas
     * @date    2016-09-22
     * @param   {Object}   d3El    D3 selection of the node to be rooted.
     * @param   {Boolean}  unroot  If `true` the rooting is resolved.
     */

  }, {
    key: 'rootHandler',
    value: function rootHandler(d3El, unroot) {
      if (!d3El.datum().data.state.root && unroot) {
        // The node is not rooted so there's no point in unrooting.
        return;
      }
      var events = this.toggleRoot(d3El, unroot);

      if (events.rooted && events.unrooted) {
        this.events.broadcast('d3ListGraphNodeReroot', {
          rooted: {
            id: events.rooted.clone ? events.rooted.originalNode.id : events.rooted.id
          },
          unrooted: {
            id: events.unrooted.clone ? events.unrooted.originalNode.id : events.unrooted.id
          }
        });
      } else {
        if (events.rooted) {
          this.events.broadcast('d3ListGraphNodeRoot', {
            id: events.rooted.clone ? events.rooted.originalNode.id : events.rooted.id
          });
        }

        if (events.unrooted) {
          this.events.broadcast('d3ListGraphNodeUnroot', {
            id: events.unrooted.clone ? events.unrooted.originalNode.id : events.unrooted.id
          });
        }
      }
    }

    /**
     * Set the given node as the root.
     *
     * @method  rootNode
     * @author  Fritz Lekschas
     * @date    2016-09-23
     * @param   {Object}  d3El  D3 selection of the node to be rooted.
     */

  }, {
    key: 'rootNode',
    value: function rootNode(d3El) {
      var data = d3El.datum();

      data.data.state.root = true;
      d3El.classed('rooted', true);
      this.hideNodes(data);

      // Highlight level
      this.vis.levels.focus(data.depth + this.vis.activeLevel);

      if (!data.data.state.query || data.data.state.query === 'not') {
        data.data.queryBeforeRooting = false;
        return {
          query: true
        };
      }

      data.data.queryBeforeRooting = true;

      return {
        query: false
      };
    }

    /**
     * Set the query state of the node by assign the corresponding CSS class.
     *
     * @method  setNodeQueryState
     * @author  Fritz Lekschas
     * @date    2016-09-23
     * @param   {Object}  d3El  D3 selection of the node to be inspected.
     * @param   {String}  mode  Name of the query mode.
     */

  }, {
    key: 'setUpFocusControls',


    /**
     * Helper method to create focus controls.
     *
     * @method  setUpFocusControls
     * @author  Fritz Lekschas
     * @date    2016-09-23
     * @param   {Object}  selection  D3 selection of the node to which the focus
     *   controls should be added.
     * @param   {String}  location   Can either be "left" or "right"
     * @param   {Number}  position   Amount the focus control is pushed away from
     *   the node.
     * @param   {String}  mode       Specifies a helper element like "bg" or
     *   "hover-helper".
     * @param   {String}  className  Class name to be assigned to to the focus
     *   control.
     */
    value: function setUpFocusControls(selection, location, position, mode, className) {
      var paddedDim = this.iconDimension + 4;

      var x = 0 - paddedDim * (position + 1);

      if (location === 'right') {
        x = this.visData.global.column.contentWidth + 2 + paddedDim * position;
      }

      var y = this.visData.global.row.padding + (this.visData.global.row.contentHeight - 2 * this.visData.global.cell.padding) / 4;

      if (mode === 'bg') {
        selection.attr('class', className).attr('cx', x + this.iconDimension / 2).attr('cy', y + this.iconDimension / 2).attr('r', this.iconDimension * 3 / 4);
      } else if (mode === 'hover-helper') {
        selection.attr('class', className).attr('x', x - 4).attr('y', (this.visData.global.row.height - (this.iconDimension + 8)) / 2).attr('width', this.iconDimension + 8).attr('height', this.iconDimension + 8).attr('rx', this.iconDimension).attr('ry', this.iconDimension);
      } else {
        selection.attr('class', className).attr('x', x).attr('y', (this.visData.global.row.height - this.iconDimension) / 2).attr('width', this.iconDimension).attr('height', this.iconDimension);
      }
    }

    /**
     * Helper method to show nodes.
     *
     * @method  showNodes
     * @author  Fritz Lekschas
     * @date    2016-09-22
     */

  }, {
    key: 'showNodes',
    value: function showNodes() {
      this.nodesVisibility(undefined, true);
    }

    /**
     * Visually update the nodes' positions after sorting.
     *
     * @method  sort
     * @author  Fritz Lekschas
     * @date    2016-10-02
     * @param   {Object}   update       Updated node data object.
     * @param   {Boolean}  newSortType  If `true` the sort type has changed.
     */

  }, {
    key: 'sort',
    value: function sort(update, newSortType) {
      var _this7 = this;

      for (var i = update.length; i--;) {
        var selection = this.nodes.data(update[i].rows, function (data) {
          return data.id;
        });

        this.vis.svgD3.classed('sorting', true);
        selection.transition().duration(TRANSITION_SEMI_FAST).attr('transform', function (data) {
          return 'translate(' + (data.x + _this7.visData.global.column.padding) + ', ' + data.y + ')';
        }).call(allTransitionsEnded, function () {
          _this7.vis.svgD3.classed('sorting', false);
          _this7.vis.updateLevelsVisibility();
          _this7.vis.updateScrolling();
        });

        if (newSortType && this.vis.currentSorting.local[update[i].level].type !== 'name') {
          this.bars.update(selection.selectAll('.bar'), update[i].sortBy);
        }
      }
    }

    /**
     * Toggle through the lock state of a node
     *
     * @method  toggleLock
     * @author  Fritz Lekschas
     * @date    2016-09-23
     * @param   {Object}   d3El         D3 selection of the node to be locked.
     * @param   {Boolean}  forceUnlock  If `true` forces an unlock.
     */

  }, {
    key: 'toggleLock',
    value: function toggleLock(d3El, forceUnlock) {
      var data = d3El.datum();
      var events = { locked: false, unlocked: false };

      if (this.lockedNode) {
        if (this.lockedNode.datum().id === data.id) {
          this.unlockNode(this.lockedNode.datum().id);
          events.unlocked = this.lockedNode.datum();
          this.lockedNode = undefined;
        } else {
          // Reset previously locked node;
          this.unlockNode(this.lockedNode.datum().id);
          events.unlocked = this.lockedNode.datum();

          if (!forceUnlock) {
            this.lockNode(data.id);
            events.locked = data;
            this.lockedNode = d3El;
          }
        }
      } else {
        if (!forceUnlock) {
          this.lockNode(data.id);
          events.locked = data;
          this.lockedNode = d3El;
        }
      }

      return events;
    }

    /**
     * Toggle through node query states.
     *
     * @method  toggleNodeQueryStates
     * @author  Fritz Lekschas
     * @date    2016-09-23
     * @param   {Object}  d3El  D3 selection of the node to be inspected.
     */

  }, {
    key: 'toggleNodeQueryStates',
    value: function toggleNodeQueryStates(d3El) {
      var data = d3El.datum();
      var previousMode = data.data.state.query;

      if (data.data.state.root) {
        if (previousMode !== 'or') {
          Nodes.setNodeQueryState(d3El, 'or');
        } else {
          Nodes.setNodeQueryState(d3El, 'and');
        }
      } else {
        switch (previousMode) {
          case 'or':
            Nodes.setNodeQueryState(d3El, 'and');
            break;
          case 'and':
            Nodes.setNodeQueryState(d3El, 'not');
            break;
          case 'not':
            this.unsetNodeQueryState(d3El);
            break;
          default:
            Nodes.setNodeQueryState(d3El, 'or');
            break;
        }
      }
    }

    /**
     * Toggle root node.
     *
     * @method  toggleRoot
     * @author  Fritz Lekschas
     * @date    2016-09-23
     * @param   {Object}   d3El            D3 selection of the node to be
     *   inspected.
     * @param   {Boolean}  forceUnroot     If `true` the node will be "un-rooted".
     * @param   {Boolean}  noNotification  If `true` notifications are suppressed.
     */

  }, {
    key: 'toggleRoot',
    value: function toggleRoot(d3El, forceUnroot, noNotification) {
      var data = d3El.datum();
      var events = { rooted: false, unrooted: false };
      var queries = [];

      // Blur current levels
      this.vis.levels.blur();

      if (this.rootedNode) {
        // Reset current root node
        this.rootedNode.classed('active', false).classed('inactive', true);

        events.unrooted = this.rootedNode.datum();
        if (this.unrootNode(this.rootedNode).unquery) {
          queries.push({
            d3El: this.rootedNode,
            action: 'unquery'
          });
        }

        // Activate new root
        if (this.rootedNode.datum().id !== data.id && !forceUnroot) {
          d3El.classed('active', true).classed('inactive', false);

          this.rootedNode = d3El;
          events.rooted = d3El.datum();
          if (this.rootNode(d3El).query) {
            queries.push({
              d3El: d3El,
              action: 'query',
              mode: 'or'
            });
          }
        } else {
          this.rootedNode = undefined;
          // Highlight first level
          this.vis.levels.focus(this.vis.activeLevel - this.vis.noRootActiveLevelDiff);
        }
      } else {
        if (!forceUnroot) {
          d3El.classed('active', true).classed('inactive', false);

          this.rootedNode = d3El;
          events.rooted = d3El.datum();
          if (this.rootNode(d3El).query) {
            queries.push({
              d3El: d3El,
              action: 'query',
              mode: 'or'
            });
          }
        }
      }

      if (queries.length) {
        this.batchQueryHandler(queries, noNotification);
      }

      return events;
    }

    /**
     * Visually remove the highlighting of nodes.
     *
     * @method  unhighlightNodes
     * @author  Fritz Lekschas
     * @date    2016-10-02
     * @param   {Object}   d3El           D3 selection of the starting node which
     *   highlighting should be undone.
     * @param   {String}   className      CSS class name to be assigned to the
     *   highlighted nodes.
     * @param   {String}   restriction    Specify a restriction. Currently
     *   only "directParentsOnly" is supported.
     * @param   {Boolean}  excludeClones  If `true` exclude cloned nodes.
     */

  }, {
    key: 'unhighlightNodes',
    value: function unhighlightNodes(d3El, className, restriction, excludeClones) {
      var data = d3El.datum();
      var traverseCallback = function traverseCallback(nodeData) {
        nodeData.hovering = 0;
      };
      var includeParents = true;
      var appliedClassName = className || 'hovering';
      var includeClones = !excludeClones;
      var includeChildren = restriction !== 'directParentsOnly';

      data.hovering = 0;
      if (includeParents && includeChildren) {
        upAndDown(data, traverseCallback, undefined, undefined, includeClones);
      }
      if (includeParents && !includeChildren) {
        up(data, traverseCallback, undefined, includeClones);
      }
      if (!includeParents && includeChildren) {
        down(data, traverseCallback, undefined, includeClones);
      }

      if (data.clone) {
        data.originalNode.hovering = 0;
      } else {
        if (includeClones) {
          for (var i = data.clones.length; i--;) {
            data.clones[i].hovering = 0;
          }
        }
      }

      this.nodes.classed(appliedClassName + '-directly', false);
      this.nodes.classed(appliedClassName + '-indirectly', false);

      if (this.currentLinks[appliedClassName] && this.currentLinks[appliedClassName][data.id]) {
        this.links.highlight(this.currentLinks[appliedClassName][data.id], false, appliedClassName);
      }
    }

    /**
     * Unlock node.
     *
     * @method  unlockNode
     * @author  Fritz Lekschas
     * @date    2016-09-23
     * @param   {Number}  id  ID of node(s) to be locked.
     */

  }, {
    key: 'unlockNode',
    value: function unlockNode(id) {
      var self = this;
      var els = this.nodes.filter(function (data) {
        return data.id === id;
      });

      els.each(function (data) {
        self.unhighlightNodes(d3.select(this), 'lock', undefined);
        data.data.state.lock = undefined;
      });
    }

    /**
     * Stop rooting by the given node.
     *
     * @method  unrootNode
     * @author  Fritz Lekschas
     * @date    2016-09-23
     * @param   {Object}  d3El  D3 selection of the node to be "un-rooted".
     */

  }, {
    key: 'unrootNode',
    value: function unrootNode(d3El) {
      var data = d3El.datum();

      data.data.state.root = false;
      d3El.classed('rooted', false);
      this.showNodes();

      if (!data.data.queryBeforeRooting) {
        return {
          unquery: true
        };
      }

      return {
        unquery: false
      };
    }

    /**
     * Unset the query state of a node.
     *
     * @method  unsetNodeQueryState
     * @author  Fritz Lekschas
     * @date    2016-09-23
     * @param   {Object}  d3El  D3 selection of the node to be inspected.
     */

  }, {
    key: 'unsetNodeQueryState',
    value: function unsetNodeQueryState(d3El) {
      var data = d3El.datum();

      data.data.state.query = undefined;
      data.data.queryBeforeRooting = undefined;

      d3El.classed('active', true).classed('inactive', false).classed('query-and', false).classed('query-or', false).classed('query-not', false);

      if (this.rootedNode) {
        this.hideNodes(this.rootedNode.datum());
      }
    }

    /**
     * Updates the visual appearance of the link location indicators.
     *
     * @method  updateHeightLinkLocationIndicatorBars
     * @author  Fritz Lekschas
     * @date    2016-09-22
     * @param   {Object}   selection  D3 selection of the corresponding nodes.
     * @param   {Boolean}  outgoing   If `true` outgoing link location indicator
     *   heights are updated. Otherwise incoming link location indicator
     *   heights are updated.
     */

  }, {
    key: 'updateHeightLinkLocationIndicatorBars',
    value: function updateHeightLinkLocationIndicatorBars(selection, outgoing) {
      var barRefHeight = this.visData.global.row.contentHeight / 2 - 1;
      var barAboveRefTop = this.visData.global.row.height / 2 - 1;

      var baseClassName = '.' + CLASS_INDICATOR_LOCATION + '.' + (outgoing ? CLASS_INDICATOR_OUTGOING : CLASS_INDICATOR_INCOMING);

      selection.selectAll(baseClassName + '.' + CLASS_INDICATOR_ABOVE).attr('y', function (data) {
        return data.total ? barAboveRefTop - data.above / data.total * barRefHeight : barAboveRefTop;
      }).attr('height', function (data) {
        return data.total ? data.above / data.total * barRefHeight : 0;
      });

      selection.selectAll(baseClassName + '.' + CLASS_INDICATOR_BELOW).attr('height', function (data) {
        return data.total ? data.below / data.total * barRefHeight : 0;
      });
    }

    /**
     * Update the link location indicators.
     *
     * @description
     * Updates the link location indicators of level / column `right` - `left`.
     *
     * @method  updateLinkLocationIndicators
     * @author  Fritz Lekschas
     * @date    2016-09-22
     * @param   {Number}  left   Index of the column to the left.
     * @param   {Number}  right  Index of the right column.
     */

  }, {
    key: 'updateLinkLocationIndicators',
    value: function updateLinkLocationIndicators(left, right) {
      this.calcHeightLinkLocationIndicator(left, true);
      this.calcHeightLinkLocationIndicator(right);
    }

    /**
     * Updates the nodes' visibility visually.
     *
     * @method  updateVisibility
     * @author  Fritz Lekschas
     * @date    2016-02-21
     */

  }, {
    key: 'updateVisibility',
    value: function updateVisibility() {
      var _this8 = this;

      // Calls the D3 list graph layout method to update the nodes position.
      this.vis.layout.updateNodesVisibility();

      // Transition to the updated position
      this.nodes.transition().duration(TRANSITION_SEMI_FAST).attr('transform', function (data) {
        return 'translate(' + (data.x + _this8.visData.global.column.padding) + ', ' + data.y + ')';
      }).call(allTransitionsEnded, function () {
        _this8.vis.updateLevelsVisibility();
        _this8.vis.updateScrolling();
        _this8.nodes.call(_this8.isInvisible.bind(_this8));
      });

      this.vis.links.updateVisibility();
    }
  }, {
    key: 'barMode',
    get: function get() {
      return this.bars.mode;
    }
  }], [{
    key: 'setNodeQueryState',
    value: function setNodeQueryState(d3El, mode) {
      d3El.datum().data.state.query = mode;
      d3El.classed('active', true).classed('inactive', false).classed('query-and', mode === 'and').classed('query-or', mode === 'or').classed('query-not', mode === 'not');
    }
  }, {
    key: 'classNodeVisible',
    get: function get() {
      return CLASS_NODE_VISIBLE;
    }

    /**
     * Get the CSS class of focus controls.
     *
     * @method  classFocusControls
     * @author  Fritz Lekschas
     * @date    2016-09-22
     * @return  {String}  CSS name.
     */

  }, {
    key: 'classFocusControls',
    get: function get() {
      return CLASS_FOCUS_CONTROLS;
    }

    /**
     * Get the CSS class of root elements.
     *
     * @method  classRoot
     * @author  Fritz Lekschas
     * @date    2016-09-22
     * @return  {String}  CSS name.
     */

  }, {
    key: 'classRoot',
    get: function get() {
      return CLASS_ROOT;
    }

    /**
     * Get the CSS class of query button..
     *
     * @method  classQuery
     * @author  Fritz Lekschas
     * @date    2016-09-22
     * @return  {String}  CSS name.
     */

  }, {
    key: 'classQuery',
    get: function get() {
      return CLASS_QUERY;
    }
  }]);
  return Nodes;
}();

// External
// Internal
/**
 * Class name of scrollbar elements.
 *
 * @type  {String}
 */
var SCROLLBAR_CLASS = 'scrollbar';

var Scrollbars = function () {
  /**
   * [constructor description]
   *
   * @method  constructor
   * @author  Fritz Lekschas
   * @date    2016-09-14
   * @param   {Object}  baseEl   D3 selection of the element where the
   *   scrollbars should be appended to.
   * @param   {Object}  visData  List Graph App's data.
   * @param   {Number}  width    Width of the scrollbar in pixels.
   */
  function Scrollbars(baseEl, visData, width) {
    classCallCheck(this, Scrollbars);

    this.visData = visData;
    this.width = width;

    // Add empty scrollbar element
    this.all = baseEl.append('rect').attr('class', SCROLLBAR_CLASS).call(function (selection) {
      selection.each(function setScrollBarDomElement() {
        d3.select(this.parentNode).datum().scrollbar.el = this;
      });
    }).attr('x', function (data) {
      return data.scrollbar.x - 2;
    }).attr('y', function (data) {
      return data.scrollbar.y;
    }).attr('width', this.width).attr('height', function (data) {
      return data.scrollbar.height;
    }).attr('rx', this.width / 2).attr('ry', this.width / 2).classed('ready', true);
  }

  /**
   * Re-render
   *
   * @method  reRender
   * @author  Fritz Lekschas
   * @date    2017-01-16
   * @param   {Object}  newVisData  New vid data.
   */


  createClass(Scrollbars, [{
    key: 'reRender',
    value: function reRender(newVisData) {
      if (newVisData) {
        this.visData = newVisData;
      }

      this.all.data(this.visData.nodes).call(function (selection) {
        selection.each(function setScrollBarDomElement() {
          d3.select(this.parentNode).datum().scrollbar.el = this;
        });
      });

      this.updateVisibility();
    }

    /**
     * Update the visual state of the scrollbar given the current data.
     *
     * @method  updateVisibility
     * @author  Fritz Lekschas
     * @date    2016-09-14
     */

  }, {
    key: 'updateVisibility',
    value: function updateVisibility() {
      this.all.transition().duration(TRANSITION_LIGHTNING_FAST).attr('x', function (data) {
        return data.scrollbar.x;
      }).attr('height', function (data) {
        return data.scrollbar.height;
      });
    }
  }]);
  return Scrollbars;
}();

// External
// Internal
var Events = function () {
  function Events(el, broadcast) {
    classCallCheck(this, Events);

    if (broadcast && !isFunction(broadcast)) {
      throw new EventDispatcherNoFunction();
    }

    this.el = el;
    this._stack = {};
    this.dispatch = broadcast || this._dispatchEvent;
  }

  createClass(Events, [{
    key: '_dispatchEvent',
    value: function _dispatchEvent(eventName, data) {
      var event$$1 = document.createEvent('CustomEvent');
      event$$1.initCustomEvent(eventName, false, false, data);
      this.el.dispatchEvent(event$$1);
    }
  }, {
    key: 'broadcast',
    value: function broadcast(event$$1, data) {
      this.dispatch(event$$1, data);
    }

    /**
     * Add a callback function to an event stack.
     *
     * @method  on
     * @author  Fritz Lekschas
     * @date    2016-01-07
     *
     * @param   {String}    event     Event identifier.
     * @param   {Function}  callback  Function which is called when the event
     *   stack is triggered.
     * @param   {Number}    times     Number of times the callback function should
     *   be triggered before it is removed from the event stack. This is useful
     *   when an event happens only a certain number of times.
     * @return  {Number}              Index of callback, which is needed to
     *   manually remove the callback from the event stack.
     */

  }, {
    key: 'on',
    value: function on(event$$1, callback, times) {
      if (!isFunction(callback)) {
        return false;
      }

      var normTimes = isFinite(times) ? parseInt(times, 10) : Infinity;

      if (isArray(this.stack[event$$1])) {
        return this.stack[event$$1].push({ callback: callback, times: normTimes }) - 1;
      }
      this.stack[event$$1] = [{ callback: callback, times: normTimes }];
      return 0;
    }

    /**
     * Removes a callback function from an event stack given its index.
     *
     * @method  off
     * @author  Fritz Lekschas
     * @date    2016-01-07
     *
     * @param   {String}   event  Event identifier.
     * @param   {Number}   index  Index of the callback to be removed.
     * @return  {Boolean}         Returns `true` if event callback was found and
     *   successfully removed.
     */

  }, {
    key: 'off',
    value: function off(event$$1, index) {
      try {
        this.stack[event$$1].splice(index, 1);
        return true;
      } catch (e) {
        return false;
      }
    }

    /**
     * Trigger an event stack
     *
     * @method  trigger
     * @author  Fritz Lekschas
     * @date    2016-01-07
     *
     * @param   {String}   event  Event identifier.
     * @return  {Boolean}         Returns `true` if an event stack was found.
     */

  }, {
    key: 'trigger',
    value: function trigger(event$$1, data) {
      if (isArray(this.stack[event$$1])) {
        // Traversing from the end to the start, which has the advantage that
        // deletion of events, i.e. calling `Event.off()` doesn't affect the index
        // of event listeners in the next step.
        for (var i = this.stack[event$$1].length; i--;) {
          // Instead of checking whether `stack[event][i]` is a function here,
          // we do it just once when we add the function to the stack.
          if (this.stack[event$$1][i].times--) {
            this.stack[event$$1][i].callback(data);
          } else {
            this.off(event$$1, i);
          }
        }
        return true;
      }
      return false;
    }
  }, {
    key: 'stack',
    get: function get() {
      return this._stack;
    }
  }]);
  return Events;
}();

function objectOrFunction(x) {
  return typeof x === 'function' || (typeof x === 'object' && x !== null);
}

function isFunction$2(x) {
  return typeof x === 'function';
}



var _isArray;
if (!Array.isArray) {
  _isArray = function (x) {
    return Object.prototype.toString.call(x) === '[object Array]';
  };
} else {
  _isArray = Array.isArray;
}

var isArray$2 = _isArray;

var len = 0;
var vertxNext;
var customSchedulerFn;

var asap = function asap(callback, arg) {
  queue[len] = callback;
  queue[len + 1] = arg;
  len += 2;
  if (len === 2) {
    // If len is 2, that means that we need to schedule an async flush.
    // If additional callbacks are queued before the queue is flushed, they
    // will be processed by this flush that we are scheduling.
    if (customSchedulerFn) {
      customSchedulerFn(flush);
    } else {
      scheduleFlush();
    }
  }
}

function setScheduler(scheduleFn) {
  customSchedulerFn = scheduleFn;
}

function setAsap(asapFn) {
  asap = asapFn;
}

var browserWindow = (typeof window !== 'undefined') ? window : undefined;
var browserGlobal = browserWindow || {};
var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
var isNode = typeof self === 'undefined' && typeof process !== 'undefined' && {}.toString.call(process) === '[object process]';

// test for web worker but not in IE10
var isWorker = typeof Uint8ClampedArray !== 'undefined' &&
  typeof importScripts !== 'undefined' &&
  typeof MessageChannel !== 'undefined';

// node
function useNextTick() {
  // node version 0.10.x displays a deprecation warning when nextTick is used recursively
  // see https://github.com/cujojs/when/issues/410 for details
  return function() {
    process.nextTick(flush);
  };
}

// vertx
function useVertxTimer() {
  return function() {
    vertxNext(flush);
  };
}

function useMutationObserver() {
  var iterations = 0;
  var observer = new BrowserMutationObserver(flush);
  var node = document.createTextNode('');
  observer.observe(node, { characterData: true });

  return function() {
    node.data = (iterations = ++iterations % 2);
  };
}

// web worker
function useMessageChannel() {
  var channel = new MessageChannel();
  channel.port1.onmessage = flush;
  return function () {
    channel.port2.postMessage(0);
  };
}

function useSetTimeout() {
  return function() {
    setTimeout(flush, 1);
  };
}

var queue = new Array(1000);
function flush() {
  for (var i = 0; i < len; i+=2) {
    var callback = queue[i];
    var arg = queue[i+1];

    callback(arg);

    queue[i] = undefined;
    queue[i+1] = undefined;
  }

  len = 0;
}

function attemptVertx() {
  try {
    var r = require;
    var vertx = r('vertx');
    vertxNext = vertx.runOnLoop || vertx.runOnContext;
    return useVertxTimer();
  } catch(e) {
    return useSetTimeout();
  }
}

var scheduleFlush;
// Decide what async method to use to triggering processing of queued callbacks:
if (isNode) {
  scheduleFlush = useNextTick();
} else if (BrowserMutationObserver) {
  scheduleFlush = useMutationObserver();
} else if (isWorker) {
  scheduleFlush = useMessageChannel();
} else if (browserWindow === undefined && typeof require === 'function') {
  scheduleFlush = attemptVertx();
} else {
  scheduleFlush = useSetTimeout();
}

function then(onFulfillment, onRejection) {
  var parent = this;

  var child = new this.constructor(noop);

  if (child[PROMISE_ID] === undefined) {
    makePromise(child);
  }

  var state = parent._state;

  if (state) {
    var callback = arguments[state - 1];
    asap(function(){
      invokeCallback(state, child, callback, parent._result);
    });
  } else {
    subscribe(parent, child, onFulfillment, onRejection);
  }

  return child;
}

/**
  `Promise.resolve` returns a promise that will become resolved with the
  passed `value`. It is shorthand for the following:

  ```javascript
  var promise = new Promise(function(resolve, reject){
    resolve(1);
  });

  promise.then(function(value){
    // value === 1
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  var promise = Promise.resolve(1);

  promise.then(function(value){
    // value === 1
  });
  ```

  @method resolve
  @static
  @param {Any} value value that the returned promise will be resolved with
  Useful for tooling.
  @return {Promise} a promise that will become fulfilled with the given
  `value`
*/
function resolve$1(object) {
  /*jshint validthis:true */
  var Constructor = this;

  if (object && typeof object === 'object' && object.constructor === Constructor) {
    return object;
  }

  var promise = new Constructor(noop);
  resolve(promise, object);
  return promise;
}

var PROMISE_ID = Math.random().toString(36).substring(16);

function noop() {}

var PENDING   = void 0;
var FULFILLED = 1;
var REJECTED  = 2;

var GET_THEN_ERROR = new ErrorObject();

function selfFulfillment() {
  return new TypeError("You cannot resolve a promise with itself");
}

function cannotReturnOwn() {
  return new TypeError('A promises callback cannot return that same promise.');
}

function getThen(promise) {
  try {
    return promise.then;
  } catch(error) {
    GET_THEN_ERROR.error = error;
    return GET_THEN_ERROR;
  }
}

function tryThen(then$$1, value, fulfillmentHandler, rejectionHandler) {
  try {
    then$$1.call(value, fulfillmentHandler, rejectionHandler);
  } catch(e) {
    return e;
  }
}

function handleForeignThenable(promise, thenable, then$$1) {
   asap(function(promise) {
    var sealed = false;
    var error = tryThen(then$$1, thenable, function(value) {
      if (sealed) { return; }
      sealed = true;
      if (thenable !== value) {
        resolve(promise, value);
      } else {
        fulfill(promise, value);
      }
    }, function(reason) {
      if (sealed) { return; }
      sealed = true;

      reject(promise, reason);
    }, 'Settle: ' + (promise._label || ' unknown promise'));

    if (!sealed && error) {
      sealed = true;
      reject(promise, error);
    }
  }, promise);
}

function handleOwnThenable(promise, thenable) {
  if (thenable._state === FULFILLED) {
    fulfill(promise, thenable._result);
  } else if (thenable._state === REJECTED) {
    reject(promise, thenable._result);
  } else {
    subscribe(thenable, undefined, function(value) {
      resolve(promise, value);
    }, function(reason) {
      reject(promise, reason);
    });
  }
}

function handleMaybeThenable(promise, maybeThenable, then$$1) {
  if (maybeThenable.constructor === promise.constructor &&
      then$$1 === then &&
      constructor.resolve === resolve$1) {
    handleOwnThenable(promise, maybeThenable);
  } else {
    if (then$$1 === GET_THEN_ERROR) {
      reject(promise, GET_THEN_ERROR.error);
    } else if (then$$1 === undefined) {
      fulfill(promise, maybeThenable);
    } else if (isFunction$2(then$$1)) {
      handleForeignThenable(promise, maybeThenable, then$$1);
    } else {
      fulfill(promise, maybeThenable);
    }
  }
}

function resolve(promise, value) {
  if (promise === value) {
    reject(promise, selfFulfillment());
  } else if (objectOrFunction(value)) {
    handleMaybeThenable(promise, value, getThen(value));
  } else {
    fulfill(promise, value);
  }
}

function publishRejection(promise) {
  if (promise._onerror) {
    promise._onerror(promise._result);
  }

  publish(promise);
}

function fulfill(promise, value) {
  if (promise._state !== PENDING) { return; }

  promise._result = value;
  promise._state = FULFILLED;

  if (promise._subscribers.length !== 0) {
    asap(publish, promise);
  }
}

function reject(promise, reason) {
  if (promise._state !== PENDING) { return; }
  promise._state = REJECTED;
  promise._result = reason;

  asap(publishRejection, promise);
}

function subscribe(parent, child, onFulfillment, onRejection) {
  var subscribers = parent._subscribers;
  var length = subscribers.length;

  parent._onerror = null;

  subscribers[length] = child;
  subscribers[length + FULFILLED] = onFulfillment;
  subscribers[length + REJECTED]  = onRejection;

  if (length === 0 && parent._state) {
    asap(publish, parent);
  }
}

function publish(promise) {
  var subscribers = promise._subscribers;
  var settled = promise._state;

  if (subscribers.length === 0) { return; }

  var child, callback, detail = promise._result;

  for (var i = 0; i < subscribers.length; i += 3) {
    child = subscribers[i];
    callback = subscribers[i + settled];

    if (child) {
      invokeCallback(settled, child, callback, detail);
    } else {
      callback(detail);
    }
  }

  promise._subscribers.length = 0;
}

function ErrorObject() {
  this.error = null;
}

var TRY_CATCH_ERROR = new ErrorObject();

function tryCatch(callback, detail) {
  try {
    return callback(detail);
  } catch(e) {
    TRY_CATCH_ERROR.error = e;
    return TRY_CATCH_ERROR;
  }
}

function invokeCallback(settled, promise, callback, detail) {
  var hasCallback = isFunction$2(callback),
      value, error, succeeded, failed;

  if (hasCallback) {
    value = tryCatch(callback, detail);

    if (value === TRY_CATCH_ERROR) {
      failed = true;
      error = value.error;
      value = null;
    } else {
      succeeded = true;
    }

    if (promise === value) {
      reject(promise, cannotReturnOwn());
      return;
    }

  } else {
    value = detail;
    succeeded = true;
  }

  if (promise._state !== PENDING) {
    // noop
  } else if (hasCallback && succeeded) {
    resolve(promise, value);
  } else if (failed) {
    reject(promise, error);
  } else if (settled === FULFILLED) {
    fulfill(promise, value);
  } else if (settled === REJECTED) {
    reject(promise, value);
  }
}

function initializePromise(promise, resolver) {
  try {
    resolver(function resolvePromise(value){
      resolve(promise, value);
    }, function rejectPromise(reason) {
      reject(promise, reason);
    });
  } catch(e) {
    reject(promise, e);
  }
}

var id = 0;
function nextId() {
  return id++;
}

function makePromise(promise) {
  promise[PROMISE_ID] = id++;
  promise._state = undefined;
  promise._result = undefined;
  promise._subscribers = [];
}

function Enumerator$1(Constructor, input) {
  this._instanceConstructor = Constructor;
  this.promise = new Constructor(noop);

  if (!this.promise[PROMISE_ID]) {
    makePromise(this.promise);
  }

  if (isArray$2(input)) {
    this._input     = input;
    this.length     = input.length;
    this._remaining = input.length;

    this._result = new Array(this.length);

    if (this.length === 0) {
      fulfill(this.promise, this._result);
    } else {
      this.length = this.length || 0;
      this._enumerate();
      if (this._remaining === 0) {
        fulfill(this.promise, this._result);
      }
    }
  } else {
    reject(this.promise, validationError());
  }
}

function validationError() {
  return new Error('Array Methods must be provided an Array');
}

Enumerator$1.prototype._enumerate = function() {
  var length  = this.length;
  var input   = this._input;

  for (var i = 0; this._state === PENDING && i < length; i++) {
    this._eachEntry(input[i], i);
  }
};

Enumerator$1.prototype._eachEntry = function(entry, i) {
  var c = this._instanceConstructor;
  var resolve$$1 = c.resolve;

  if (resolve$$1 === resolve$1) {
    var then$$1 = getThen(entry);

    if (then$$1 === then &&
        entry._state !== PENDING) {
      this._settledAt(entry._state, i, entry._result);
    } else if (typeof then$$1 !== 'function') {
      this._remaining--;
      this._result[i] = entry;
    } else if (c === Promise$4) {
      var promise = new c(noop);
      handleMaybeThenable(promise, entry, then$$1);
      this._willSettleAt(promise, i);
    } else {
      this._willSettleAt(new c(function(resolve$$1) { resolve$$1(entry); }), i);
    }
  } else {
    this._willSettleAt(resolve$$1(entry), i);
  }
};

Enumerator$1.prototype._settledAt = function(state, i, value) {
  var promise = this.promise;

  if (promise._state === PENDING) {
    this._remaining--;

    if (state === REJECTED) {
      reject(promise, value);
    } else {
      this._result[i] = value;
    }
  }

  if (this._remaining === 0) {
    fulfill(promise, this._result);
  }
};

Enumerator$1.prototype._willSettleAt = function(promise, i) {
  var enumerator = this;

  subscribe(promise, undefined, function(value) {
    enumerator._settledAt(FULFILLED, i, value);
  }, function(reason) {
    enumerator._settledAt(REJECTED, i, reason);
  });
};

/**
  `Promise.all` accepts an array of promises, and returns a new promise which
  is fulfilled with an array of fulfillment values for the passed promises, or
  rejected with the reason of the first passed promise to be rejected. It casts all
  elements of the passed iterable to promises as it runs this algorithm.

  Example:

  ```javascript
  var promise1 = resolve(1);
  var promise2 = resolve(2);
  var promise3 = resolve(3);
  var promises = [ promise1, promise2, promise3 ];

  Promise.all(promises).then(function(array){
    // The array here would be [ 1, 2, 3 ];
  });
  ```

  If any of the `promises` given to `all` are rejected, the first promise
  that is rejected will be given as an argument to the returned promises's
  rejection handler. For example:

  Example:

  ```javascript
  var promise1 = resolve(1);
  var promise2 = reject(new Error("2"));
  var promise3 = reject(new Error("3"));
  var promises = [ promise1, promise2, promise3 ];

  Promise.all(promises).then(function(array){
    // Code here never runs because there are rejected promises!
  }, function(error) {
    // error.message === "2"
  });
  ```

  @method all
  @static
  @param {Array} entries array of promises
  @param {String} label optional string for labeling the promise.
  Useful for tooling.
  @return {Promise} promise that is fulfilled when all `promises` have been
  fulfilled, or rejected if any of them become rejected.
  @static
*/
function all(entries) {
  return new Enumerator$1(this, entries).promise;
}

/**
  `Promise.race` returns a new promise which is settled in the same way as the
  first passed promise to settle.

  Example:

  ```javascript
  var promise1 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 1');
    }, 200);
  });

  var promise2 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 2');
    }, 100);
  });

  Promise.race([promise1, promise2]).then(function(result){
    // result === 'promise 2' because it was resolved before promise1
    // was resolved.
  });
  ```

  `Promise.race` is deterministic in that only the state of the first
  settled promise matters. For example, even if other promises given to the
  `promises` array argument are resolved, but the first settled promise has
  become rejected before the other promises became fulfilled, the returned
  promise will become rejected:

  ```javascript
  var promise1 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 1');
    }, 200);
  });

  var promise2 = new Promise(function(resolve, reject){
    setTimeout(function(){
      reject(new Error('promise 2'));
    }, 100);
  });

  Promise.race([promise1, promise2]).then(function(result){
    // Code here never runs
  }, function(reason){
    // reason.message === 'promise 2' because promise 2 became rejected before
    // promise 1 became fulfilled
  });
  ```

  An example real-world use case is implementing timeouts:

  ```javascript
  Promise.race([ajax('foo.json'), timeout(5000)])
  ```

  @method race
  @static
  @param {Array} promises array of promises to observe
  Useful for tooling.
  @return {Promise} a promise which settles in the same way as the first passed
  promise to settle.
*/
function race(entries) {
  /*jshint validthis:true */
  var Constructor = this;

  if (!isArray$2(entries)) {
    return new Constructor(function(resolve, reject) {
      reject(new TypeError('You must pass an array to race.'));
    });
  } else {
    return new Constructor(function(resolve, reject) {
      var length = entries.length;
      for (var i = 0; i < length; i++) {
        Constructor.resolve(entries[i]).then(resolve, reject);
      }
    });
  }
}

/**
  `Promise.reject` returns a promise rejected with the passed `reason`.
  It is shorthand for the following:

  ```javascript
  var promise = new Promise(function(resolve, reject){
    reject(new Error('WHOOPS'));
  });

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  var promise = Promise.reject(new Error('WHOOPS'));

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  @method reject
  @static
  @param {Any} reason value that the returned promise will be rejected with.
  Useful for tooling.
  @return {Promise} a promise rejected with the given `reason`.
*/
function reject$1(reason) {
  /*jshint validthis:true */
  var Constructor = this;
  var promise = new Constructor(noop);
  reject(promise, reason);
  return promise;
}

function needsResolver() {
  throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
}

function needsNew() {
  throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
}

/**
  Promise objects represent the eventual result of an asynchronous operation. The
  primary way of interacting with a promise is through its `then` method, which
  registers callbacks to receive either a promise's eventual value or the reason
  why the promise cannot be fulfilled.

  Terminology
  -----------

  - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
  - `thenable` is an object or function that defines a `then` method.
  - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
  - `exception` is a value that is thrown using the throw statement.
  - `reason` is a value that indicates why a promise was rejected.
  - `settled` the final resting state of a promise, fulfilled or rejected.

  A promise can be in one of three states: pending, fulfilled, or rejected.

  Promises that are fulfilled have a fulfillment value and are in the fulfilled
  state.  Promises that are rejected have a rejection reason and are in the
  rejected state.  A fulfillment value is never a thenable.

  Promises can also be said to *resolve* a value.  If this value is also a
  promise, then the original promise's settled state will match the value's
  settled state.  So a promise that *resolves* a promise that rejects will
  itself reject, and a promise that *resolves* a promise that fulfills will
  itself fulfill.


  Basic Usage:
  ------------

  ```js
  var promise = new Promise(function(resolve, reject) {
    // on success
    resolve(value);

    // on failure
    reject(reason);
  });

  promise.then(function(value) {
    // on fulfillment
  }, function(reason) {
    // on rejection
  });
  ```

  Advanced Usage:
  ---------------

  Promises shine when abstracting away asynchronous interactions such as
  `XMLHttpRequest`s.

  ```js
  function getJSON(url) {
    return new Promise(function(resolve, reject){
      var xhr = new XMLHttpRequest();

      xhr.open('GET', url);
      xhr.onreadystatechange = handler;
      xhr.responseType = 'json';
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.send();

      function handler() {
        if (this.readyState === this.DONE) {
          if (this.status === 200) {
            resolve(this.response);
          } else {
            reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
          }
        }
      };
    });
  }

  getJSON('/posts.json').then(function(json) {
    // on fulfillment
  }, function(reason) {
    // on rejection
  });
  ```

  Unlike callbacks, promises are great composable primitives.

  ```js
  Promise.all([
    getJSON('/posts'),
    getJSON('/comments')
  ]).then(function(values){
    values[0] // => postsJSON
    values[1] // => commentsJSON

    return values;
  });
  ```

  @class Promise
  @param {function} resolver
  Useful for tooling.
  @constructor
*/
function Promise$4(resolver) {
  this[PROMISE_ID] = nextId();
  this._result = this._state = undefined;
  this._subscribers = [];

  if (noop !== resolver) {
    typeof resolver !== 'function' && needsResolver();
    this instanceof Promise$4 ? initializePromise(this, resolver) : needsNew();
  }
}

Promise$4.all = all;
Promise$4.race = race;
Promise$4.resolve = resolve$1;
Promise$4.reject = reject$1;
Promise$4._setScheduler = setScheduler;
Promise$4._setAsap = setAsap;
Promise$4._asap = asap;

Promise$4.prototype = {
  constructor: Promise$4,

/**
  The primary way of interacting with a promise is through its `then` method,
  which registers callbacks to receive either a promise's eventual value or the
  reason why the promise cannot be fulfilled.

  ```js
  findUser().then(function(user){
    // user is available
  }, function(reason){
    // user is unavailable, and you are given the reason why
  });
  ```

  Chaining
  --------

  The return value of `then` is itself a promise.  This second, 'downstream'
  promise is resolved with the return value of the first promise's fulfillment
  or rejection handler, or rejected if the handler throws an exception.

  ```js
  findUser().then(function (user) {
    return user.name;
  }, function (reason) {
    return 'default name';
  }).then(function (userName) {
    // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
    // will be `'default name'`
  });

  findUser().then(function (user) {
    throw new Error('Found user, but still unhappy');
  }, function (reason) {
    throw new Error('`findUser` rejected and we're unhappy');
  }).then(function (value) {
    // never reached
  }, function (reason) {
    // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
    // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
  });
  ```
  If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.

  ```js
  findUser().then(function (user) {
    throw new PedagogicalException('Upstream error');
  }).then(function (value) {
    // never reached
  }).then(function (value) {
    // never reached
  }, function (reason) {
    // The `PedgagocialException` is propagated all the way down to here
  });
  ```

  Assimilation
  ------------

  Sometimes the value you want to propagate to a downstream promise can only be
  retrieved asynchronously. This can be achieved by returning a promise in the
  fulfillment or rejection handler. The downstream promise will then be pending
  until the returned promise is settled. This is called *assimilation*.

  ```js
  findUser().then(function (user) {
    return findCommentsByAuthor(user);
  }).then(function (comments) {
    // The user's comments are now available
  });
  ```

  If the assimliated promise rejects, then the downstream promise will also reject.

  ```js
  findUser().then(function (user) {
    return findCommentsByAuthor(user);
  }).then(function (comments) {
    // If `findCommentsByAuthor` fulfills, we'll have the value here
  }, function (reason) {
    // If `findCommentsByAuthor` rejects, we'll have the reason here
  });
  ```

  Simple Example
  --------------

  Synchronous Example

  ```javascript
  var result;

  try {
    result = findResult();
    // success
  } catch(reason) {
    // failure
  }
  ```

  Errback Example

  ```js
  findResult(function(result, err){
    if (err) {
      // failure
    } else {
      // success
    }
  });
  ```

  Promise Example;

  ```javascript
  findResult().then(function(result){
    // success
  }, function(reason){
    // failure
  });
  ```

  Advanced Example
  --------------

  Synchronous Example

  ```javascript
  var author, books;

  try {
    author = findAuthor();
    books  = findBooksByAuthor(author);
    // success
  } catch(reason) {
    // failure
  }
  ```

  Errback Example

  ```js

  function foundBooks(books) {

  }

  function failure(reason) {

  }

  findAuthor(function(author, err){
    if (err) {
      failure(err);
      // failure
    } else {
      try {
        findBoooksByAuthor(author, function(books, err) {
          if (err) {
            failure(err);
          } else {
            try {
              foundBooks(books);
            } catch(reason) {
              failure(reason);
            }
          }
        });
      } catch(error) {
        failure(err);
      }
      // success
    }
  });
  ```

  Promise Example;

  ```javascript
  findAuthor().
    then(findBooksByAuthor).
    then(function(books){
      // found books
  }).catch(function(reason){
    // something went wrong
  });
  ```

  @method then
  @param {Function} onFulfilled
  @param {Function} onRejected
  Useful for tooling.
  @return {Promise}
*/
  then: then,

/**
  `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
  as the catch block of a try/catch statement.

  ```js
  function findAuthor(){
    throw new Error('couldn't find that author');
  }

  // synchronous
  try {
    findAuthor();
  } catch(reason) {
    // something went wrong
  }

  // async with promises
  findAuthor().catch(function(reason){
    // something went wrong
  });
  ```

  @method catch
  @param {Function} onRejection
  Useful for tooling.
  @return {Promise}
*/
  'catch': function(onRejection) {
    return this.then(null, onRejection);
  }
};

/**
 * Gets the timestamp of the number of milliseconds that have elapsed since
 * the Unix epoch (1 January 1970 00:00:00 UTC).
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Date
 * @returns {number} Returns the timestamp.
 * @example
 *
 * _.defer(function(stamp) {
 *   console.log(_.now() - stamp);
 * }, _.now());
 * // => Logs the number of milliseconds it took for the deferred invocation.
 */
var now = function() {
  return root.Date.now();
};

/** `Object#toString` result references. */
var symbolTag$2 = '[object Symbol]';

/** Used for built-in method references. */
var objectProto$12 = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString$4 = objectProto$12.toString;

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol(value) {
  return typeof value == 'symbol' ||
    (isObjectLike(value) && objectToString$4.call(value) == symbolTag$2);
}

/** Used as references for various `Number` constants. */
var NAN = 0 / 0;

/** Used to match leading and trailing whitespace. */
var reTrim = /^\s+|\s+$/g;

/** Used to detect bad signed hexadecimal string values. */
var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

/** Used to detect binary string values. */
var reIsBinary = /^0b[01]+$/i;

/** Used to detect octal string values. */
var reIsOctal = /^0o[0-7]+$/i;

/** Built-in method references without a dependency on `root`. */
var freeParseInt = parseInt;

/**
 * Converts `value` to a number.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to process.
 * @returns {number} Returns the number.
 * @example
 *
 * _.toNumber(3.2);
 * // => 3.2
 *
 * _.toNumber(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toNumber(Infinity);
 * // => Infinity
 *
 * _.toNumber('3.2');
 * // => 3.2
 */
function toNumber(value) {
  if (typeof value == 'number') {
    return value;
  }
  if (isSymbol(value)) {
    return NAN;
  }
  if (isObject(value)) {
    var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
    value = isObject(other) ? (other + '') : other;
  }
  if (typeof value != 'string') {
    return value === 0 ? value : +value;
  }
  value = value.replace(reTrim, '');
  var isBinary = reIsBinary.test(value);
  return (isBinary || reIsOctal.test(value))
    ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
    : (reIsBadHex.test(value) ? NAN : +value);
}

/** Error message constants. */
var FUNC_ERROR_TEXT = 'Expected a function';

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;
var nativeMin = Math.min;

/**
 * Creates a debounced function that delays invoking `func` until after `wait`
 * milliseconds have elapsed since the last time the debounced function was
 * invoked. The debounced function comes with a `cancel` method to cancel
 * delayed `func` invocations and a `flush` method to immediately invoke them.
 * Provide `options` to indicate whether `func` should be invoked on the
 * leading and/or trailing edge of the `wait` timeout. The `func` is invoked
 * with the last arguments provided to the debounced function. Subsequent
 * calls to the debounced function return the result of the last `func`
 * invocation.
 *
 * **Note:** If `leading` and `trailing` options are `true`, `func` is
 * invoked on the trailing edge of the timeout only if the debounced function
 * is invoked more than once during the `wait` timeout.
 *
 * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
 * until to the next tick, similar to `setTimeout` with a timeout of `0`.
 *
 * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
 * for details over the differences between `_.debounce` and `_.throttle`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to debounce.
 * @param {number} [wait=0] The number of milliseconds to delay.
 * @param {Object} [options={}] The options object.
 * @param {boolean} [options.leading=false]
 *  Specify invoking on the leading edge of the timeout.
 * @param {number} [options.maxWait]
 *  The maximum time `func` is allowed to be delayed before it's invoked.
 * @param {boolean} [options.trailing=true]
 *  Specify invoking on the trailing edge of the timeout.
 * @returns {Function} Returns the new debounced function.
 * @example
 *
 * // Avoid costly calculations while the window size is in flux.
 * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
 *
 * // Invoke `sendMail` when clicked, debouncing subsequent calls.
 * jQuery(element).on('click', _.debounce(sendMail, 300, {
 *   'leading': true,
 *   'trailing': false
 * }));
 *
 * // Ensure `batchLog` is invoked once after 1 second of debounced calls.
 * var debounced = _.debounce(batchLog, 250, { 'maxWait': 1000 });
 * var source = new EventSource('/stream');
 * jQuery(source).on('message', debounced);
 *
 * // Cancel the trailing debounced invocation.
 * jQuery(window).on('popstate', debounced.cancel);
 */
function debounce(func, wait, options) {
  var lastArgs,
      lastThis,
      maxWait,
      result,
      timerId,
      lastCallTime,
      lastInvokeTime = 0,
      leading = false,
      maxing = false,
      trailing = true;

  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  wait = toNumber(wait) || 0;
  if (isObject(options)) {
    leading = !!options.leading;
    maxing = 'maxWait' in options;
    maxWait = maxing ? nativeMax(toNumber(options.maxWait) || 0, wait) : maxWait;
    trailing = 'trailing' in options ? !!options.trailing : trailing;
  }

  function invokeFunc(time) {
    var args = lastArgs,
        thisArg = lastThis;

    lastArgs = lastThis = undefined;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  }

  function leadingEdge(time) {
    // Reset any `maxWait` timer.
    lastInvokeTime = time;
    // Start the timer for the trailing edge.
    timerId = setTimeout(timerExpired, wait);
    // Invoke the leading edge.
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time) {
    var timeSinceLastCall = time - lastCallTime,
        timeSinceLastInvoke = time - lastInvokeTime,
        result = wait - timeSinceLastCall;

    return maxing ? nativeMin(result, maxWait - timeSinceLastInvoke) : result;
  }

  function shouldInvoke(time) {
    var timeSinceLastCall = time - lastCallTime,
        timeSinceLastInvoke = time - lastInvokeTime;

    // Either this is the first call, activity has stopped and we're at the
    // trailing edge, the system time has gone backwards and we're treating
    // it as the trailing edge, or we've hit the `maxWait` limit.
    return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
      (timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait));
  }

  function timerExpired() {
    var time = now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    // Restart the timer.
    timerId = setTimeout(timerExpired, remainingWait(time));
  }

  function trailingEdge(time) {
    timerId = undefined;

    // Only invoke if we have `lastArgs` which means `func` has been
    // debounced at least once.
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = lastThis = undefined;
    return result;
  }

  function cancel() {
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }
    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timerId = undefined;
  }

  function flush() {
    return timerId === undefined ? result : trailingEdge(now());
  }

  function debounced() {
    var time = now(),
        isInvoking = shouldInvoke(time);

    lastArgs = arguments;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timerId === undefined) {
        return leadingEdge(lastCallTime);
      }
      if (maxing) {
        // Handle invocations in a tight loop.
        timerId = setTimeout(timerExpired, wait);
        return invokeFunc(lastCallTime);
      }
    }
    if (timerId === undefined) {
      timerId = setTimeout(timerExpired, wait);
    }
    return result;
  }
  debounced.cancel = cancel;
  debounced.flush = flush;
  return debounced;
}

/**
 * Polyfill-safe method for requesting an animation frame
 *
 * @method  requestAnimationFrame
 * @author  Fritz Lekschas
 * @date    2016-09-12
 * @param   {Function}  callback  Function to be called after a animation frame
 *   has been delivered.
 * @return  {Integer}             ID of the request.
 */
var requestAnimationFrame = function () {
  var lastTime = 0;

  return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (callback) {
    var currTime = new Date().getTime();
    var timeToCall = Math.max(0, 16 - (currTime - lastTime));
    var id = window.setTimeout(function () {
      callback(currTime + timeToCall);
    }, timeToCall);
    lastTime = currTime + timeToCall;
    return id;
  };
}();

/**
 * Polyfill-safe method for canceling a requested animation frame
 *
 * @method  cancelAnimationFrame
 * @author  Fritz Lekschas
 * @date    2016-09-12
 * @param   {Integer}  id  ID of the animation frame request to be canceled.
 */
var cancelAnimationFrame = function () {
  return window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || window.oCancelAnimationFrame || window.msCancelAnimationFrame || window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || window.oCancelAnimationFrame || window.msCancelAnimationFrame || function (id) {
    window.clearTimeout(id);
  };
}();

/**
 * Requests the next animation frame.
 *
 * @method  nextAnimationFrame
 * @author  Fritz Lekschas
 * @date    2016-09-12
 * @return  {Object}  Object holding the _request_ and _cancel_ method for
 *   requesting the next animation frame.
 */
var nextAnimationFrame = function () {
  var ids = {};

  function requestId() {
    var id = void 0;
    do {
      id = Math.floor(Math.random() * 1E9);
    } while (id in ids);
    return id;
  }

  return {
    request: window.requestNextAnimationFrame || function (callback, element) {
      var id = requestId();

      ids[id] = requestAnimationFrame(function () {
        ids[id] = requestAnimationFrame(function (ts) {
          delete ids[id];
          callback(ts);
        }, element);
      }, element);

      return id;
    },
    cancel: window.cancelNextAnimationFrame || function (id) {
      if (ids[id]) {
        cancelAnimationFrame(ids[id]);
        delete ids[id];
      }
    }
  };
}();

var requestNextAnimationFrame = nextAnimationFrame.request;

// External
// Internal
/**
 * Class name assigned to the context menu's root element
 *
 * @type  {String}
 */
var CLASS_NAME = 'context-menu';

/**
 * Class name assigned to checkboxes.
 *
 * @type  {String}
 */
var CLASS_CHECKBOX = 'checkbox';

/**
 * Size of the dialog arrow in pixel.
 *
 * @type  {Number}
 */
var ARROW_SIZE = 6;

/**
 * General transition speed.
 *
 * @type  {Number}
 */
var TRANSITION_SPEED = 125;

/**
 * Time in milliseconds before the query button click actially triggers its
 * action.
 *
 * The time is resetted every time the user clicks on the button again within
 * the time interval.
 *
 * @type  {Number}
 */
var BUTTON_QUERY_DEBOUNCE = 666;

/**
 * Time in milliseconds before the root button click actially triggers its
 * action.
 *
 * The time is resetted every time the user clicks on the button again within
 * the time interval.
 *
 * @type  {Number}
 */
var BUTTON_ROOT_DEBOUNCE = 500;

/**
 * Default time in milliseconds before a button click actially triggers its
 * action.
 *
 * The time is resetted every time the user clicks on the button again within
 * the time interval.
 *
 * @type  {Number}
 */
var BUTTON_DEFAULT_DEBOUNCE = 150;

/**
 * [BUTTON_BAM_EFFECT_ANIMATION_TIME description]
 *
 * @type  {Number}
 */
var BUTTON_BAM_EFFECT_ANIMATION_TIME = 700;

var NodeContextMenu = function () {
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
  function NodeContextMenu(init) {
    var _this = this;

    classCallCheck(this, NodeContextMenu);

    var self = this;

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
    this.numButtonRows = this.isQueryable ? ++this.numButtonRows : this.numButtonRows;
    this.numButtonRows = this.infoFields && this.infoFields.length ? ++this.numButtonRows : this.numButtonRows;

    this.height = this.visData.global.row.height * this.numButtonRows;
    this.toBottom = false;

    this.nodeInfoId = 0;

    this.wrapper = this.baseEl.append('g').attr('class', CLASS_NAME);

    this.updateAppearance();

    this.bgWrapper = this.wrapper.append('g').classed('bg-outer-wrapper', true).attr('transform', 'translate(' + this.visData.global.column.width / 2 + ' ' + this.height / 2 + ')').append('g').classed('bg-inner-wrapper', true);

    this.bgBorder = this.bgWrapper.append('path').attr('class', 'bgBorder').attr('d', dropMenu({
      x: -1,
      y: -1,
      width: this.visData.global.column.width + 2,
      height: this.height + 2,
      radius: ARROW_SIZE - 2,
      arrowSize: ARROW_SIZE
    })).attr('transform', 'translate(' + -this.visData.global.column.width / 2 + ' ' + -this.height / 2 + ')');

    this.bg = this.bgWrapper.append('path').attr('class', 'bg').attr('d', dropMenu({
      x: 0,
      y: 0,
      width: this.visData.global.column.width,
      height: this.height,
      radius: ARROW_SIZE - 1,
      arrowSize: ARROW_SIZE
    })).style('filter', 'url(#drop-shadow-context-menu)').attr('transform', 'translate(' + -this.visData.global.column.width / 2 + ' ' + -this.height / 2 + ')');

    if (this.infoFields && this.infoFields.length) {
      this.textNodeInfo = this.wrapper.append('g').call(this.createTextField.bind(this), {
        alignRight: false,
        classNames: [],
        distanceFromCenter: this.isQueryable ? 2 : 1,
        fullWidth: true,
        labels: this.infoFields
      }, this.infoFields.length > 1);

      if (this.infoFields.length > 1) {
        var toggler = this.textNodeInfo.append('g').attr('class', 'toggler').on('click', function () {
          self.clickNodeInfo.call(self, this);
        });

        var togglerX = this.visData.global.column.width - this.visData.global.row.contentHeight - this.visData.global.row.padding + this.visData.global.cell.padding;

        var togglerY = this.visData.global.row.padding + this.visData.global.cell.padding;

        toggler.append('rect').attr('class', 'bg').attr('x', togglerX).attr('y', togglerY).attr('width', this.visData.global.row.contentHeight).attr('height', this.visData.global.row.contentHeight);

        toggler.append('use').attr('x', togglerX + (this.visData.global.row.contentHeight - 10) / 2).attr('y', togglerY + (this.visData.global.row.contentHeight - 10) / 2).attr('width', 10).attr('height', 10).attr('xlink:href', this.iconPath + '#arrow-right');
      }
    }

    if (this.isQueryable) {
      this.buttonQuery = this.wrapper.append('g').call(this.createButton.bind(this), {
        alignRight: false,
        classNames: [],
        distanceFromCenter: 1,
        fullWidth: true,
        label: 'Query',
        labelTwo: true,
        bamEffect: true,
        unselectable: true
      }).on('click', function () {
        self.clickQueryHandler.call(self, this);
      });
      this.buttonQueryFill = this.buttonQuery.select('.bg-fill-effect');
      this.buttonQueryBamEffect = this.buttonQuery.select('.bam-effect');
    }

    this.buttonRoot = this.wrapper.append('g').call(this.createButton.bind(this), {
      alignRight: false,
      classNames: [],
      distanceFromCenter: 0,
      fullWidth: false,
      label: 'Root',
      unselectable: true
    }).on('click', function () {
      self.clickRootHandler.call(self, this);
    });
    this.buttonRootFill = this.buttonRoot.select('.bg-fill-effect');
    this.checkboxRoot = this.createCheckbox(this.buttonRoot);

    this.buttonLock = this.wrapper.append('g').call(this.createButton.bind(this), {
      alignRight: true,
      classNames: [],
      distanceFromCenter: 0,
      fullWidth: false,
      label: 'Lock',
      bamEffect: true,
      unselectable: true
    }).on('click', function () {
      self.clickLockHandler.call(self, this);
    });
    this.buttonLockFill = this.buttonLock.select('.bg-fill-effect');
    this.buttonLockBamEffect = this.buttonLock.select('.bam-effect');
    this.checkboxLock = this.createCheckbox(this.buttonLock);

    this.components = this.wrapper.selectAll('.component');

    this.debouncedQueryHandler = debounce(this.queryHandler, BUTTON_QUERY_DEBOUNCE);
    this.debouncedRootHandler = debounce(this.rootHandler, BUTTON_ROOT_DEBOUNCE);

    this.events.on('d3ListGraphNodeLock', function () {
      if (_this.node) {
        _this.clickLockHandler();
      }
    });

    this.events.on('d3ListGraphNodeUnlock', function () {
      return _this.updateStates();
    });

    this.events.on('d3ListGraphNodeRoot', function () {
      return _this.close();
    });

    this.events.on('d3ListGraphNodeUnroot', function () {
      return _this.close();
    });

    this.events.on('d3ListGraphNodeQuery', function () {
      return requestNextAnimationFrame(function () {
        _this.updateStates();
      });
    });

    this.events.on('d3ListGraphNodeUnquery', function () {
      return requestNextAnimationFrame(function () {
        _this.updateStates();
      });
    });
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


  createClass(NodeContextMenu, [{
    key: 'addLabel',


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
    value: function addLabel(selection, fullWidth, label, labelTwo, isToggable, isUnselectable) {
      var width = this.visData.global.column.width * (fullWidth ? 1 : 0.5) - this.visData.global.row.padding * 4 - (isToggable ? this.visData.global.row.contentHeight : 0);

      var height = this.visData.global.row.contentHeight - this.visData.global.cell.padding * 2;

      var div = selection.append('foreignObject').attr('x', this.visData.global.row.padding * 2).attr('y', this.visData.global.row.padding + this.visData.global.cell.padding).attr('width', width).attr('height', height).classed('label-wrapper', true).classed('unselectable', isUnselectable).append('xhtml:div').style('line-height', height - 2 + 'px').style('width', width + 'px');

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

  }, {
    key: 'checkLock',
    value: function checkLock(debounced) {
      var checked = this.node.datum().data.state.lock;

      this.buttonLock.classed('semi-active', checked);
      this.buttonLock.classed('active', !debounced);
      this.checkboxLock.style('transform', 'translateX(' + (checked ? this.checkBoxMovement : 0) + 'px)');

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

  }, {
    key: 'checkOrientation',
    value: function checkOrientation() {
      if (this._y + this._yOffset >= 0) {
        this.toBottom = false;
      } else {
        this.toBottom = true;
      }
      this.components.call(this.positionComponent.bind(this));
      this.bgWrapper.classed('is-mirrored-horizontally', this.toBottom);

      var translate = 'translate(' + -this.visData.global.column.width / 2 + ' ' + -(this.height / 2 + (this.toBottom ? ARROW_SIZE : 0)) + ')';

      this.bg.attr('transform', translate).style('filter', 'url(#drop-shadow-context-menu' + (this.toBottom ? '-inverted' : '') + ')');

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

  }, {
    key: 'checkRoot',
    value: function checkRoot(debounced, time) {
      var state = this.node.datum().data.state.root;
      var checked = state;

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
      this.checkboxRoot.style('transform', 'translateX(' + (checked ? this.checkBoxMovement : 0) + 'px)');
    }

    /**
     * Click handler of the lock button.
     *
     * @method  clickLockHandler
     * @author  Fritz Lekschas
     * @date    2016-09-13
     */

  }, {
    key: 'clickLockHandler',
    value: function clickLockHandler() {
      var _this2 = this;

      this.buttonLock.classed('fill-effect', true);
      this.nodes.lockHandler(this.node);

      var checked = this.checkLock(BUTTON_DEFAULT_DEBOUNCE);

      setTimeout(function () {
        if (checked) {
          NodeContextMenu.triggerButtonBamEffect(_this2.buttonLockBamEffect);
          _this2.buttonLock.classed('active', true);
        }
        _this2.buttonLock.classed('fill-effect', false);
      }, BUTTON_DEFAULT_DEBOUNCE);
    }

    /**
     * Click handler of the info button.
     *
     * @method  clickNodeInfo
     * @author  Fritz Lekschas
     * @date    2016-09-13
     */

  }, {
    key: 'clickNodeInfo',
    value: function clickNodeInfo() {
      var _this3 = this;

      this.nodeInfoId = (this.nodeInfoId + 1) % this.infoFields.length;

      var wrapper = this.textNodeInfo.select('.label-wrapper');

      wrapper.attr('opacity', 1).transition().duration(TRANSITION_LIGHTNING_FAST).attr('opacity', 0).call(allTransitionsEnded, function () {
        _this3.textNodeInfo.select('.label').text(_this3.infoFields[_this3.nodeInfoId].label);

        _this3.textNodeInfo.select('.label-two').text(_this3.getNodeProperty(_this3.infoFields[_this3.nodeInfoId].property));

        wrapper.transition().duration(TRANSITION_LIGHTNING_FAST).attr('opacity', 1);
      });
    }

    /**
     * Click handler of the query button.
     *
     * @method  clickQueryHandler
     * @author  Fritz Lekschas
     * @date    2016-09-13
     */

  }, {
    key: 'clickQueryHandler',
    value: function clickQueryHandler() {
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

  }, {
    key: 'clickRootHandler',
    value: function clickRootHandler() {
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

  }, {
    key: 'close',
    value: function close() {
      var _this4 = this;

      if (this.node && !this.closing) {
        this.closing = new Promise$4(function (resolve) {
          _this4.opened = false;
          _this4.updateAppearance();

          setTimeout(function () {
            _this4.visible = false;
            _this4.updateAppearance();
            resolve(_this4.node.datum().id);
            _this4.node = undefined;
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

  }, {
    key: 'createButton',
    value: function createButton(selection, properties) {
      var classNames = 'component button';
      if (properties.classNames && properties.classNames.length) {
        classNames += ' ' + properties.classNames.join(' ');
      }
      selection.attr('class', classNames);

      selection.datum(properties).call(this.createButtonBg.bind(this), {
        bamEffect: properties.bamEffect,
        fullWidth: properties.fullWidth
      }).call(this.addLabel.bind(this), properties.fullWidth, properties.label, properties.labelTwo, false, properties.unselectable).call(this.positionComponent.bind(this), properties.distanceFromCenter, properties.alignRight);
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

  }, {
    key: 'createButtonBg',
    value: function createButtonBg(selection, properties) {
      var _this5 = this;

      selection.datum(function (data) {
        data.x = _this5.visData.global.row.padding;
        data.y = _this5.visData.global.row.padding;
        data.width = _this5.visData.global.column.width * (properties.fullWidth ? 1 : 0.5) - _this5.visData.global.row.padding * 2;
        data.height = _this5.visData.global.row.contentHeight;
        data.rx = 2;
        data.ry = 2;

        return data;
      }).append('rect').attr('class', 'bg').attr('x', function (data) {
        return data.x;
      }).attr('y', function (data) {
        return data.y;
      }).attr('width', function (data) {
        return data.width;
      }).attr('height', function (data) {
        return data.height;
      }).attr('rx', function (data) {
        return data.rx;
      }).attr('ry', function (data) {
        return data.ry;
      });

      selection.append('rect').attr('class', 'bg-fill-effect').attr('x', function (data) {
        return data.x;
      }).attr('y', function (data) {
        return data.y;
      }).attr('width', function (data) {
        return data.width;
      }).attr('height', 0).attr('rx', function (data) {
        return data.rx;
      }).attr('ry', function (data) {
        return data.ry;
      });

      if (properties.bamEffect) {
        selection.append('g').attr('transform', function (data) {
          return 'translate(' + data.width / 2 + ' ' + data.height / 2 + ')';
        }).append('g').attr('class', 'bam-effect').append('rect').attr('class', 'bam-effect-bg').attr('x', function (data) {
          return data.x;
        }).attr('y', function (data) {
          return data.y;
        }).attr('width', function (data) {
          return data.width;
        }).attr('height', function (data) {
          return data.height;
        }).attr('rx', function (data) {
          return data.rx;
        }).attr('ry', function (data) {
          return data.ry;
        }).attr('transform', function (data) {
          return 'translate(' + -data.width / 2 + ' ' + -data.height / 2 + ')';
        });
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

  }, {
    key: 'createCheckbox',
    value: function createCheckbox(selection) {
      var height = Math.round(selection.datum().height / 2);
      var x = -1.75 * height + this.visData.global.row.padding;

      var container = selection.append('g').attr('class', CLASS_CHECKBOX);

      container.append('rect').attr('class', 'checkbox-bg').attr('x', function (data) {
        return data.width + x;
      }).attr('y', height / 2 + this.visData.global.row.padding).attr('width', height * 1.5).attr('height', height).attr('rx', height / 2).attr('ry', height / 2);

      this.checkBoxMovement = (height - 2) / 2;

      return container.append('rect').attr('class', 'checkbox-knob').attr('x', function (data) {
        return data.width + x + 1;
      }).attr('y', height / 2 + this.visData.global.row.padding + 1).attr('width', height - 2).attr('height', height - 2).attr('rx', height - 2);
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

  }, {
    key: 'createTextField',
    value: function createTextField(selection, properties, isToggable) {
      var classNames = 'component text-field';
      if (properties.classNames && properties.classNames.length) {
        classNames += ' ' + properties.classNames.join(' ');
      }
      selection.attr('class', classNames);

      selection.datum(properties).call(this.addLabel.bind(this), true, properties.labels[this.nodeInfoId].label, true, isToggable).call(this.positionComponent.bind(this), properties.distanceFromCenter, properties.alignRight);
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

  }, {
    key: 'destroy',
    value: function destroy() {
      // Clone the old elements first, which will remove all existing event
      // handlers
      var newEl = this.wrapper.node().cloneNode(true);

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

  }, {
    key: 'getNodeProperty',


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
    value: function getNodeProperty(callback) {
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

  }, {
    key: 'isOpenSameColumn',


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
    value: function isOpenSameColumn(columnNum) {
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

  }, {
    key: 'open',
    value: function open(node) {
      var _this6 = this;

      return new Promise$4(function (resolve) {
        _this6.node = node;
        _this6.closing = undefined;

        _this6.updateStates();

        _this6._yOffset = _this6.visData.nodes[_this6.node.datum().depth].scrollTop;
        _this6.translate = {
          x: _this6.node.datum().x,
          y: _this6.node.datum().y - _this6.height
        };
        _this6.checkOrientation();

        _this6.updateAppearance();
        _this6.opened = true;
        _this6.visible = true;

        requestNextAnimationFrame(function () {
          _this6.updateAppearance();
          setTimeout(function () {
            resolve(true);
          }, TRANSITION_SPEED);
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

  }, {
    key: 'positionComponent',
    value: function positionComponent(selection, distanceFromCenter, alignRight) {
      var _this7 = this;

      selection.datum(function (data) {
        // Lets cache some values to make our lives easier when checking the
        // position again in `checkOrientation`.
        if (distanceFromCenter) {
          data.distanceFromCenter = distanceFromCenter;
        }
        if (alignRight) {
          data.alignRight = alignRight;
        }
        return data;
      }).attr('transform', function (data) {
        var x = data.alignRight ? _this7.visData.global.column.width / 2 : 0;
        // When the buttons are created I assume self the menu is positioned
        // above the node; i.e. `distanceFromCenter` needs to be inverted.
        var y = _this7.visData.global.row.height * (_this7.toBottom ? data.distanceFromCenter : _this7.numButtonRows - data.distanceFromCenter - 1) + (_this7.toBottom ? ARROW_SIZE : 0);

        return 'translate(' + x + ', ' + y + ')';
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

  }, {
    key: 'queryHandler',
    value: function queryHandler(debounced) {
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

  }, {
    key: 'rootHandler',
    value: function rootHandler(debounced) {
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

  }, {
    key: 'scrollY',
    value: function scrollY(offset) {
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

  }, {
    key: 'toggle',


    /* ---------------------------------- T ----------------------------------- */

    /**
     * Toggle menu visibility
     *
     * @method  toggle
     * @author  Fritz Lekschas
     * @date    2016-09-13
     * @param   {Object}  node  D3 selection of the related node.
     */
    value: function toggle(node) {
      var _this8 = this;

      return new Promise$4(function (resolve) {
        var nodeId = node.datum().id;
        var closed = Promise$4.resolve();

        if (_this8.visible) {
          closed = _this8.close();
        }

        closed.then(function (previousNodeId) {
          if (nodeId !== previousNodeId) {
            _this8.open(node).then(function () {
              resolve(nodeId);
            });
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

  }, {
    key: 'updateAppearance',


    /* ---------------------------------- U ----------------------------------- */

    /**
     * Update appearance of the menu.
     *
     * @method  updateAppearance
     * @author  Fritz Lekschas
     * @date    2016-09-13
     */
    value: function updateAppearance() {
      var centerY = this.toBottom ? 0 : this.height + this.visData.global.row.height;

      this.wrapper.classed('transitionable', this.visible).classed('open', this.opened).style('transform', this.translate + ' ' + this.scale).style('transform-origin', this.visData.global.column.width / 2 + 'px ' + centerY + 'px');
    }

    /**
     * Toggle through the info text fields.
     *
     * @method  updateInfoText
     * @author  Fritz Lekschas
     * @date    2016-09-13
     */

  }, {
    key: 'updateInfoText',
    value: function updateInfoText() {
      if (!this.infoFields || !this.infoFields.length) {
        return;
      }

      this.textNodeInfo.select('.label').text(this.infoFields[this.nodeInfoId].label);

      this.textNodeInfo.select('.label-two').text(this.getNodeProperty(this.infoFields[this.nodeInfoId].property));
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

  }, {
    key: 'updatePosition',
    value: function updatePosition() {
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

  }, {
    key: 'updateQuery',
    value: function updateQuery(debounced, time) {
      if (!this.isQueryable) {
        return;
      }

      var state = this.node.datum().data.state.query;
      var queryMode = state;

      function nextQueryMode(mode) {
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

      this.buttonQuery.classed('semi-active', !!queryMode).classed('active', !!state).select('.label-two').text(queryMode || 'not queried').classed('inactive', !queryMode);
    }

    /**
     * Helper method to trigger a check of all buttons and text fields.
     *
     * @method  updateStates
     * @author  Fritz Lekschas
     * @date    2016-09-13
     */

  }, {
    key: 'updateStates',
    value: function updateStates() {
      if (this.node) {
        this.checkLock();
        this.checkRoot();
        this.updateQuery();
        this.updateInfoText();
      }
    }
  }, {
    key: 'scale',
    get: function get() {
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

  }, {
    key: 'translate',
    get: function get() {
      var y = this.toBottom ? this._y + this.height + this.visData.global.row.height - ARROW_SIZE : this._y;

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
    ,
    set: function set(position) {
      this._x = position.x;
      this._y = position.y;
    }
  }], [{
    key: 'emptyButton',
    value: function emptyButton(selection, time) {
      selection.transition().duration(0).attr('y', function (data) {
        return data.y;
      }).attr('height', function (data) {
        return data.height;
      }).call(allTransitionsEnded, function () {
        selection.transition().duration(time || BUTTON_DEFAULT_DEBOUNCE).ease(d3.easeLinear).attr('y', function (data) {
          return data.height;
        }).attr('height', 0);
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

  }, {
    key: 'fillButton',
    value: function fillButton(selection, time) {
      selection.transition().duration(0).attr('y', function (data) {
        return data.y;
      }).attr('height', 0).call(allTransitionsEnded, function () {
        selection.transition().duration(time || BUTTON_DEFAULT_DEBOUNCE).ease(d3.easeLinear).attr('height', function (data) {
          return data.height;
        });
      });
    }
  }, {
    key: 'hideElement',
    value: function hideElement(selection) {
      selection.transition().duration(0).attr('height', 0);
    }
  }, {
    key: 'showElement',
    value: function showElement(selection) {
      selection.transition().duration(0).attr('y', function (data) {
        return data.y;
      }).attr('height', function (data) {
        return data.height;
      });
    }
  }, {
    key: 'triggerButtonBamEffect',
    value: function triggerButtonBamEffect(button) {
      button.classed('trigger', true);
      setTimeout(function () {
        button.classed('trigger', false);
      }, BUTTON_BAM_EFFECT_ANIMATION_TIME);
    }
  }]);
  return NodeContextMenu;
}();

/* eslint no-shadow: 0 */

// External
// Internal
var LimitsUnsupportedFormat = function (_ExtendableError) {
  inherits(LimitsUnsupportedFormat, _ExtendableError);

  function LimitsUnsupportedFormat(message) {
    classCallCheck(this, LimitsUnsupportedFormat);
    return possibleConstructorReturn(this, (LimitsUnsupportedFormat.__proto__ || Object.getPrototypeOf(LimitsUnsupportedFormat)).call(this, message || 'The limits are wrongly formatted. Please provide an ' + 'object of the following format: `{ x: { min: 0, max: 1 }, y: { min: ' + '0, max: 1 } }`'));
  }

  return LimitsUnsupportedFormat;
}(ExtendableError);

/**
 * Drap and drop event handler that works via translation.
 *
 * @method  onDragDrop
 * @author  Fritz Lekschas
 * @date    2016-09-12
 * @param   {Object}  selection        D3 selection to listen for the drag
 *   event.
 * @param   {Object}           dragMoveHandler         Handler for drag-move.
 * @param   {Object}           dropHandler             Handler for drag-end,
 *   i.e. drop.
 * @param   {Array}            elsToBeDragged          Array of D3 selections to
 *   be moved according to the drag event. If empty or undefined `selection`
 *   will be used.
 * @param   {String}           orientation             Can either be
 *   "horizontal", "vertical" or `undefined`, i.e. both directions.
 * @param   {Object|Function}  limits                  X and Y drag limits. E.g.
 *   `{ x: { min: 0, max: 10 } }`.
 * @param   {Array}             noDraggingWhenTrue     List if function
 *   returning a Boolean value which should prevent the dragMoveHandler from
 *   working.
 * @param   {String}           clickTolerance          Specify the number of
 *   pixel that are allowed to move but still trigger a click event. Sometimes
 *   it is useful to allow the user to move 1 or 2 pixel, especially in high
 *   res environments. [Default is 0]
 */
function onDragDrop(selection, dragStartHandler, dragMoveHandler, dropHandler, elsToBeDragged, orientation, limits, noDraggingWhenTrue, dragData, clickTolerance) {
  var drag$$1 = d3.drag();
  var checkWhenDragging = isFunction(noDraggingWhenTrue);

  var appliedLimits = limits || {}; // eslint-disable-line no-param-reassign

  var filter = function filter() {
    return !(checkWhenDragging && noDraggingWhenTrue());
  };

  drag$$1.filter(filter);

  var d2 = void 0;

  drag$$1.on('start', function () {
    d2 = 0;
    if (typeof limits === 'function') {
      appliedLimits = limits();
    }
  });

  if (dragMoveHandler) {
    drag$$1.on('drag', function (data) {
      if (checkWhenDragging && noDraggingWhenTrue()) {
        return;
      }
      d3.event.sourceEvent.preventDefault();
      dragStartHandler();
      dragMoveHandler.call(this, data, elsToBeDragged, orientation, appliedLimits);

      d2 += d3.event.dx * d3.event.dx + d3.event.dy * d3.event.dy;
    });
  }

  if (dropHandler) {
    drag$$1.on('end', function () {
      dropHandler.call(this);

      if (d2 <= (clickTolerance || 0)) {
        // Don't supress the click event for minor mouse movements.
        d3.select(window).on('click.drag', null);
      }
    });
  }

  selection.each(function (data) {
    var el = d3.select(this);

    // Set default data if not available.
    if (!data) {
      data = { drag: dragData }; // eslint-disable-line no-param-reassign
      el.datum(data);
    }

    // Add drag event handler
    el.call(drag$$1);
  });
}

/**
 * Custom drag-move handler used by the custom drag-drop handler.
 *
 * @method  dragMoveHandler
 * @author  Fritz Lekschas
 * @date    2016-09-12
 * @param   {Object}           data            D3's drag event object.
 * @param   {Array}            elsToBeDragged  Array of D3 selections.
 * @param   {String}           orientation     Can either be "horizontal",
 *   "vertical" or `undefined`, i.e. both directions.
 * @param   {Object|Function}  limits          X and Y drag limits. E.g.
 *   `{ x: { min: 0, max: 10 } }`.
 */
function dragMoveHandler$1(data, elsToBeDragged, orientation, limits) {
  var els = d3.select(this);

  if (elsToBeDragged && elsToBeDragged.length) {
    els = mergeSelections(elsToBeDragged);
  }

  function withinLimits(value, applyingLimits) {
    var restrictedValue = void 0;

    if (applyingLimits) {
      try {
        restrictedValue = Math.min(applyingLimits.max, Math.max(applyingLimits.min, value));
      } catch (e) {
        throw new LimitsUnsupportedFormat();
      }
    }
    return restrictedValue;
  }

  if (orientation === 'horizontal' || orientation === 'vertical') {
    if (orientation === 'horizontal') {
      data.drag.x += d3.event.dx;
      data.drag.x = withinLimits(data.drag.x + d3.event.dx, limits.x);
      els.style('transform', 'translateX(' + data.drag.x + 'px)');
    }
    if (orientation === 'vertical') {
      data.drag.y += d3.event.dy;
      data.drag.x = withinLimits(data.drag.y + d3.event.dy, limits.y);
      els.style('transform', 'translateY(' + data.drag.y + 'px)');
    }
  } else {
    data.drag.x += d3.event.dx;
    data.drag.y += d3.event.dy;
    els.style('transform', 'translate(' + data.drag.x + 'px,' + data.drag.y + 'px)');
  }
}

/**
 * Creates SVG filter element for simulating drop shadow.
 *
 * @description
 * Adapted from: http://bl.ocks.org/cpbotha/5200394
 *
 * @method  dropShadow
 * @author  Fritz Lekschas
 * @date    2016-09-12
 * @param   {Object}  el       D3 selection.
 * @param   {String}  name     Filter name.
 * @param   {Number}  dx       Shadow x-distance.
 * @param   {Number}  dy       Shadow y-distance.
 * @param   {Number}  blur     Blurness.
 * @param   {Number}  opacity  Opacity of the shadow with in [0,1].
 */
function dropShadow(el, name, dx, dy, blur, opacity) {
  var defs = el.select('defs');

  if (defs.empty()) {
    defs = el.append('defs');
  }

  // create filter with id #drop-shadow
  // height = 130% so that the shadow is not clipped
  var filter = defs.append('filter').attr('id', 'drop-shadow' + (name ? '-' + name : '')).attr('height', '130%');

  // SourceAlpha refers to opacity of graphic that this filter will be applied to
  // convolve that with a Gaussian with standard deviation 3 and store result
  // in blur
  filter.append('feGaussianBlur').attr('in', 'SourceAlpha').attr('stdDeviation', blur);

  // translate output of Gaussian blur to the right and downwards with 2px
  // store result in offsetBlur
  filter.append('feOffset').attr('dx', dx).attr('dy', dy).attr('result', 'offsetBlur');

  filter.append('feComponentTransfer').append('feFuncA').attr('type', 'linear').attr('slope', opacity || 1);

  // overlay original SourceGraphic over translated blurred opacity by using
  // feMerge filter. Order of specifying inputs is important!
  var feMerge = filter.append('feMerge');

  feMerge.append('feMergeNode');
  feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
}

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
function setOption(value, defaultValue, noFalsyValue) {
  if (noFalsyValue) {
    return value || defaultValue;
  }

  return typeof value !== 'undefined' ? value : defaultValue;
}

var ARROW_DOWN = {
  id: 'arrow-down',
  paths: ['M2.539,2.667L0,5.236l8,8.097l8-8.097l-2.538-2.569L8,8.196L2.539,2.667z'],
  viewBox: '0 0 16 16'
};

var ARROW_RIGHT = {
  id: 'arrow-right',
  paths: ['M8.196,8l-5.529,5.462L5.236,16l8.097-8L5.236,0L2.667,2.539L8.196,8z'],
  viewBox: '0 0 16 16'
};

var SORT_ASC = {
  id: 'sort-asc',
  paths: ['M10.718,2V0.286c0-0.083-0.026-0.152-0.079-0.206C10.584,0.026,10.516,0,10.434,0H8.146C8.063,0,7.995,0.027,7.941,0.081C7.887,0.135,7.86,0.203,7.86,0.286V2c0,0.083,0.027,0.151,0.081,0.205c0.054,0.054,0.122,0.081,0.205,0.081h2.286c0.084,0,0.151-0.027,0.205-0.081C10.691,2.151,10.718,2.083,10.718,2z M6.432,12.857c0-0.084-0.027-0.152-0.08-0.207c-0.054-0.053-0.123-0.08-0.206-0.08H4.432V0.285c0-0.083-0.027-0.151-0.08-0.205C4.298,0.025,4.229,0,4.146,0H2.432C2.349,0,2.28,0.025,2.228,0.081C2.174,0.135,2.147,0.203,2.147,0.286v12.286H0.433c-0.131,0-0.221,0.059-0.268,0.178c-0.048,0.113-0.027,0.217,0.062,0.312l2.857,2.856C3.15,15.973,3.218,16,3.29,16c0.077,0,0.145-0.027,0.205-0.081l2.848-2.849C6.402,13,6.432,12.928,6.432,12.857L6.432,12.857z M12.434,6.572V4.857c0-0.083-0.027-0.152-0.082-0.206c-0.054-0.053-0.121-0.08-0.205-0.08h-4c-0.083,0-0.151,0.027-0.205,0.08C7.888,4.706,7.86,4.774,7.86,4.857v1.714c0,0.083,0.027,0.152,0.081,0.205C7.995,6.83,8.063,6.857,8.146,6.857h4c0.082,0,0.15-0.027,0.205-0.081C12.404,6.724,12.434,6.655,12.434,6.572z M14.146,11.145V9.43c0-0.084-0.026-0.152-0.08-0.205c-0.055-0.055-0.123-0.08-0.207-0.08H8.146c-0.083,0-0.151,0.025-0.205,0.08C7.887,9.277,7.86,9.346,7.86,9.43v1.715c0,0.082,0.027,0.15,0.081,0.205c0.054,0.053,0.122,0.08,0.205,0.08h5.713c0.084,0,0.152-0.027,0.207-0.08C14.12,11.295,14.146,11.227,14.146,11.145z M15.859,15.715V14c0-0.083-0.025-0.15-0.08-0.205c-0.053-0.054-0.121-0.08-0.204-0.08H8.146c-0.083,0-0.151,0.026-0.205,0.08C7.887,13.85,7.86,13.917,7.86,14v1.715c0,0.083,0.027,0.151,0.081,0.205C7.995,15.975,8.063,16,8.146,16h7.429c0.083,0,0.151-0.025,0.204-0.08C15.834,15.866,15.859,15.798,15.859,15.715z'],
  viewBox: '0 0 16 16'
};

var SORT_DESC = {
  id: 'sort-desc',
  paths: ['M6.432,12.857c0-0.084-0.027-0.152-0.08-0.206c-0.054-0.054-0.123-0.08-0.206-0.08H4.432V0.285c0-0.084-0.027-0.151-0.081-0.205S4.229,0,4.146,0H2.432C2.348,0,2.28,0.026,2.226,0.08S2.146,0.201,2.146,0.285v12.286H0.431c-0.131,0-0.22,0.06-0.268,0.179c-0.047,0.113-0.027,0.217,0.062,0.312l2.857,2.857C3.149,15.973,3.217,16,3.289,16c0.077,0,0.145-0.027,0.205-0.08l2.848-2.849C6.402,13,6.432,12.928,6.432,12.857L6.432,12.857z M15.861,2V0.286c0-0.083-0.027-0.152-0.081-0.206C15.728,0.027,15.658,0,15.575,0H8.146C8.063,0,7.994,0.027,7.941,0.081c-0.054,0.053-0.08,0.122-0.08,0.206V2c0,0.083,0.026,0.152,0.08,0.206c0.053,0.053,0.122,0.08,0.205,0.08h7.429c0.083,0,0.152-0.027,0.205-0.08C15.834,2.152,15.861,2.083,15.861,2z M14.147,6.572V4.857c0-0.083-0.027-0.152-0.081-0.206c-0.054-0.054-0.122-0.081-0.205-0.081H8.146c-0.083,0-0.152,0.027-0.205,0.081c-0.054,0.053-0.08,0.122-0.08,0.206v1.714c0,0.083,0.026,0.151,0.08,0.205c0.053,0.054,0.122,0.08,0.205,0.08h5.715c0.083,0,0.151-0.026,0.205-0.08S14.147,6.655,14.147,6.572z M12.433,11.144V9.429c0-0.083-0.027-0.151-0.081-0.205s-0.122-0.081-0.205-0.081h-4c-0.083,0-0.152,0.027-0.205,0.081c-0.054,0.054-0.08,0.122-0.08,0.205v1.715c0,0.083,0.026,0.151,0.08,0.205c0.053,0.053,0.122,0.08,0.205,0.08h4c0.083,0,0.151-0.027,0.205-0.08C12.405,11.295,12.433,11.227,12.433,11.144z M10.718,15.715V14c0-0.083-0.026-0.151-0.08-0.205s-0.122-0.081-0.205-0.081H8.146c-0.083,0-0.152,0.027-0.205,0.081c-0.054,0.054-0.08,0.122-0.08,0.205v1.715c0,0.084,0.026,0.151,0.08,0.205C7.994,15.974,8.063,16,8.146,16h2.287c0.083,0,0.151-0.026,0.205-0.08S10.718,15.799,10.718,15.715z'],
  viewBox: '0 0 16 16'
};

var UNSORT = {
  id: 'unsort',
  paths: ['M12.433,2V0.286c0-0.083-0.027-0.152-0.081-0.206C12.298,0.027,12.229,0,12.146,0h-4C8.063,0,7.995,0.027,7.941,0.08C7.887,0.134,7.86,0.202,7.86,0.286V2c0,0.083,0.027,0.152,0.081,0.205c0.054,0.054,0.122,0.081,0.205,0.081h4c0.083,0,0.151-0.027,0.205-0.081C12.405,2.152,12.433,2.083,12.433,2z M14.146,15.715V14c0-0.083-0.026-0.151-0.08-0.205s-0.122-0.08-0.206-0.08H8.146c-0.083,0-0.151,0.026-0.205,0.08S7.86,13.917,7.86,14v1.715c0,0.083,0.027,0.151,0.081,0.205S8.063,16,8.146,16h5.714c0.084,0,0.152-0.026,0.206-0.08S14.146,15.798,14.146,15.715zM15.861,6.572V4.857c0-0.083-0.027-0.151-0.08-0.205c-0.055-0.054-0.123-0.08-0.205-0.08h-7.43c-0.082,0-0.15,0.026-0.205,0.08c-0.053,0.054-0.08,0.122-0.08,0.205v1.715c0,0.083,0.027,0.151,0.08,0.205c0.055,0.054,0.123,0.08,0.205,0.08h7.43c0.082,0,0.15-0.026,0.205-0.08C15.834,6.724,15.861,6.655,15.861,6.572z M10.718,11.144V9.429c0-0.083-0.026-0.151-0.08-0.205s-0.122-0.08-0.205-0.08H8.146c-0.083,0-0.151,0.026-0.205,0.08S7.86,9.346,7.86,9.429v1.715c0,0.084,0.027,0.152,0.081,0.205c0.054,0.055,0.122,0.08,0.205,0.08h2.286c0.083,0,0.151-0.025,0.205-0.08C10.691,11.296,10.718,11.228,10.718,11.144z'],
  viewBox: '0 0 16 16'
};

var SORT_ALPHA_DESC = {
  id: 'sort-alpha-desc',
  paths: ['M11.731,10.84c0.023-0.072,0.046-0.158,0.066-0.26c0.021-0.102,0.031-0.154,0.031-0.16l0.027-0.179h0.035c0,0.023,0.006,0.083,0.019,0.179l0.106,0.42l0.644,1.945h-1.581L11.731,10.84z M7.017,12.857c0-0.084-0.027-0.152-0.081-0.205c-0.054-0.055-0.122-0.081-0.206-0.081H5.017V0.286c0-0.084-0.027-0.152-0.081-0.206S4.814,0,4.731,0H3.017C2.934,0,2.865,0.026,2.812,0.08S2.731,0.202,2.731,0.286v12.285H1.017c-0.131,0-0.22,0.06-0.268,0.179c-0.047,0.113-0.027,0.217,0.062,0.312l2.857,2.857C3.734,15.973,3.803,16,3.874,16c0.078,0,0.146-0.027,0.206-0.08l2.848-2.849C6.987,13,7.017,12.929,7.017,12.857L7.017,12.857z M15.275,15.054H14.65l-2.053-5.911H11.15l-2.053,5.911H8.472V16h2.563v-0.946h-0.67l0.42-1.286h2.169l0.42,1.286h-0.67V16h2.571V15.054L15.275,15.054z M14.481,4.776H13.4v1.062h-2.214c-0.125,0-0.214,0.003-0.268,0.01l-0.125,0.026V5.849l0.098-0.09c0.09-0.107,0.152-0.185,0.188-0.232l3.295-4.731V0H9.312v2.045h1.071V1.018h2.071c0.107,0,0.196-0.009,0.269-0.026c0.018,0,0.04-0.002,0.066-0.005c0.027-0.003,0.046-0.004,0.059-0.004v0.026l-0.099,0.08c-0.054,0.054-0.116,0.135-0.188,0.241L9.267,6.054v0.804h5.215V4.776L14.481,4.776z'],
  viewBox: '0 0 16 16'
};

var SORT_ALPHA_ASC = {
  id: 'sort-alpha-asc',
  paths: ['M11.731,1.696c0.023-0.071,0.046-0.158,0.066-0.259c0.021-0.102,0.031-0.155,0.031-0.161l0.027-0.179h0.035c0,0.024,0.006,0.084,0.019,0.179l0.106,0.42l0.644,1.946h-1.581L11.731,1.696z M7.016,12.856c0-0.083-0.026-0.151-0.08-0.205s-0.122-0.08-0.205-0.08H5.016V0.285c0-0.083-0.026-0.151-0.08-0.205S4.814,0,4.731,0H3.016C2.933,0,2.865,0.026,2.811,0.08s-0.08,0.122-0.08,0.205v12.286H1.016c-0.131,0-0.22,0.06-0.268,0.179c-0.048,0.113-0.026,0.217,0.062,0.312l2.857,2.856C3.734,15.973,3.802,16,3.874,16c0.077,0,0.146-0.027,0.205-0.081l2.849-2.848C6.987,13,7.016,12.929,7.016,12.856L7.016,12.856zM14.481,13.919h-1.08v1.062h-2.215c-0.125,0-0.214,0.007-0.268,0.019l-0.125,0.018V15l0.098-0.099c0.09-0.107,0.152-0.185,0.188-0.232l3.295-4.731V9.143H9.312v2.045h1.071V10.16h2.071c0.107,0,0.197-0.009,0.269-0.026c0.018,0,0.04-0.002,0.066-0.005c0.027-0.003,0.046-0.004,0.059-0.004v0.026l-0.099,0.08c-0.054,0.054-0.116,0.135-0.188,0.241l-3.295,4.724V16h5.215V13.919L14.481,13.919z M15.276,5.91h-0.625L12.598,0h-1.446L9.098,5.91H8.472v0.946h2.563V5.91h-0.67l0.42-1.285h2.169l0.42,1.285h-0.67v0.946h2.571L15.276,5.91L15.276,5.91z'],
  viewBox: '0 0 16 16'
};

var ONE_BAR = {
  id: 'one-bar',
  paths: ['M14,3H2C0.896,3,0,3.896,0,5v6c0,1.104,0.896,2,2,2h12c1.104,0,2-0.896,2-2V5C16,3.896,15.104,3,14,3zM15,11c0,0.553-0.448,1-1,1H8V4h6c0.552,0,1,0.448,1,1V11z'],
  viewBox: '0 0 16 16'
};

var TWO_BARS = {
  id: 'two-bars',
  paths: ['M14,3H2C0.896,3,0,3.896,0,5v6c0,1.104,0.896,2,2,2h12c1.104,0,2-0.896,2-2V5C16,3.896,15.104,3,14,3z M15,11c0,0.553-0.448,1-1,1H6V8h5V4h3c0.552,0,1,0.448,1,1V11z'],
  viewBox: '0 0 16 16'
};

var LOCKED = {
  id: 'locked',
  paths: ['M5.333,7.333v-2c0-0.736,0.26-1.364,0.781-1.886c0.521-0.521,1.149-0.781,1.885-0.781c0.736,0,1.365,0.261,1.886,0.781c0.521,0.521,0.781,1.149,0.781,1.886v2H5.333L5.333,7.333z M14,8.333c0-0.278-0.098-0.514-0.292-0.708c-0.194-0.195-0.431-0.292-0.709-0.292h-0.333v-2c0-1.278-0.458-2.375-1.375-3.292C10.374,1.125,9.277,0.667,8,0.667c-1.278,0-2.375,0.459-3.292,1.375C3.791,2.958,3.333,4.055,3.333,5.333v2H2.999c-0.277,0-0.514,0.097-0.708,0.292C2.097,7.82,2,8.055,2,8.333v6c0,0.277,0.097,0.514,0.291,0.707c0.194,0.195,0.431,0.293,0.708,0.293h10c0.278,0,0.515-0.098,0.709-0.293c0.194-0.193,0.291-0.43,0.291-0.707L14,8.333L14,8.333z'],
  viewBox: '0 0 16 16'
};

var UNION = {
  id: 'union',
  paths: ['M12,1v7C11.999,10.21,10.209,12,8,12c-2.209,0-4-1.79-4-3.999h0l0-7H1v7C1,11.867,4.134,15,8,15c3.865,0,6.999-3.133,7-6.999V1H12z'],
  viewBox: '0 0 16 16'
};

var INTERSECTION = {
  id: 'intersection',
  paths: ['M15,15V7.999C14.999,4.133,11.865,1,8,1C4.134,1,1,4.133,1,7.999V15h3l0-7.001h0C4.001,5.79,5.792,4,8,4c2.208,0,3.999,1.79,4,3.999V15H15z'],
  viewBox: '0 0 16 16'
};

var NOT = {
  id: 'not',
  paths: ['M8,1C4.134,1,1,4.134,1,8c0,3.865,3.134,7,7,7c3.865,0,7-3.135,7-7C15,4.134,11.865,1,8,1z M3,8c0-2.761,2.239-5,5-5c1.019,0,1.964,0.308,2.754,0.832l-6.922,6.923C3.309,9.965,3,9.019,3,8z M8,13c-1.019,0-1.964-0.309-2.754-0.831l6.922-6.923C12.691,6.036,13,6.981,13,8C13,10.762,10.762,13,8,13z'],
  viewBox: '0 0 16 16'
};

var ZOOM_OUT = {
  id: 'zoom-out',
  paths: ['M3.5,5.5H9.5V7.5H3.5V5.5z', 'M15.682,14.268l-3.938-3.938C12.53,9.254,13,7.934,13,6.5C13,2.91,10.09,0,6.5,0S0,2.91,0,6.5S2.91,13,6.5,13c1.434,0,2.756-0.47,3.83-1.257l3.938,3.94L15.682,14.268z M2,6.5C2,4.015,4.015,2,6.5,2S11,4.015,11,6.5C11,8.985,8.985,11,6.5,11S2,8.985,2,6.5z'],
  viewBox: '0 0 16 16'
};

var all$1 = [ARROW_DOWN, ARROW_RIGHT, SORT_ASC, SORT_DESC, UNSORT, SORT_ALPHA_DESC, SORT_ALPHA_ASC, ONE_BAR, TWO_BARS, LOCKED, UNION, INTERSECTION, NOT, ZOOM_OUT];

/**
 * Create a path-based symbol icon
 *
 * @method  createSymbol
 * @author  Fritz Lekschas
 * @date    2016-10-09
 * @param   {Object}  el       Base element to where the symbols should be
 *   appended to.
 * @param   {String}  id       ID of the icon to be created.
 * @param   {Array}   paths    Array of path strings.
 * @param   {String}  viewBox  View box string.
 */
function createSymbolIcon(el, id, paths, viewBox) {
  var symbol = el.append('symbol').attr('id', id).attr('viewBox', viewBox);

  paths.forEach(function (d) {
    return symbol.append('path').attr('d', d).attr('fill', 'currentColor');
  });
}

// External
// Internal
/**
 * Private d3 object. Needed to handle cases where D3.js v3 and v4 are used.
 *
 * @type  {Object}
 */
var _d3 = d3;

var ListGraph = function () {
  /**
   * ListGraph App constructor.
   *
   * @method  constructor
   * @author  Fritz Lekschas
   * @date    2016-10-02
   * @param   {Object}  init  Config object.
   */
  function ListGraph(init) {
    var _this = this;

    classCallCheck(this, ListGraph);

    if (init.d3) {
      _d3 = init.d3;
    }

    if (_d3.version[0] !== '4') {
      throw new D3VersionFourRequired(_d3.version);
    }

    if (!_d3.listGraph) {
      throw new LayoutNotAvailable();
    }

    var self = this;

    this.init = init;
    this.baseEl = init.element;
    this.baseEl.__d3ListGraphBase__ = true;

    this.baseElD3 = _d3.select(this.baseEl);
    this.baseElJq = $(this.baseEl);
    this.svgD3 = this.baseElD3.select('svg.base');
    this.svgEl = this.svgD3.node();
    this.outsideClickHandler = {};
    this.outsideClickClassHandler = {};

    if (this.svgD3.empty()) {
      this.svgD3 = this.baseElD3.append('svg').attr('class', 'base');
      this.svgJq = $(this.svgD3.node());
    } else {
      this.svgJq = $(this.svgD3.node());
    }

    // Array of root node IDs.
    this.rootNodes = init.rootNodes;

    // Width of the vis. If `undefined` the SVG's width will be used.
    this.width = setOption(init.width, this.svgJq.width(), true);

    // Height of the vis. If `undefined` the SVG's height will be used.
    this.height = setOption(init.height, this.svgJq.height(), true);

    // Refresh top and left position of the base `svg` everytime the user enters
    // the element with his/her mouse cursor. This will avoid relying on complex
    // browser resize events and other layout manipulations as they most likely
    // won't happen when the user tries to interact with the visualization.
    this.svgD3.on('mouseenter', this.getBoundingRect.bind(this));

    // With of the column's scrollbars
    this.scrollbarWidth = setOption(init.scrollbarWidth, SCROLLBAR_WIDTH, true);

    // Number of visible columns
    this.columns = setOption(init.columns, COLUMNS, true);

    // Number of visible rows.
    this.rows = setOption(init.rows, ROWS, true);

    // Path to SVG icon file.
    this.iconPath = setOption(init.iconPath, ICON_PATH, true);

    // If `true` query icons and controls are enabled.
    this.querying = setOption(init.querying, QUERYING);

    // If `true` hide links that point to invisible nodes.
    this.hideOutwardsLinks = setOption(init.hideOutwardsLinks, HIDE_OUTWARDS_LINKS);

    // If `true` and `this.hideOutwardsLinks === true` indicates the location of
    // target nodes of invisible nodes connected via links.
    this.showLinkLocation = setOption(init.showLinkLocation, SHOW_LINK_LOCATION);

    // The visual size of a location bucket. E.g. `3` pixel.
    this.linkLocationBucketSize = init.linkLocationBucketSize;

    // If `true` the currently rooted level will softly be highlighted.
    this.highlightActiveLevel = setOption(init.highlightActiveLevel, HIGHLIGHT_ACTIVE_LEVEL);

    // Determines which level from the rooted node will be regarded as active.
    // Zero means that the level of the rooted node is regarded.
    this.activeLevel = setOption(init.activeLevel, ACTIVE_LEVEL);

    // When no manually rooted node is available the active level will be
    // `this.activeLevel` minus `this.noRootActiveLevelDiff`.
    // WAT?
    // In some cases it makes sense to hide the original root node just to save
    // a column, so having no manually set root node means that the invisible
    // root node is active. Using this option it can be assured that the
    // approriate column is being highlighted.
    this.noRootActiveLevelDiff = setOption(init.noRootActiveLevelDiff, NO_ROOT_ACTIVE_LEVEL_DIFF);

    // Determine the level of transitions
    // - 0 [Default]: Show all transitions
    // - 1: Show only CSS transitions
    // - 2: Show no transitions
    this.lessTransitionsJs = init.lessTransitions > 0;
    this.lessTransitionsCss = init.lessTransitions > 1;

    // Enable or disable
    this.disableDebouncedContextMenu = setOption(init.disableDebouncedContextMenu, DISABLE_DEBOUNCED_CONTEXT_MENU);

    // Create custom topbar buttons
    this.customTopbarButtons = setOption(init.customTopbarButtons, []);

    // Height of the vis. If `undefined` the SVG's height will be used.
    this.showTitle = setOption(init.showTitle, SHOW_TITLE);

    this.baseElD3.classed('less-animations', this.lessTransitionsCss);

    // Add SVG Icons
    all$1.forEach(function (icon) {
      return createSymbolIcon(_this.svgD3, icon.id, icon.paths, icon.viewBox);
    });

    // Holds the key of the property to be sorted initially. E.g. `precision`.
    this.sortBy = init.sortBy;

    // Initial sort order. Anything other than `asc` will fall back to `desc`.
    this.sortOrder = init.sortOrder === 'asc' ? 1 : DEFAULT_SORT_ORDER;

    this.nodeInfoContextMenu = isArray(init.nodeInfoContextMenu) ? init.nodeInfoContextMenu : [];

    this.events = new Events(this.baseEl, init.dispatcher);

    this.baseElJq.addClass(CLASSNAME);

    this.dragged = { x: 0, y: 0 };

    if (init.forceWidth) {
      this.baseElJq.width(this.width);
    }

    this.layout = new _d3.listGraph({ // eslint-disable-line new-cap
      size: [this.width, this.height],
      grid: [this.columns, this.rows],
      d3: _d3
    });

    this.data = cloneDeep(init.data);
    this.visData = this.layout.process(this.data, this.rootNodes, {
      showLinkLocation: this.showLinkLocation,
      linkLocationBucketSize: this.linkLocationBucketSize,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder
    });

    /**
     * Stores current sorting, e.g. type, order and a reference to the element.
     *
     * @type  {Object}
     */
    this.currentSorting = {
      global: {
        type: this.sortBy,
        order: this.sortOrder
      },
      local: {}
    };

    this.barMode = init.barMode || DEFAULT_BAR_MODE;
    this.svgD3.classed(this.barMode + '-bar', true);

    this.topbar = new Topbar(this, this.baseElD3, this.visData, this.customTopbarButtons, this.showTitle);

    this.svgD3.attr('viewBox', '0 0 ' + this.width + ' ' + this.height);

    this.container = this.svgD3.append('g').attr('class', 'main-container');

    this.levels = new Levels(this.container, this, this.visData);

    this.links = new Links(this, this.levels.groups, this.visData, this.layout);

    this.nodes = new Nodes(this, this.levels.groups, this.visData, this.links, this.events);

    this.levels.scrollPreparation(this.scrollbarWidth);

    this.scrollbars = new Scrollbars(this.levels.groups, this.visData, this.scrollbarWidth);

    this.nodeContextMenu = new NodeContextMenu({
      visData: this.visData,
      baseEl: this.container,
      events: this.events,
      nodes: this.nodes,
      iconPath: this.iconPath,
      infoFields: this.nodeInfoContextMenu,
      isQueryable: this.querying,
      isDebounced: !this.disableDebouncedContextMenu
    });

    this.nodeContextMenu.wrapper.on('mousedown', function () {
      _this.mouseDownOnContextMenu = true;
    });

    dropShadow(this.svgD3, 'context-menu', 0, 1, 2, 0.2);
    dropShadow(this.svgD3, 'context-menu-inverted', 0, -1, 2, 0.2);

    // jQuery's mousewheel plugin is much nicer than D3's half-baked zoom event.
    // We are using delegated event listeners to provide better scaling
    this.svgJq.on('mousewheel', '.' + Levels.className, function (event$$1) {
      if (!self.zoomedOut) {
        self.mousewheelColumn(this, event$$1);
      }
    });

    this.svgJq.on('click', function (event$$1) {
      self.checkGlobalClick.call(self, event$$1.target);
    });

    // Add jQuery delegated event listeners instead of direct listeners of D3.
    this.svgJq.on('click', '.' + Nodes.classNodeVisible, function () {
      // Add a new global outside click listener using this node and the
      // node context menu as the related elements.
      requestNextAnimationFrame(function () {
        self.registerOutSideClickHandler('nodeContextMenu', [self.nodeContextMenu.wrapper.node()], ['visible-node'], function () {
          // The context of this method is the context of the outer click
          // handler.
          self.nodeContextMenu.close();
          self.unregisterOutSideClickHandler.call(self, 'nodeContextMenu');
        });
      });

      self.nodeContextMenu.toggle.call(self.nodeContextMenu, _d3.select(this.parentNode));
    });

    this.svgJq.on('click', '.' + Nodes.classFocusControls + '.' + Nodes.classRoot, function () {
      self.nodes.rootHandler.call(self.nodes, _d3.select(this), true);
    });

    if (this.querying) {
      this.svgJq.on('click', '.' + Nodes.classFocusControls + '.' + Nodes.classQuery, function () {
        self.nodes.queryHandler.call(self.nodes, _d3.select(this.parentNode), 'unquery');
        self.nodeContextMenu.updateStates();
      });
    }

    this.svgJq.on('mouseenter', '.' + Nodes.classNodeVisible, function () {
      self.interactionWrapper.call(self, function (domEl, data) {
        if (!this.vis.activeScrollbar) {
          this.enterHandler.call(this, domEl, data);
        }
      }.bind(self.nodes), [this, _d3.select(this).datum()]);
    });

    this.svgJq.on('mouseleave', '.' + Nodes.classNodeVisible, function () {
      self.interactionWrapper.call(self, function (domEl, data) {
        if (!this.vis.activeScrollbar) {
          this.leaveHandler.call(this, domEl, data);
        }
      }.bind(self.nodes), [this, _d3.select(this).datum()]);
    });

    // Normally we would reference a named methods but since we need to access
    // the class' `this` property instead of the DOM element we need to use an
    // arrow function.
    this.scrollbars.all.on('mousedown', function () {
      self.scrollbarMouseDown(this, _d3.event);
    });

    // We need to listen to `mouseup` and `mousemove` globally otherwise
    // scrolling will only work as long as the cursor hovers the actual
    // scrollbar, which is super annoying.
    _d3.select(document).on('mouseup', function () {
      _this.globalMouseUp(_d3.event);
    });

    // Enable dragging of the whole graph.
    this.svgD3.call(onDragDrop, this.dragStartHandler.bind(this), this.dragMoveHandler.bind(this), this.dragEndHandler.bind(this), [this.container, this.topbar.localControlWrapper], 'horizontal', this.getDragLimits.bind(this), this.noDragging.bind(this), this.dragged, 2);

    this.events.on('d3ListGraphLevelFocus', function (levelId) {
      return _this.levels.focus(levelId);
    });

    this.events.on('d3ListGraphNodeRoot', function () {
      _this.nodes.bars.updateAll(_d3.listGraph.updateBars(_this.data), _this.currentSorting.global.type);
      _this.updateSorting();
    });

    this.events.on('d3ListGraphNodeUnroot', function () {
      _this.nodes.bars.updateAll(_d3.listGraph.updateBars(_this.data), _this.currentSorting.global.type);
      _this.updateSorting();
    });

    this.events.on('d3ListGraphUpdateBars', function () {
      _this.nodes.bars.updateAll(_d3.listGraph.updateBars(_this.data), _this.currentSorting.global.type);
      _this.updateSorting();
    });

    this.events.on('d3ListGraphActiveLevel', function (nextLevel) {
      var oldLevel = _this.activeLevel;
      _this.activeLevel = Math.max(nextLevel, 0);
      if (_this.nodes.rootedNode) {
        var rootNodeDepth = _this.nodes.rootedNode.datum().depth;
        _this.levels.blur(rootNodeDepth + oldLevel);
        _this.levels.focus(rootNodeDepth + _this.activeLevel);
      } else {
        _this.levels.blur(oldLevel - _this.noRootActiveLevelDiff);
        _this.levels.focus(_this.activeLevel - _this.noRootActiveLevelDiff);
      }
    });

    // Initialize `this.left` and `this.top`
    this.getBoundingRect();
  }

  /**
   * Get visually used area of the container
   *
   * @method  area
   * @author  Fritz Lekschas
   * @date    2016-10-02
   * @return  {Object}  Bounding client rectangle.
   */


  createClass(ListGraph, [{
    key: 'checkGlobalClick',


    /**
     * Check global mouse click
     *
     * @method  checkGlobalClick
     * @author  Fritz Lekschas
     * @date    2016-10-02
     * @param   {Object}  target  DOM element
     */
    value: function checkGlobalClick(target) {
      var found = {};
      var checkClass = Object.keys(this.outsideClickClassHandler).length;

      var el = target;
      try {
        while (!el.__d3ListGraphBase__) {
          if (el.__id__) {
            for (var i = el.__id__.length; i--;) {
              found[el.__id__[i]] = true;
            }
          }
          if (checkClass) {
            var classNames = Object.keys(this.outsideClickClassHandler);
            for (var _i = classNames.length; _i--;) {
              var className = el.getAttribute('class');
              if (className && className.indexOf(classNames[_i]) >= 0) {
                found[this.outsideClickClassHandler[classNames[_i]].id] = true;
              }
            }
          }
          el = el.parentNode;
        }
      } catch (e) {
        return;
      }

      var handlerIds = Object.keys(this.outsideClickHandler);
      for (var _i2 = handlerIds.length; _i2--;) {
        if (!found[handlerIds[_i2]]) {
          this.outsideClickHandler[handlerIds[_i2]].callback.call(this);
        }
      }
    }

    /**
     * Check which nodes of a level are visible.
     *
     * @method  checkNodeVisibility
     * @author  Fritz Lekschas
     * @date    2016-10-02
     * @param   {Number}  level            Index of the level or column.
     * @param   {[type]}             customScrollTop  [description]
     */

  }, {
    key: 'checkNodeVisibility',
    value: function checkNodeVisibility(level, customScrollTop) {
      var nodes = level ? this.nodes.nodes.filter(function (data) {
        return data.depth === level;
      }) : this.nodes.nodes;

      nodes.call(this.nodes.isInvisible.bind(this.nodes), customScrollTop);
    }

    /**
     * Drag end handler
     *
     * @method  dragEndHandler
     * @author  Fritz Lekschas
     * @date    2016-10-02
     */

  }, {
    key: 'dragEndHandler',
    value: function dragEndHandler() {
      if (this.dragging) {
        this.noInteractions = this.dragging = false;
      }
    }

    /**
     * Get the minimal drag X value
     *
     * @method  dragMinX
     * @author  Fritz Lekschas
     * @date    2016-10-02
     * @return  {Number}  Minimal drag x value.
     */

  }, {
    key: 'dragMoveHandler',


    /**
     * Drag-move handler instance.
     *
     * @method  dragMoveHandler
     * @author  Fritz Lekschas
     * @date    2016-10-02
     * @param   {Object}           data            D3's drag event object.
     * @param   {Array}            elsToBeDragged  Array of D3 selections.
     * @param   {String}           orientation     Can either be "horizontal",
     *   "vertical" or `undefined`, i.e. both directions.
     * @param   {Object|Function}  limits          X and Y drag limits. E.g.
     *   `{ x: { min: 0, max: 10 } }`.
     */
    value: function dragMoveHandler(data, elsToBeDragged, orientation, limits) {
      dragMoveHandler$1(data, elsToBeDragged, orientation, limits);
      this.checkNodeVisibility();
    }

    /**
     * Method for scrolling a column of nodes when the scrollbar is dragged.
     *
     * @method  dragScrollbar
     * @author  Fritz Lekschas
     * @date    2016-09-12
     * @param   {Object}  event  D3's _mousemove_ event object.
     */

  }, {
    key: 'dragScrollbar',
    value: function dragScrollbar(event$$1) {
      event$$1.preventDefault();
      var data = this.activeScrollbar.datum();
      var deltaY = data.scrollbar.clientY - event$$1.clientY;

      // Scroll scrollbar
      ListGraph.scrollElVertically(this.activeScrollbar.node(), Math.min(Math.max(data.scrollbar.scrollTop - deltaY, 0), data.scrollbar.scrollHeight));

      // Scroll content
      var contentScrollTop = Math.max(Math.min(data.scrollTop + data.invertedHeightScale(deltaY), 0), -data.scrollHeight);

      ListGraph.scrollElVertically(data.nodes, contentScrollTop);

      // Scroll Links
      if (data.level !== this.visData.nodes.length) {
        this.links.scroll(data.linkSelections.outgoing, this.layout.offsetLinks(data.level, contentScrollTop, 'source'));
      }

      if (data.level > 0) {
        this.links.scroll(data.linkSelections.incoming, this.layout.offsetLinks(data.level - 1, contentScrollTop, 'target'));
      }

      if (this.showLinkLocation) {
        this.nodes.updateLinkLocationIndicators(data.level - 1, data.level + 1);
      }

      if (this.nodeContextMenu.opened) {
        this.nodeContextMenu.scrollY(contentScrollTop);
      }

      // Check if nodes are visible.
      this.checkNodeVisibility(data.level, contentScrollTop);
    }

    /**
     * Drag start handler
     *
     * @method  dragStartHandler
     * @author  Fritz Lekschas
     * @date    2016-10-02
     */

  }, {
    key: 'dragStartHandler',
    value: function dragStartHandler() {
      if (!this.dragging) {
        this.noInteractions = this.dragging = true;
      }
    }

    /**
     * Helper method to get the top and left position of the base `svg`.
     *
     * @Description
     * Calling `getBoundingClientRect()` right at the beginning leads to errornous
     * values, probably because the function is called because HTML has been fully
     * rendered.
     *
     * @method  getBoundingRect
     * @author  Fritz Lekschas
     * @date    2016-02-24
     */

  }, {
    key: 'getBoundingRect',
    value: function getBoundingRect() {
      this.left = this.svgEl.getBoundingClientRect().left;
      this.top = this.svgEl.getBoundingClientRect().top;
    }

    /**
     * Get drag limits
     *
     * @method  dragLimits
     * @author  Fritz Lekschas
     * @date    2016-10-02
     * @return  {Object}  Min and max drag limits.
     */

  }, {
    key: 'getDragLimits',
    value: function getDragLimits() {
      return {
        x: {
          min: this.dragMinX,
          max: 0
        }
      };
    }

    /**
     * Global _mouseUp_ event handler
     *
     * @method  globalMouseUp
     * @author  Fritz Lekschas
     * @date    2016-10-02
     * @param   {[type]}       event  [description]
     * @return  {[type]}              [description]
     */

  }, {
    key: 'globalMouseUp',
    value: function globalMouseUp(event$$1) {
      this.noInteractions = false;
      this.mouseDownOnContextMenu = false;

      if (this.activeScrollbar) {
        var data = this.activeScrollbar.datum();
        var deltaY = data.scrollbar.clientY - event$$1.clientY;

        // Save final vertical position
        // Scrollbar
        data.scrollbar.scrollTop = Math.min(Math.max(data.scrollbar.scrollTop - deltaY, 0), data.scrollbar.scrollHeight);

        // Content
        data.scrollTop = Math.max(Math.min(data.scrollTop + data.invertedHeightScale(deltaY), 0), -data.scrollHeight);

        this.activeScrollbar.classed('active', false);

        this.activeScrollbar = undefined;

        ListGraph.stopScrollBarMouseMove();
      }
    }

    /**
     * Show the complete graph by zooming out
     *
     * @method  globalView
     * @author  Fritz Lekschas
     * @date    2016-10-02
     * @param   {Object}  selectionInterst  D3 selection of nodes of interest,
     *   which restrict the amount of zoom-out. If `undefined` the whole graph
     *   will be shown.
     */

  }, {
    key: 'globalView',
    value: function globalView(selectionInterst) {
      var _this2 = this;

      if (!this.zoomedOut) {
        (function () {
          var x = 0;
          var y = 0;
          var width = 0;
          var height = 0;
          var cRect = void 0;
          var contBBox = _this2.container.node().getBBox();

          var globalCRect = _this2.svgD3.node().getBoundingClientRect();

          if (selectionInterst && !selectionInterst.empty()) {
            selectionInterst.each(function () {
              cRect = this.getBoundingClientRect();
              width = Math.max(width, cRect.left - (globalCRect.left + cRect.width));
              height = Math.max(height, cRect.top - (globalCRect.top + cRect.height));
            });
            width = _this2.width > width ? _this2.width : width;
            height = _this2.height > height ? _this2.height : height;
          } else {
            width = _this2.width > contBBox.width ? _this2.width : contBBox.width;
            height = _this2.height > contBBox.height ? _this2.height : contBBox.height;
          }

          x = contBBox.x + _this2.dragged.x;
          y = contBBox.y;

          _this2.nodes.makeAllTempVisible();
          _this2.links.makeAllTempVisible();

          _this2.svgD3.classed('zoomedOut', true).transition().duration(TRANSITION_SEMI_FAST).attr('viewBox', x + ' ' + y + ' ' + width + ' ' + height);
        })();
      }
    }

    /**
     * Interaction wrapper
     *
     * @description
     * Cheks if interacctions are allowed first.
     *
     * @method  interactionWrapper
     * @author  Fritz Lekschas
     * @date    2016-10-02
     * @param   {Function}  callback  Callback function.
     * @param   {Object}    params    Parameters of the callback function.
     */

  }, {
    key: 'interactionWrapper',
    value: function interactionWrapper(callback, params) {
      if (!this.noInteractions) {
        callback.apply(this, params);
      }
    }

    /**
     * Check if an element is actually visible, i.e. within the boundaries of the
     * SVG element.
     *
     * @method  isHidden
     * @author  Fritz Lekschas
     * @date    2016-02-24
     * @param   {Object}    el  DOM element to be checked.
     * @return  {Boolean}       If `true` element is not visible.
     */

  }, {
    key: 'isHidden',
    value: function isHidden(el) {
      var boundingRect = el.getBoundingClientRect();
      return boundingRect.top + boundingRect.height <= this.top || boundingRect.left + boundingRect.width <= this.left || boundingRect.top >= this.top + this.height || boundingRect.left >= this.left + this.width;
    }

    /**
     * Assesses whether a link's end points outwards
     *
     * @method  linkPointsOutside
     * @author  Fritz Lekschas
     * @date    2016-09-14
     * @param   {Object}  data  Link data.
     * @return  {Number}  If link ends inwards returns `0`, if it points outwards
     *   to the top returns `1` or `2` when it points to the bottom. If the node
     *   pointed to is hidden return `16`.
     */

  }, {
    key: 'linkPointsOutside',
    value: function linkPointsOutside(data) {
      var y = data.node.y + data.offsetY;
      if (data.node.hidden) {
        return 16;
      }
      if (y + this.visData.global.row.height - this.visData.global.row.padding <= 0) {
        return 1;
      }
      if (y + this.visData.global.row.padding >= this.height) {
        return 2;
      }
      return 0;
    }

    /**
     * Scroll column by the mouseWheel action
     *
     * @method  mousewheelColumn
     * @author  Fritz Lekschas
     * @date    2016-10-02
     * @param   {Object}  el     DOM element
     * @param   {Object}  event  jQuery event object.
     */

  }, {
    key: 'mousewheelColumn',
    value: function mousewheelColumn(el, event$$1) {
      event$$1.preventDefault();

      var data = _d3.select(el).datum();

      if (data.scrollHeight > 0) {
        // Scroll nodes
        data.scrollTop = Math.max(Math.min(data.scrollTop + event$$1.deltaY, 0), -data.scrollHeight);

        this.scrollY(data);
      }

      // Check if nodes are visible.
      this.checkNodeVisibility(data.level);
    }

    /**
     * Check if dragging should be disabled.
     *
     * @description
     * When the scrollbar or context menu is clicked the graph shouldn#t be
     * draggable.
     *
     * @method  noDragging
     * @author  Fritz Lekschas
     * @date    2016-10-02
     * @return  {Boolean}  If `true` the graph shouldn't be draggable.
     */

  }, {
    key: 'noDragging',
    value: function noDragging() {
      return !!this.activeScrollbar || this.mouseDownOnContextMenu;
    }

    /**
     * Assesses any of the two ends of a link points outwards.
     *
     * @description
     * In order to be able to determine where a link points to, the output of
     * `linkPointsOutside` for the source and target location is shifted bitwise
     * in such a way that this method return 11 unique numbers.
     * - 0: link is completely inwards
     * - 1: source is outwards to the top
     * - 2: source is outwards to the bottom
     * - 4: target is outwards to the top
     * - 8: target is outwards to the bottom
     * - 5: source and target are outwards to the top
     * - 6: source is outwards to the bottom and target is outwards to the top
     * - 9: source is outwards to the top and target is outwards to the bottom
     * - 10: source and target are outwards to the bottom
     * - 16: source is invisible
     * - 64: target is invisible
     *
     * If you're asking yourself: "WAT?!?!!" Think of a 4x4 binary matrix:
     * |    target    |    source    |
     * | bottom | top | bottom | top |
     * |    0   |  0  |    0   |  0  | (=0)
     * |    0   |  0  |    0   |  1  | (=1)
     * |    0   |  0  |    1   |  0  | (=2)
     * |    0   |  1  |    0   |  0  | (=4)
     * |    1   |  0  |    0   |  0  | (=8)
     * |    0   |  1  |    0   |  1  | (=5)
     * |    0   |  1  |    1   |  0  | (=6)
     * |    1   |  0  |    0   |  1  | (=9)
     * |    1   |  0  |    1   |  0  | (=10)
     *
     * *Note: 16 and 64 are two special values when the source or target node is
     * hidden. The numbers are so hight just because that the bitwise-and with 4
     * and 8 results to 0.
     *
     * To check whether the source or target location is above, below or within
     * the global SVG container is very simple. For example, to find out if the
     * target location is above, all we need to do is `<VALUE> & 4 > 0`. This
     * performs a bit-wise AND operation with only two possible outcomes: 4 and 0.
     *
     * @method  pointsOutside
     * @author  Fritz Lekschas
     * @date    2016-09-14
     * @param   {Object}  data  Link data.
     * @return  {Number}  Numberical represenation of the links constallation. See
     *   description for details.
     */

  }, {
    key: 'pointsOutside',
    value: function pointsOutside(data) {
      var source = this.linkPointsOutside(data.source);
      var target = this.linkPointsOutside(data.target) << 2;
      return source | target;
    }

    /**
     * Register an outside mouse click handler
     *
     * @method  registerOutSideClickHandler
     * @author  Fritz Lekschas
     * @date    2016-10-02
     * @param   {String}     id            ID of the handler to be removed.
     * @param   {Array}      els           Array of elements to be registered.
     * @param   {[type]}     elClassNames  Element class names.
     * @param   {Function}   callback      Callback function
     * @return  {Number}                   Return number of outside click
     *   handlers.
     */

  }, {
    key: 'registerOutSideClickHandler',
    value: function registerOutSideClickHandler(id, els, elClassNames, callback) {
      // We need to register a unique property to be able to efficiently identify
      // the element later.
      for (var i = els.length; i--;) {
        if (els[i].__id__) {
          els[i].__id__.push(id);
        } else {
          els[i].__id__ = [id];
        }
      }
      var newLength = this.outsideClickHandler[id] = {
        id: id, els: els, elClassNames: elClassNames, callback: callback
      };
      for (var _i3 = elClassNames.length; _i3--;) {
        this.outsideClickClassHandler[elClassNames[_i3]] = this.outsideClickHandler[id];
      }
      return newLength;
    }

    /**
     * Render the list graph
     *
     * @method  reRender
     * @author  Fritz Lekschas
     * @date    2017-01-16
     * @param   {Object}  update  Update grid
     */

  }, {
    key: 'reRender',
    value: function reRender(update) {
      this.width = setOption(this.init.width, this.svgJq.width(), true);
      this.height = setOption(this.init.height, this.svgJq.height(), true);

      if (update && update.grid) {
        this.columns = update.grid.columns || this.columns;
        this.rows = update.grid.rows || this.rows;
      }

      if (this.init.forceWidth) {
        this.baseElJq.width(this.width);
      }

      this.layout.size([this.width, this.height]);

      this.layout.grid([this.columns, this.rows]);

      this.visData = this.layout.process(this.data, this.rootNodes, {
        showLinkLocation: this.showLinkLocation,
        linkLocationBucketSize: this.linkLocationBucketSize,
        sortBy: this.currentSorting.global.type,
        sortOrder: this.currentSorting.global.order
      });

      this.svgD3.attr('viewBox', '0 0 ' + this.width + ' ' + this.height);

      this.topbar.reRender(this.visData);
      this.levels.reRender(this.visData);
      this.links.reRender(this.visData);
      this.nodes.reRender(this.visData);

      this.levels.scrollPreparation(this.scrollbarWidth);
      this.scrollbars.reRender(this.visData);

      this.nodeContextMenu.destroy();
      this.nodeContextMenu = new NodeContextMenu({
        visData: this.visData,
        baseEl: this.container,
        events: this.events,
        nodes: this.nodes,
        iconPath: this.iconPath,
        infoFields: this.nodeInfoContextMenu,
        isQueryable: this.querying,
        isDebounced: !this.disableDebouncedContextMenu
      });

      this.getBoundingRect();
    }

    /**
     * Helper method to scroll all columns to the top.
     *
     * @method  resetAllScrollPositions
     * @author  Fritz Lekschas
     * @date    2016-10-02
     */

  }, {
    key: 'resetAllScrollPositions',
    value: function resetAllScrollPositions() {
      return this.scrollYTo(this.levels.groups, 0);
    }

    /**
     * Scrollbar _mouseDown_ handler
     *
     * @method  scrollbarMouseDown
     * @author  Fritz Lekschas
     * @date    2016-10-02
     * @param   {Object}  el     DOM element.
     * @param   {Object}  event  D3 _mouseDown_ event object.
     */

  }, {
    key: 'scrollbarMouseDown',
    value: function scrollbarMouseDown(el, event$$1) {
      this.noInteractions = true;
      this.activeScrollbar = _d3.select(el).classed('active', true);
      this.activeScrollbar.datum().scrollbar.clientY = event$$1.clientY;
      this.startScrollBarMouseMove();
    }

    /**
     * Scroll an element vertically
     *
     * @method  scrollElVertically
     * @author  Fritz Lekschas
     * @date    2016-10-02
     * @param   {Object}  el      DOM element to be scrolled.
     * @param   {Number}  offset  Number of pixel to be scrolled.
     */

  }, {
    key: 'scrollY',


    /**
     * Scroll column of nodes.
     *
     * @method  scrollY
     * @author  Fritz Lekschas
     * @date    2016-10-02
     * @param   {Object}   columnData         D3 data object of the column.
     * @param   {Boolean}  scrollbarDragging  If `true` column is scrolled by
     *   dragging the scrollbar.
     */
    value: function scrollY(columnData, scrollbarDragging) {
      ListGraph.scrollElVertically(columnData.nodes, columnData.scrollTop);

      if (!scrollbarDragging) {
        // Scroll scrollbar
        columnData.scrollbar.scrollTop = columnData.scrollbar.heightScale(-columnData.scrollTop);

        ListGraph.scrollElVertically(columnData.scrollbar.el, columnData.scrollbar.scrollTop);
      }

      // Scroll Links
      if (columnData.level !== this.visData.nodes.length) {
        this.links.scroll(columnData.linkSelections.outgoing, this.layout.offsetLinks(columnData.level, columnData.scrollTop, 'source'));
      }

      if (columnData.level > 0) {
        this.links.scroll(columnData.linkSelections.incoming, this.layout.offsetLinks(columnData.level - 1, columnData.scrollTop, 'target'));
      }

      if (this.showLinkLocation) {
        this.nodes.updateLinkLocationIndicators(columnData.level - 1, columnData.level + 1);
      }

      if (this.nodeContextMenu.isOpenSameColumn(columnData.level)) {
        this.nodeContextMenu.scrollY(columnData.scrollTop);
      }
    }

    /**
     * Scroll to a certain vertical position in a column
     *
     * @method  scrollYTo
     * @author  Fritz Lekschas
     * @date    2016-10-02
     * @param   {Object}  selection  D3 selection of columns.
     * @param   {Number}  positionY  Position in pixel to be scrolled to.
     */

  }, {
    key: 'scrollYTo',
    value: function scrollYTo(selection, positionY) {
      var _this3 = this;

      return selection.transition().duration(TRANSITION_SEMI_FAST).tween('scrollY', function (data) {
        var scrollPositionY = _d3.interpolateNumber(data.scrollTop, positionY);
        return function (time) {
          data.scrollTop = scrollPositionY(time);
          _this3.scrollY(data);
        };
      });
    }

    /**
     * Select elements by column
     *
     * @method  selectByLevel
     * @author  Fritz Lekschas
     * @date    2016-10-02
     * @param   {Number}  level     Index of the column or level.
     * @param   {String}  selector  Query selector string.
     * @return  {Object}            D3 selection.
     */

  }, {
    key: 'selectByLevel',
    value: function selectByLevel(level, selector) {
      return _d3.select(this.levels.groups._groups[0][level]).selectAll(selector);
    }

    /**
     * Sort all columns or levels
     *
     * @method  sortAllColumns
     * @author  Fritz Lekschas
     * @date    2016-10-02
     * @param   {String}   property     Node property to be sorted by.
     * @param   {Boolean}  newSortType  If `true` sorted by a new type.
     */

  }, {
    key: 'sortAllColumns',
    value: function sortAllColumns(property, newSortType) {
      this.currentSorting.global.order = this.currentSorting.global.order === -1 && !newSortType ? 1 : -1;

      this.nodes.sort(this.layout.sort(undefined, property, this.currentSorting.global.order).updateNodesVisibility().nodes(), newSortType);

      this.links.sort(this.layout.links());
      this.nodeContextMenu.updatePosition();
      this.checkNodeVisibility();
    }

    /**
     * Sort a column or level
     *
     * @method  sortColumn
     * @author  Fritz Lekschas
     * @date    2016-10-02
     * @param   {Integer}   level        Specifies the level which should be
     *   sorted.
     * @param   {String}    property     The property used for sorting. Can be one
     *   of ['precision', 'recall', 'name'].
     * @param   {Integer}   sortOrder    If `1` sort asc. If `-1` sort desc.
     * @param   {String}    newSortType  Property to be sorted by.
     */

  }, {
    key: 'sortColumn',
    value: function sortColumn(level, property, sortOrder, newSortType) {
      this.nodes.sort(this.layout.sort(level, property, sortOrder).updateNodesVisibility().nodes(level), newSortType);
      this.links.sort(this.layout.links(level - 1, level + 1));
      this.nodeContextMenu.updatePosition();
      this.checkNodeVisibility();
    }

    /**
     * Start listening to the _mouseMove_ event when the scroll drag is started
     *
     * @method  startScrollBarMouseMove
     * @author  Fritz Lekschas
     * @date    2016-10-02
     */

  }, {
    key: 'startScrollBarMouseMove',
    value: function startScrollBarMouseMove() {
      var _this4 = this;

      _d3.select(document).on('mousemove', function () {
        _this4.dragScrollbar(_d3.event);
      });
    }

    /**
     * Stop listening to the _mouseMove_ event when the scroll bar drag is over
     *
     * @method  stopScrollBarMouseMove
     * @author  Fritz Lekschas
     * @date    2016-10-02
     */

  }, {
    key: 'switchBarMode',


    /**
     * Switch node bar mode
     *
     * @method  switchBarMode
     * @author  Fritz Lekschas
     * @date    2016-10-02
     * @param   {String}  mode  Bar mode. Either "one" or "two".
     */
    value: function switchBarMode(mode) {
      this.svgD3.classed('one-bar', mode === 'one');
      this.svgD3.classed('two-bar', mode === 'two');
      this.nodes.bars.switchMode(mode, this.currentSorting);
    }

    /**
     * Helper method to trigger an event
     *
     * @method  trigger
     * @author  Fritz Lekschas
     * @date    2016-10-02
     * @param   {[type]}    event  [description]
     * @param   {[type]}    data   [description]
     * @return  {[type]}           [description]
     */

  }, {
    key: 'trigger',
    value: function trigger(event$$1, data) {
      this.events.trigger(event$$1, data);
    }

    /**
     * Toggle between the global and zoomed graph view.
     *
     * @method  toggleView
     * @author  Fritz Lekschas
     * @date    2016-10-02
     */

  }, {
    key: 'toggleView',
    value: function toggleView() {
      if (this.zoomedOut) {
        this.zoomedOut = false;
        this.zoomedView();
      } else {
        this.globalView();
        this.zoomedOut = true;
      }
    }

    /**
     * Remove outside mouse click handler
     *
     * @method  unregisterOutSideClickHandler
     * @author  Fritz Lekschas
     * @date    2016-10-02
     * @param   {String}  id  ID of the handler to be removed.
     */

  }, {
    key: 'unregisterOutSideClickHandler',
    value: function unregisterOutSideClickHandler(id) {
      var handler = this.outsideClickHandler[id];

      // Remove element `__id__` property.
      for (var i = handler.els.length; i--;) {
        handler.els[i].__id__ = undefined;
        delete handler.els[i].__id__;
      }

      // Remove handler.
      this.outsideClickHandler[id] = undefined;
      delete this.outsideClickHandler[id];
    }

    /**
     * Helper method to trigger an update of the columns' or levels' visibility
     *
     * @method  updateLevelsVisibility
     * @author  Fritz Lekschas
     * @date    2016-10-02
     */

  }, {
    key: 'updateLevelsVisibility',
    value: function updateLevelsVisibility() {
      this.levels.updateVisibility();
    }

    /**
     * Update the scroll position and scroll-bar visibility.
     *
     * @description
     * This method needs to be called after hiding or showing nodes.
     *
     * @method  updateScrolling
     * @author  Fritz Lekschas
     * @date    2016-02-21
     */

  }, {
    key: 'updateScrolling',
    value: function updateScrolling() {
      var _this5 = this;

      this.resetAllScrollPositions().call(allTransitionsEnded, function () {
        _this5.levels.updateScrollProperties();
        _this5.scrollbars.updateVisibility();
      });
    }

    /**
     * Update column sorting given the current sort settings.
     *
     * @method  updateSorting
     * @author  Fritz Lekschas
     * @date    2016-10-02
     */

  }, {
    key: 'updateSorting',
    value: function updateSorting() {
      var levels = Object.keys(this.currentSorting.local);
      for (var i = levels.length; i--;) {
        this.sortColumn(i, this.currentSorting.local[levels[i]].type, this.currentSorting.local[levels[i]].order, this.currentSorting.local[levels[i]].type);
      }
    }

    // get visData () {
    //   console.log('request visData');
    //   return this._visData;
    // }

    // set visData (value) {
    //   this._visData = value;
    // }

    /**
     * Show original zoomed graph
     *
     * @method  zoomedView
     * @author  Fritz Lekschas
     * @date    2016-10-02
     */

  }, {
    key: 'zoomedView',
    value: function zoomedView() {
      if (!this.zoomedOut) {
        this.nodes.makeAllTempVisible(true);
        this.links.makeAllTempVisible(true);

        this.svgD3.classed('zoomedOut', false).transition().duration(TRANSITION_SEMI_FAST).attr('viewBox', '0 0 ' + this.width + ' ' + this.height);
      }
    }
  }, {
    key: 'area',
    get: function get() {
      return this.container.node().getBoundingClientRect();
    }

    /**
     * Get current bar mode.
     *
     * @method  barMode
     * @author  Fritz Lekschas
     * @date    2016-10-02
     * @return  {String}  Bar mode. Either "one" or "two".
     */

  }, {
    key: 'barMode',
    get: function get() {
      if (this.bars) {
        return this.nodes.bars.mode;
      }
      return this._barMode;
    }

    /**
     * Set bar mode.
     *
     * @method  barMode
     * @author  Fritz Lekschas
     * @date    2016-10-02
     * @param   {String}  mode  Bar mode. Either "one" or "two".
     */
    ,
    set: function set(mode) {
      if (this.bars) {
        this.nodes.bars.mode = mode;
      }
      this._barMode = mode;
    }
  }, {
    key: 'dragMinX',
    get: function get() {
      return Math.min(0, this.width - this.area.width);
    }
  }], [{
    key: 'scrollElVertically',
    value: function scrollElVertically(el, offset) {
      _d3.select(el).attr('transform', 'translate(0, ' + offset + ')');
    }
  }, {
    key: 'stopScrollBarMouseMove',
    value: function stopScrollBarMouseMove() {
      _d3.select(document).on('mousemove', null);
    }
  }]);
  return ListGraph;
}();

// Will be set by Gulp during the build process


ListGraph.version = '1.1.2';

return ListGraph;

})));
