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
