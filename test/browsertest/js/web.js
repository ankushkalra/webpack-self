/******/(function (document, undefined) {
/******/ return function(modules) {
/******/  var installedModules = {}, installedChunks = {0:1};
/******/
/******/  function require(moduleId) {
/******/    if (installedModules[moduleId]) {
/******/      return installedModules[moduleId].exports;
/******/    }
/******/
/******/    var module = installedModules[moduleId]= {
/******/      exports: {},
/******/    };
/******/    console.log("async moduleId = ", moduleId, modules);
/******/    modules[moduleId](
/******/      module,
/******/      module.exports,
/******/      require,
/******/    );
/******/    return module.exports;
/******/  }
/******/
/******/  require.ensure = function(chunkId, callback) {
/******/    if (installedChunks[chunkId] === 1) return callback(require);
/******/    if (installedChunks[chunkId] !== undefined)
/******/      installedChunks[chunkId].push(callback);
/******/    else {
/******/      installedChunks[chunkId] = [callback];
/******/      var head = document.getElementsByTagName('head')[0];
/******/      var script = document.createElement('script');
/******/      script.type = 'text/javascript';
/******/      console.log("script c, chunkId, a = ", modules.c, chunkId, modules.a);
/******/      script.src = modules.c + chunkId + modules.a;
/******/      head.appendChild(script);
/******/    }
/******/  };
/******/
/******/  window[modules.b] = function(chunkId, moreModules) {
/******/    for (var moduleId in moreModules)
/******/      modules[moduleId] = moreModules[moduleId];
/******/    var callbacks = installedChunks[chunkId];
/******/    installedChunks[chunkId] = 1;
/******/    for (var i = 0; i < callbacks.length; i++)
/******/      callbacks[i](require);
/******/  };
/******/  return require(0);
/******/ }
/******/})(document)

/******/({a:'.web.js', b: 'webpackJsonp', c: 'js/',
/*******/0: function(module, exports, require) {

window.test(true, "index.js should be replaced with index.web.js");
window.test(window.libary1, "libary1 loaded");
window.test(window.libary2.ok, "libary2 loaded");
require.ensure(1, function(require) {
	// Comments work!
	exports.ok = true;
	window.test(require(/* subcontent */18) === "replaced", "node_modules should be replaced with web_modules");
	window.test(require(/* subcontent2/file.js */19) === "orginal", "node_modules should still work when web_modules exists");
});
setTimeout(function() {
	window.test(exports.ok, "asnyc loaded, exports is still avaible");
}, 3000);

window.test(require(/* ./circular */4) === 1, "circular require should work");
window.test(require(/* ./singluar.js */1).value === 1, "sigular module loaded");
require(/* ./singluar.js */1).value = 2;
window.test(require(/* ./singluar */1).value === 2, "exported object is singluar");
window.test(require(/* subfilemodule */20) === "subfilemodule", "Modules as single file should load");
window.test(require(/* ../templates */2)("./tmpl") === "test template", "Context should work");
window.test(require(/* ../templates */2) ( "./subdir/tmpl.js" ) === "subdir test template", "Context should work with subdirectories and splitted");
var template = "tmpl", templateFull = "./tmpl.js";
window.test(require(/* ../templates */2)("./" + template) === "test template", "Automatical context should work");
window.test(require(/* ../templates/templateLoader */5)(templateFull) === "test template", "Automatical context without prefix should work");
window.test(require(/* ../templates/templateLoaderIndirect */6)(templateFull) === "test template", "Automatical context should work with require identifier");
window.test(function(require) { return require; }(1234) === 1234, "require overwrite in anonymos function");
function testFunc(abc, require) {
	return require;
}
window.test(testFunc(333, 678) === 678, "require overwrite in named function");


require.ensure(2, function(require) {
	var contextRequire = require(/* . */3);
	window.test(contextRequire("./singluar").value === 2, "Context works in chunk");
	var singl = "singl";
	window.test(require(/* . */3)("./" + singl + "uar").value === 2, "Context works in chunk, when splitted");
});

require.ensure(7, function(require) {
	require(/* ./acircular */7);
	require(/* ./duplicate */9);
	require(/* ./duplicate2 */8);
});
require.ensure(8, function(require) {
	require(/* ./acircular2 */10);
	require(/* ./duplicate */9);
	require(/* ./duplicate2 */8);
});
var sum = 0;
require.ensure(9, function(require) {
	require(/* ./duplicate */9);
	require(/* ./duplicate2 */8);
	sum++;
});
require.ensure(10, function(require) {
	require(/* ./duplicate */9);
	require(/* ./duplicate2 */8);
	sum++;
});
setTimeout(function() {
	window.test(sum === 2, "Multiple callbacks on code load finish");
}, 3000);


/*******/},
/*******/
/*******/1: function(module, exports, require) {

module.exports.value = 1;

/*******/},
/*******/
/*******/2: function(module, exports, require) {

/***/module.exports = function(name) {
/***/	var map = {"./templateLoader.js":5,"./templateLoaderIndirect.js":6,"./tmpl.js":12,"./subdir/tmpl.js":17};
/***/ console.log('name = ', name);/***/	var value = require(map[name]|| map[name + ".web.js"]|| map[name + ".js"]);
/***/ console.log('value = ', value);/***/	return value;/***/};

/*******/},
/*******/
/*******/4: function(module, exports, require) {

module.exports = 1;
module.exports = require(/* ./circular */4);

/*******/},
/*******/
/*******/5: function(module, exports, require) {

module.exports = function(name) {
	return require(/* . */2)(name);
}

/*******/},
/*******/
/*******/6: function(module, exports, require) {

module.exports = function(name) {
	var a = load(require(/* . */2), name);
	var r = require(/* . */2);
	var b = r(name);
	if(a !== b) return "FAIL";
	return a;
}

function load(requireFunction, name) {
	return requireFunction(name);
}

/*******/},
/*******/
/*******/12: function(module, exports, require) {

module.exports = "test template";

/*******/},
/*******/
/*******/17: function(module, exports, require) {

module.exports = "subdir test template";

/*******/},
/*******/
/*******/20: function(module, exports, require) {

module.exports = "subfilemodule";

/*******/},
/*******/
/*******/})