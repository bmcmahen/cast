
# Cast.js

Cast helps you build beautiful, animated grid layouts. Supply an array of attributes, select your layout mode, and receive grid positions for rendering your own views... or let Cast automatically update and render the views for you. It's vanilla Javascript and it's inspired by [Isotope](https://github.com/desandro/isotope).

Check out the [demonstration](http://cast.meteor.com) built with Meteor.

## Installation

Cast can be used as a Component. To use it, you'll need to install Component via npm:

	$ npm install -g component

Navigate to your project directory, install Cast, and build the installed components.

	$ component install bmcmahen/cast
	$ component build

This produces a `build.js` file inside the `build` folder. Attach this script to your HTML file and access the constructor using `require()` within your code.

	var Cast = require('bmcmahen-cast');
	var cast = new Cast(options);

Alternatively, use `app.js` located in the `dist` folder. Cast will be available under the global variable `cast`.

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

	// Create a template in our <body>
	// You can use any templating language that you want. Here, I'll use underscore.

	<script type='text/template' id='grid-item-template'>
		<p> name: <%= name %> </p>
	</script>

	<script>

		var Cast = require('bmcmahen-cast');
		var attributes = [{name: 'ben'}, {name: 'kit'}, {name: 'rick'}, {name: 'james'}];

		var myCast = new Cast({
			wrapper: '#wrapper',
			template: _.template($('#grid-item-template').html())
		})
		.data(attributes, function(attr){
			return attr.name;
		})
		.justify({
			boxHeight: 50,
			boxWidth: 50,
			paddingHeight: 10,
			paddingWidth: 10
		})
		.sortBy('name');

		myCast.on('viewRendered', function(view){
			$(view.el).addClass('custom-class');
			$(view.el).find('p').on('click', function(e){
				alert('hello'+ view.model.get('name'));
			});
		});

		myCast.draw();
	</script>

## License

  MIT
