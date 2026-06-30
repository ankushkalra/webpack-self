var path = require("path");
var fs = require("fs");
var parse = require("./parse");
var resolve = require("./resolve");
const { checkPrime } = require("crypto");

module.exports = function buildDeps(context, mainModule, options, callback) {
  if (!callback) {
    callback = options;
    options = {};
  }
  if (!options) options = {};
  // console.log("buildDeps called modulePath  = ", modulePath);
  var depTree = {
    modules: {},
    modulesById: {},
    chunks: {},
    nextModuleId: 0,
    nextChunkId: 0,
    warnings: [],
    errors: []
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
    createRealIds(depTree, options);
    for (var chunkId in depTree.chunks) {
      removeParentsModules(depTree, depTree.chunks[chunkId]);
      removeChunkIfEmpty(depTree, depTree.chunks[chunkId]);
    }

    // cleanup
    delete depTree.chunkModules;
    depTree.modulesByFile = depTree.modules;
    depTree.modules = depTree.modulesById;
    delete depTree.modulesById;
    delete depTree.nextModuleId;
    delete depTree.nextChunkId;
    // return
    callback(null, depTree);
  }
}

function createRealIds(depTree, options) {
  var sortedModules = [];
  for (var id in depTree.modulesById) {
    if ("" + id === "0") continue;
    var modu = depTree.modulesById[id];
    var usages = 1;
    modu.reasons.forEach(function(reason) {
      usages += reason.count ? reason.count : 1;
    });
    modu.usages = usages;
    sortedModules.push(modu);
  }
  depTree.modulesById[0].realId = 0;
  sortedModules.sort(function(a, b) {
    if (a.chunks && b.chunks && (a.chunks.indexOf(0) !== -1 || b.chunks.indexOf(0) !== -1)) {
      if (a.chunks.indexOf(0) === -1) {
        return 1;
      }
      if (b.chunks.indexOf(0) === -1) {
        return -1;
      }
    }
    var diff = b.usages - a.usages;
    if (diff !== 0) return diff;
    if (typeof a.filename === "string" || typeof b.filename === "string") {
      if (typeof a.filename !== "string")
        return -1;
      if (typeof b.filename !== "string")
        return 1;
      if (a.filename === b.filename)
        return 0;
      return (a.filename < b.filename) ? -1 : 1;
    }
    if (a.dirname === b.dirname)
      return 0;
    return (a.dirname - b.dirname) ? -1 : 1;
  });
  sortedModules.forEach(function(modu, idx) {
    modu.realId = idx + 1;
  });
}

function execLoaders(request, loaders, filenames, contents, options, callback) {
  console.log("loaders = ", loaders);
  if (loaders.length === 0) {
    callback(null, contents[0]);
    return;
  } else {
    var loaderFunctions = [];
    try {
      loaders.forEach(function(name) {
        var loader = require(name);
        loaderFunctions.push(loader);
      });
    } catch (e) {
      callback(e);
      return;
    }

    function nextLoader() {
      var args = Array.prototype.slice.apply(arguments);
      var err = args.shift();
      if (err) {
        callback(err);
        return;
      }
      if (loaderFunctions.length > 0) {
        try {
          var async = false;
          var context = {
            request: request,
            filenames,
            exec: function(code, filename) {
              var Module = require("module")
              var m = new Module("exec in " + request, module);
              m.filename = filenames[0];
              m._compile(code, filename);
              return m.exports;
            },
            resolve: function(context, path, cb) {
              resolve(context, "!"+path, options.resolve, cb);
            },
            async: function() {
              async = true;
              return nextLoader;
            },
            callback: function() {
              async = true;
              nextLoader.apply(null, arguments);
            },
            web: true,
            debug: options.debug,
            minimize: options.minimize,
            values: undefined,
            options
          };
          var retVal = loaderFunctions.pop().apply(context, args);
          if (!async) {
            nextLoader(retVal === undefined ? new Error("loader did not return a value") : null, retVal);
          }
        } catch (e) {
          callback("Loader throwed exception: " + e);
          return;
        }
      } else {
        callback(null, args[0]);
      }
    }
    contents.unshift(null);
    nextLoader.apply(null, contents);
  }
}

