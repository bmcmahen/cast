var Grid = require('bmcmahen-grid-it');

var attributes = [{name : 'ben'}, {name: 'kit'}, {name: 'rick'}, {name: 'joe'}];

var myGrid = new Grid(attributes);
myGrid.justify();

console.log(myGrid.toJSON());