/******/(function(document, undefined) {
/******/	return function(modules) {
/******/		var installedModules = {}, installedChunks = {0:1};
/******/		function require(moduleId) {
/******/			if(installedModules[moduleId])
/******/				return installedModules[moduleId].exports;
/******/			var module = installedModules[moduleId] = {
/******/				exports: {}
/******/			};
/******/			modules[moduleId](module, module.exports, require);
/******/			return module.exports;
/******/		}
/******/		require.ensure = function(chunkId, callback) {
/******/			if(installedChunks[chunkId] === 1) return callback(require);
/******/			if(installedChunks[chunkId] !== undefined)
/******/				installedChunks[chunkId].push(callback);
/******/			else {
/******/				installedChunks[chunkId] = [callback];
/******/				var head = document.getElementsByTagName('head')[0];
/******/				var script = document.createElement('script');
/******/				script.type = 'text/javascript';
/******/				script.src = modules.c+chunkId+modules.a;
/******/				head.appendChild(script);
/******/			}
/******/		};
/******/		window[modules.b] = function(chunkId, moreModules) {
/******/			for(var moduleId in moreModules)
/******/				modules[moduleId] = moreModules[moduleId];
/******/			var callbacks = installedChunks[chunkId];
/******/			installedChunks[chunkId] = 1;
/******/			for(var i = 0; i < callbacks.length; i++)
/******/				callbacks[i](require);
/******/		};
/******/		return require(0);
/******/	}
/******/})(document)
/******/({a:".web.js",b:"webpackJsonp",c:"js/",
/******/0: function(module, exports, require) {

window.test(true, "index.js should be replaced with index.web.js");
window.test(window.libary1, "libary1 loaded");
window.test(window.libary2.ok, "libary2 loaded");
require.ensure(1, function(require) {
	// Comments work!
	exports.ok = true;
	window.test(require(9) === "replaced", "node_modules should be replaced with web_modules");
	window.test(require(10) === "orginal", "node_modules should still work when web_modules exists");
});
setTimeout(function() {
	window.test(exports.ok, "asnyc loaded, exports is still avaible");
}, 3000);

window.test(require(2) === 1, "circular require should work");
window.test(require(1).value === 1, "sigular module loaded");
require(1).value = 2;
window.test(require(1).value === 2, "exported object is singluar");
window.test(require(11) === "subfilemodule", "Modules as single file should load");

require.ensure(2, function(require) {
	require(3);
	require(4);
	require(5);
});
require.ensure(7, function(require) {
	require(6);
	require(4);
	require(5);
});
var sum = 0;
require.ensure(8, function(require) {
	require(4);
	require(5);
	sum++;
});
require.ensure(8, function(require) {
	require(4);
	require(5);
	sum++;
});
setTimeout(function() {
	window.test(sum === 2, "Multiple callbacks on code load finish");
}, 3000);


/******/},
/******/
/******/1: function(module, exports, require) {

module.exports.value = 1;

/******/},
/******/
/******/2: function(module, exports, require) {

module.exports = 1;
module.exports = require(2);

/******/},
/******/
/******/11: function(module, exports, require) {

module.exports = "subfilemodule";

/******/},
/******/
/******/})