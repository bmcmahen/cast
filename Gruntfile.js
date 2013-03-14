module.exports = function(grunt){

	grunt.initConfig({
		component: {
			app: {
			output: './dist/',
			config: './component.json',
			styles: false,
			scripts: true,
			standalone: true
		}
	},

	mocha: {
		all: ['test/*.html'],
		options: {
			run: true
		}
	},

	watch: {
		scripts: {
			files: ['index.js'],
			tasks: ['component']
		}
	}
});

	grunt.registerTask('default', 'mocha');

	grunt.loadNpmTasks('grunt-component-build');
	grunt.loadNpmTasks('grunt-mocha');
	grunt.loadNpmTasks('grunt-contrib-watch');
};