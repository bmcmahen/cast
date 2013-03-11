
# Cast.js

Create beautiful, animated grid layouts. Supply an array and receive grid positions for rendering your own views... Or let Cast render them for you. Inspired by [Isotope]() but written in vanilla Javascript.

## Installation

Cast can be built through the use of Components. If you don't already have Component installed, install it using NPM.

	$ npm install -g component

Navigate to your directory, install it, and build it.

   $ component install bmcmahen/grid-it
   $ component build

This produces a `build.js` file in the `build` folder. Attach this script to your HTML file.

## API

### new Cast(attributes, options)

	var options = {
		boxWidth: Number,
		paddingWidth: Number,
		boxHeight: Number,
		paddingHeight: Number,
		minWidth: Number,
		maxWidth: Number,
		ratio: Number,
		template: Underscore, Handlebars, etc., template function,
		wrapper: '#selector'
	};

### .toJSON()

Returns an array of your attributes with `top`, `left`, and `hidden` attributes. This can be useful when you want to handle the drawing logic yourself. For example, when working with Meteor it might make more sense to create a Template with {{top}}, {{left}}, and {{hidden}} attributes, that can be fed with a helper that returns the `.toJSON()` data.

### .justify()

Draws the grid without wrapper padding on the left or right.

### .center()

Draw the grid with padding on the left and right of the wrapper.

### .dynamic()

Keeps a constant padding width and height, but implements a dynamic grid item width and height.

	.filter(field, query)
	Performs a (case insensitive) filter of the attribute collection based on a query string and specified field.

	.showAll()
	Restores the original attributes and sets each to hidden, false.

	.sortBy(field, 1)
	Sorts the collection based on a `field`.

	.draw()
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
