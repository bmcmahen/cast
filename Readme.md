# Cast.js

Cast helps you build beautiful, animated grid layouts. Supply an array of attributes, select your layout mode, and receive grid positions for rendering your own views... or let Cast automatically update and render the views for you. It's vanilla Javascript and it's inspired by [Isotope](https://github.com/desandro/isotope).

Check out the [demonstration](http://cast.meteor.com) built with Meteor.

## Installation

The easiest way to use Cast is to use the `cast.js` located in the `dist` folder, and require this script in your html page. Cast will then be available under the global variable `cast`'. 

Alternatively, Cast can be used as a [component](https://github.com/component/component).

	$ component install bmcmahen/cast


## API

### new Cast(options)

Available options include:

	var options = {
		boxWidth: Number,
		boxHeight: Number,
		paddingWidth: Number,
		paddingHeight: Number,
		template: Underscore, Handlebars, etc., template function,
		wrapper: '#selector',
		wrapperWidth: Number
	};

If you are working without views, you'll need to specify the `wrapperWidth` option. If you supply a `wrapper` element, `wrapperWidth` isn't necessary.

### .data(attr, fn)

Supply Cast with an array of attributes. Use the callback function to supply a unique identifer for each field, which will allow Cast to update, remove, and add attributes on subsequent calls.

	cast.data(attributes, function(attr){
		return attr._id;
	});

### .justify()

Calculates the grid positions assuming that the wrapper has 0 padding on the left and right. Grid item width and height are constant. paddingWidth is dynamic. If `.draw()` has been called, `.justify()` will automatically rerender your views.

### .center()

Calculates the grid with dynamic width on the left and right side of the wrapper. Grid item width, height, paddingWidth, and paddingHeight are constant. If `.draw()` has been called, `.center()` will automatically rerender your views.

### .dynamic()

Calculates the grid with a constant `paddingWidth` and `paddingHeight`, and a dynamic `boxWidth` and `boxHeight`. If `.draw()` has been called, `.dynamic()` will automatically rerender your views.

### .list()

Calculates the grid as a list, with one object per line.

### .toJSON()

After running a layout method, calling `.toJSON()` will return the grid item collection with the `top`, `left`, and `hidden` attributes. This can be useful when you want to handle the drawing logic yourself. For example, when working with Meteor it might make more sense to create a Template with {{top}}, {{left}}, and {{hidden}} attributes, that can be fed with a helper that returns the `.toJSON()` data.

	var json = cast.data(attr).justify().toJSON();

### .reset(attributes, fn)

Resets the Cast object with the supplied array. Use the callback to provide a unique, constant value for the field.

	cast.reset(attributes, function(attr){
		return attr._id;
	});

### .add(attributes, fn)

Appends attributes to the Cast object.

### .remove(key)

	cast.remove('a_document_id');

### .sortBy(field, 1)

Sorts the collection based on a `field`.

	cast.sortBy('name', -1).center();

### .draw()

	cast.data(attr).center().draw({
		wrapper: '#my-cast',
		template: _.template($('#template').html())
	});

Renders (or rerenders) the collection into the specified wrapper element.

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

var layout = cast({ wrapper: '#wrapper', template: render })
	.data(docs, function(attr){ return attr.name; })
	.sortBy('name')
	.justify({
		boxHeight: 50,
		boxWidth: 50,
		paddingHeight: 10,
		paddingWidth: 10
	});


layout.on('viewRendered', function(view){
	$(view.el).addClass('custom-class');
	$(view.el).find('p').on('click', function(e){
		alert('hello'+ view.model.get('name'));
	});
});

layout.draw();
```

## Meteor Usage

Include the standalone `cast.js` file in your folder structure, and Meteor should automatically load it into your application. Create a template that will act as your cast wrapper.

```html
{{constant}}
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

	var mycast = cast({
		wrapper: '#cast',
		template: renderTemplate
	});

	mycast.draw();

	this.handle = Meteor.autorun(function(){
		var videos = Videos.find().fetch();
		mycast
			.data(videos, function(attr){
				return attr._id;
			})
			.dynamic({
				boxWidth: 150,
				boxHeight: 150,
				paddingWidth: 10,
				paddingHeight: 10
			});
	});
}
```
## License

  MIT