function addModule(depTree, context, modu, options, reason, callback) {
  console.log("addModule modulePath = ", modu);
  console.log("addModule context = ", context);

  // if (modulePath === "subfilemodule") {
  //   console.log("context = ", context);
  // }
  resolve(context || path.dirname(modu), modu, options.resolve, resolved);
  function resolved(err, filename) {
    console.log("resolved in addModule callback called with err = ", err);
    if (err) {
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
      var modu = (depTree.modules[filename] = {
        id: depTree.nextModuleId++,
        filename,
        reasons: [reason]
      });

      depTree.modulesById[modu.id] = modu;
      // if (modulePath === "subfilemodule") {
      //   console.log("module = ", module);
      // }
      //

      var filenameWithLoaders = filename;
      console.log("filenameWithLoaders = ", filenameWithLoaders);
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
        execLoaders(filenameWithLoaders, loaders, [filename], [content], options, processJs);
        function processJs(err, source) {
          if (err) {
            callback(err);
            return;
          }
          var deps;
          try {
            console.log("content = ", content);
            deps = parse(content, options.parse);
          } catch (e) {
            callback("File \"" + filenameWithLoaders + "\" parsing failed: " + e);
            return;
          }

          // console.log("deps.requires = ", deps.requires);

          modu.requires = deps.requires || [];
          modu.asyncs = deps.asyncs || [];
          modu.contexts = deps.contexts || [];
          // console.log("file, modu.requires = ", filename, modu.requires);
          modu.source = source;
          // console.log("modu = ", modu);
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

          if (modu.requires) {
            modu.requires.forEach(add);
            modu.requires.forEach(function(r) {
              directRequire[r.name] = true;
            })
          }
          if (modu.contexts) {
            modu.contexts.forEach(addContext(modu));
            modu.contexts.forEach(function(c) {
              directContexts[c.name] = true;
            });
          }
          if (modu.asyncs) {
            modu.asyncs.forEach(function addAsync(c) {
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
                    depTree.errors.push(
                      "Cannot find module '" + moduleName + "'\n" +
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
                    depTree.errors.push(
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
              // console.log("ended bina err wala");
              if (errors.length) {
                // console.log("!!!!!!! callback called with err = ", errors);
                callback(errors.join("\n"));
              } else {
                // console.log("2 callback called with value = ", module.id);
                callback(null, modu.id);
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
  resolve.context(context, contextModuleName, options.resolve, resolved);
  function resolved(err, dirname) {
    if (err) {
      callback(err);
      return;
    }
    // console.log("addContextModule return dirname = ", dirname);

    if (depTree.modules[dirname]) {
      depTree.modules[dirname].reasons.push(reason);
      callback(null, depTree.modules[dirname].id);
    } else {
      var contextModule = depTree.modules[dirname] = {
        name: contextModuleName,
        dirname,
        id: depTree.nextModuleId++,
        requireMap: {},
        requires: [],
        reasons: [reason]
      }
      depTree.modulesById[contextModule.id] = contextModule;
      var contextModuleNameWithLoaders = dirname;
      var loaders = dirname.split(/!/g);
      dirname = loaders.pop();
      var prependLoaders = loaders.length === 0 ? "" : loaders.join("!") + "!";
      var extensions = (options.resolve && options.resolve.extensions) || [".web.js", ".js"];
      function doDir(dirname, moduleName, done) {
        // console.log("doDir dirname = ", dirname);
        fs.readdir(dirname, function(err, list) {
          if (err) {
            console.log("doDir err = ", err);
            done(err);
          } else {
            var count = list.length;
            // console.log("doDir count = ", count);
            var errors = [];
            function endOne(err) {
              if (err) {
                errors.push(err);
              }
              count--;
              if (count === 0) {
                // console.log("ended err wala");
                if (errors.length > 0) {
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
                      doDir(filename, moduleName + "/" + file, endOne);
                  } else {
                    var match = false;
                    if (loaders.length === 0)
                      extensions.forEach(function(ext) {
                        if (file.substr(file.length - ext.length) === ext)
                          match = true;
                        if (options.resolve && options.resolve.loaders)
                          options.resolve.loaders.forEach(function(loader) {
                            if (loader.test.test(filename))
                              match = true;
                          });
                      });
                    if (!match && loaders.length === 0) {
                      endOne();
                      return;
                    }
                    var modulereason = {
                      type: "context",
                      filename: reason.filename
                    };
                    // console.log(
                    //   "addModule triggerd from list.forEach file = ",
                    //   file,
                    //   " dirname = ",
                    //   dirname,
                    // );
                    addModule(depTree, dirname, prependLoaders + filename, options, reason, (err, moduleId) => {
                      // console.log(
                      //   "addModule callback in list.forEach moduleId = ",
                      //   moduleId,
                      //   moduleName,
                      //   file,
                      // );
                      if (err) {
                        depTree.warnings.push("A file in context was excluded because of error: " + err);
                        endOne();
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
            endOne();
          }
        });
      }
      doDir(dirname, ".", function(err) {
        // console.log("************* doDir callback err = ", err);
        if (err) {
          callback(err);
          return;
        }
        // var extensionsAccess = [];
        // var extensions = (options.resolve && options.resolve.extensions) || [
        //   ".web.js",
        //   ".js",
        // ];
        // extensions.forEach((extension) => {
        //   extensionsAccess.push("|| map[name + " + '"' + extension + '"' + "]");
        // });
        // contextModule.source =
        //   "/***/module.exports = function(name) {\n" +
        //   "/***/\tvar map = " +
        //   JSON.stringify(contextModule.requireMap) +
        //   ";\n" +
        //   "/***/ console.log('name = ', name);" +
        //   "/***/\tvar value = require(map[name]" +
        //   extensionsAccess.join("") +
        //   ");\n" +
        //   "/***/ console.log('value = ', value);" +
        //   "/***/\treturn value;" +
        //   "/***/};";
        callback(null, contextModule.id);
      });
    }
  };
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
    var checkedParents = {};
    chunk.parents.forEach(function checkParent(parentId) {
      if (checkedParents[parentId]) return;
      checkedParents[parentId] = true;
      if (!depTree.chunks[parentId].modules[moduleId]) inParent = false;
      if (inParent && depTree.chunks[parentId].parents) 
        depTree.chunks[parentId].parents.forEach(checkParent);
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

