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