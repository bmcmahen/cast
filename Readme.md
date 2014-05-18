# Cast.js

Cast helps you build beautiful, animated grid layouts. Supply an array of attributes, select a layout mode, supply a template, and get a grid-view. It's vanilla Javascript and it's inspired by [Isotope](https://github.com/desandro/isotope).

Check out the [demonstration](http://cast.meteor.com) built with Meteor.

## Installation

The easiest way to use Cast is to use the `cast.js` located in the `dist` folder, and require this script in your html page. Cast will then be available under the global variable `cast`'. 

Alternatively, Cast can be used as a [component](https://github.com/component/component).

	$ component install bmcmahen/cast


## API

### new Cast(container, template)

`container` can either be an Element, Selector String, or a Number. A number should be used when you don't plan to actually use the built in views, in which case you still need to specify the wrapper width.

### .data(docs, Fn|String)

Supply Cast with an array of documents. Use the callback function to supply a unique identifer for each field, which will allow Cast to update, remove, and add attributes on subsequent calls. Alternatively, supply the key of the unique identifer ('_id', 'id', etc.).

	cast.data(docs, function(attr){
		return attr._id;
	});

	cast.data(docs, '_id');

### .justify(width, height, paddingWidth, paddingHeight)

Calculates grid positions to maintain a container left & right padding of zero. Grid item width and height remain constant, while grid-item-padding is dyanimc. If `#draw` has been called, `#justify` will automatically rerender your views.

### .center(width, height, paddingWidth, paddingHeight)

Calculates the grid with dynamic width on the left and right side of the wrapper. Grid item width, height, paddingWidth, and paddingHeight are constant. If `#draw` has been called, `#center` will automatically rerender your views.

### .dynamic(width, height, paddingWidth, paddingHeight)

Calculates the grid with a constant `paddingWidth` and `paddingHeight`, and a dynamic `boxWidth` and `boxHeight`. If `#draw` has been called, `#dynamic` will automatically rerender your views.

### .list(height, paddingHeight)

Calculates the grid as a list, with one object per line.

### .toJSON()

	var json = cast.data(docs).justify(40, 40, 10, 10).toJSON();

### .reset(docs, fn|String)

Resets the Cast object with the supplied array. Use the callback to provide a unique, constant value for the field.

	cast.reset(docs, function(attr){
		return attr._id;
	});

	cast.reset(docs, 'id');

### .add(docs, fn|String)

Appends docs to the Cast object.

### .remove(uid)

	cast.remove('34');

### .sortBy(field, 1)

Sorts the collection based on a `field`.

	cast.sortBy('name', -1).center(50, 50, 10, 10);

### .draw()

Simple utility function to append the cast layout to the container element.

## Events

### enter(model)

	 cast.on('enter', function(model){ });

### exit(model)
### view-created(view)
### view-rendered(view)
### view-destroyed(view)

## Example

This example assumes you are using `cast.js` located in the `dist` folder.

```javascript
// Render function. This could also be a template engine
// like Handlebars, Underscore, etc.
function render(obj){
	return '<div>' + obj.name + '</div>';
}

var docs = [{name: 'ben'}, {name: 'kit'}, {name: 'rick'}, {name: 'james'}];
var container = document.getElementById('#wrapper');

// Create our cast
var grid = cast(container, render);

grid.on('view-rendered', function(view){
	$(view.el)
		.addClass('custom-class')
		.find('p')
		.on('click', function(e){
			alert('hello' + view.model.get('name'));
		});
});

grid
	.data(docs, 'name')
	.sortBy('name')
	.justify(50, 50, 10, 10)
	.draw();
```

## Meteor Usage

See an example app [here](https://github.com/bmcmahen/meteor-cast-example). Include the standalone `cast.js` file in your client-side folder structure, and Meteor should automatically load it into your application. Create a template that will act as your cast wrapper.

```html
{{#constant}}
<div id='cast'></div>
{{/constant}}
```

In your code, you'll want to create a simple template function that will be used to render each cast item. Here's a simple example:

```javascript
function renderTemplate(obj){
	return '<p>' + obj.title + '</p>';
}
```

Inside your templat rendered callback, instantiate a new `cast` and attach the data to the cast, specifying the layout that you want. Putting your `data` attachment function inside of an autorun will automatically update your cast layout any time the collection changes.

```javascript
Template.cast.rendered = function(){

	var el = document.getElementById('#cast');

	var mycast = cast(el, renderTemplate);
	mycast.draw();

	this.handle = Meteor.autorun(function(){
		var videos = Videos.find().fetch();
		mycast
			.data(videos, '_id')
			.dynamic(150, 150, 10, 10);
	});
}
```
## License

  MIT
