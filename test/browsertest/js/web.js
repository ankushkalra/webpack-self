/******/(function (document, undefined) {
/******/ return function(modules) {
/******/  var installedModules = {}, installedChunks = {0:1};
/******/
/******/  function require(moduleId) {
/******/    if (typeof moduleId !== "number") throw new Error("Cannot find module '"+moduleId+"'"); 
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

require = require(/* ../../../require-polyfill */4)(require.valueOf());
window.test(true, "index.js should be replaced with index.web.js");
window.test(window.libary1, "libary1 loaded");
window.test(window.libary2.ok, "libary2 loaded");
require.ensure(1, function(require) {
	// Comments work!
	exports.ok = true;
	window.test(require(/* subcontent */27) === "replaced", "node_modules should be replaced with web_modules");
	window.test(require(/* subcontent2/file.js */28) === "orginal", "node_modules should still work when web_modules exists");
});
setTimeout(function() {
	window.test(exports.ok, "asnyc loaded, exports is still avaible");
}, 3000);

window.test(require(/* ./circular */5) === 1, "circular require should work");
window.test(require(/* ./singluar.js */1).value === 1, "sigular module loaded");
require(/* ./singluar.js */1).value = 2;
window.test(require(/* ./singluar */1).value === 2, "exported object is singluar");
window.test(require(/* subfilemodule */29) === "subfilemodule", "Modules as single file should load");
window.test(require(/* ../templates */2)("./tmpl") === "test template", "Context should work");
window.test(require(/* ../templates */2) ( "./subdir/tmpl.js" ) === "subdir test template", "Context should work with subdirectories and splitted");
var template = "tmpl", templateFull = "./tmpl.js";
window.test(require(/* ../templates */2)("./" + template) === "test template", "Automatical context should work");
window.test(require(/* ../templates/templateLoader */6)(templateFull) === "test template", "Automatical context without prefix should work");
window.test(require(/* ../templates/templateLoaderIndirect */7)(templateFull) === "test template", "Automatical context should work with require identifier");
window.test(function(require) { return require; }(1234) === 1234, "require overwrite in anonymos function");
function testFunc(abc, require) {
	return require;
}
window.test(testFunc(333, 678) === 678, "require overwrite in named function");
function testCase(number) {
	//window.test(require("./folder/file" + (number === 1 ? 1 : "2")) === "file" + number);
	window.test(require(number === 1 ? /* ../folder/file1 */8 : number === 2 ? /* ../folder/file2 */9 : number === 3 ? /* ../folder/file3 */10 : "./missingModule") === "file" + number, "?: operator in require do not create context, test "+number);
}
testCase(1);
testCase(2);
testCase(3);
window.test(require(/* ../folder/typeof */11) === "function", "typeof require should be function");

var error = null;
try {
	testCase(4);
} catch(e) {
	error = e;
}
window.test(error instanceof Error, "Missing module should throw Error, indirect");
error = null;
try {
	require("./missingModule2");
} catch(e) {
	error = e;
}
window.test(error instanceof Error, "Missing module should throw Error, direct");

require.ensure(2, function(require) {
	var contextRequire = require(/* . */3);
	window.test(contextRequire("./singluar").value === 2, "Context works in chunk");
	var singl = "singl";
	window.test(require(/* . */3)("./" + singl + "uar").value === 2, "Context works in chunk, when splitted");
	window.test(typeof require(/* __webpack_module */12).id === "string", "module.id should be a string");
	window.test(require(/* __webpack_process */13).argv && require(/* __webpack_process */13).argv.length > 1, "process.argv should be an array");
	require(/* __webpack_process */13).nextTick(function() {
		sum2++;
	});
	require(/* __webpack_process */13).on("xyz", function() {
		sum2++;
	});
	require(/* __webpack_process */13).emit("xyz");
	window.test(window === require(/* __webpack_global */14), "window === global");
	(function() {
		var require = 123;
		window.test(require === 123, "overwrite require via variable should be ok");
	}());
	(function() {
		var module = 1233;
		window.test(module === 1233, "overwrite module via variable should be ok");
	}());
});

require.ensure(7, function(require) {
	require(/* ./acircular */15);
	require(/* ./duplicate */16);
	require(/* ./duplicate2 */17);
});
require.ensure(8, function(require) {
	require(/* ./acircular2 */18);
	require(/* ./duplicate */16);
	require(/* ./duplicate2 */17);
});
var sum = 0;
require.ensure(9, function(require) {
	require(/* ./duplicate */16);
	require(/* ./duplicate2 */17);
	sum++;
});
require.ensure(10, function(require) {
	require(/* ./duplicate */16);
	require(/* ./duplicate2 */17);
	sum++;
});
var sum2 = 0;
setTimeout(function() {
	window.test(sum === 2, "Multiple callbacks on code load finish");
	window.test(sum2 === 2, "process.nextTick and process.emit/on should be polyfilled");
}, 3000);


/*******/},
/*******/
/*******/1: function(module, exports, require) {

module.exports.value = 1;

/*******/},
/*******/
/*******/2: function(module, exports, require) {

/***/module.exports = function(name) {
/***/	var map = {"./templateLoader.js":6,"./templateLoaderIndirect.js":7,"./tmpl.js":20,"./subdir/tmpl.js":25};
/***/ console.log('name = ', name);/***/	var value = require(map[name]|| map[name + ".web.js"]|| map[name + ".js"]);
/***/ console.log('value = ', value);/***/	return value;/***/};

/*******/},
/*******/
/*******/4: function(module, exports, require) {

module.exports = function(r) { return r; }


/*******/},
/*******/
/*******/5: function(module, exports, require) {

module.exports = 1;
module.exports = require(/* ./circular */5);

/*******/},
/*******/
/*******/6: function(module, exports, require) {

module.exports = function(name) {
	return require(/* . */2)(name);
}

/*******/},
/*******/
/*******/7: function(module, exports, require) {

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
/*******/8: function(module, exports, require) {

module.exports = "file1";

/*******/},
/*******/
/*******/9: function(module, exports, require) {

module.exports = "file2";

/*******/},
/*******/
/*******/10: function(module, exports, require) {

module.exports = "file3";

/*******/},
/*******/
/*******/11: function(module, exports, require) {

module.exports = typeof require;


/*******/},
/*******/
/*******/20: function(module, exports, require) {

module.exports = "test template";

/*******/},
/*******/
/*******/25: function(module, exports, require) {

module.exports = "subdir test template";

/*******/},
/*******/
/*******/29: function(module, exports, require) {

module.exports = "subfilemodule";

/*******/},
/*******/
/*******/})