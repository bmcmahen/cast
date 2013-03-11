// Required Modules.
var Emitter = require('emitter'),
		clone = require('clone'),
		bind = require('bind'),
		type = require('type');

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
var Grid = function(attributes, options){
	if (!(this instanceof Grid)) return new Grid(attributes, options);

	// Attributes
	attributes = attributes || {};
	this.reset(attributes);

	// Options
	options = options || {};
	for (var def in defaultOptions) {
		if (defaultOptions.hasOwnProperty(def) && options[def] == null) {
			options[def] = defaultOptions[def];
		}
	}
	this.options = options;

	if (type(options.wrapper) !== 'number') {
		this.wrapperEl = document.querySelector(options.wrapper);
		this.options.wrapper = this.wrapperEl.clientWidth;
	}
};

Emitter(Grid.prototype);

// Methods
Grid.prototype.toJSON = function(){
	var i = -1, len = this.collection.length, json = [];
	while (++i < len) json.push(this.collection[i].toJSON());
	return json;
};

Grid.prototype.reset = function(attr){
	this.collection = [];
	this.add(attr);
	return this;
};

Grid.prototype.add = function(attr){
	for (var i = 0, len = attr.length; i < len; i++){
		this.collection.push(new Block(attr[i], this));
	}
	return this;
};

// There won't be padding on the left/right of the wrapper.
// The grid items on the left/right will be fully aligned
// to the left/right side of the wrapper.
Grid.prototype.justify = function(){
	var containerWidth = this.options.wrapper,
			boxWidth = this.options.boxWidth,
			paddingWidth = this.options.paddingWidth,
			paddingHeight = this.options.paddingHeight,
			boxHeight = this.options.boxHeight;

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

	for ( var i = 0, len = this.collection.length; i < len; i++ ) {
		var r = Math.floor(i / bpr),
				c = i % bpr,
				left = getLeft(c, r),
				top = ((r * boxHeight) + (r + 1) * paddingHeight);

		this.collection[i].set({ 'left': left, 'top': top });
	}

	return this;
};

// Ensure that there is padding on the far left and right
// of the wrapper.
Grid.prototype.center = function(){
	var containerWidth = this.options.wrapper,
			boxWidth = this.options.boxWidth,
			boxHeight = this.options.boxHeight,
			paddingWidth = this.options.paddingWidth,
			paddingHeight = this.options.paddingHeight;

	var bpr = Math.floor(containerWidth/(boxWidth + paddingWidth));
	var mx = (containerWidth - (bpr * boxWidth) - (bpr - 1) * paddingWidth) * 0.5;

	for ( var i = 0, len = this.collection.length; i < len; i++ ) {
		var r = Math.floor(i / bpr),
				c = i % bpr,
				left = mx + (c * (boxWidth + paddingWidth)),
				top = ((r * boxHeight) + (r + 1) * paddingHeight);

		this.collection[i].set({ 'left': left, 'top': top });
	}
	return this;
};

// Keeps a constant paddingWidth and Height, but implements a
// dynamic gridWidth and gridHeight.
Grid.prototype.dynamic = function(){
	var containerWidth = this.options.wrapper,
			min = this.options.minWidth,
			max = this.options.maxWidth,
			paddingWidth = this.options.paddingWidth,
			paddingHeight = this.options.paddingHeight,
			boxWidth = 0,
			rows = Math.floor(containerWidth / (min + paddingWidth));

	// Check to ensure that this doesn't do anything infinite...
	while (boxWidth < min || boxWidth > max) {
		boxWidth = (containerWidth - (rows * paddingWidth)) / rows;
		if (boxWidth > max) rows++ ;
		if (boxWidth < min) rows-- ;
	}

	var boxHeight = boxWidth * (this.options.ratio || 1);
	var mx = (containerWidth - (rows * boxWidth) - (rows - 1) * paddingWidth) * 0.5;

	for ( var i = 0, len = this.collection.length; i < len; i++ ) {
		var r = Math.floor(i / rows),
				c = i % rows,
				left = (c * (boxWidth + paddingWidth)),
				top = ((r * boxHeight) + (r + 1) * paddingHeight);

		this.collection[i].set({
			width: boxWidth,
			left: left,
			top: top,
			height: boxHeight
		});
	}

	return this;
};

Grid.prototype.filter = function(field, query){
	if (!this.initialCollection)
		this.initialCollection = this.collection;

	var re = new RegExp(query, 'i'), filtered = [];

	for (var i = 0, len = this.initialCollection.length; i < len; i++){
		var model = this.initialCollection[i];
		if (re.test(model.get(field))){
			model.set({ 'hidden' : false });
			filtered.push(model);
		} else {
			model.set({ 'hidden' : true });
		}
	}
	this.collection = filtered;
	return this;
};

Grid.prototype.determineHeight = function(){
//return (Math.ceil(totalNumber / bpr)) * (boxHeight * paddingHeight);
};

Grid.prototype.showAll = function(){
	var i = this.collection.length;
	while (i--){ this.collection[i].set({ 'hidden' : false }); }
	if (this.initialCollection)
		this.collection = this.initialCollection;
	return this;
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

Grid.prototype.draw = function(){
	if (!this.view) {
		this.view = new GridView(this);
		this.supportsTransform = testTransform();
	}
	this.view.render();
	this.wrapperEl.innerHTML = '';
	this.wrapperEl.appendChild(this.view.el);
	return this;
};


// Grid Item Model
// Events: change:attribute
// Constructor
var Block = function(attributes, context){
	this.context = context;
	attributes = attributes || {};
	this.attributes = {};
	this.set(attributes);
	this.attributes.hidden = false;
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

Block.prototype.hide = function(){
	this.set({ hide: true });
};

Block.prototype.show = function(){
	this.set({ hide: false });
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
};

// Methods
GridView.prototype.render = function(){
	this.children = [];
	this.el.innerHTML = '';
	for (var i = 0, len = this.collection.length; i < len; i++){
		var cardView = new GridItemView({
			model: this.collection[i],
			context: this.context
		});
		this.children.push(cardView.render());
		this.el.appendChild(cardView.el);
	}
	return this;
};

GridView.prototype.setHeight = function(height){
	this.el.setAttribute('height', height);
};


// Grid Item View. Contains one grid block.
// Constructor
var GridItemView = function(options){
	this.model = options.model;
	this.context = options.context;
	this.el = document.createElement('div');
	this.el.className = 'grid-item';
	this.template = options.context.options.template;
	this.model
		.on('change:top', bind(this, this.changePosition))
		.on('change:left', bind(this, this.changePosition))
		.on('change:hidden', bind(this, this.showOrHide));
};

// Methods
GridItemView.prototype.render = function(){
	this.el.innerHTML = this.template(this.model.toJSON());
	this.redraw();
	return this;
};

GridItemView.prototype.redraw = function(){
	this.changePosition().showOrHide();
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
	var el = this.el,
			style = el.style;

	if (this.model.get('hidden')) {
		el.className += ' hidden';
		el.setAttribute('aria-hidden', true);
		window.setTimeout(function(){ style.display = 'none'; }, 500);
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