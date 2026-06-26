/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var cp = require('child_process');

var argv = process.argv;
argv.shift();
argv.shift();
var extraArgs = argv.join(" ");

cp.exec("node ../../bin/webpack.js "+extraArgs+" --colors --script-src-prefix js/ lib/index js/web.js", function (error, stdout, stderr) {
	console.log('web stdout:\n' + stdout);
	console.log('web stderr:\n ' + stderr);
	if (error !== null) {
		console.log('web error: ' + error);
	}
});
