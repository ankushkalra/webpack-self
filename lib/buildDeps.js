var path = require("path");
var fs = require("fs");
var parse = require("./parse");
var resolve = require("./resolve");

function buildDeps(context, mainModule, options, callback) {
  // console.log("buildDeps called modulePath  = ", modulePath);
  var depTree = {
    modules: {},
    modulesById: {},
    chunks: {},
    nextModuleId: 0,
    nextChunkId: 0,
    warnings: []
  };
  var mainModuleId;
  // console.log("addModule triggered from buildDeps modulePath = ", modulePath);
  addModule(depTree, context, mainModule, options, { type: "main" }, function(err, id) {
    // console.log("*********callback test ", err, id);
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

function addModule(depTree, context, module, options, reason, callback) {
  // console.log("addModule modulePath = ", modulePath);
  // console.log("addModule context = ", context);

  // if (modulePath === "subfilemodule") {
  //   console.log("context = ", context);
  // }
  if (context) resolve(context, module, options.resolve, resolved);
  else resolved(null, module);
  function resolved(err, filename) {
    if (err) {
      // console.log("resolved in addModule callback called with err = ", err);
      callback(err);
      return;
    }

    if (depTree.modules[filename]) {
      if (module === "subfilemodule") {
        // console.log(
        //   "1 callback called with value = ",
        //   depTree.modules[filename].id,
        // );
        // console.log("add Module callback triggered = ", callback);
      }
      callback(null, depTree.modules[filename].id);
    } else {
      var module = (depTree.modules[filename] = {
        id: depTree.nextModuleId++,
        filename,
      });

      depTree.modulesById[module.id] = module;
      // if (modulePath === "subfilemodule") {
      //   console.log("module = ", module);
      // }
      //

      var filenameWithLoaders = filename;
      var loaders = filename.split("!");
      filename = loaders.pop();

      fs.readFile(filename, "utf-8", function(err, content) {
        if (err) {
          console.log(
            "fs readFile in resolved callback called with err = ",
            err,
          );
          callback(err);
          return;
        }

        if (loaders.length === 0)
          processJs(content);
        else {
          var loaderFunctions = [];
          try {
            loaders.forEach(function(name) {
              var loader = require(name);
              loaderFunctions.push(loader);
            })
          } catch (e) {
            callback(e);
            return;
          }

          function nextLoader(err, content) {
            if (err) {
              callback(err);
              return;
            }
            if (loaderFunctions.length > 0) {
              try {
                loaderFunctions.pop()([content], {
                  request: filenameWithLoaders,
                  filename
                }, nextLoader);
              } catch (e) {
                callback(err);
                return;
              }
            } else {
              processJs(content);
            }
          }
          nextLoader(null, content);
        }

        function processJs(source) {
          var deps;
          try {
            deps = parse(content, options.parse);
          } catch (e) {
            callback("File \"" + filenameWithLoaders + "\" parsing failed: " + e);
            return;
          }

          // console.log("deps.requires = ", deps.requires);

          module.requires = deps.requires || [];
          module.asyncs = deps.asyncs || [];
          module.contexts = deps.contexts || [];
          // console.log("file, module.requires = ", filename, module.requires);
          module.source = source;
          // console.log("module = ", module);
          let testValue =
            "/Users/ankush/wr/webpack/webpack-self/examples/require.context/example.js";

          if (filename === testValue) {
            console.log("source = ", source);
          }

          var requires = {}, directRequire = {};
          var contexts = [], directContexts = {};
          function add(r) {
            requires[r.name] = requires[r.name] || [];
            requires[r.name].push(r);
          }

          function addContext(m) {
            return function(c) {
              contexts.push({ context: c, module: m });
            };
          }

          if (module.requires) {
            module.requires.forEach(add);
            module.requires.forEach(function(r) {
              directRequire[r.name] = true;
            })
          }
          if (module.contexts) {
            module.contexts.forEach(addContext(module));
            module.contexts.forEach(function(c) {
              directContexts[c.name] = true;
            });
          }
          if (module.asyncs) {
            module.asyncs.forEach(function addAsync(c) {
              if (c.requires) c.requires.forEach(add);
              if (c.asyncs) c.asyncs.forEach(addAsync);
              if (c.contexts) c.contexts.forEach(addContext(c));
            });
          }

          var requireNames = Object.keys(requires);
          var count = requireNames.length + contexts.length + 1;
          var errors = [];
          // console.log("resolved init count = ", count);
          if (requireNames.length) {
            requireNames.forEach((moduleName) => {
              // console.log(
              //   "addModule triggerd from inside moduleName = ",
              //   moduleName,
              // );
              var reason = {
                type: directRequire[moduleName] ? "require" : "async require",
                count: requires[moduleName].length,
                filename
              };
              addModule(
                depTree,
                path.dirname(filename),
                moduleName,
                options,
                reason,
                function(err, moduleId) {
                  // console.log("*************** require callback");
                  if (err) {
                    console.log("err = ", err);
                    depTree.warnings.push(
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
                    requires[moduleName].forEach(function(requireItem) {
                      requireItem.id = moduleId;
                    });
                  }
                  endOne();
                },
              );
            });
          }
          if (contexts) {
            contexts.forEach(function(contextObj) {
              var context = contextObj.context;
              var module = contextObj.module;
              var reason = {
                type: directContexts[context.name] ? "context" : "async context",
                filename: filename
              }
              addContextModule(
                depTree,
                path.dirname(filename),
                context.name,
                options,
                reason,
                function(err, contextModuleId) {
                  // console.log("************ context callback err = ");
                  if (err) {
                    errors.push(
                      err +
                      "\n @ " +
                      filename +
                      " (line " +
                      context.line +
                      ", column " +
                      context.column +
                      ")",
                    );
                  } else {
                    // console.log("contextModuleId = ", contextModuleId);
                    context.id = contextModuleId;
                    module.requires.push({ id: context.id });
                  }
                  endOne();
                },
              );
              if (context.warn) {
                depTree.warnings.push(filename + "(line " + context.line + ", column " + context.column + "): " + "implicit use of require.context(\".\") is not recommended");
              }
            });
          }

          endOne();
          function endOne() {
            count--;
            // console.log("resolved = ", count);
            if (count === 0) {
              if (errors.length) {
                // console.log("!!!!!!! callback called with err = ", errors);
                callback(errors.join("\n"));
              } else {
                // console.log("2 callback called with value = ", module.id);
                callback(null, module.id);
              }
            }
          }
        }
      });
    }
  }
}

function addContextModule(
  depTree,
  context,
  contextModuleName,
  reason,
  options,
  callback,
) {
  // console.log("addContextModule contextModuleName = ", contextModuleName);
  resolve.context(context, contextModuleName, options, (err, dirname) => {
    if (err) {
      callback(err);
      return;
    }
    // console.log("addContextModule return dirname = ", dirname);

    if (depTree.modules[dirname]) {
      callback(null, depTree.modules[dirname].id);
      return;
    }
    var contextModule = (depTree.modules[dirname] = {
      name: contextModuleName,
      id: depTree.nextModuleId++,
      requireMap: {},
      requires: [],
    });
    depTree.modulesById[contextModule.id] = contextModule;
    function doDir(dirname, moduleName, done) {
      // console.log("doDir dirname = ", dirname);
      fs.readdir(dirname, function(err, list) {
        if (err) {
          console.log("doDir err = ", err);
          done(err);
          return;
        }
        var count = list.length;
        console.log("doDir count = ", count);
        var errors = [];
        function endOne(err) {
          if (err) {
            errors.push(err);
          }
          count--;
          if (count === 0) {
            if (errors.length) {
              done(errors.join("\n"));
            } else {
              done();
            }
          }
        }

        list.forEach((file) => {
          var filename = path.join(dirname, file);
          fs.stat(filename, function(err, stat) {
            // console.log("list filename = ", filename);
            if (err) {
              errors.push(err);
              endOne();
            } else {
              if (stat.isDirectory()) {
                if (file === "node_modules" || file === "web_modules")
                  endOne();
                else
                  doDir(filename, moduleName + "/" + file, done);
              } else {
                // console.log(
                //   "addModule triggerd from list.forEach file = ",
                //   file,
                //   " dirname = ",
                //   dirname,
                // );
                addModule(depTree, null, filename, options, reason, (err, moduleId) => {
                  // console.log(
                  //   "addModule callback in list.forEach moduleId = ",
                  //   moduleId,
                  //   moduleName,
                  //   file,
                  // );
                  if (err) {
                    endOne(err);
                  } else {
                    contextModule.requires.push({ id: moduleId });
                    contextModule.requireMap[moduleName + "/" + file] =
                      moduleId;
                    endOne();
                  }
                });
              }
            }
          });
        });
      });
    }
    doDir(dirname, ".", function(err) {
      // console.log("************* doDir callback err = ", err);
      if (err) {
        callback(err);
        return;
      }
      var extensionsAccess = [];
      var extensions = (options.resolve && options.resolve.extensions) || [
        ".web.js",
        ".js",
      ];
      extensions.forEach((extension) => {
        extensionsAccess.push("|| map[name + " + '"' + extension + '"' + "]");
      });
      contextModule.source =
        "/***/module.exports = function(name) {\n" +
        "/***/\tvar map = " +
        JSON.stringify(contextModule.requireMap) +
        ";\n" +
        "/***/ console.log('name = ', name);" +
        "/***/\tvar value = require(map[name]" +
        extensionsAccess.join("") +
        ");\n" +
        "/***/ console.log('value = ', value);" +
        "/***/\treturn value;" +
        "/***/};";
      callback(null, contextModule.id);
    });
  });
}

function addChunk(depTree, chunkStartpoint, options) {
  // console.log("chunkstart point = ", chunkStartpoint.id);
  var chunk = {
    id: depTree.nextChunkId++,
    modules: {},
    context: chunkStartpoint,
  };
  depTree.chunks[chunk.id] = chunk;
  chunkStartpoint.chunkId = chunk.id;
  // console.log(
  //   "chunkStartpoint requires = ", chunkStartpoint.requires.map((r) => r.name).join(", "),
  // );
  //
  // console.log(
  //   "chunkStartPoint id = ", chunkStartpoint.id,
  // );
  addModuleToChunk(depTree, chunkStartpoint, chunk.id, options);
  return chunk;
}

function addModuleToChunk(depTree, context, chunkId, options) {
  // console.log("context = ", context);
  context.chunks = context.chunks || [];
  if (context.chunks.indexOf(chunkId) === -1) {
    context.chunks.push(chunkId);
    if (context.id !== undefined)
      depTree.chunks[chunkId].modules[context.id] = "include";
    if (context.requires) {
      // console.log("context.requires = ", context.requires.map((r) => r.name).join(", "));
      // console.log("context.id = ", context.id);
      // console.log("requires = ", context.requires);
      context.requires.forEach((requireItem) => {
        // console.log(
        //   "depTree.modulesById[requireItem.id] = ",
        //   depTree.modulesById[requireItem.id],
        //   requireItem,
        // );
        // console.log("requiteItem = ", requireItem);
        if (requireItem.id) {
          addModuleToChunk(
            depTree,
            depTree.modulesById[requireItem.id],
            chunkId,
            options,
          );
        }
      });
    }

    if (context.asyncs) {
      context.asyncs.forEach(function(context) {
        var subChunk;
        if (context.chunkId) {
          subChunk = depTree.chunks[context.chunkId];
        } else {
          subChunk = addChunk(depTree, context, options);
        }
        subChunk.parents = subChunk.parents || [];
        subChunk.parents.push(chunkId);
      });
    }
  }
}

function removeParentsModules(depTree, chunk) {
  if (!chunk.parents) return;
  for (var moduleId in chunk.modules) {
    var inParent = true;
    chunk.parents.forEach(function(parentId) {
      if (!depTree.chunks[parentId].modules[moduleId]) inParent = false;
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
