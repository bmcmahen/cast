;(function(){


/**
 * hasOwnProperty.
 */

var has = Object.prototype.hasOwnProperty;

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
  if (!module.exports) {
    module.exports = {};
    module.client = module.component = true;
    module.call(this, module.exports, require.relative(resolved), module);
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
  var index = path + '/index.js';

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (has.call(require.modules, path)) return path;
  }

  if (has.call(require.aliases, index)) {
    return require.aliases[index];
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
  if (!has.call(require.modules, from)) {
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
    return has.call(require.modules, localRequire.resolve(path));
  };

  return localRequire;
};
require.register("component-indexof/index.js", function(exports, require, module){

var indexOf = [].indexOf;

module.exports = function(arr, obj){
  if (indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
});
require.register("component-emitter/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var index = require('indexof');

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

Emitter.prototype.on = function(event, fn){
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

  fn._off = on;
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
Emitter.prototype.removeAllListeners = function(event, fn){
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
  var i = index(callbacks, fn._off || fn);
  if (~i) callbacks.splice(i, 1);
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
require.register("component-bind/index.js", function(exports, require, module){

/**
 * Slice reference.
 */

var slice = [].slice;

/**
 * Bind `obj` to `fn`.
 *
 * @param {Object} obj
 * @param {Function|String} fn or string
 * @return {Function}
 * @api public
 */

module.exports = function(obj, fn){
  if ('string' == typeof fn) fn = obj[fn];
  if ('function' != typeof fn) throw new Error('bind() requires a function');
  var args = [].slice.call(arguments, 2);
  return function(){
    return fn.apply(obj, args.concat(slice.call(arguments)));
  }
};

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
  if (val === Object(val)) return 'object';

  return typeof val;
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
require.register("cast/index.js", function(exports, require, module){
// Required Modules.
var Emitter = require('emitter'),
		clone = require('clone'),
		bind = require('bind'),
		type = require('type'),
		OrderedDictionary = require('ordered-dictionary');

var testTransform = function(){
	var prefixes = 'transform WebkitTransform MozTransform OTransform msTransform'.split(' ');
		for(var i = 0; i < prefixes.length; i++) {
			if(document.createElement('div').style[prefixes[i]] !== undefined) {
				return prefixes[i];
		}
	}
	return false;
};

var defaultOptions = {
	boxWidth: 75,
	paddingWidth: 5,
	boxHeight: 75,
	paddingHeight: 5,
	minWidth: 30,
	maxWidth: 80,
	ratio: 1
};

// Primary Grid constructor, contains an array of Grid Item models.
var Grid = function(options){
	if (!(this instanceof Grid)) return new Grid(options);

	// Attributes
	this.collection = new OrderedDictionary();
	this.idCounter = 0;

	// Options
	options = options || {};
	for (var def in defaultOptions) {
		if (defaultOptions.hasOwnProperty(def) && options[def] == null) {
			options[def] = defaultOptions[def];
		}
	}
	this.setOptions(options);
};

Emitter(Grid.prototype);

// Allow the user to specify the unique field (like _.id) in the callback.
// This allows us to keep an ordered dictionary of each grid model, with the
// unique field as key. We can then more efficiently add, remove, and update
// our models, without reconstructing all of them.
Grid.prototype.data = function(attr, fn) {
	var len = this.collection.length(),
			keys = [],
			model;

	if (!fn && len) {
		this.collection.clear();
		len = null;
	}

	for (var i = 0; i < attr.length; i++){
		if (fn) {
			var key = fn(attr[i]);
			model = this.collection.get(key);
			keys.push(key);
			if (model) {
				model.set(attr[i]);
			} else {
				model = new Block(attr[i], this);
				this.collection.set(key, model);
			}

		// If an _id isn't provided, data() simply rebuilds
		// the collection each time it is called.
		} else {
			model = new Block(attr[i], this);
			this.collection.set(this.uniqueId('c'), model);
		}
	}

	// XXX There's got to be a better way...
	if (len && keys.length) {
		var toRemove = [];
		this.collection.forEach(function(key, model, i){
			if (keys.indexOf(key) === -1 )
				toRemove.push(key);
		});
		for (var x = 0; x < toRemove.length; x++){
			this.collection.remove(toRemove[x]);
		}
	}

	return this;
};

// Methods
Grid.prototype.toJSON = function(){
	var json = [];
	this.collection.forEach(function(key, value){
		json.push(value.toJSON());
	});
	return json;
};

Grid.prototype.uniqueId = function(prefix){
	var id = ++this.idCounter + '';
	return prefix ? prefix + id : id;
};

Grid.prototype.reset = function(attr, fn){
	this.collection.clear();
	this.add(attr, fn);
	return this;
};

Grid.prototype.add = function(attr, fn){
	if (type(attr) !== 'array') attr = [attr];
	for (var i = 0, len = attr.length; i < len; i++){
		var key = fn ? fn(attr[i]) : this.uniqueId('c');
		var val = new Block(attr[i], this);
		this.collection.set(key, val);
	}
	return this;
};

Grid.prototype.setOptions = function(options){
	for (var option in options) {
		if (options.hasOwnProperty(option)) {
			if (option === 'wrapper') {
				this.wrapper = document.querySelector(options.wrapper);
				this.wrapperWidth = this.wrapper.clientWidth;
				console.log(this.wrapperWidth);
			} else {
				this[option] = options[option];
			}
		}
	}
};

// There won't be padding on the left/right of the wrapper.
// The grid items on the left/right will be fully aligned
// to the left/right side of the wrapper.
Grid.prototype.justify = function(options){
	if (options) this.setOptions(options);

	var containerWidth = this.wrapperWidth,
			boxWidth = this.boxWidth,
			paddingWidth = this.paddingWidth,
			paddingHeight = this.paddingHeight,
			boxHeight = this.boxHeight;

	var bpr = function(){
		var width = (containerWidth - (boxWidth * 2));
		return Math.floor(width/(boxWidth + paddingWidth));
	}();

	var getLeft = function(c, r) {
		if (c === 0) return 0;
		if (c === bpr - 1) return containerWidth - boxWidth;
		var remainingSpace = containerWidth - (boxWidth * bpr),
				padding = remainingSpace / (bpr - 1);
		return boxWidth + (c * padding) + ((c - 1) * boxWidth);
	};

	this.collection.forEach(function(key, model, i){
		var r = Math.floor(i / bpr),
				c = i % bpr,
				left = getLeft(c, r),
				top = ((r * boxHeight) + (r + 1) * paddingHeight);

		model.set({ 'left': left, 'top': top });
	});

	return this;
};

// Ensure that there is padding on the far left and right
// of the wrapper.
Grid.prototype.center = function(options){
	if (options) this.setOptions(options);

	var containerWidth = this.wrapperWidth,
			boxWidth = this.boxWidth,
			boxHeight = this.boxHeight,
			paddingWidth = this.paddingWidth,
			paddingHeight = this.paddingHeight;

	var bpr = Math.floor(containerWidth/(boxWidth + paddingWidth));
	var mx = (containerWidth - (bpr * boxWidth) - (bpr - 1) * paddingWidth) * 0.5;

	this.collection.forEach(function(key, model, i){
		var r = Math.floor(i / bpr),
				c = i % bpr,
				left = mx + (c * (boxWidth + paddingWidth)),
				top = ((r * boxHeight) + (r + 1) * paddingHeight);

		model.set({ 'left': left, 'top': top });
	});
	return this;
};

// Keeps a constant paddingWidth and Height, but implements a
// dynamic gridWidth and gridHeight.
Grid.prototype.dynamic = function(options){
	if (options) this.setOptions(options);
	var containerWidth = this.wrapperWidth,
			min = this.minWidth,
			max = this.maxWidth,
			paddingWidth = this.paddingWidth,
			paddingHeight = this.paddingHeight,
			boxWidth = 0,
			rows = Math.floor(containerWidth / (min + paddingWidth));

	// Check to ensure that this doesn't do anything infinite...
	while (boxWidth < min || boxWidth > max) {
		boxWidth = (containerWidth - (rows * paddingWidth)) / rows;
		if (boxWidth > max) rows++ ;
		if (boxWidth < min) rows-- ;
	}

	var boxHeight = boxWidth * (this.ratio || 1);
	var mx = (containerWidth - (rows * boxWidth) - (rows - 1) * paddingWidth) * 0.5;

	this.collection.forEach(function(id, model, i){
		var r = Math.floor(i / rows),
				c = i % rows,
				left = (c * (boxWidth + paddingWidth)),
				top = ((r * boxHeight) + (r + 1) * paddingHeight);

		model.set({
			width: boxWidth,
			left: left,
			top: top,
			height: boxHeight
		});
	});

	return this;
};

Grid.prototype.determineHeight = function(){
//return (Math.ceil(totalNumber / bpr)) * (boxHeight * paddingHeight);
};

Grid.prototype.sortBy = function(field, invert){
	invert = invert || 1;
	this.collection.sort(function(left, right){
		var leftVal = left.get(field),
				rightVal = right.get(field);
		if (leftVal < rightVal) return (-1 * invert);
		if (leftVal > rightVal) return (1 * invert);
		return 0;
	});
	return this;
};

Grid.prototype.draw = function(options){
	if (options) this.setOptions(options);
	if (!this.view) {
		this.view = new GridView(this);
		this.supportsTransform = testTransform();
	}
	this.wrapper.innerHTML = '';
	this.view.render();
	this.wrapper.appendChild(this.view.el);
	return this;
};


// Grid Item Model
// Events: change:attribute
// Constructor
var Block = function(attributes, context){
	this.context = context;
	attributes = attributes || {};
	this.attributes = {};
	this.attributes.hidden = true;
	this.set(attributes);
};

Emitter(Block.prototype);

// Methods
Block.prototype.set = function(attr){
	if (this.attributes)
		this.previousAttributes = clone(this.attributes);

	if (!attr) return;

	for (var key in attr) {
		if (attr.hasOwnProperty(key)) {
			this.attributes[key] = attr[key];
			if (this.previousAttributes) {
				if (this.attributes[key] !== this.previousAttributes[key]) {
					this.emit('change:'+ key, attr[key]);
				}
			} else {
				this.emit('change:'+ key, attr[key]);
			}
		}
	}
};

Block.prototype.get = function(key){
	return this.attributes[key];
};

Block.prototype.destroy = function(){
	this.emit('destroy');
};

Block.prototype.hide = function(){
	this.set({ hidden: true });
};

Block.prototype.show = function(){
	this.set({ hidden: false });
};

Block.prototype.toJSON = function(){
	var json = {};
	for (var name in this.attributes) {
		json[name] = this.attributes[name];
	}
	return json;
};

// Our wrapper view, which renders an array of grid item views.
// Constructor
var GridView = function(context){
	this.context = context;
	this.collection = context.collection;
	this.el = document.createElement('div');
	this.el.className = 'grid-view';
	this.collection.on('enter', bind(this, this.renderNew));
	this.collection.on('exit', bind(this, this.removeOld));
};

// Methods

GridView.prototype.render = function(){
	var _this = this;
	this.collection.forEach(function(key, model, i){
		_this.renderNew(model);
	});
};

GridView.prototype.renderNew = function(model){
	var cardView = new GridItemView({ model: model, context: this.context });
	this.el.appendChild(cardView.render().el);
	window.setTimeout(function(){
		model.show();
	}, 0);
};

GridView.prototype.removeOld = function(model){
	model.hide();
	window.setTimeout(function(){
		model.destroy();
	}, 500);
};


// Grid Item View. Contains one grid block.
// Constructor
var GridItemView = function(options){
	this.model = options.model;
	this.context = options.context;
	this.el = document.createElement('div');
	this.el.className = 'grid-item';
	this.template = options.context.template;
	if (!this.template) throw new Error('You need to supply a template');
	this.model
		.on('change:top', bind(this, this.changePosition))
		.on('change:left', bind(this, this.changePosition))
		.on('change:hidden', bind(this, this.showOrHide))
		.on('destroy', bind(this, this.remove));
};

// Methods
GridItemView.prototype.render = function(){
	this.el.innerHTML = this.template(this.model.toJSON());
	this.changePosition().showOrHide();
	return this;
};

GridItemView.prototype.remove = function(){
	this.model
		.off('change:top')
		.off('change:left')
		.off('change:hidden')
		.off('destroy');

	this.el.parentNode.removeChild(this.el);
};

// Do we also want to do scale3d, like isotope, for hiding items?
GridItemView.prototype.changePosition = function(){
	var top = this.model.get('top'),
			left = this.model.get('left'),
			style = this.el.style;

	if (this.context.supportsTransform){
		style.webkitTransform = style.MozTransform = 'translate3d('+left+'px,'+top+'px, 0)';
		style.msTransform = style.OTransform = 'translate('+left+'px, '+top+'px)';
		return this;
	}

	style.top = top;
	style.left = left;
	return this;
};

GridItemView.prototype.showOrHide = function(){
	var _this = this,
			el = this.el,
			style = el.style;

	if (this.model.get('hidden')) {
		el.className += ' hidden';
		el.setAttribute('aria-hidden', true);
	} else {
		style.display = 'block';
		window.setTimeout(function(){
			el.className = el.className.replace( /(?:^|\s)hidden(?!\S)/g , '');
		}, 0);
		el.setAttribute('aria-hidden', false);
	}
	return this;
};

module.exports = Grid;
});
require.alias("component-emitter/index.js", "cast/deps/emitter/index.js");
require.alias("component-indexof/index.js", "component-emitter/deps/indexof/index.js");

require.alias("component-clone/index.js", "cast/deps/clone/index.js");
require.alias("component-type/index.js", "component-clone/deps/type/index.js");

require.alias("component-bind/index.js", "cast/deps/bind/index.js");

require.alias("component-type/index.js", "cast/deps/type/index.js");

require.alias("bmcmahen-ordered-dictionary/index.js", "cast/deps/ordered-dictionary/index.js");
require.alias("component-indexof/index.js", "bmcmahen-ordered-dictionary/deps/indexof/index.js");

require.alias("component-emitter/index.js", "bmcmahen-ordered-dictionary/deps/emitter/index.js");
require.alias("component-indexof/index.js", "component-emitter/deps/indexof/index.js");

if (typeof exports == "object") {
  module.exports = require("cast");
} else if (typeof define == "function" && define.amd) {
  define(require("cast"));
} else {
  window["cast"] = require("cast");
}})();