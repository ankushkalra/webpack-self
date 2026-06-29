/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var cp = require('child_process');

var argv = process.argv;
argv.shift();
argv.shift();
var extraArgs = argv.join(" ");

try {
	require("vm-browserify");
	compile();
} catch(e) {
	console.log("install vm-browserify...");
	cp.exec("npm install vm-browserify", function (error, stdout, stderr) {
		console.log(stdout);
		compile();
	});
}
function compile() {
	console.log("compile scripts...");
	
	cp.exec("node ../../bin/webpack.js "+extraArgs+" --colors --script-src-prefix js/ --libary libary2 node_modules/libary2 js/libary2.js", function (error, stdout, stderr) {
		console.log('libary2 stdout:\n' + stdout);
		console.log('libary2 stderr:\n ' + stderr);
		if (error !== null) {
			console.log('libary2 error: ' + error);
		}
	});
}
