;(function(){

/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module._resolving && !module.exports) {
    var mod = {};
    mod.exports = {};
    mod.client = mod.component = true;
    module._resolving = true;
    module.call(this, mod.exports, require.relative(resolved), mod);
    delete module._resolving;
    module.exports = mod.exports;
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("component-emitter/index.js", function(exports, require, module){

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

});
require.register("component-clone/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var type;

try {
  type = require('type');
} catch(e){
  type = require('type-component');
}

/**
 * Module exports.
 */

module.exports = clone;

/**
 * Clones objects.
 *
 * @param {Mixed} any object
 * @api public
 */

function clone(obj){
  switch (type(obj)) {
    case 'object':
      var copy = {};
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          copy[key] = clone(obj[key]);
        }
      }
      return copy;

    case 'array':
      var copy = new Array(obj.length);
      for (var i = 0, l = obj.length; i < l; i++) {
        copy[i] = clone(obj[i]);
      }
      return copy;

    case 'regexp':
      // from millermedeiros/amd-utils - MIT
      var flags = '';
      flags += obj.multiline ? 'm' : '';
      flags += obj.global ? 'g' : '';
      flags += obj.ignoreCase ? 'i' : '';
      return new RegExp(obj.source, flags);

    case 'date':
      return new Date(obj.getTime());

    default: // string, number, boolean, …
      return obj;
  }
}

});
require.register("component-type/index.js", function(exports, require, module){

/**
 * toString ref.
 */

var toString = Object.prototype.toString;

/**
 * Return the type of `val`.
 *
 * @param {Mixed} val
 * @return {String}
 * @api public
 */

module.exports = function(val){
  switch (toString.call(val)) {
    case '[object Function]': return 'function';
    case '[object Date]': return 'date';
    case '[object RegExp]': return 'regexp';
    case '[object Arguments]': return 'arguments';
    case '[object Array]': return 'array';
    case '[object String]': return 'string';
  }

  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (val && val.nodeType === 1) return 'element';
  if (val === Object(val)) return 'object';

  return typeof val;
};

});
require.register("component-indexof/index.js", function(exports, require, module){
module.exports = function(arr, obj){
  if (arr.indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
});
require.register("bmcmahen-ordered-dictionary/index.js", function(exports, require, module){
// Modules
var indexOf = require('indexof'),
		Emitter = require('emitter');

var OrderedDictonary = function(attr){
	if (!(this instanceof OrderedDictonary))
		return new OrderedDictonary(attr);

	this.map = {};
	this.array = [];

	if (typeof attr === 'object')
		this.set(attr);
};

module.exports = OrderedDictonary;

Emitter(OrderedDictonary.prototype);

// Allow both 'key', 'value' and {key: value} style arguments.
OrderedDictonary.prototype.set = function(key, val){
	var attr, attrs;
	if (typeof key === 'object') attrs = key;
	else (attrs = {})[key] = val;
	for (attr in attrs) {
		if (attr in this.map) this.map[attr] = attrs[attr];
		else {
			this.array.push(attr);
			this.map[attr] = attrs[attr];
			this.emit('enter', attrs[attr]);
		}
	}
	return this;
};

OrderedDictonary.prototype.remove = function(key) {
	var index = indexOf(this.array, key);
	if (index === -1) throw new Error('Key doesnt exist');
	this.emit('exit', this.map[key]);
	this.array.splice(index, 1);
	delete this.map[key];
};

OrderedDictonary.prototype.get = function(key){
	return this.map[key];
};

OrderedDictonary.prototype.at = function(index){
	return this.map[this.array[index]];
};

OrderedDictonary.prototype.length = function(){
	return this.array.length;
};

// Iterates through our array, providing the key, value,
// and index of the field.
OrderedDictonary.prototype.forEach = function(fn){
	var key, value;
	for (var i = 0, len = this.array.length; i < len; i++) {
		key = this.array[i];
		value = this.map[key];
		fn(key, value, i);
	}
	return this;
};

OrderedDictonary.prototype.sort = function(fn){
	var _this = this;
	this.array.sort(function(left, right){
		return fn(_this.map[left], _this.map[right]);
	});
	return this;
};

OrderedDictonary.prototype.clear = function(){
	this.map = {};
	this.array = [];
	return this;
};
});
require.register("component-has-translate3d/index.js", function(exports, require, module){

var prop = require('transform-property');
// IE8<= doesn't have `getComputedStyle`
if (!prop || !window.getComputedStyle) return module.exports = false;

var map = {
  webkitTransform: '-webkit-transform',
  OTransform: '-o-transform',
  msTransform: '-ms-transform',
  MozTransform: '-moz-transform',
  transform: 'transform'
};

// from: https://gist.github.com/lorenzopolidori/3794226
var el = document.createElement('div');
el.style[prop] = 'translate3d(1px,1px,1px)';
document.body.insertBefore(el, null);
var val = getComputedStyle(el).getPropertyValue(map[prop]);
document.body.removeChild(el);
module.exports = null != val && val.length && 'none' != val;

});
require.register("component-transform-property/index.js", function(exports, require, module){

var styles = [
  'webkitTransform',
  'MozTransform',
  'msTransform',
  'OTransform',
  'transform'
];

var el = document.createElement('p');
var style;

for (var i = 0; i < styles.length; i++) {
  style = styles[i];
  if (null != el.style[style]) {
    module.exports = style;
    break;
  }
}

});
require.register("component-translate/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var transform = require('transform-property');
var has3d = require('has-translate3d');

/**
 * Expose `translate`.
 */

module.exports = translate;

/**
 * Translate `el` by `(x, y)`.
 *
 * @param {Element} el
 * @param {Number} x
 * @param {Number} y
 * @api public
 */

function translate(el, x, y){
  if (transform) {
    if (has3d) {
      el.style[transform] = 'translate3d(' + x + 'px,' + y + 'px, 0)';
    } else {
      el.style[transform] = 'translate(' + x + 'px,' + y + 'px)';
    }
  } else {
    el.style.left = x + 'px';
    el.style.top = y + 'px';
  }
};

});
require.register("wilsonpage-fastdom/index.js", function(exports, require, module){
/**
 * FastDom
 *
 * Eliminates layout thrashing
 * by batching DOM read/write
 * interactions.
 *
 * @author Wilson Page <wilsonpage@me.com>
 */

;(function(fastdom){

  'use strict';

  // Normalize rAF
  var raf = window.requestAnimationFrame
    || window.webkitRequestAnimationFrame
    || window.mozRequestAnimationFrame
    || window.msRequestAnimationFrame
    || function(cb) { return window.setTimeout(cb, 1000 / 60); };

  // Normalize cAF
  var caf = window.cancelAnimationFrame
    || window.cancelRequestAnimationFrame
    || window.mozCancelAnimationFrame
    || window.mozCancelRequestAnimationFrame
    || window.webkitCancelAnimationFrame
    || window.webkitCancelRequestAnimationFrame
    || window.msCancelAnimationFrame
    || window.msCancelRequestAnimationFrame
    || function(id) { window.clearTimeout(id); };

  /**
   * Creates a fresh
   * FastDom instance.
   *
   * @constructor
   */
  function FastDom() {
    this.frames = [];
    this.lastId = 0;

    // Placing the rAF method
    // on the instance allows
    // us to replace it with
    // a stub for testing.
    this.raf = raf;

    this.batch = {
      hash: {},
      read: [],
      write: [],
      mode: null
    };
  }

  /**
   * Adds a job to the
   * read batch and schedules
   * a new frame if need be.
   *
   * @param  {Function} fn
   * @api public
   */
  FastDom.prototype.read = function(fn, ctx) {
    var job = this.add('read', fn, ctx);
    var id = job.id;

    // Add this job to the read queue
    this.batch.read.push(job.id);

    // We should *not* schedule a new frame if:
    // 1. We're 'reading'
    // 2. A frame is already scheduled
    var doesntNeedFrame = this.batch.mode === 'reading'
      || this.batch.scheduled;

    // If a frame isn't needed, return
    if (doesntNeedFrame) return id;

    // Schedule a new
    // frame, then return
    this.scheduleBatch();
    return id;
  };

  /**
   * Adds a job to the
   * write batch and schedules
   * a new frame if need be.
   *
   * @param  {Function} fn
   * @api public
   */
  FastDom.prototype.write = function(fn, ctx) {
    var job = this.add('write', fn, ctx);
    var mode = this.batch.mode;
    var id = job.id;

    // Push the job id into the queue
    this.batch.write.push(job.id);

    // We should *not* schedule a new frame if:
    // 1. We are 'writing'
    // 2. We are 'reading'
    // 3. A frame is already scheduled.
    var doesntNeedFrame = mode === 'writing'
      || mode === 'reading'
      || this.batch.scheduled;

    // If a frame isn't needed, return
    if (doesntNeedFrame) return id;

    // Schedule a new
    // frame, then return
    this.scheduleBatch();
    return id;
  };

  /**
   * Defers the given job
   * by the number of frames
   * specified.
   *
   * If no frames are given
   * then the job is run in
   * the next free frame.
   *
   * @param  {Number}   frame
   * @param  {Function} fn
   * @api public
   */
  FastDom.prototype.defer = function(frame, fn, ctx) {

    // Accepts two arguments
    if (typeof frame === 'function') {
      ctx = fn;
      fn = frame;
      frame = 1;
    }

    var self = this;
    var index = frame - 1;

    return this.schedule(index, function() {
      self.run({
        fn: fn,
        ctx: ctx
      });
    });
  };

  /**
   * Clears a scheduled 'read',
   * 'write' or 'defer' job.
   *
   * @param  {Number} id
   * @api public
   */
  FastDom.prototype.clear = function(id) {

    // Defer jobs are cleared differently
    if (typeof id === 'function') {
      return this.clearFrame(id);
    }

    var job = this.batch.hash[id];
    if (!job) return;

    var list = this.batch[job.type];
    var index = list.indexOf(id);

    // Clear references
    delete this.batch.hash[id];
    if (~index) list.splice(index, 1);
  };

  /**
   * Clears a scheduled frame.
   *
   * @param  {Function} frame
   * @api private
   */
  FastDom.prototype.clearFrame = function(frame) {
    var index = this.frames.indexOf(frame);
    if (~index) this.frames.splice(index, 1);
  };

  /**
   * Schedules a new read/write
   * batch if one isn't pending.
   *
   * @api private
   */
  FastDom.prototype.scheduleBatch = function() {
    var self = this;

    // Schedule batch for next frame
    this.schedule(0, function() {
      self.batch.scheduled = false;
      self.runBatch();
    });

    // Set flag to indicate
    // a frame has been scheduled
    this.batch.scheduled = true;
  };

  /**
   * Generates a unique
   * id for a job.
   *
   * @return {Number}
   * @api private
   */
  FastDom.prototype.uniqueId = function() {
    return ++this.lastId;
  };

  /**
   * Calls each job in
   * the list passed.
   *
   * If a context has been
   * stored on the function
   * then it is used, else the
   * current `this` is used.
   *
   * @param  {Array} list
   * @api private
   */
  FastDom.prototype.flush = function(list) {
    var id;

    while (id = list.shift()) {
      this.run(this.batch.hash[id]);
    }
  };

  /**
   * Runs any 'read' jobs followed
   * by any 'write' jobs.
   *
   * We run this inside a try catch
   * so that if any jobs error, we
   * are able to recover and continue
   * to flush the batch until it's empty.
   *
   * @api private
   */
  FastDom.prototype.runBatch = function() {
    try {

      // Set the mode to 'reading',
      // then empty all read jobs
      this.batch.mode = 'reading';
      this.flush(this.batch.read);

      // Set the mode to 'writing'
      // then empty all write jobs
      this.batch.mode = 'writing';
      this.flush(this.batch.write);

      this.batch.mode = null;

    } catch (e) {
      this.runBatch();
      throw e;
    }
  };

  /**
   * Adds a new job to
   * the given batch.
   *
   * @param {Array}   list
   * @param {Function} fn
   * @param {Object}   ctx
   * @returns {Number} id
   * @api private
   */
  FastDom.prototype.add = function(type, fn, ctx) {
    var id = this.uniqueId();
    return this.batch.hash[id] = {
      id: id,
      fn: fn,
      ctx: ctx,
      type: type
    };
  };

  /**
   * Runs a given job.
   *
   * Applications using FastDom
   * have the options of setting
   * `fastdom.onError`.
   *
   * This will catch any
   * errors that may throw
   * inside callbacks, which
   * is useful as often DOM
   * nodes have been removed
   * since a job was scheduled.
   *
   * Example:
   *
   *   fastdom.onError = function(e) {
   *     // Runs when jobs error
   *   };
   *
   * @param  {Object} job
   * @api private
   */
  FastDom.prototype.run = function(job){
    var ctx = job.ctx || this;
    var fn = job.fn;

    // Clear reference to the job
    delete this.batch.hash[job.id];

    // If no `onError` handler
    // has been registered, just
    // run the job normally.
    if (!this.onError) {
      return fn.call(ctx);
    }

    // If an `onError` handler
    // has been registered, catch
    // errors that throw inside
    // callbacks, and run the
    // handler instead.
    try { fn.call(ctx); } catch (e) {
      this.onError(e);
    }
  };

  /**
   * Starts a rAF loop
   * to empty the frame queue.
   *
   * @api private
   */
  FastDom.prototype.loop = function() {
    var self = this;
    var raf = this.raf;

    // Don't start more than one loop
    if (this.looping) return;

    raf(function frame() {
      var fn = self.frames.shift();

      // If no more frames,
      // stop looping
      if (!self.frames.length) {
        self.looping = false;

      // Otherwise, schedule the
      // next frame
      } else {
        raf(frame);
      }

      // Run the frame.  Note that
      // this may throw an error
      // in user code, but all
      // fastdom tasks are dealt
      // with already so the code
      // will continue to iterate
      if (fn) fn();
    });

    this.looping = true;
  };

  /**
   * Adds a function to
   * a specified index
   * of the frame queue.
   *
   * @param  {Number}   index
   * @param  {Function} fn
   * @return {Function}
   */
  FastDom.prototype.schedule = function(index, fn) {

    // Make sure this slot
    // hasn't already been
    // taken. If it has, try
    // re-scheduling for the next slot
    if (this.frames[index]) {
      return this.schedule(index + 1, fn);
    }

    // Start the rAF
    // loop to empty
    // the frame queue
    this.loop();

    // Insert this function into
    // the frames queue and return
    return this.frames[index] = fn;
  };

  // We only ever want there to be
  // one instance of FastDom in an app
  fastdom = fastdom || new FastDom();

  /**
   * Expose 'fastdom'
   */

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = fastdom;
  } else if (typeof define === 'function' && define.amd) {
    define(function(){ return fastdom; });
  } else {
    window['fastdom'] = fastdom;
  }

})(window.fastdom);

});
require.register("component-props/index.js", function(exports, require, module){
/**
 * Global Names
 */

var globals = /\b(this|Array|Date|Object|Math|JSON)\b/g;

/**
 * Return immediate identifiers parsed from `str`.
 *
 * @param {String} str
 * @param {String|Function} map function or prefix
 * @return {Array}
 * @api public
 */

module.exports = function(str, fn){
  var p = unique(props(str));
  if (fn && 'string' == typeof fn) fn = prefixed(fn);
  if (fn) return map(str, p, fn);
  return p;
};

/**
 * Return immediate identifiers in `str`.
 *
 * @param {String} str
 * @return {Array}
 * @api private
 */

function props(str) {
  return str
    .replace(/\.\w+|\w+ *\(|"[^"]*"|'[^']*'|\/([^/]+)\//g, '')
    .replace(globals, '')
    .match(/[$a-zA-Z_]\w*/g)
    || [];
}

/**
 * Return `str` with `props` mapped with `fn`.
 *
 * @param {String} str
 * @param {Array} props
 * @param {Function} fn
 * @return {String}
 * @api private
 */

function map(str, props, fn) {
  var re = /\.\w+|\w+ *\(|"[^"]*"|'[^']*'|\/([^/]+)\/|[a-zA-Z_]\w*/g;
  return str.replace(re, function(_){
    if ('(' == _[_.length - 1]) return fn(_);
    if (!~props.indexOf(_)) return _;
    return fn(_);
  });
}

/**
 * Return unique array.
 *
 * @param {Array} arr
 * @return {Array}
 * @api private
 */

function unique(arr) {
  var ret = [];

  for (var i = 0; i < arr.length; i++) {
    if (~ret.indexOf(arr[i])) continue;
    ret.push(arr[i]);
  }

  return ret;
}

/**
 * Map with prefix `str`.
 */

function prefixed(str) {
  return function(_){
    return str + _;
  };
}

});
require.register("component-to-function/index.js", function(exports, require, module){
/**
 * Module Dependencies
 */

var expr = require('props');

/**
 * Expose `toFunction()`.
 */

module.exports = toFunction;

/**
 * Convert `obj` to a `Function`.
 *
 * @param {Mixed} obj
 * @return {Function}
 * @api private
 */

function toFunction(obj) {
  switch ({}.toString.call(obj)) {
    case '[object Object]':
      return objectToFunction(obj);
    case '[object Function]':
      return obj;
    case '[object String]':
      return stringToFunction(obj);
    case '[object RegExp]':
      return regexpToFunction(obj);
    default:
      return defaultToFunction(obj);
  }
}

/**
 * Default to strict equality.
 *
 * @param {Mixed} val
 * @return {Function}
 * @api private
 */

function defaultToFunction(val) {
  return function(obj){
    return val === obj;
  }
}

/**
 * Convert `re` to a function.
 *
 * @param {RegExp} re
 * @return {Function}
 * @api private
 */

function regexpToFunction(re) {
  return function(obj){
    return re.test(obj);
  }
}

/**
 * Convert property `str` to a function.
 *
 * @param {String} str
 * @return {Function}
 * @api private
 */

function stringToFunction(str) {
  // immediate such as "> 20"
  if (/^ *\W+/.test(str)) return new Function('_', 'return _ ' + str);

  // properties such as "name.first" or "age > 18" or "age > 18 && age < 36"
  return new Function('_', 'return ' + get(str));
}

/**
 * Convert `object` to a function.
 *
 * @param {Object} object
 * @return {Function}
 * @api private
 */

function objectToFunction(obj) {
  var match = {}
  for (var key in obj) {
    match[key] = typeof obj[key] === 'string'
      ? defaultToFunction(obj[key])
      : toFunction(obj[key])
  }
  return function(val){
    if (typeof val !== 'object') return false;
    for (var key in match) {
      if (!(key in val)) return false;
      if (!match[key](val[key])) return false;
    }
    return true;
  }
}

/**
 * Built the getter function. Supports getter style functions
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

function get(str) {
  var props = expr(str);
  if (!props.length) return '_.' + str;

  var val;
  for(var i = 0, prop; prop = props[i]; i++) {
    val = '_.' + prop;
    val = "('function' == typeof " + val + " ? " + val + "() : " + val + ")";
    str = str.replace(new RegExp(prop, 'g'), val);
  }

  return str;
}

});
require.register("component-each/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var type = require('type');
var toFunction = require('to-function');

/**
 * HOP reference.
 */

var has = Object.prototype.hasOwnProperty;

/**
 * Iterate the given `obj` and invoke `fn(val, i)`
 * in optional context `ctx`.
 *
 * @param {String|Array|Object} obj
 * @param {Function} fn
 * @param {Object} [ctx]
 * @api public
 */

module.exports = function(obj, fn, ctx){
  fn = toFunction(fn);
  ctx = ctx || this;
  switch (type(obj)) {
    case 'array':
      return array(obj, fn, ctx);
    case 'object':
      if ('number' == typeof obj.length) return array(obj, fn, ctx);
      return object(obj, fn, ctx);
    case 'string':
      return string(obj, fn, ctx);
  }
};

/**
 * Iterate string chars.
 *
 * @param {String} obj
 * @param {Function} fn
 * @param {Object} ctx
 * @api private
 */

function string(obj, fn, ctx) {
  for (var i = 0; i < obj.length; ++i) {
    fn.call(ctx, obj.charAt(i), i);
  }
}

/**
 * Iterate object keys.
 *
 * @param {Object} obj
 * @param {Function} fn
 * @param {Object} ctx
 * @api private
 */

function object(obj, fn, ctx) {
  for (var key in obj) {
    if (has.call(obj, key)) {
      fn.call(ctx, key, obj[key]);
    }
  }
}

/**
 * Iterate array-ish.
 *
 * @param {Array|Object} obj
 * @param {Function} fn
 * @param {Object} ctx
 * @api private
 */

function array(obj, fn, ctx) {
  for (var i = 0; i < obj.length; ++i) {
    fn.call(ctx, obj[i], i);
  }
}

});
require.register("component-classes/index.js", function(exports, require, module){
/**
 * Module dependencies.
 */

var index = require('indexof');

/**
 * Whitespace regexp.
 */

var re = /\s+/;

/**
 * toString reference.
 */

var toString = Object.prototype.toString;

/**
 * Wrap `el` in a `ClassList`.
 *
 * @param {Element} el
 * @return {ClassList}
 * @api public
 */

module.exports = function(el){
  return new ClassList(el);
};

/**
 * Initialize a new ClassList for `el`.
 *
 * @param {Element} el
 * @api private
 */

function ClassList(el) {
  if (!el) throw new Error('A DOM element reference is required');
  this.el = el;
  this.list = el.classList;
}

/**
 * Add class `name` if not already present.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.add = function(name){
  // classList
  if (this.list) {
    this.list.add(name);
    return this;
  }

  // fallback
  var arr = this.array();
  var i = index(arr, name);
  if (!~i) arr.push(name);
  this.el.className = arr.join(' ');
  return this;
};

/**
 * Remove class `name` when present, or
 * pass a regular expression to remove
 * any which match.
 *
 * @param {String|RegExp} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.remove = function(name){
  if ('[object RegExp]' == toString.call(name)) {
    return this.removeMatching(name);
  }

  // classList
  if (this.list) {
    this.list.remove(name);
    return this;
  }

  // fallback
  var arr = this.array();
  var i = index(arr, name);
  if (~i) arr.splice(i, 1);
  this.el.className = arr.join(' ');
  return this;
};

/**
 * Remove all classes matching `re`.
 *
 * @param {RegExp} re
 * @return {ClassList}
 * @api private
 */

ClassList.prototype.removeMatching = function(re){
  var arr = this.array();
  for (var i = 0; i < arr.length; i++) {
    if (re.test(arr[i])) {
      this.remove(arr[i]);
    }
  }
  return this;
};

/**
 * Toggle class `name`, can force state via `force`.
 *
 * For browsers that support classList, but do not support `force` yet,
 * the mistake will be detected and corrected.
 *
 * @param {String} name
 * @param {Boolean} force
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.toggle = function(name, force){
  // classList
  if (this.list) {
    if ("undefined" !== typeof force) {
      if (force !== this.list.toggle(name, force)) {
        this.list.toggle(name); // toggle again to correct
      }
    } else {
      this.list.toggle(name);
    }
    return this;
  }

  // fallback
  if ("undefined" !== typeof force) {
    if (!force) {
      this.remove(name);
    } else {
      this.add(name);
    }
  } else {
    if (this.has(name)) {
      this.remove(name);
    } else {
      this.add(name);
    }
  }

  return this;
};

/**
 * Return an array of classes.
 *
 * @return {Array}
 * @api public
 */

ClassList.prototype.array = function(){
  var str = this.el.className.replace(/^\s+|\s+$/g, '');
  var arr = str.split(re);
  if ('' === arr[0]) arr.shift();
  return arr;
};

/**
 * Check if class `name` is present.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.has =
ClassList.prototype.contains = function(name){
  return this.list
    ? this.list.contains(name)
    : !! ~index(this.array(), name);
};

});
require.register("anthonyshort-has-transitions/index.js", function(exports, require, module){
/**
 * This will store the property that the current
 * browser uses for transitionDuration
 */
var property;

/**
 * The properties we'll check on an element
 * to determine if it actually has transitions
 * We use duration as this is the only property
 * needed to technically have transitions
 * @type {Array}
 */
var types = [
  "transitionDuration",
  "MozTransitionDuration",
  "webkitTransitionDuration"
];

/**
 * Determine the correct property for this browser
 * just once so we done need to check every time
 */
while(types.length) {
  var type = types.shift();
  if(type in document.body.style) {
    property = type;
  }
}

/**
 * Determine if the browser supports transitions or
 * if an element has transitions at all.
 * @param  {Element}  el Optional. Returns browser support if not included
 * @return {Boolean}
 */
function hasTransitions(el){
  if(!property) {
    return false; // No browser support for transitions
  }
  if(!el) {
    return property != null; // We just want to know if browsers support it
  }
  var duration = getComputedStyle(el)[property];
  return duration !== "" && parseFloat(duration) !== 0; // Does this element have transitions?
}

module.exports = hasTransitions;
});
require.register("component-event/index.js", function(exports, require, module){
var bind = window.addEventListener ? 'addEventListener' : 'attachEvent',
    unbind = window.removeEventListener ? 'removeEventListener' : 'detachEvent',
    prefix = bind !== 'addEventListener' ? 'on' : '';

/**
 * Bind `el` event `type` to `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.bind = function(el, type, fn, capture){
  el[bind](prefix + type, fn, capture || false);
  return fn;
};

/**
 * Unbind `el` event `type`'s callback `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.unbind = function(el, type, fn, capture){
  el[unbind](prefix + type, fn, capture || false);
  return fn;
};
});
require.register("anthonyshort-css-emitter/index.js", function(exports, require, module){
/**
 * Module Dependencies
 */

var events = require('event');

// CSS events

var watch = [
  'transitionend'
, 'webkitTransitionEnd'
, 'oTransitionEnd'
, 'MSTransitionEnd'
, 'animationend'
, 'webkitAnimationEnd'
, 'oAnimationEnd'
, 'MSAnimationEnd'
];

/**
 * Expose `CSSnext`
 */

module.exports = CssEmitter;

/**
 * Initialize a new `CssEmitter`
 *
 */

function CssEmitter(element){
  if (!(this instanceof CssEmitter)) return new CssEmitter(element);
  this.el = element;
}

/**
 * Bind CSS events.
 *
 * @api public
 */

CssEmitter.prototype.bind = function(fn){
  for (var i=0; i < watch.length; i++) {
    events.bind(this.el, watch[i], fn);
  }
  return this;
};

/**
 * Unbind CSS events
 * 
 * @api public
 */

CssEmitter.prototype.unbind = function(fn){
  for (var i=0; i < watch.length; i++) {
    events.unbind(this.el, watch[i], fn);
  }
  return this;
};

/**
 * Fire callback only once
 * 
 * @api public
 */

CssEmitter.prototype.once = function(fn){
  var self = this;
  function on(){
    self.unbind(on);
    fn.apply(self.el, arguments);
  }
  self.bind(on);
  return this;
};


});
require.register("anthonyshort-after-transition/index.js", function(exports, require, module){
var hasTransitions = require('has-transitions');
var emitter = require('css-emitter');

function afterTransition(el, callback) {
  if(hasTransitions(el)) {
    return emitter(el).bind(callback);
  }
  return callback.apply(el);
};

afterTransition.once = function(el, callback) {
  afterTransition(el, function fn(){
    callback.apply(el);
    emitter(el).unbind(fn);
  });
};

module.exports = afterTransition;
});
require.register("yields-empty/index.js", function(exports, require, module){

/**
 * Empty the given `el`.
 * 
 * @param {Element} el
 * @return {Element}
 */

module.exports = function(el, node){
  while (node = el.firstChild) el.removeChild(node);
  return el;
};

});
require.register("component-domify/index.js", function(exports, require, module){

/**
 * Expose `parse`.
 */

module.exports = parse;

/**
 * Wrap map from jquery.
 */

var map = {
  legend: [1, '<fieldset>', '</fieldset>'],
  tr: [2, '<table><tbody>', '</tbody></table>'],
  col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],
  _default: [0, '', '']
};

map.td =
map.th = [3, '<table><tbody><tr>', '</tr></tbody></table>'];

map.option =
map.optgroup = [1, '<select multiple="multiple">', '</select>'];

map.thead =
map.tbody =
map.colgroup =
map.caption =
map.tfoot = [1, '<table>', '</table>'];

map.text =
map.circle =
map.ellipse =
map.line =
map.path =
map.polygon =
map.polyline =
map.rect = [1, '<svg xmlns="http://www.w3.org/2000/svg" version="1.1">','</svg>'];

/**
 * Parse `html` and return the children.
 *
 * @param {String} html
 * @return {Array}
 * @api private
 */

function parse(html) {
  if ('string' != typeof html) throw new TypeError('String expected');
  
  // tag name
  var m = /<([\w:]+)/.exec(html);
  if (!m) return document.createTextNode(html);

  html = html.replace(/^\s+|\s+$/g, ''); // Remove leading/trailing whitespace

  var tag = m[1];

  // body support
  if (tag == 'body') {
    var el = document.createElement('html');
    el.innerHTML = html;
    return el.removeChild(el.lastChild);
  }

  // wrap map
  var wrap = map[tag] || map._default;
  var depth = wrap[0];
  var prefix = wrap[1];
  var suffix = wrap[2];
  var el = document.createElement('div');
  el.innerHTML = prefix + html + suffix;
  while (depth--) el = el.lastChild;

  // one element
  if (el.firstChild == el.lastChild) {
    return el.removeChild(el.firstChild);
  }

  // several elements
  var fragment = document.createDocumentFragment();
  while (el.firstChild) {
    fragment.appendChild(el.removeChild(el.firstChild));
  }

  return fragment;
}

});
require.register("cast/index.js", function(exports, require, module){
/**
 * Module dependencies
 */

var Emitter = require('emitter');
var Dict = require('ordered-dictionary');
var fastdom = require('fastdom');
var type = require('type');
var Block = require('./block');
var empty = require('empty');

module.exports = Cast;

/**
 * Cast
 * @param {Element} wrapper 
 */

function Cast(wrapper, template){
  if (!(this instanceof Cast)) return new Cast(wrapper, template);
  this.wrapper = wrapper;
  this.template = template;
  this.wrapperWidth = this.wrapper.clientWidth;
  this.el = document.createElement('div');
  this.el.className = 'Cast';
  this.collection = new Dict();
  this.collection.on('enter', this.renderNew.bind(this));
  this.collection.on('exit', this.removeOld.bind(this));
}

Emitter(Cast.prototype);

/**
 * Supply our Cast with a collection of documents. If a unique identifier is
 * supplied, then we can efficiently update, add, and remove models on subsequent
 * .data() calls. If we don't have a uid, then reset collection.
 * 
 * @param  {Object}   attr 
 * @param  {Function|String} fn   unique id
 * @return {Cast}        
 */

Cast.prototype.data = function(docs, fn) {
  if (!fn) throw new Error('Unique id required');

  var len = this.collection.length();
  var keys = [];
  var isFn = (type(fn) === 'function');

  // Either update our model, or make a new one for each docsibute
  // that we have passed.
  for ( var i = 0, l = docs.length; i < l; i++ ){
    var key = isFn ? fn(docs[i]) : docs[i][fn];
    var model = this.collection.get(key);
    keys.push(key);
    if (model) model.set(docs[i]);
    else this.collection.set(key, new Block(docs[i], this));
  }

  // If running .data() multiple times, remove any attributes
  // that were not contained in subsequent calls. This is fugly. Yoiks.
  if (len) {
    var toRemove = [];
    this.collection.forEach(function(key, model, i){
      if (keys.indexOf(key) === -1 ) toRemove.push(key);
    });
    for (var x = 0, length = toRemove.length; x < length; x++){
      this.collection.remove(toRemove[x]);
    }
  }
  return this;
};

/**
 * return the JSON of our Cast.
 * 
 * @return {Array} 
 */

Cast.prototype.toJSON = function(){
  var json = [];
  this.collection.forEach(function(key, value){
    json.push(value.toJSON());
  });
  return json;
};


/**
 * Reset Cast with given docs.
 * 
 * @param  {Array|Object}   attr 
 * @param  {Function|String} fn   
 * @return {Cast}        
 */

Cast.prototype.reset = function(docs, fn){
  this.collection.clear();
  this.add(docs, fn);
  return this;
};

/**
 * Add item with optional uid.
 * 
 * @param {Object|Array}   attr 
 * @param {Function|String} fn   
 */

Cast.prototype.add = function(docs, fn){
  if (type(docs) !== 'array') docs = [docs];
  if (!fn) throw new Error('Unique id required');
  var isFn = type(fn) === 'function';
  for (var i = 0, l = docs.length; i < l; i++){
    var key = isFn ? fn(docs[i]) : docs[i][fn];
    var val = new Block(docs[i], this);
    this.collection.set(key, val);
  }
  return this;
};

/**
 * Remove item given a unique id.
 * 
 * @param  {String} key 
 * @return {Cast}     
 */

Cast.prototype.remove = function(uid){
  this.collection.remove(uid);
  return this;
};



/**
 * Remove any left/right padding from the container.
 * 
 * @param  {Number} w  width
 * @param  {Number} h  height
 * @param  {Number} pw padding-width
 * @param  {Number} ph padding-height
 * @return {Cast}    
 */

Cast.prototype.justify = function(w, h, pw, ph){
  var cw = this.wrapperWidth;

  var bpr = Math.floor((cw - (pw * 2)) / (w + pw));

  var getLeft = function(c, r) {
    if (c === 0) return 0;
    if (c === bpr - 1) return cw - w;
    var remainingSpace = cw - (w * bpr);
    var padding = remainingSpace / (bpr - 1);
    return w + (c * padding) + ((c - 1) * w);
  };

  this.collection.forEach(function(key, block, i){
    var r = Math.floor(i / bpr);
    var c = i % bpr;
    var left = getLeft(c, r);
    var top = ((r * h) + (r + 1) * ph);

    block.position({
      'left': left,
      'top': top,
      'width': w,
      'height': h
    });
  });

  var t = this.collection.length();
  var wrapperHeight = Math.ceil(t / bpr) * (h + ph)  + ph;
  this.setHeight(wrapperHeight);
  return this;
};


/**
 * The left and right container padding is the 
 * dynamic property here.
 * 
 * @param  {Number} w  width
 * @param  {Number} h  height
 * @param  {Number} pw padding-width
 * @param  {Number} ph padding-height
 * @return {Cast}    
 */

Cast.prototype.center = function(w, h, pw, ph){
  var cw = this.wrapperWidth;
  var bpr = Math.floor(cw/(w + pw));
  var mx = (cw - (bpr * w) - (bpr - 1) * pw) * 0.5;

  this.collection.forEach(function(key, block, i){
    var r = Math.floor(i / bpr);
    var c = i % bpr;
    var left = mx + (c * (w + pw));
    var top = (r * h) + (r + 1) * ph;

    block.position({
      'left': left,
      'top': top,
      'width': w,
      'height': h
    });
  });

  var t = this.collection.length();
  var wrapperHeight = Math.ceil(t / bpr) * (h + ph)  + ph;
  this.setHeight(wrapperHeight);
  return this;
};


/**
 * Keep a constant padding-width & padding-height with
 * a dynamic cast-item width and height.
 * 
 * @param  {Number} w  width
 * @param  {Number} h  height
 * @param  {Number} pw padding-width
 * @param  {Number} ph padding-height
 * @return {Cast}    
 */

Cast.prototype.dynamic = function(w, h, pw, ph){
  var cw = this.wrapperWidth;
  var bpr = Math.floor(cw / ( w + pw ));
  var newWidth = (cw - (bpr * pw)) / bpr;
  var newHeight = ( newWidth / w ) * h;
  var mx = (cw - (bpr * newWidth) - (bpr - 1) * pw) * 0.5;

  // XXX This logic is the same as center(). Should we make
  // this a shared function?
  this.collection.forEach(function(id, block, i){
    var r = Math.floor(i / bpr);
    var c = i % bpr;
    var left = mx + (c * (newWidth + pw));
    var top = (r * newHeight) + (r + 1) * ph;

    block.position({
      'width': newWidth,
      'left': left,
      'top': top,
      'height': newHeight
    });
  });

  var t = this.collection.length();
  var wrapperHeight = Math.ceil(t / bpr) * (newHeight + ph)  + ph;
  this.setHeight(wrapperHeight);
  return this;
};

/**
 * List layout
 * 
 * @param  {Number} h  height
 * @param  {Number} ph padding-height
 * @return {Cast}    
 */

Cast.prototype.list = function(h, ph){

  this.collection.forEach(function(id, block, i){
    var top = (h + ph) * i;
    block.position({
      'left': 0,
      'top': top,
      'height': h
    });
  });

  this.setHeight(this.collection.length() * (h + ph));
  return this;
};

/**
 * Sort data by field
 * 
 * @param  {String} field  
 * @param  {Number} invert 
 * @return {Cast}        
 */

Cast.prototype.sortBy = function(field, invert){
  invert = invert || 1;

  this.collection.sort(function(left, right){
    var leftVal = left.attr[field];
    var rightVal = right.attr[field];
    if (leftVal < rightVal) return (-1 * invert);
    if (leftVal > rightVal) return (1 * invert);
    return 0;
  });

  return this;
};

/**
 * render new block
 * @param  {Block} block 
 */

Cast.prototype.renderNew = function(block){
  fastdom.write(function(){
    this.el.appendChild(block.el);
  }.bind(this));
};

/**
 * remove old block
 * @param  {Block} block 
 */

Cast.prototype.removeOld = function(block){
  fastdom.write(function(){
    block.hide(function(){
      block.remove();
    });
  }.bind(this));
};

/**
 * Set our cast.js height
 * @param {Number} height 
 */

Cast.prototype.setHeight = function(height){
  fastdom.write(function(){
    this.el.style.height = height + 'px';
  }.bind(this));
};


Cast.prototype.draw = function(template){
  this.template = template;
  empty(this.wrapper);
  this.wrapper.appendChild(this.el);
  return this;
};

});
require.register("cast/block.js", function(exports, require, module){
/**
 * Module dependencies
 */

var each = require('each');
var classes = require('classes');
var fastdom = require('fastdom');
var afterTransition = require('after-transition');
var domify = require('domify');
var type = require('type');
var empty = require('empty');
var clone = require('clone');
var translate = require('translate');

/**
 * expose Block
 */

module.exports = Block;

/**
 * Block
 * @param {Object} attr 
 * @param {Cast} cast 
 */

function Block(attr, cast){
  this.cast = cast;
  this.attr = {};
  this.pos = {};
  this.template = cast.template;
  this.el = document.createElement('div');
  this.classes = classes(this.el);
  this.el.className = 'Cast-item';
  this.rendered = false;
  this.hidden = false;
  this.set(attr);
  this.cast.emit('view-created', this);
}

/**
 * Set attributes
 * @param {Object} attr 
 */

Block.prototype.set = function(attr){
  var changed = false;
  if (!attr) return;

  var prev = clone(this.attr);

  each(attr, function(key){
    this.attr[key] = attr[key];
    if (this.attr[key] !== prev[key]) {
      changed = true;
    }
  }.bind(this));

  if (changed) this.render();
};

/**
 * Hide the block
 * @return {Block} 
 */

Block.prototype.hide = function(fn){
  if (this.hidden) return;
  fastdom.write(function(){
    if (fn) afterTransition.once(this.el, fn);
    this.classes.add('hidden');
    this.el.setAttribute('aria-hidden', true);
  }.bind(this));
  this.hidden = true;
  return this;
};

/**
 * Show the block
 * @return {Block} 
 */

Block.prototype.show = function(){
  if (!this.hidden) return;
  fastdom.write(function(){
    this.classes.remove('hidden');
    this.el.setAttribute('aria-hidden', false);
  }.bind(this));
  this.hidden = false;
  return this;
};

/**
 * Render block with template
 * @return {Block} 
 */

Block.prototype.render = function(){
  var tmp = this.template(this.attr, this.el);
  var content = (type(tmp) === 'string') ? domify(tmp) : tmp;
  fastdom.write(function(){
    empty(this.el);
    this.el.appendChild(content);
    this.cast.emit('view-rendered', this);
    this.rendered = true;
  }.bind(this));
  return this;
};

/**
 * Remove block element from dom
 * @return {Block} 
 */

Block.prototype.remove = function(){
  this.cast.emit('view-destroyed', this);
  this.el.parentNode.removeChild(this.el);
  return this;
};

/**
 * Update position
 * @return {Block} 
 */

Block.prototype.position = function(pos){
  if (pos) this.pos = pos;
  var style = this.el.style;
  fastdom.write(function(){
    style.width = this.pos.width + 'px';
    style.height = this.pos.height + 'px';
    translate(this.el, this.pos.left, this.pos.top); 
  }.bind(this));
  return this;
};

/**
 * Get our attr
 * @return {Object} 
 */

Block.prototype.toJSON = function(){
  return clone(this.attr);
};
});


























