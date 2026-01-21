var writeSource = require("./writeSource");

function writeChunk(depTree, chunk) {
  var buffer = [];

  const modules = chunk ? chunk.modules : Object.keys(depTree.modulesById);

  for (var moduleId in modules) {
    var module = depTree.modulesById[moduleId];
    buffer.push("/*******/");
    buffer.push(moduleId);
    buffer.push(": function(module, exports, require) {\n\n");

    buffer.push(writeSource(module));
    buffer.push("\n\n/*******/},\n/*******/\n");
  }

  return buffer.join("");
}

module.exports = writeChunk;
