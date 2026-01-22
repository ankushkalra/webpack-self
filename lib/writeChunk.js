var writeSource = require("./writeSource");

module.exports = function (depTree, chunk, options) {
  if (!options) {
    options = chunk;
    chunk = null;
  }

  var buffer = [];

  const modules = chunk ? chunk.modules : Object.keys(depTree.modulesById);

  for (var moduleId in modules) {
    var module = depTree.modulesById[moduleId];
    buffer.push("/*******/");
    buffer.push(moduleId);
    buffer.push(": function(module, exports, require) {\n\n");
    if (options.includeFilenames) {
      buffer.push("/*** ");
      buffer.push(module.filename);
      buffer.push(" ***/\n\n");
    }
    buffer.push(writeSource(module));
    buffer.push("\n\n/*******/},\n/*******/\n");
  }

  return buffer.join("");
};