require.alias("component-emitter/index.js", "cast/deps/emitter/index.js");
require.alias("component-emitter/index.js", "emitter/index.js");

require.alias("component-clone/index.js", "cast/deps/clone/index.js");
require.alias("component-clone/index.js", "clone/index.js");
require.alias("component-type/index.js", "component-clone/deps/type/index.js");

require.alias("component-type/index.js", "cast/deps/type/index.js");
require.alias("component-type/index.js", "type/index.js");

require.alias("bmcmahen-ordered-dictionary/index.js", "cast/deps/ordered-dictionary/index.js");
require.alias("bmcmahen-ordered-dictionary/index.js", "ordered-dictionary/index.js");
require.alias("component-indexof/index.js", "bmcmahen-ordered-dictionary/deps/indexof/index.js");

require.alias("component-emitter/index.js", "bmcmahen-ordered-dictionary/deps/emitter/index.js");

require.alias("component-translate/index.js", "cast/deps/translate/index.js");
require.alias("component-translate/index.js", "cast/deps/translate/index.js");
require.alias("component-translate/index.js", "translate/index.js");
require.alias("component-has-translate3d/index.js", "component-translate/deps/has-translate3d/index.js");
require.alias("component-transform-property/index.js", "component-has-translate3d/deps/transform-property/index.js");

