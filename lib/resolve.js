var fs = require("fs");
var path = require("path");

function resolve(context, identifier, options, type, callback) {
  if (!options) options = {};
  if (!options.extensions) options.extensions = [".web.js", ".js"];
  var pathname;
  var identArray = split(identifier);
  var contextArray = context.split("/");

  if (identArray[0] === "." || identArray[0] === ".." || identArray[0] === "" || identArray[0].match(/^[A-Z]:$/i)) {
    var pathname = identArray[0][0] === "." ? join(contextArray, identArray) : path.join.apply(path, identArray);
    loadAsFile(pathname, options, type, (err, absoluteFilename) => {
      if (err) {
        loadAsDirectory(pathname, options, type, callback);
        return;
      }
      callback(null, absoluteFilename);
    });
  } else {
    loadNodeModules(context, identArray, options, type, callback);
    return;
  }
};

module.exports = function(context, identifier, options, callback) {
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
  var identifiers = identifier.split(/!/g);
  if (identifiers.length === 1) {
    var resource = identifiers.pop();
    for (var i = 0; i < options.loaders.length; i++) {
      var line = options.loaders[i];
      if (line.test.test(resource)) {
        identifiers.push(line.loader);
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
    resolve(context, ident, options, index === identifiers.length - 1 ? "normal" : "loader", function(err, filename) {
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


module.exports.context = function(context, identifier, options, callback) {
  if (!options) {
    options = {};
  }
  if (!options.paths) options.paths = [];
  if (!options.alias) options.alias = {};
  function finalResult(err, absoluteFilename) {
    if (err) {
      callback(
        'Context "' + identifier + '" not found in context "' + context + '"',
      );
      return;
    }
    callback(null, absoluteFilename);
  }

  var identArray = identifier.split("/");
  var contextArray = split(context);
  // console.log("identArray[0] = ", identArray[0], identifier);
  while (options.alias[identArray[0]]) {
    var old = identArray[0];
    identArray[0] = options.alias[identArray[0]];
    identArray = split(path.join.apply(path, identArray));
    if (identArray[0] === old)
      break;
  }


  if (identArray[0] === "." || identArray[0] === ".." || identArray[0] === "") {
    var pathname = join(contextArray, identArray);
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
    loadNodeModulesAsContext(context, identifier, options, finalResult);
  }
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
  // console.log("loadNodeModules identifier = ", identifier);
  nodeModulePaths(context, options, function(err, dirs) {
    // console.log("nodeModulePaths callback dirs = ", dirs);
    function tryDir(dir) {
      var pathname = join(split(dir), identifier);
      // console.log("pathname = ", pathname);
      loadAsFile(pathname, options, type, (err, absoluteFilename) => {
        if (err) {
          // console.log("err = ", err);
          loadAsDirectory(pathname, options, type, function(err, absoluteFilename) {
            if (err) {
              // console.log("err = ", err);
              if (dirs.length === 0) {
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
    tryDir(dirs.shift());
  });
}

function loadNodeModulesAsContext(context, identifier, options, callback) {
  nodeModulePaths(context, options, function(err, dirs) {
    function tryDir(dir) {
      var pathname = path.join(dir, identifier);
      fs.stat(pathname, function(err, stat) {
        if (err || !stat.isDirectory()) {
          if (dirs.length === 0) {
            callback(true);
            return;
          }
          tryDir(dirs.shift());
          return;
        }
        callback(null, pathname);
      });
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
