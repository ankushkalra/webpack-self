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

/******/({a:'.output.js', b: 'webpackJsonp', c: 'js/',
/*******/0: function(module, exports, require) {

function getTemplate(templateName, callback) {
	require.ensure(1, function(require) {
		callback(require(/* ../require.context/templates */1)("./"+templateName));
	});
}
getTemplate("a", function(a) {
	console.log(a);
});
getTemplate("b", function(b) {
	console.log(b);
});

/*******/},
/*******/
/*******/})