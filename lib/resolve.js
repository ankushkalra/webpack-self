var fs = require("fs");
var path = require("path");

function resolve(context, identifier, options, type, callback) {
  function finalResult(err, absoluteFilename) {
    if (err) {
      callback("Module \"" + identifier + "\" not found in context \"" + context + "\"\n " + err);
      return;
    }
    callback(null, absoluteFilename);
  }
  var identArray = split(identifier);
  var contextArray = split(context);
  if (!options) options = {};
  if (!options.extensions) options.extensions = [".web.js", ".js"];
  var pathname;

  if (identArray[0] === "." || identArray[0] === ".." || identArray[0] === "" || identArray[0].match(/^[A-Z]:$/i)) {
    var pathname = identArray[0][0] === "." ? join(contextArray, identArray) : path.join.apply(path, identArray);
    if (type === "context") {
      fs.stat(pathname, function(err, stat) {
        if (err) {
          finalResult(err);
          return;
        }
        if (!stat.isDirectory()) {
          finalResult('Context "' + identifier + '" is not a directory');
          return;
        }
        callback(null, pathname);
      });
    } else {

      loadAsFile(pathname, options, type, (err, absoluteFilename) => {
        if (err) {
          loadAsDirectory(pathname, options, type, callback);
          return;
        }
        callback(null, absoluteFilename);
      });
    }
  } else {
    loadNodeModulesAsContext(context, identifier, options, finalResult);
  }
};

function doResolve(context, identifier, options, type, callback) {
  if (!options) {
    options = {};
  }
  if (!options.extensions) {
    options.extensions = ["", ".webpack.js", ".web.js", ".js"];
  }
  if (!options.loaders) {
    options.loaders = [];
  }
  if (!options.postfixes) {
    options.postfixes = ["", "-webpack", "-web"];
  }
  if (!options.loaderExtensions) {
    options.loaderExtensions = [".webpack-web-loader.js", ".webpack-loader.js", ".web-loader.js", ".loader.js", "", ".js"];
  }
  if (!options.loaderPostfixes) {
    options.loaderPostfixes = ["-webpack-web-loader", "-webpack-loader", "-web-loader", "-loader", ""];
  }
  if (!options.paths)
    options.paths = [];
  if (!options.alias)
    options.alias = {};
  var identifiers = identifier.replace(/^!|!$/g,"").replace(/!!/g, "!").split(/!/g);
  if (identifier.indexOf("!") === -1) {
    var resource = identifiers.pop();
    // console.log("resource = ", resource);
    for (var i = 0; i < options.loaders.length; i++) {
      var line = options.loaders[i];
      if (line.test.test(resource)) {
        Array.prototype.push.apply(identifiers, line.loader.split(/!/g));
        break;
      }
    }
    identifiers.push(resource);
  }
  var errors = [];
  var count = identifiers.length;
  function endOne() {
    count--;
    if (count === 0) {
      if (errors.length > 0) {
        callback(errors.join("\n"));
        return;
      }
      callback(null, identifiers.join("!"));
    }
  }
  identifiers.forEach(function(ident, index) {
    resolve(context, ident, options, index === identifiers.length - 1 ? type : "loader", function(err, filename) {
      if (err) {
        errors.push(err);
      } else {
        if (!filename) {
          throw new Error(JSON.stringify({ identifiers, from: ident, to: filename }));
        }

        identifiers[index] = filename;
      }
      endOne()
    });
  });
}

module.exports = function(context, identifier, options, callback) {
  return doResolve(context, identifier, options, "normal", callback);
}


module.exports.context = function(context, identifier, options, callback) {
  return doResolve(context, identifier, options, "context", callback);
};

function split(a) {
  return a.split(/[\/\\]/g);
}

function join(a, b) {
  var c = [];
  a.forEach(function(x) {
    c.push(x);
  });
  b.forEach(function(x) {
    c.push(x);
  });
  if (c[0] === "") {
    c[0] = "/";
  }
  return path.join.apply(path, c);
}

