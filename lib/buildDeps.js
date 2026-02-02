var path = require("path");
var fs = require("fs");
var parse = require("./parse");
var resolve = require("./resolve");

function buildDeps(context, modulePath, options, callback) {
  var depTree = {
    modules: {},
    modulesById: {},
    chunks: {},
    nextModuleId: 0,
    nextChunkId: 0,
  };
  var mainModuleId;
  addModule(depTree, context, modulePath, options, (err, id) => {
    if (err) {
      callback(err);
      return;
    }
    mainModuleId = id;
    buildTree();
  });

  function buildTree() {
    addChunk(depTree, depTree.modulesById[mainModuleId]);
    for (var chunkId in depTree.chunks) {
      removeParentsModules(depTree, depTree.chunks[chunkId]);
      removeChunkIfEmpty(depTree, depTree.chunks[chunkId]);
    }

    callback(null, depTree);
  }
}

function addModule(depTree, context, modulePath, options, callback) {
  resolve(context, modulePath, options, (err, filename) => {
    if (err) {
      callback(err);
      return;
    }

    if (depTree.modules[filename]) {
      callback(null, depTree.modules[filename].id);
    } else {
      var module = (depTree.modules[filename] = {
        id: depTree.nextModuleId++,
        filename,
      });

      depTree.modulesById[module.id] = module;

      fs.readFile(filename, "utf-8", function (err, source) {
        if (err) {
          callback(err);
          return;
        }
        var deps = parse(source);

        module.requires = deps.requires || [];
        module.asyncs = deps.asyncs || [];
        module.source = source;

        var requires = {};
        function add(r) {
          requires[r.name] = requires[r.name] || [];
          requires[r.name].push(r);
        }

        if (module.requires) {
          module.requires.forEach(add);
        }

        if (module.asyncs) {
          module.asyncs.forEach(function addContext(c) {
            if (c.requires) c.requires.forEach(add);
            if (c.asyncs) c.asyncs.forEach(addContext);
          });
        }

        var requireNames = Object.keys(requires);
        var count = requireNames.length;
        var errors = [];
        if (requireNames.length) {
          requireNames.forEach((moduleName) => {
            addModule(
              depTree,
              path.dirname(filename),
              moduleName,
              options,
              function (err, moduleId) {
                if (err) {
                  errors.push(
                    err +
                      "\n @ " +
                      filename +
                      "(line " +
                      requires[moduleName][0].line +
                      ", column " +
                      requires[moduleName][0].column +
                      ")",
                  );
                } else {
                  requires[moduleName].forEach(function (requireItem) {
                    requireItem.id = moduleId;
                  });
                }

                count--;
                if (count === 0) {
                  if (errors.length) {
                    callback(errors.join("\n"));
                  } else {
                    end();
                  }
                }
              },
            );
          });
        } else end();
        function end() {
          callback(null, module.id);
        }
      });
    }
  });
}

function addChunk(depTree, chunkStartpoint) {
  var chunk = {
    id: depTree.nextChunkId++,
    modules: {},
    context: chunkStartpoint,
  };
  depTree.chunks[chunk.id] = chunk;
  chunkStartpoint.chunkId = chunk.id;
  addModuleToChunk(depTree, chunkStartpoint, chunk.id);
  return chunk;
}

function addModuleToChunk(depTree, module, chunkId) {
  module.chunks = module.chunks || [];
  if (module.chunks.indexOf(chunkId) === -1) {
    module.chunks.push(chunkId);
  }

  if (module.id !== undefined)
    depTree.chunks[chunkId].modules[module.id] = "include";

  if (module.requires) {
    module.requires.forEach((r) => {
      addModuleToChunk(depTree, depTree.modulesById[r.id], chunkId);
    });
  }

  if (module.asyncs) {
    module.asyncs.forEach(function (context) {
      var subChunk;
      if (context.chunkId) {
        subChunk = depTree.chunks[context.chunkId];
      } else {
        subChunk = addChunk(depTree, context);
      }

      subChunk.parents = subChunk.parents || [];
      subChunk.parents.push(chunkId);
    });
  }
}

function removeParentsModules(depTree, chunk) {
  if (!chunk.parents) return;
  for (var moduleId in chunk.modules) {
    var inParent = false;
    chunk.parents.forEach(function (parentId) {
      if (depTree.chunks[parentId].modules[moduleId]) inParent = true;
    });
    if (inParent) {
      chunk.modules[moduleId] = "in-parent";
    }
  }
}

function removeChunkIfEmpty(depTree, chunk) {
  var hasModules = false;
  for (var moduleId in chunk.modules) {
    if (chunk.modules[moduleId] === "include") {
      hasModules = true;
      break;
    }
  }
  if (!hasModules) {
    chunk.context.chunkId = null;
    chunk.empty = true;
  }
}

module.exports = buildDeps;
