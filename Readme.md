
# Cast.js

With Cast you can easily create beautiful, animated grid layouts. Supply an array and receive grid positions for rendering your own views... or let Cast render them for you. Cast is inspired by [Isotope](https://github.com/desandro/isotope) but is somewhat less ambitious.

## Installation

Cast can be used as a Component. To use it, you'll need to install Component via npm:

	$ npm install -g component

Navigate to your project directory, install Cast, and build the installed components.

	$ component install bmcmahen/cast
	$ component build

This produces a `build.js` file inside the `build` folder. Attach this script to your HTML file and access the constructor using `require()` within your code.

	var Cast = require('bmcmahen-cast');
	var radCast = new Cast(attributes, options);

## API

### Cast(attributes, options)

Available options include:

	var options = {
		boxWidth: Number,
		paddingWidth: Number,
		boxHeight: Number,
		paddingHeight: Number,
		minWidth: Number,
		maxWidth: Number,
		template: Underscore, Handlebars, etc., template function,
		wrapper: '#selector'
	};

### .toJSON()

Returns an array of your attributes with `top`, `left`, and `hidden` attributes. This can be useful when you want to handle the drawing logic yourself. For example, when working with Meteor it might make more sense to create a Template with {{top}}, {{left}}, and {{hidden}} attributes, that can be fed with a helper that returns the `.toJSON()` data.

### .reset(attributes)

Resets the Cast object with the supplied attributes.

### .add(attributes)

Appends attributes to the Cast object.

### .justify()

Calculates the grid positions without left and right wrapper padding. Grid item width and height, and boxes per row are constant.

### .center()

Calculates the grid with padding on the left and right of the wrapper. Grid item width and height, and boxes per row are constant.

### .dynamic()

Calculates the grid by keeping a constant padding width and height, but implements a dynamic grid item width and height, and boxes per row. You must set `minWidth`, `maxWidth`, and `ratio` options. For square grid items, use a ratio of 1.

### .filter(field, query)

Performs a (case insensitive) filter on the attribute collection based on a query string and specified field.

	cast.filter('name', 'ben');

### .showAll()

Restores the original attributes and sets each to hidden, false.

### .sortBy(field, 1)

Sorts the collection based on a `field`.

	cast.sortBy('name', -1);

### .draw()

Renders the collection into the specified wrapper element.

## Example

	// Create a template in our <body>
	// You can use any templating language that you want. Here, I'll use underscore.

	<script type='text/template' id='grid-item-template'>
		<p> name: <%= name %> </p>
	</script>

	<script>

		// Import the Cast module.
		var Cast = require('bmcmahen-cast');

		// Fetch (or create) some JSON.
		var attributes = [{name: 'ben'}, {name: 'kit'}, {name: 'rick'}, {name: 'james'}];

		// Instantiate a new Cast object, passing in your attributes and options.
		var myCast = new Cast(attributes, {
			wrapper: '#wrapper',
			paddingWidth: 10,
			boxWidth: 100,
			boxHeight: 100,
			template: _.template($('#grid-item-template').html())
		});

		// Specify our item positions and render
		myCast.justify().draw();

		// Sort
		myGrid.sortBy('name', 1).justify();

		// Filter
		myGrid.filter('name', 'ben').justify();

		// Change our layout
		myGrid.center();

	</script>

## License

  MIT