function loadAsFile(filename, options, type, callback) {
  let testValue =
    "/Users/ankush/wr/webpack/webpack-self/test/browsertest/lib/subfilemodule";
  // if (filename === testValue)
  // console.log("filename = ", filename);
  var pos = -1,
    result = "NOT SET";
  var extensions = type === "loader" ? options.loaderExtensions : options.extensions;
  function tryCb(err, stats) {
    if (err || !stats || !stats.isFile()) {
      pos++;
      if (pos >= extensions.length) {
        callback(err || "Isn't a file");
        return;
      }
      fs.stat((result = filename + extensions[pos]), tryCb);
      return;
    }
    // if (filename === testValue) console.log("result = ", result);
    if (!result) throw new Error("no result");
    callback(null, result);
  }
  fs.stat((result = filename), tryCb);
}

function loadAsDirectory(dirname, options, type, callback) {
  var packageJsonFile = path.join(dirname, "package.json");
  fs.stat(packageJsonFile, function(err, stats) {
    var mainModule = "index";
    if (!err && stats.isFile()) {
      fs.readFile(packageJsonFile, "utf-8", function(err, content) {
        if (err) {
          callback(err);
          return;
        }
        content = JSON.parse(content);
        if (content.webpackLoader && type === "loader") {
          mainModule = content.webpackLoader;
        } else if (content.main) {
          mainModule = content.main;
        }
        loadAsFile(path.join(dirname, mainModule), options, type, callback);
      });
    } else {
      loadAsFile(path.join(dirname, mainModule), options, type, callback);
    }
  });
}

function loadNodeModules(context, identifier, options, type, callback) {
  var moduleName = identifier.shift();
  var postfixes = type === "loader" ? options.loaderPostfixes : options.postfixes;
  // console.log("loadNodeModules identifier = ", identifier);
  nodeModulePaths(context, options, function(err, paths) {
    // console.log("nodeModulePaths callback dirs = ", dirs);
    var dirs = [];
    paths.forEach(function(path) {
      postfixes.forEach(postfix => {
        dirs.push(join(split(path), [moduleName + postfix]));
      });
    });
    function tryDir(dir) {
      console.log("identifier = ", identifier);
      var pathname = join(split(dir), identifier);
      if (type === "context") {
        fs.stat(pathname, function(err, stat) {
          if (err || !stat.isDirectory()) {
            if (dirs.length === 0) {
              callback("no directory in any of the paths");
              return;
            }
            tryDir(dirs.shift());
            return;
          }
          callback(null, pathname);
        });
      } else {
        // console.log("pathname = ", pathname);
        loadAsFile(pathname, options, type, (err, absoluteFilename) => {
          if (err) {
            // console.log("err = ", err);
            loadAsDirectory(pathname, options, type, function(err, absoluteFilename) {
              if (err) {
                // console.log("err = ", err);
                if (dirs.length === 0) {
                  console.log("pathname = ", pathname);
                  callback("no module " + "named " + pathname + " in any path of paths");
                  return;
                }
                tryDir(dirs.shift());
                return;
              }
              callback(null, absoluteFilename);
            });
            return;
          }
          callback(null, absoluteFilename);
        });
      }
    }
    tryDir(dirs.shift());
  });
}

function loadNodeModulesAsContext(context, identifier, options, callback) {
  nodeModulePaths(context, options, function(err, dirs) {
    function tryDir(dir) {

      var pathname = path.join(dir, identifier);
    }
    tryDir(dirs.shift());
  });
}

function nodeModulePaths(context, options, callback) {
  var parts = context.split("/");
  var rootNodeModules = parts.indexOf("node_modules");
  var rootWebModules = parts.indexOf("web_modules");
  var root = 0;
  if (rootNodeModules != -1 && rootWebModules != -1) {
    root = Math.min(rootNodeModules, rootWebModules) - 1;
  }
  if (rootNodeModules != -1 || rootWebModules != -1) {
    root = Math.max(rootNodeModules, rootWebModules) - 1;
  }

  var dirs = [];
  if (options.paths) {
    options.paths.forEach(function(path) {
      dirs.push(path);
    });
  }

  for (var i = parts.length; i > root; i--) {
    if (parts[i - 1] === "node_modules" || parts[i - 1] === "web_modules") {
      continue;
    }
    var part = parts.slice(0, i);
    dirs.push(path.join(part.join("/"), "web_modules"));
    dirs.push(path.join(part.join("/"), "node_modules"));
  }
  callback(null, dirs);
}
