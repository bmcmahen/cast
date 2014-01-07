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
  var args = slice.call(arguments, 2);
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
  if (val && val.nodeType === 1) return 'element';
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
require.register("component-indexof/index.js", function(exports, require, module){
module.exports = function(arr, obj){
  if (arr.indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
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
require.register("cast/index.js", function(exports, require, module){
// Required Modules.
var Emitter = require('emitter');
var clone = require('clone');
var bind = require('bind');
var type = require('type');
var OrderedDictionary = require('ordered-dictionary');
var indexOf = require('indexof');
var translate = require('translate');


/**
 * Cast Constructor
 */

var Cast = function(container){
  if (!(this instanceof Cast)) return new Cast(container);

  var containerType = type(container);

  if (containerType === 'string') {
    this.wrapper = document.querySelector(container);
  } else if (containerType === 'element') {
    this.wrapper = container;
  } else {
    this.wrapperWidth = container;
  }

  if (!this.wrapperWidth) this.wrapperWidth = this.wrapper.clientWidth;
  this.collection = new OrderedDictionary();
  this.idCounter = 0;
};

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
  if (!fn) {
    this.reset(docs);
    return this;
  }

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
      if (indexOf(keys, key) === -1 ) toRemove.push(key);
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
 * Provide a uid
 * todo: replace with component
 * 
 * @param  {String} prefix optional
 * @return {String}        
 */

Cast.prototype.uniqueId = function(prefix){
  var id = ++this.idCounter + '';
  return prefix ? prefix + id : id;
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
  var isFn = fn && (type(fn) === 'function');
  for (var i = 0, l = docs.length; i < l; i++){
    var key = fn ? (isFn ? fn(docs[i]) : docs[i][fn]) : this.uniqueId('c');
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

  this.collection.forEach(function(key, model, i){
    var r = Math.floor(i / bpr);
    var c = i % bpr;
    var left = getLeft(c, r);
    var top = ((r * h) + (r + 1) * ph);

    model.set({
      'left': left,
      'top': top,
      'width': w,
      'height': h
    });
  });

  var t = this.collection.length();
  var wrapperHeight = Math.ceil(t / bpr) * (h + ph)  + ph;
  this.emit('wrapper-height', wrapperHeight);
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

  this.collection.forEach(function(key, model, i){
    var r = Math.floor(i / bpr);
    var c = i % bpr;
    var left = mx + (c * (w + pw));
    var top = (r * h) + (r + 1) * ph;

    model.set({
      'left': left,
      'top': top,
      'width': w,
      'height': h
    });
  });

  var t = this.collection.length();
  var wrapperHeight = Math.ceil(t / bpr) * (h + ph)  + ph;
  this.emit('wrapper-height', wrapperHeight);
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
  this.collection.forEach(function(id, model, i){
    var r = Math.floor(i / bpr);
    var c = i % bpr;
    var left = mx + (c * (newWidth + pw));
    var top = (r * newHeight) + (r + 1) * ph;

    model.set({
      'width': newWidth,
      'left': left,
      'top': top,
      'height': newHeight
    });
  });

  var t = this.collection.length();
  var wrapperHeight = Math.ceil(t / bpr) * (newHeight + ph)  + ph;
  this.emit('wrapper-height', wrapperHeight);
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

  this.collection.forEach(function(id, model, i){
    var top = (h + ph) * i;

    model.set({
      'left': 0,
      'top': top,
      'height': h
    });
  });

  this.emit('wrapper-height', this.collection.length() * (h + ph));
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

    var leftVal = left.get(field);
    var rightVal = right.get(field);

    if (leftVal < rightVal) return (-1 * invert);
    if (leftVal > rightVal) return (1 * invert);
    return 0;
  });

  return this;
};

/**
 * Render Cast Views inside of our wrapper
 * 
 * @param  {Function} template 
 * @return {Cast}          
 */

Cast.prototype.draw = function(template){
  this.template = template;
  if (!this.view) this.view = new CastView(this);
  this.wrapper.innerHTML = '';
  this.view.render();
  this.wrapper.appendChild(this.view.el);
  return this;
};


// Cast Item Model
// Events: change:attribute
// Constructor
var Block = function(attributes, context){
  this.context = context;
  this.attributes = { hidden: true };
  if (attributes) this.set(attributes);
};

Emitter(Block.prototype);

// Methods
Block.prototype.set = function(attr){
  var changed = false;
  if (!attr) return;
  this.previousAttributes = clone(this.attributes);

  for (var key in attr) {
    if (attr.hasOwnProperty(key)) {
      this.attributes[key] = attr[key];
      if (this.attributes[key] !== this.previousAttributes[key]){
        changed = true;
      }
    }
  }
  if (changed) this.emit('change:attribute');
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
  return clone(this.attributes);
};

// Our wrapper view, which renders an array of Cast item views.
// Constructor
var CastView = function(context){
  this.context = context;
  this.collection = context.collection;
  this.el = document.createElement('div');
  this.el.className = 'cast-view';
  this.collection.on('enter', bind(this, this.renderNew));
  this.collection.on('exit', bind(this, this.removeOld));
  this.context.on('wrapper-height', bind(this, this.setHeight));
};

// Methods
CastView.prototype.render = function(){
  var _this = this;
  this.collection.forEach(function(key, model, i){
    _this.renderNew(model);
  });
};

CastView.prototype.setHeight = function(height){
  this.el.style.height = height + 'px';
};

CastView.prototype.renderNew = function(model){
  var cardView = new CastItemView({ model: model, context: this.context });
  this.el.appendChild(cardView.render().el);
  window.setTimeout(function(){
    model.show();
  }, 0);
};

CastView.prototype.removeOld = function(model){
  var _this = this;
  model.hide();
  window.setTimeout(function(){
    model.destroy();
  }, 500);
};

// Cast Item View. Contains one Cast block.
// Constructor
var CastItemView = function(options){
  this.model = options.model;
  this.context = options.context;
  this.el = document.createElement('div');
  this.el.className = 'cast-item';
  this.template = options.context.template;
  if (!this.template) throw new Error('You need to supply a template');
  this.model
    .on('change:attribute', bind(this, this.render))
    .on('destroy', bind(this, this.remove));
  this.context.emit('view-created', this);
};

// Methods
CastItemView.prototype.render = function(){
  this.el.innerHTML = this.template(this.model.toJSON());
  this.changePosition().showOrHide();
  this.context.emit('view-rendered', this);
  return this;
};

CastItemView.prototype.remove = function(){
  this.model
    .off('change:attribute')
    .off('destroy');
  this.context.emit('view-destroyed', this);
  this.el.parentNode.removeChild(this.el);
};

// Should we also use scale3d (like isotope?)
CastItemView.prototype.changePosition = function(){
  var top = this.model.get('top')
    , left = this.model.get('left')
    , style = this.el.style
    , width = this.model.get('width')
    , height = this.model.get('height');

  style.width = width + 'px';
  style.height = height + 'px';
  translate(this.el, left, top);
  return this;
};

CastItemView.prototype.showOrHide = function(){
  var _this = this
    , el = this.el
    , style = el.style;

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

module.exports = Cast;
});
















require.alias("component-emitter/index.js", "cast/deps/emitter/index.js");
require.alias("component-emitter/index.js", "emitter/index.js");

require.alias("component-clone/index.js", "cast/deps/clone/index.js");
require.alias("component-clone/index.js", "clone/index.js");
require.alias("component-type/index.js", "component-clone/deps/type/index.js");

require.alias("component-bind/index.js", "cast/deps/bind/index.js");
require.alias("component-bind/index.js", "bind/index.js");

require.alias("component-type/index.js", "cast/deps/type/index.js");
require.alias("component-type/index.js", "type/index.js");

require.alias("bmcmahen-ordered-dictionary/index.js", "cast/deps/ordered-dictionary/index.js");
require.alias("bmcmahen-ordered-dictionary/index.js", "ordered-dictionary/index.js");
require.alias("component-indexof/index.js", "bmcmahen-ordered-dictionary/deps/indexof/index.js");

require.alias("component-emitter/index.js", "bmcmahen-ordered-dictionary/deps/emitter/index.js");

require.alias("component-indexof/index.js", "cast/deps/indexof/index.js");
require.alias("component-indexof/index.js", "indexof/index.js");

require.alias("component-translate/index.js", "cast/deps/translate/index.js");
require.alias("component-translate/index.js", "cast/deps/translate/index.js");
require.alias("component-translate/index.js", "translate/index.js");
require.alias("component-has-translate3d/index.js", "component-translate/deps/has-translate3d/index.js");
require.alias("component-transform-property/index.js", "component-has-translate3d/deps/transform-property/index.js");

require.alias("component-transform-property/index.js", "component-translate/deps/transform-property/index.js");

require.alias("component-translate/index.js", "component-translate/index.js");if (typeof exports == "object") {
  module.exports = require("cast");
} else if (typeof define == "function" && define.amd) {
  define(function(){ return require("cast"); });
} else {
  this["cast"] = require("cast");
}})();