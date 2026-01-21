var fs = require("fs");
var parse = require("./parse");
var resolve = require("./resolve");

var depTree = {
  currentId: 0,
  nextChunkId: 0,
  modulesById: {},
  chunks: {},
  modules: [],
};

function addModule(depTree, modulePath, callback) {
  resolve(modulePath, (err, filename) => {
    if (err) {
      callback(err);
      return;
    }

    var modules = depTree.modules || [];
    var m = modules.find((module) => module.filename === filename);
    if (m) {
      callback(null, m.id);
      return;
    }

    var module = {
      id: depTree.currentId++,
      filename,
    };

    depTree.modules.push(module);
    depTree.modulesById[module.id] = module;

    fs.readFile(filename, "utf-8", function (err, source) {
      if (err) {
        callback(err);
        return;
      }
      var deps = parse(source);

      module.requires = deps.requires;
      module.asyncs = deps.asyncs || [];
      module.source = source;

      var requires = [];
      function add(r) {
        requires.push(r);
      }

      module.requires.forEach(add);

      module.asyncs.forEach(function addContext(c) {
        if (c.requires) c.requires.forEach(add);
        if (c.asyncs) c.asyncs.forEach(addContext);
      });

      var count = requires.length;

      if (requires.length) {
        requires.forEach((r) => {
          addModule(depTree, r.name, (err, id) => {
            if (err) {
              callback(err);
              return;
            }

            r.id = id;

            count--;
            if (count === 0) {
              end();
            }
          });
        });
      } else {
        end();
      }

      function end() {
        callback(null, module.id);
      }
    });
  });
}

function buildDeps(modulePath, callback) {
  var mainModuleId;
  addModule(depTree, modulePath, (err, id) => {
    if (err) {
      callback(err);
      return;
    }
    mainModuleId = id;
    buildTree(depTree);
  });

  function buildTree(depTree) {
    addChunk(depTree, depTree.modulesById[mainModuleId]);
    callback(null, depTree);
  }
}

function addChunk(depTree, chunkStartpoint) {
  var chunk = {
    id: depTree.nextChunkId++,
    modules: {},
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
      addModuleToChunk(depTree, r, chunkId);
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

module.exports = buildDeps;