require.alias("component-transform-property/index.js", "component-translate/deps/transform-property/index.js");

require.alias("component-translate/index.js", "component-translate/index.js");
require.alias("wilsonpage-fastdom/index.js", "cast/deps/fastdom/index.js");
require.alias("wilsonpage-fastdom/index.js", "cast/deps/fastdom/index.js");
require.alias("wilsonpage-fastdom/index.js", "fastdom/index.js");
require.alias("wilsonpage-fastdom/index.js", "wilsonpage-fastdom/index.js");
require.alias("component-each/index.js", "cast/deps/each/index.js");
require.alias("component-each/index.js", "each/index.js");
require.alias("component-to-function/index.js", "component-each/deps/to-function/index.js");
require.alias("component-props/index.js", "component-to-function/deps/props/index.js");

require.alias("component-type/index.js", "component-each/deps/type/index.js");

require.alias("component-classes/index.js", "cast/deps/classes/index.js");
require.alias("component-classes/index.js", "classes/index.js");
require.alias("component-indexof/index.js", "component-classes/deps/indexof/index.js");

require.alias("anthonyshort-after-transition/index.js", "cast/deps/after-transition/index.js");
require.alias("anthonyshort-after-transition/index.js", "cast/deps/after-transition/index.js");
require.alias("anthonyshort-after-transition/index.js", "after-transition/index.js");
require.alias("anthonyshort-has-transitions/index.js", "anthonyshort-after-transition/deps/has-transitions/index.js");
require.alias("anthonyshort-has-transitions/index.js", "anthonyshort-after-transition/deps/has-transitions/index.js");
require.alias("anthonyshort-has-transitions/index.js", "anthonyshort-has-transitions/index.js");
require.alias("anthonyshort-css-emitter/index.js", "anthonyshort-after-transition/deps/css-emitter/index.js");
require.alias("component-emitter/index.js", "anthonyshort-css-emitter/deps/emitter/index.js");

require.alias("component-event/index.js", "anthonyshort-css-emitter/deps/event/index.js");

require.alias("anthonyshort-after-transition/index.js", "anthonyshort-after-transition/index.js");
require.alias("yields-empty/index.js", "cast/deps/empty/index.js");
require.alias("yields-empty/index.js", "cast/deps/empty/index.js");
require.alias("yields-empty/index.js", "empty/index.js");
require.alias("yields-empty/index.js", "yields-empty/index.js");
require.alias("component-domify/index.js", "cast/deps/domify/index.js");
require.alias("component-domify/index.js", "domify/index.js");

require.alias("cast/index.js", "cast/index.js");if (typeof exports == "object") {
  module.exports = require("cast");
} else if (typeof define == "function" && define.amd) {
  define([], function(){ return require("cast"); });
} else {
  this["cast"] = require("cast");
}})();