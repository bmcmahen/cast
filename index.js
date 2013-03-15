// Required Modules.
var Emitter = require('emitter'),
    clone = require('clone'),
    bind = require('bind'),
    type = require('type'),
    OrderedDictionary = require('ordered-dictionary');

// Determine whehter or not we can use 3d/2d transforms
var testTransform = function(){
  var prefixes = 'transform WebkitTransform MozTransform OTransform msTransform'.split(' ');
    for(var i = 0; i < prefixes.length; i++) {
      if(document.createElement('div').style[prefixes[i]] !== undefined) {
        return prefixes[i];
    }
  }
  return false;
};

// By default, use these options. Should we bother with this?
var defaultOptions = {
  boxWidth: 75,
  paddingWidth: 5,
  boxHeight: 75,
  paddingHeight: 5,
  minWidth: 30,
  maxWidth: 80,
  ratio: 1
};

// Cast Constructor. Contains an ordered-dictionary of Cast-Item models.
var Cast = function(options){
  if (!(this instanceof Cast)) return new Cast(options);

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

Emitter(Cast.prototype);

// #data() allows us to give our Cast a collection of attributes. If a unique
// identifier is supplied in the callback (like _.id), then we can efficiently
// update, add, and remove models on subsequent .data() calls. If we don't
// have a unique identifier, then we just reset our collection.
Cast.prototype.data = function(attr, fn) {
  if (!fn) {
    this.reset(attr);
    return;
  }

  var len = this.collection.length(),
      keys = [];

  // Either update our model, or make a new one for each attribute
  // that we have passed.
  for ( var i = 0; i < attr.length; i++ ){
    var key = fn(attr[i]);
    var model = this.collection.get(key);
    keys.push(key);
    if (model) model.set(attr[i]);
    else this.collection.set(key, new Block(attr[i], this));
  }

  // If running .data() multiple times, remove any attributes
  // that were not contained in subsequent calls. XXX Improve.
  if (len) {
    var toRemove = [];
    this.collection.forEach(function(key, model, i){
      if (keys.indexOf(key) === -1 ) toRemove.push(key);
    });
    for (var x = 0; x < toRemove.length; x++){
      this.collection.remove(toRemove[x]);
    }
  }
  return this;
};

// Methods
Cast.prototype.toJSON = function(){
  var json = [];
  this.collection.forEach(function(key, value){
    json.push(value.toJSON());
  });
  return json;
};

// Courtesy of underscore.js
Cast.prototype.uniqueId = function(prefix){
  var id = ++this.idCounter + '';
  return prefix ? prefix + id : id;
};

Cast.prototype.reset = function(attr, fn){
  this.collection.clear();
  this.add(attr, fn);
  return this;
};

Cast.prototype.add = function(attr, fn){
  if (type(attr) !== 'array') attr = [attr];
  for (var i = 0, len = attr.length; i < len; i++){
    var key = fn ? fn(attr[i]) : this.uniqueId('c');
    var val = new Block(attr[i], this);
    this.collection.set(key, val);
  }
  return this;
};

Cast.prototype.remove = function(key){
  this.collection.remove(key);
};

Cast.prototype.setOptions = function(options){
  for (var option in options) {
    if (options.hasOwnProperty(option)) {
      if (option === 'wrapper') {
        this.wrapper = document.querySelector(options.wrapper);
        this.wrapperWidth = this.wrapper.clientWidth;
      } else {
        this[option] = options[option];
      }
    }
  }
  return this;
};

// The Cast items on the left/right will be fully aligned
// to the left/right side of the wrapper.
Cast.prototype.justify = function(options){
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
Cast.prototype.center = function(options){
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
// dynamic CastWidth and CastHeight.
Cast.prototype.dynamic = function(options){
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

Cast.prototype.determineHeight = function(){
//return (Math.ceil(totalNumber / bpr)) * (boxHeight * paddingHeight);
};

Cast.prototype.sortBy = function(field, invert){
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

Cast.prototype.draw = function(options){
  if (options) this.setOptions(options);
  if (!this.view) {
    this.view = new CastView(this);
    this.supportsTransform = testTransform();
  }
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

// Our wrapper view, which renders an array of Cast item views.
// Constructor
var CastView = function(context){
  this.context = context;
  this.collection = context.collection;
  this.el = document.createElement('div');
  this.el.className = 'cast-view';
  this.collection.on('enter', bind(this, this.renderNew));
  this.collection.on('exit', bind(this, this.removeOld));
};

// Methods
CastView.prototype.render = function(){
  var _this = this;
  this.collection.forEach(function(key, model, i){
    _this.renderNew(model);
  });
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
    .on('change:top', bind(this, this.changePosition))
    .on('change:left', bind(this, this.changePosition))
    .on('change:hidden', bind(this, this.showOrHide))
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
    .off('change:top')
    .off('change:left')
    .off('change:hidden')
    .off('destroy');
  this.context.emit('viewDestroyed', this);
  this.el.parentNode.removeChild(this.el);
};

// Do we also want to do scale3d, like isotope, for hiding items?
CastItemView.prototype.changePosition = function(){
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

CastItemView.prototype.showOrHide = function(){
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

module.exports = Cast;