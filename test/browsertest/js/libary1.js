/******/var libary1=
/******/(function(document, undefined) {
/******/	return function(modules) {
/******/		var installedModules = {};
/******/		function require(moduleId) {
/******/			if(installedModules[moduleId])
/******/				return installedModules[moduleId];
/******/			var module = installedModules[moduleId] = {
/******/				exports: {}
/******/			};
/******/			modules[moduleId](module, module.exports, require);
/******/			return module.exports;
/******/		}
/******/		require.ensure = function(chunkId, callback) {
/******/			callback(require);
/******/		};
/******/		return require(0);
/******/	}
/******/})(document)
/******/({
/******/0: function(module, exports, require) {

// Single File Libary
window.test(window.writing, "Lib1 Should be in first tick");
window.test(require(1) === "lib1 component", "Lib1 component loaded");
require.ensure(1, function(require) {
	window.test(window.writing, "Lib1 Should be in first tick too");
	window.test(require(3) === "submodule1", "Lib1 submodule1 loaded");
	window.test(require(4) === "submodule2", "Lib1 submodule2 loaded");
	window.test(require(5)() === "submodule3", "Lib1 submodule3 loaded");
	require.ensure(0, function(require) {
		window.test(window.writing, "Lib1 Should be still in first tick");
	});
});
module.exports = true;

/******/},
/******/
/******/1: function(module, exports, require) {

module.exports = require(2);

/******/},
/******/
/******/2: function(module, exports, require) {

module.exports = "lib1 component";

/******/},
/******/
/******/3: function(module, exports, require) {

module.exports = "submodule1";

/******/},
/******/
/******/4: function(module, exports, require) {

module.exports = (function() {
	return "submodule2";
}());

/******/},
/******/
/******/5: function(module, exports, require) {

module.exports = function() {
	return "submodule3";
};

/******/},
/******/
/******/})