// Required Modules.
var Emitter = require('emitter')
  , clone = require('clone')
  , bind = require('bind')
  , type = require('type')
  , OrderedDictionary = require('ordered-dictionary')
  , indexOf = require('indexof')
  , translate = require('translate');

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
  for ( var i = 0, l = attr.length; i < l; i++ ){
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
      if (indexOf(keys, key) === -1 ) toRemove.push(key);
    });
    for (var x = 0, length = toRemove.length; x < length; x++){
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
  for (var i = 0, l = attr.length; i < l; i++){
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

  var cw = this.wrapperWidth,
      w = this.boxWidth,
      pw = this.paddingWidth,
      ph = this.paddingHeight,
      h = this.boxHeight;

  var bpr = Math.floor((cw - (pw * 2)) / (w + pw));
  var getLeft = function(c, r) {
    if (c === 0) return 0;
    if (c === bpr - 1) return cw - w;
    var remainingSpace = cw - (w * bpr),
        padding = remainingSpace / (bpr - 1);
    return w + (c * padding) + ((c - 1) * w);
  };

  this.collection.forEach(function(key, model, i){
    var r = Math.floor(i / bpr),
        c = i % bpr,
        left = getLeft(c, r),
        top = ((r * h) + (r + 1) * ph);

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

// Ensure that there is padding on the far left and right
// of the wrapper.
Cast.prototype.center = function(options){
  if (options) this.setOptions(options);

  var cw = this.wrapperWidth
    , w = this.boxWidth
    , h = this.boxHeight
    , pw = this.paddingWidth
    , ph = this.paddingHeight;

  var bpr = Math.floor(cw/(w + pw));
  var mx = (cw - (bpr * w) - (bpr - 1) * pw) * 0.5;

  this.collection.forEach(function(key, model, i){
    var r = Math.floor(i / bpr)
      , c = i % bpr
      , left = mx + (c * (w + pw))
      , top = (r * h) + (r + 1) * ph;

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

// Keeps a constant paddingWidth and Height with a
// dynamic CastWidth and CastHeight.
Cast.prototype.dynamic = function(options){
  if (options) this.setOptions(options);

  var cw = this.wrapperWidth
    , w = this.boxWidth
    , h = this.boxHeight
    , pw = this.paddingWidth
    , ph = this.paddingHeight;

  var bpr = Math.floor(cw / ( w + pw ));
  var newWidth = (cw - (bpr * pw)) / bpr;
  var newHeight = ( newWidth / w ) * h;
  var mx = (cw - (bpr * newWidth) - (bpr - 1) * pw) * 0.5;

  // XXX This logic is the same as center(). Should we make
  // this a shared function?
  this.collection.forEach(function(id, model, i){
    var r = Math.floor(i / bpr)
      , c = i % bpr
      , left = mx + (c * (newWidth + pw))
      , top = (r * newHeight) + (r + 1) * ph;

    model.set({
      width: newWidth,
      left: left,
      top: top,
      height: newHeight
    });
  });

  var t = this.collection.length();
  var wrapperHeight = Math.ceil(t / bpr) * (newHeight + ph)  + ph;
  this.emit('wrapperHeight', wrapperHeight);
  return this;
};

Cast.prototype.list = function(options){
  if (options) this.setOptions(options);
  var h = this.boxHeight
    , ph = this.paddingHeight;

  this.collection.forEach(function(id, model, i){
    var top = (h + ph) * i;
    model.set({
      left: 0,
      top: top,
      height: h
    });
  });

  this.emit('wrapperHeight', this.collection.length() * (h + ph));
  return this;
};

Cast.prototype.sortBy = function(field, invert){
  invert = invert || 1;
  this.collection.sort(function(left, right){
    var leftVal = left.get(field)
      , rightVal = right.get(field);
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