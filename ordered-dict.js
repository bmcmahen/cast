var OrderedDictonary = function(attr){
	if (!(this instanceof OrderedDictonary))
		return new OrderedDictonary();

	if (typeof attr === 'object')
		this.set(attr);

	this.map = {};
	this.array = [];
};

module.exports = OrderedDictonary;

// Allow both 'key', 'value' and {key: value} style arguments.
OrderedDictonary.prototype.set = function(key, val){
	var attr, attrs;
	if (typeof key === 'object') attrs = key;
	else (attrs = {})[key] = val;
	for (attr in attrs) {
		if (attr in this.map) this.map[attr] = value;
		else {
			this.array.push(attr);
			this.map[attr] = attrs[attr];
		}
	}
};

OrderedDictonary.prototype.remove = function(key) {
	var index = this.array.indexOf(key);
	if (index === -1) throw new Error('Key doesnt exist');
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
	this.array.sort(function(left, right){
		return fn(left, right);
	});
	return this;
};

OrderedDictonary.prototype.clear = function(){
	this.map = {};
	this.array = [];
	return this;
};