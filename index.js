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
  this.emit('wrapperHeight', wrapperHeight);
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
  this.emit('wrapperHeight', wrapperHeight);
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
  this.emit('wrapperHeight', wrapperHeight);
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

  this.emit('wrapperHeight', this.collection.length() * (h + ph));
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
  this.context.on('wrapperHeight', bind(this, this.setHeight));
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
  this.context.emit('viewCreated', this);
};

// Methods
CastItemView.prototype.render = function(){
  this.el.innerHTML = this.template(this.model.toJSON());
  this.changePosition().showOrHide();
  this.context.emit('viewRendered', this);
  return this;
};

CastItemView.prototype.remove = function(){
  this.model
    .off('change:attribute')
    .off('destroy');
  this.context.emit('viewDestroyed', this);
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