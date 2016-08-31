/* Copyright Fritz Lekschas: D3 layout for list-like graphs */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('d3')) :
  typeof define === 'function' && define.amd ? define(['exports', 'd3'], factory) :
  (factory((global.d3 = global.d3 || {}),global.d3));
}(this, (function (exports,d3) { 'use strict';

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

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

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
  return !!value && (type == 'object' || type == 'function');
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

/** Used for built-in method references. */
var objectProto$1 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$1 = objectProto$1.hasOwnProperty;

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
  if (!(hasOwnProperty$1.call(object, key) && eq(objValue, value)) ||
      (value === undefined && !(key in object))) {
    object[key] = value;
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
  object || (object = {});

  var index = -1,
      length = props.length;

  while (++index < length) {
    var key = props[index];

    var newValue = customizer
      ? customizer(object[key], source[key], key, object, source)
      : undefined;

    assignValue(object, key, newValue === undefined ? source[key] : newValue);
  }
  return object;
}

/**
 * A faster alternative to `Function#apply`, this function invokes `func`
 * with the `this` binding of `thisArg` and the arguments of `args`.
 *
 * @private
 * @param {Function} func The function to invoke.
 * @param {*} thisArg The `this` binding of `func`.
 * @param {Array} args The arguments to invoke `func` with.
 * @returns {*} Returns the result of `func`.
 */
function apply(func, thisArg, args) {
  switch (args.length) {
    case 0: return func.call(thisArg);
    case 1: return func.call(thisArg, args[0]);
    case 2: return func.call(thisArg, args[0], args[1]);
    case 3: return func.call(thisArg, args[0], args[1], args[2]);
  }
  return func.apply(thisArg, args);
}

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * The base implementation of `_.rest` which doesn't validate or coerce arguments.
 *
 * @private
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @returns {Function} Returns the new function.
 */
function baseRest(func, start) {
  start = nativeMax(start === undefined ? (func.length - 1) : start, 0);
  return function() {
    var args = arguments,
        index = -1,
        length = nativeMax(args.length - start, 0),
        array = Array(length);

    while (++index < length) {
      array[index] = args[start + index];
    }
    index = -1;
    var otherArgs = Array(start + 1);
    while (++index < start) {
      otherArgs[index] = args[index];
    }
    otherArgs[start] = array;
    return apply(func, this, otherArgs);
  };
}

var funcTag = '[object Function]';
var genTag = '[object GeneratorFunction]';
/** Used for built-in method references. */
var objectProto$2 = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto$2.toString;

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
  return tag == funcTag || tag == genTag;
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

/**
 * Checks if the given arguments are from an iteratee call.
 *
 * @private
 * @param {*} value The potential iteratee value argument.
 * @param {*} index The potential iteratee index or key argument.
 * @param {*} object The potential iteratee object argument.
 * @returns {boolean} Returns `true` if the arguments are from an iteratee call,
 *  else `false`.
 */
function isIterateeCall(value, index, object) {
  if (!isObject(object)) {
    return false;
  }
  var type = typeof index;
  if (type == 'number'
        ? (isArrayLike(object) && isIndex(index, object.length))
        : (type == 'string' && index in object)
      ) {
    return eq(object[index], value);
  }
  return false;
}

/**
 * Creates a function like `_.assign`.
 *
 * @private
 * @param {Function} assigner The function to assign values.
 * @returns {Function} Returns the new assigner function.
 */
function createAssigner(assigner) {
  return baseRest(function(object, sources) {
    var index = -1,
        length = sources.length,
        customizer = length > 1 ? sources[length - 1] : undefined,
        guard = length > 2 ? sources[2] : undefined;

    customizer = (assigner.length > 3 && typeof customizer == 'function')
      ? (length--, customizer)
      : undefined;

    if (guard && isIterateeCall(sources[0], sources[1], guard)) {
      customizer = length < 3 ? undefined : customizer;
      length = 1;
    }
    object = Object(object);
    while (++index < length) {
      var source = sources[index];
      if (source) {
        assigner(object, source, index, customizer);
      }
    }
    return object;
  });
}

/** Used for built-in method references. */
var objectProto$3 = Object.prototype;

/**
 * Checks if `value` is likely a prototype object.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
 */
function isPrototype(value) {
  var Ctor = value && value.constructor,
      proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto$3;

  return value === proto;
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
  return !!value && typeof value == 'object';
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
var argsTag = '[object Arguments]';

/** Used for built-in method references. */
var objectProto$5 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$3 = objectProto$5.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString$1 = objectProto$5.toString;

/** Built-in value references. */
var propertyIsEnumerable$1 = objectProto$5.propertyIsEnumerable;

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
  return isArrayLikeObject(value) && hasOwnProperty$3.call(value, 'callee') &&
    (!propertyIsEnumerable$1.call(value, 'callee') || objectToString$1.call(value) == argsTag);
}

/** Used for built-in method references. */
var objectProto$4 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$2 = objectProto$4.hasOwnProperty;

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
    if ((inherited || hasOwnProperty$2.call(value, key)) &&
        !(skipIndexes && (key == 'length' || isIndex(key, length)))) {
      result.push(key);
    }
  }
  return result;
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
var objectProto$6 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$4 = objectProto$6.hasOwnProperty;

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
    if (hasOwnProperty$4.call(object, key) && key != 'constructor') {
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

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Built-in value references. */
var propertyIsEnumerable = objectProto.propertyIsEnumerable;

/** Detect if properties shadowing those on `Object.prototype` are non-enumerable. */
var nonEnumShadows = !propertyIsEnumerable.call({ 'valueOf': 1 }, 'valueOf');

/**
 * Assigns own enumerable string keyed properties of source objects to the
 * destination object. Source objects are applied from left to right.
 * Subsequent sources overwrite property assignments of previous sources.
 *
 * **Note:** This method mutates `object` and is loosely based on
 * [`Object.assign`](https://mdn.io/Object/assign).
 *
 * @static
 * @memberOf _
 * @since 0.10.0
 * @category Object
 * @param {Object} object The destination object.
 * @param {...Object} [sources] The source objects.
 * @returns {Object} Returns `object`.
 * @see _.assignIn
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 * }
 *
 * function Bar() {
 *   this.c = 3;
 * }
 *
 * Foo.prototype.b = 2;
 * Bar.prototype.d = 4;
 *
 * _.assign({ 'a': 0 }, new Foo, new Bar);
 * // => { 'a': 1, 'c': 3 }
 */
var assign = createAssigner(function(object, source) {
  if (nonEnumShadows || isPrototype(source) || isArrayLike(source)) {
    copyObject(source, keys(source), object);
    return;
  }
  for (var key in source) {
    if (hasOwnProperty.call(source, key)) {
      assignValue(object, key, source[key]);
    }
  }
});

/**
 * Default size
 *
 * @constant
 * @default
 * @type  {Object}
 */
var SIZE = {
  width: 300,
  height: 300
};

/**
 * Default grid
 *
 * @constant
 * @default
 * @type  {Object}
 */
var GRID = {
  columns: 3,
  rows: 3
};

/**
 * Default relative padding of columns.
 *
 * @description
 * Padding between columns refers to the left and right inner padding used
 * for links between items in the column. Padding is relative to the overall
 * width of the column.
 *
 * @constant
 * @default
 * @type  {Number}
 */
var COL_REL_PADDING = 0.2;

/**
 * Default relative padding of rows.
 *
 * @description
 * Padding between rows refers to the top and bottom inner padding used to
 * separate items vertically in the column. Padding is relative to the overall
 * height of the row.
 *
 * @constant
 * @default
 * @type  {Number}
 */
var ROW_REL_PADDING = 0.05;

/**
 * Default inner padding of a cell relative to the shorter dimension, e.g.
 * width or height.
 *
 * @type  {Number}
 */
var CELL_REL_INNER_PADDING = 0.05;

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

var ExtendableError = function (_Error) {
  inherits(ExtendableError, _Error);

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

var D3VersionFourRequired = function (_ExtendableError) {
  inherits(D3VersionFourRequired, _ExtendableError);

  function D3VersionFourRequired(versionFound) {
    classCallCheck(this, D3VersionFourRequired);
    return possibleConstructorReturn(this, (D3VersionFourRequired.__proto__ || Object.getPrototypeOf(D3VersionFourRequired)).call(this, 'D3 version 4 is required to run the code. Found version ' + versionFound));
  }

  return D3VersionFourRequired;
}(ExtendableError);

var NoRootNodes = function (_ExtendableError) {
  inherits(NoRootNodes, _ExtendableError);

  function NoRootNodes(message) {
    classCallCheck(this, NoRootNodes);
    return possibleConstructorReturn(this, (NoRootNodes.__proto__ || Object.getPrototypeOf(NoRootNodes)).call(this, message || 'No root node IDs specified.'));
  }

  return NoRootNodes;
}(ExtendableError);

// External
/**
 * Traverse graph in a breadth-first search fashion and process nodes along
 * the traversal.
 *
 * @author  Fritz Lekschas
 * @date  2015-11-13
 *
 * @private
 * @method  traverseGraph
 * @param  {Object}  graph  Graph to be traversed
 * @param  {Array}  starts  Array of node IDs for start the traversal.
 * @param  {Object}  columnCache  Cache storing node IDs per column.
 * @param  {Object}  scale  D3 linear scale functions for the
 *    x-axis (columns), y-axis (rows) and other stuff.
 * œparam  {Object}  links  Object storing links data.
 */
function traverseGraph(graph, starts, columnCache, nodeOrder, scale, links) {
  var visited = {};
  var queue = [];

  /**
   * Ensure that the bar values are in [0,1] and that the structure of `bars`
   * is unified.
   *
   * @description
   * Each node can feature a number of bars representing some value. The layout
   * can handle two structure, an object-based and an array-based structure.
   *
   * Object-based model:
   * ```
   * {
   *   children: [...],
   *   data: {
   *     "name": "whatever",
   *     "bars": {
   *       "propertyA": 0.9,
   *       "propertyB": 0.5
   *     }
   *   }
   * }
   * ```
   *
   * Array-based model:
   * ```
   * {
   *   children: [...],
   *   data: {
   *     "name": "whatever",
   *     "bars": [{
   *         "id": "propertyA",
   *         "value": 0.9
   *       }, {
   *         "id": "propertyB",
   *         "value": 0.5
   *       }
   *     ]
   *   }
   * }
   * ```
   *
   * @author  Fritz Lekschas
   * @date  2015-11-18
   *
   * @method  processBars
   * @private
   * @memberOf  traverseGraph
   * @param  {Object}  node  Node to be processed.
   */
  function processBars(node) {
    if (node.data.bars) {
      if (isArray(node.data.bars)) {
        node.data.barRefs = {};
        for (var i = 0, len = node.data.bars.length; i < len; i++) {
          node.data.bars[i].value = Math.max(Math.min(node.data.bars[i].value, 1), 0);
          node.data.bars[i].barId = node.id + '.' + node.data.bars[i].id;
          node.data.barRefs[node.data.bars[i].id] = node.data.bars[i].value;
        }
      } else if (isObject(node.data.bars)) {
        var bars = [];
        var keys = Object.keys(node.data.bars);
        // Keep the old object reference for quick access, e.g.
        // `node.data.barRefs.precision`
        node.data.barRefs = {};
        for (var _i = 0, _len = keys.length; _i < _len; _i++) {
          node.data.barRefs[keys[_i]] = Math.max(Math.min(node.data.bars[keys[_i]], 1), 0);
          bars.push({
            barId: node.id + '.' + keys[_i],
            id: keys[_i],
            value: node.data.barRefs[keys[_i]]
          });
        }
        node.data.bars = bars;
      }
    }
  }

  /**
   * Process outgoing links and add them to the source
   *
   * @author  Fritz Lekschas
   * @date    2015-11-17
   *
   * @method  processLink
   * @private
   * @memberOf  traverseGraph
   * @param  {Object}  source  Source node.
   * @param  {Object}  target  Target node.
   */
  function processLink(source, target) {
    var id = '(' + source.id + ')->(' + target.id + ')';

    links[id] = {
      id: id,
      source: {
        node: source,
        offsetX: 0,
        offsetY: 0
      },
      target: {
        node: target,
        offsetX: 0,
        offsetY: 0
      }
    };

    source.links.outgoing.refs.push(links[id]);
    target.links.incoming.refs.push(links[id]);

    source.links.outgoing.total++;
    target.links.incoming.total++;
  }

  /**
   * Process a node, e.g. assign `x` and `y`, clone node etc.
   *
   * @description
   * Nodes are edited in place.
   *
   * @author  Fritz Lekschas
   * @date  2015-11-13
   *
   * @method  processNode
   * @private
   * @memberOf  traverseGraph
   * @param  {String}  id  Node ID.
   * @param  {Object}  node  Node to be processed.
   * @param  {Object}  parent  Parent node.
   * @param  {Boolean}  duplication  If `true` node needs to be duplicated or
   *   cloned.
   */
  function processNode(id, node, parent, duplication) {
    var _id = id.toString();
    var _node = node;
    var skip = false;

    if (duplication) {
      // Check if there is already another clone on the same level. If so, skip
      // creating a new clone. The rationale is to have only one clone per
      // level.
      for (var i = node.clones.length; i--;) {
        if (node.clones[i].depth === parent.depth + 1) {
          skip = true;
          _id = node.clones[i].cloneId;
          _node = node.clones[i];
          break;
        }
      }

      // Clone node only when the parent is **not** just one level before the
      // clone because then the parent can simple link to the _original node_.
      if (parent.depth + 1 !== node.depth && !skip) {
        var cloneId = id + '.' + (node.clones.length + 1);
        graph[cloneId] = {
          children: [],
          clone: true,
          cloneId: cloneId,
          cloneNum: node.clones.length + 1,
          // Data will be referenced rather than copied to avoid inconsistencies
          data: node.data,
          originalId: id.toString(),
          // Reference to the original node
          originalNode: node
        };
        _id = cloneId;
        _node = graph[cloneId];
        // Add a reference to the original node that points to the clone.
        node.clones.push(_node);
        // Remove parent
        node.parents[parent.id] = undefined;
        delete node.parents[parent.id];
      }
    } else {
      _node.clones = [];
    }

    _node.id = _id;

    if (!_node.parents) {
      _node.parents = {};
    }
    if (parent) {
      _node.parents[parent.id] = parent;
    } else {
      _node.parents = {};
    }

    if (!_node.data.state) {
      _node.data.state = {};
    }

    if (!_node.childRefs) {
      _node.childRefs = [];
    }

    if (parent) {
      _node.depth = parent.depth + 1;
      parent.childRefs.push(_node);
    } else {
      _node.depth = 0;
    }

    if (!_node.links) {
      _node.links = {
        incoming: {
          refs: [],
          above: 0,
          below: 0,
          total: 0
        },
        outgoing: {
          refs: [],
          above: 0,
          below: 0,
          total: 0
        }
      };
    }

    if (!columnCache[_node.depth]) {
      columnCache[_node.depth] = {};
      nodeOrder[_node.depth] = [];
    }

    if (!columnCache[_node.depth][_id]) {
      columnCache[_node.depth][_id] = true;
      nodeOrder[_node.depth].push(_node);
      _node.x = scale.x(_node.depth);
      _node.y = scale.y(Object.keys(columnCache[_node.depth]).length - 1);
    }

    processBars(_node);

    if (parent) {
      processLink(parent, _node);
    }
  }

  function addSiblings() {
    for (var i = starts.length; i--;) {
      for (var j = starts.length; j--;) {
        if (i !== j) {
          if (!graph[starts[i]].siblings) {
            graph[starts[i]].siblings = {};
          }
          graph[starts[i]].siblings[starts[j]] = graph[starts[j]];
        }
      }
    }
  }

  // BFS for each start node.
  for (var i = starts.length; i--;) {
    if (!graph[starts[i]]) {
      return;
    }

    processNode(starts[i], graph[starts[i]]);

    queue.push(starts[i]);
    visited[starts[i]] = true;

    while (queue.length > 0) {
      var node = graph[queue.shift()];

      for (var j = node.children.length; j--;) {
        var childId = node.children[j];
        var child = graph[childId];

        if (child) {
          var clone = true;

          if (!visited[childId]) {
            queue.push(childId);
            visited[childId] = true;
            clone = false;
          }

          processNode(childId, child, node, clone);
        }
      }
    }
  }

  addSiblings();
}

// External
// eslint-disable-line import/no-unresolved
// Internal
// Private variables
var _d3 = d3;
var _cellRelInnerPadding = CELL_REL_INNER_PADDING;
var _grid = {
  columns: GRID.columns,
  rows: GRID.rows
};
var _size = {
  width: SIZE.width,
  height: SIZE.height
};
var _links = {};

var _colRelPadding = COL_REL_PADDING;
var _rowRelPadding = ROW_REL_PADDING;
var _columnWidth = void 0;
var _rowHeight = void 0;
var _colAbsPadding = void 0;
var _colAbsContentWidth = void 0;
var _rowAbsPadding = void 0;
var _rowAbsContentHeight = void 0;
var _cellAbsInnerPadding = void 0;

var ListGraphLayout = function () {
  /**
   * ListGraph class constructor.
   *
   * @author  Fritz Lekschas
   * @date  2015-11-10
   *
   * @constructor
   * @param  {Array|Object}  size  New size. Can either be an Array, e.g.
   *   `[200,20]` or an Object, e.g. `{width: 200, height: 20}`.
   * @param  {Array|Object}  grid  New grid configuration. Can either be an
   *   Array, e.g. `[5,3]` or an Object, e.g. `{columns: 5, rows: 3}`.
   * @param  {Object}  specificD3  Provide a specific version of D3.js.
   */
  function ListGraphLayout(size, grid, specificD3) {
    classCallCheck(this, ListGraphLayout);

    if (specificD3) {
      _d3 = specificD3;
    }

    if (_d3.version[0] !== '4') {
      throw new D3VersionFourRequired(_d3.version);
    }

    this.scale = {
      x: _d3.scaleLinear(),
      y: _d3.scaleLinear(),
      linkPosition: {}
    };

    this.grid(grid);
    this.size(size);

    this.columnCache = {};
    this.columns = {};
    this.columnNodeOrder = {};
    this.columnSorting = {};
  }

  /**
   * Convert an object-based list of nodes into an array of arrays of nodes.
   *
   * @description
   * Representing a graph using hierarchical data structures such as an Array is
   * difficult. To save resources and avoid complex structures a graph is
   * represented as a simple list of nodes. The list correspondes to an objects
   * where the object's keys stand for node identifiers. This ensures uniqueness
   * but has the disadvantage that D3 doesn't know what to do with it, thus we
   * have to convert that structure into a fat array of array of nodes. It's
   * important to notice that the nodes are *not* cloned into the array but
   * instead simply linked using references.
   *
   * @author  Fritz Lekschas
   * @date  2015-12-04
   *
   * @method  nodesToMatrix
   * @memberOf  ListGraph
   * @public
   * @param  {Integer}  Level for which nodes should be returned.
   * @return  {Array}  Fat array of arrays of nodes.
   */


  createClass(ListGraphLayout, [{
    key: 'nodesToMatrix',
    value: function nodesToMatrix(level) {
      var arr = [];

      var start = 0;
      var end = Object.keys(this.columnCache).length;

      if (isFinite(level)) {
        start = level;
        end = level + 1;
      }

      for (var i = start; i < end; i++) {
        arr.push({
          y: 0,
          x: this.scale.x(i),
          level: i,
          rows: [],
          sortBy: this.columnSorting[i].by,
          sortOrder: this.columnSorting[i].order
        });
        var keys = Object.keys(this.columnCache[i]);
        for (var j = keys.length; j--;) {
          arr[i - start].rows.push(this.data[keys[j]]);
        }
      }

      return arr;
    }

    /**
     * Process original data and return an D3 ready Array.
     *
     * @author  Fritz Lekschas
     * @date  2015-12-28
     *
     * @method  process
     * @memberOf  ListGraph
     * @public
     * @category  Data
     * @param  {Object}  data  Object list of nodes.
     * @param  {Array}  rootIds  Array of node IDs to start traversal.
     * @param  {Object}  options  Object holding extra options such as sorting.
     * @return  {Array}  Array of Array of nodes.
     */

  }, {
    key: 'process',
    value: function process(data, rootIds, options) {
      this.data = data || this.data;
      this.rootIds = rootIds || this.rootIds;

      if (!isArray(this.rootIds)) {
        if (isFinite(this.rootIds)) {
          this.rootIds = [this.rootIds];
        } else {
          throw new NoRootNodes('No root node IDs specified.');
        }
      }

      var _options = assign({}, options);

      traverseGraph(this.data, this.rootIds, this.columnCache, this.columnNodeOrder, this.scale, _links);

      for (var i = Object.keys(this.columnCache).length; i--;) {
        this.columnSorting[i] = {};
      }

      if (_options.sortBy) {
        this.sort(undefined, options.sortBy, options.sortOrder || 'desc');
      }

      return {
        global: this.compileGlobalProps(),
        nodes: this.nodesToMatrix()
      };
    }

    /**
     * Sorts nodes of all or a specific level according to a property and order.
     *
     * @description
     * Currently nodes can only be sorted by _precision_, _recall_ or by name.
     *
     * @method  sort
     * @author  Fritz Lekschas
     * @date    2015-12-04
     * @param  {Integer}  level  Specifies the level which should be sorted.
     * @param  {String}  property   The property used for sorting. Can be one of
     *   ['precision', 'recall', 'name'].
     * @param  {Integer}  sortOrder  If `1` sort asc. If `-1` sort desc.
     * @return  {Object}  Self.
     */

  }, {
    key: 'sort',
    value: function sort(level, property, sortOrder) {
      var itr = 0;
      var end = Object.keys(this.columnCache).length;
      var getValue = void 0;
      var sortProperty = void 0;

      // 1 = asc, -1 = desc [default]
      var numericSortOrder = sortOrder === 1 ? 1 : -1;

      switch (property) {
        case 'precision':
          sortProperty = 'precision';
          getValue = function getValue(obj) {
            return obj.data.barRefs.precision;
          };
          break;
        case 'recall':
          sortProperty = 'recall';
          getValue = function getValue(obj) {
            return obj.data.barRefs.recall;
          };
          break;
        default:
          getValue = function getValue(obj) {
            return obj.data.name.toLowerCase();
          };
          sortProperty = 'name';
          break;
      }

      if (isFinite(level)) {
        itr = level;
        end = level + 1;
      }

      for (itr; itr < end; itr++) {
        this.columnNodeOrder[itr].sort(function (a, b) {
          // eslint-disable-line no-loop-func
          var valueA = getValue(a);
          var valueB = getValue(b);

          if (valueA > valueB) {
            return numericSortOrder;
          }
          if (valueA < valueB) {
            return -numericSortOrder;
          }
          return 0;
        });

        this.columnSorting[itr].by = sortProperty;
        this.columnSorting[itr].order = numericSortOrder;

        // Update `y` according to the new position.
        for (var i = this.columnNodeOrder[itr].length; i--;) {
          this.columnNodeOrder[itr][i].y = this.scale.y(i);
        }
      }

      return this;
    }

    /**
     * Compiles an object of global properties of the visualization.
     *
     * @description
     * Global properties comprise all properties that can be applied to globally
     * across the visualization such as the width and padding of columns or the
     * height and padding of rows.
     *
     * @author  Fritz Lekschas
     * @date    2015-11-17
     *
     * @method  compileGlobalProps
     * @memberOf  ListGraph
     * @public
     * @category  Data
     * @return  {Object}  Object with global properties.
     */

  }, {
    key: 'compileGlobalProps',
    value: function compileGlobalProps() {
      return {
        column: {
          width: _columnWidth,
          height: _size.height,
          padding: _colAbsPadding,
          contentWidth: _colAbsContentWidth
        },
        row: {
          height: _rowHeight,
          padding: _rowAbsPadding,
          contentHeight: _rowAbsContentHeight
        },
        cell: {
          padding: _cellAbsInnerPadding
        }
      };
    }

    /**
     * Returns the processed nodes as an Array of Array of nodes.
     *
     * @author  Fritz Lekschas
     * @date  2015-11-16
     *
     * @method  nodes
     * @memberOf  ListGraph
     * @public
     * @category  Data
     * @param  {Integer}  Level for which nodes should be returned.
     * @return  {Array}  Array of Array of nodes.
     */

  }, {
    key: 'nodes',
    value: function nodes(level) {
      return this.nodesToMatrix(level);
    }

    /**
     * Returns an array of outgoing links per level, i.e. column, or all outgoing
     * links.
     *
     * @description
     * The column ID and level might be the same for small graphs but it's
     * possible that the first column does not represent the first level.
     *
     * @author  Fritz Lekschas
     * @date  2015-12-04
     *
     * @method  links
     * @memberOf  ListGraph
     * @public
     * @category  Data
     * @param  {Integer}  startLevel  Start level for returning links. If `to` is
     *   not specified that only links from `start` level are returned.
     * @param  {Integer}  endLevel  End level for returning links. So all links
     *   from `start` to `to` (including) will be returned
     * @return  {Array}  Array of objects containing the information for outgoing
     *   links.
     */

  }, {
    key: 'links',
    value: function links(startLevel, endLevel) {
      var allLinks = [];

      var keys = [];

      if (!isFinite(startLevel)) {
        keys = Object.keys(this.data);
      } else {
        var normStartLevel = Math.max(startLevel, 0);
        var normEndLevel = isFinite(endLevel) ? Math.min(endLevel, Object.keys(this.columnCache).length) : normStartLevel + 1;

        for (var i = normStartLevel; i < normEndLevel; i++) {
          keys = keys.concat(Object.keys(this.columnCache[i]));
        }
      }

      for (var _i = keys.length; _i--;) {
        if (this.data[keys[_i]].links) {
          allLinks = allLinks.concat(this.data[keys[_i]].links.outgoing.refs);
        }
      }

      return allLinks;
    }

    /**
     * Offset one end of all links per level vertically.
     *
     * @author  Fritz Lekschas
     * @date    2015-11-18
     *
     * @method  offsetLinks
     * @memberOf  ListGraph
     * @public
     * @category  Links
     * @param  {Integer}  level  If given get's only links of a certain level. The
     *   level of a node is relative to the length of the shortest path to the
     *   root node.
     * @param  {Number}  offsetY  The amount that one end of the link should be
     *   offset vertically.
     * @param  {String}  nodeType  Defines which end of the link should be
     *   shifted. This can either be `source` or `traget`.
     * @return  {Array}  Array of objects containing the information of the
     *   modified outgoing links.
     */

  }, {
    key: 'offsetLinks',
    value: function offsetLinks(level, offsetY, nodeType) {
      var links = this.links(level);

      if ((nodeType === 'source' || nodeType === 'target') && isFinite(offsetY)) {
        for (var i = links.length; i--;) {
          links[i][nodeType].offsetY = offsetY;
        }
      }

      return links;
    }

    /**
     * Set or get the grid configuration.
     *
     * @author  Fritz Lekschas
     * @date    2015-11-10
     *
     * @method  grid
     * @memberOf  ListGraph
     * @public
     * @chainable
     * @category  Data
     * @param  {Array|Object}  newGrid  New grid configuration. Can either be an
     *   Array, e.g. `[5,3]` or an Object, e.g. `{columns: 5, rows: 3}`.
     * @return  {Object}  Self.
     */

  }, {
    key: 'grid',
    value: function grid(newGrid) {
      if (!newGrid) {
        return _grid;
      }

      if (isArray(newGrid)) {
        _grid.columns = parseInt(newGrid[0], 10) || _grid.columns;
        _grid.rows = parseInt(newGrid[1], 10) || _grid.rows;
        this.updateScaling();
      }

      if (isObject(newGrid)) {
        _grid.columns = parseInt(newGrid.columns, 10) || _grid.columns;
        _grid.rows = parseInt(newGrid.rows, 10) || _grid.rows;
        this.updateScaling();
      }

      return this;
    }
  }, {
    key: 'updateBars',
    value: function updateBars(graph) {
      var nodesId = Object.keys(graph);
      var barsData = [];

      for (var i = nodesId.length; i--;) {
        for (var j = graph[nodesId[i]].data.bars.length; j--;) {
          barsData.push({
            barId: nodesId[i] + '.' + graph[nodesId[i]].data.bars[j].id,
            id: graph[nodesId[i]].data.bars[j].id,
            value: graph[nodesId[i]].data.bars[j].value
          });
        }
      }

      return barsData;
    }

    /**
     * Update vertical position when filtering, i.e. hiding, nodes.
     *
     * @method  updateNodeVisibility
     * @author  Fritz Lekschas
     * @date    2016-01-17
     */

  }, {
    key: 'updateNodesVisibility',
    value: function updateNodesVisibility() {
      var skipped = void 0;

      for (var i = Object.keys(this.columnCache).length; i--;) {
        skipped = 0;
        // Update `y` according to the number of previously skipped nodes.
        for (var j = 0, len = this.columnNodeOrder[i].length; j < len; j++) {
          if (this.columnNodeOrder[i][j].hidden && !this.columnNodeOrder[i][j].data.queryMode) {
            skipped++;
          }
          this.columnNodeOrder[i][j].y = this.scale.y(j - skipped);
        }
      }

      return this;
    }

    /**
     * Updates scaling according to the size and grid configuration.
     *
     * @author  Fritz Lekschas
     * @date  2015-11-10
     *
     * @method  updateScaling
     * @memberOf  ListGraph
     * @public
     * @chainable
     * @return  {Object}  Self.
     */

  }, {
    key: 'updateScaling',
    value: function updateScaling() {
      this.scale.x.domain([0, _grid.columns]).range([0, _size.width]);
      this.scale.y.domain([0, _grid.rows]).range([0, _size.height]);

      _columnWidth = _size.width / _grid.columns;
      _rowHeight = _size.height / _grid.rows;

      _colAbsPadding = _columnWidth * _colRelPadding;
      _colAbsContentWidth = _columnWidth * (1 - 2 * _colRelPadding);

      _rowAbsPadding = Math.max(_rowHeight * _rowRelPadding, 2);
      _rowAbsContentHeight = _rowHeight - 2 * _rowAbsPadding;

      _cellAbsInnerPadding = _cellRelInnerPadding * Math.min(_colAbsContentWidth, _rowAbsContentHeight, 1);

      return this;
    }

    /**
     * Set or get the size of the layout.
     *
     * @author  Fritz Lekschas
     * @date  2015-11-10
     *
     * @method  size
     * @memberOf  ListGraph
     * @public
     * @chainable
     * @param  {Array|Object}  newSize  New size. Can either be an Array, e.g.
     *   `[200, 20]` or an Object, e.g. `{width: 200, height: 20}`.
     * @return  {Object}  Self.
     */

  }, {
    key: 'size',
    value: function size(newSize) {
      if (!newSize) {
        return _size;
      }

      if (isArray(newSize)) {
        _size.width = parseInt(newSize[0], 10) || _size.width;
        _size.height = parseInt(newSize[1], 10) || _size.height;
        this.updateScaling();
      }

      if (isObject(newSize)) {
        _size.width = parseInt(newSize.width, 10) || _size.width;
        _size.height = parseInt(newSize.height, 10) || _size.height;
        this.updateScaling();
      }

      return this;
    }

    /**
     * Set or get the relative width of the content area of a node.
     *
     * @author  Fritz Lekschas
     * @date  2015-11-17
     *
     * @method  columnPadding
     * @memberOf  ListGraph
     * @public
     * @chainable
     * @param  {Number}  padding  Number in [0.1, 0.66].
     * @param  {Boolean}  absolute  If `true` `padding` is regarded to be an
     *   absolute number. Otherwise a relative number is assumed.
     * @return  {Number|Object}  When `padding` is passed `this` will be returned
     *   for chaining. Otherwise the current padding of columns will be returned.
     */

  }, {
    key: 'columnPadding',
    value: function columnPadding(padding, absolute) {
      if (!padding) {
        return _colRelPadding;
      }

      if (isFinite(padding)) {
        var relPadding = padding;
        if (absolute && isFinite(_columnWidth)) {
          relPadding = padding / _columnWidth;
        }
        _colRelPadding = Math.max(Math.min(relPadding, 0.66), 0.1);
        this.updateScaling();
      }

      return this;
    }

    /**
     * Set or get the relative width of the content area of a node.
     *
     * @author  Fritz Lekschas
     * @date  2015-11-17
     *
     * @method  rowPadding
     * @memberOf  ListGraph
     * @public
     * @chainable
     * @param  {Number}  padding  Number in [0, 0.5].
     * @param  {Boolean}  absolute  If `true` `padding` is regarded to be an
     *   absolute number. Otherwise a relative number is assumed.
     * @return  {Number|Object}  When `padding` is passed `this` will be returned
     *   for chaining. Otherwise the current padding of rows will be returned.
     */

  }, {
    key: 'rowPadding',
    value: function rowPadding(padding, absolute) {
      if (!padding) {
        return _rowRelPadding;
      }

      if (isFinite(padding)) {
        var relPadding = padding;
        if (absolute && isFinite(_rowHeight)) {
          relPadding = padding / _rowHeight;
        }
        _rowRelPadding = Math.max(Math.min(relPadding, 0.5), 0);
        this.updateScaling();
      }

      return this;
    }
  }]);
  return ListGraphLayout;
}();

exports.listGraph = ListGraphLayout;

Object.defineProperty(exports, '__esModule', { value: true });

})));