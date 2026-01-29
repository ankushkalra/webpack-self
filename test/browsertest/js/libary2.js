/******/var libary2=
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
/******/({a:".libary2.js",b:"webpackJsonplibary2",c:"js/",
/******/0: function(module, exports, require) {

// Chunked File Libary
window.test(window.writing, "Lib2 Should be in first tick");
var asnycOk = false, asnycOk2 = false;
require.ensure(1, function(require) {
	asnycOk = true;
	window.test(!window.writing, "Lib2 Should be asynchron loaded");
	var sameTick = true;
	require.ensure(0, function(require) {
		asnycOk2 = true;
		window.test(require(1) === "Lib2 extra", "Lib2 extra loaded");
		window.test(sameTick, "Lib2 Should be in the same tick, as it is a empty chunk");
	});
	sameTick = false;
});
setTimeout(function() {
	window.test(asnycOk, "Lib2 Chunk 1 should be loaded");
	window.test(asnycOk2, "Lib2 Chunk 2 should be loaded");
}, 3000);
window.test(!asnycOk, "Lib2 Chunk 1 should not be loaded yet");
window.test(!asnycOk2, "Lib2 Chunk 2 should not be loaded yet");
exports.ok = true;

/******/},
/******/
/******/})