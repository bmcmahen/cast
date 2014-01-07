# Cast.js

Cast helps you build beautiful, animated grid layouts. Supply an array of attributes, select your layout mode, and receive grid positions for rendering your own views... or let Cast automatically update and render the views for you. It's vanilla Javascript and it's inspired by [Isotope](https://github.com/desandro/isotope).

Check out the [demonstration](http://cast.meteor.com) built with Meteor.

## Installation

The easiest way to use Cast is to use the `cast.js` located in the `dist` folder, and require this script in your html page. Cast will then be available under the global variable `cast`'. 

Alternatively, Cast can be used as a [component](https://github.com/component/component).

	$ component install bmcmahen/cast


## API

### new Cast(container)

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

After running a layout method, calling `.toJSON()` will return the grid item collection with the `top`, `left`, and `hidden` attributes. This can be useful when you want to handle the drawing logic yourself. For example, when working with Meteor it might make more sense to create a Template with {{top}}, {{left}}, and {{hidden}} attributes, that can be fed with a helper that returns the `.toJSON()` data.

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

### .draw(template)

	var template = _.template($('#template').html());
	cast.data(docs, 'id').center(50, 50, 10, 10).draw(template);

Renders (or rerenders) the collection using the supplied template function. The template function should return an HTML String.

## Events

### enter(model)

	 cast.on('enter', function(model){ });

### exit(model)
### viewCreated(view)
### viewRendered(view)
### viewDestroyed(view)
### wrapperHeight(height)

## CSS for animations

The following CSS will provide animations for opacity and positions. You can also choose to animate the `width` and `height` attributes if you're using the dynamic layout mode, but this will signficantly reduce performance in some browsers.

	.cast-item {
		position: absolute;
		opacity: 1;
		-webkit-transition: opacity 0.5s, -webkit-transform 0.5s;
		-moz-transition: opacity 0.5s, -moz-transform 0.5s;
		-ms-transition: opacity 0.5s, -ms-transform 0.5s;
		-o-transition: opacity 0.5s, -o-transform 0.5s;
	}

	.cast-item.hidden {
		opacity: 0;
	}


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
var grid = cast(container)
	.data(docs, 'name')
	.sortBy('name')
	.justify(50, 50, 10, 10);

grid.on('view rendered', function(view){
	$(view.el)
		.addClass('custom-class')
		.find('p')
		.on('click', function(e){
			alert('hello' + view.model.get('name'));
		});
});

grid.draw(render);
```

## Meteor Usage

Include the standalone `cast.js` file in your client-side folder structure, and Meteor should automatically load it into your application. Create a template that will act as your cast wrapper.

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

	var mycast = cast(el);

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
