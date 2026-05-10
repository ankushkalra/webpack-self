var fs = require("fs");
var path = require("path");

module.exports = function resolve(context, identifier, options, callback) {
  if (!options) options = {};
  if (!options.extensions) options.extensions = [".web.js", ".js"];
  var pathname;
  var identArray = identifier.split("/");
  var contextArray = context.split("/");

  if (identArray[0] === "." || identArray[0] === ".." || identArray[0] === "") {
    var pathname = join(contextArray, identArray);
    loadAsFile(pathname, options, (err, absoluteFilename) => {
      if (err) {
        loadAsDirectory(pathname, options, callback);
        return;
      }
      callback(null, absoluteFilename);
    });
  } else {
    loadNodeModules(context, identArray, options, callback);
    return;
  }
};

module.exports.context = function (context, identifier, options, callback) {
  if (!options) {
    options = {};
  }
  if (!options.paths) options.paths = [];
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
  if (identArray[0] === "." || identArray[0] === ".." || identArray[0] === "") {
    var pathname = join(contextArray, identArray);
    fs.stat(pathname, function (err, stat) {
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
  a.forEach(function (x) {
    c.push(x);
  });
  b.forEach(function (x) {
    c.push(x);
  });
  if (c[0] === "") {
    c[0] = "/";
  }
  return path.join.apply(path, c);
}

function loadAsFile(filename, options, callback) {
  let testValue =
    "/Users/ankush/wr/webpack/webpack-self/test/browsertest/lib/subfilemodule";
  // if (filename === testValue)
  // console.log("filename = ", filename);
  var pos = -1,
    result;

  function tryCb(err, stats) {
    if (err || !stats || !stats.isFile()) {
      pos++;
      if (pos >= options.extensions.length) {
        callback(err);
        return;
      }
      fs.stat((result = filename + options.extensions[pos]), tryCb);
      return;
    }
    // if (filename === testValue) console.log("result = ", result);
    callback(null, result);
  }
  fs.stat((result = filename), tryCb);
}

function loadAsDirectory(dirname, options, callback) {
  var packageJsonFile = path.join(dirname, "package.json");
  fs.stat(packageJsonFile, function (err, stats) {
    var mainModule = "index";
    if (!err && stats.isFile()) {
      fs.readFile(packageJsonFile, "utf-8", function (err, content) {
        if (err) {
          callback(err);
          return;
        }
        content = JSON.parse(content);
        if (content.main) {
          mainModule = content.main;
        }
        loadAsFile(path.join(dirname, mainModule), options, callback);
      });
    } else {
      loadAsFile(path.join(dirname, mainModule), options, callback);
    }
  });
}

function loadNodeModules(context, identifier, options, callback) {
  // console.log("loadNodeModules identifier = ", identifier);
  nodeModulePaths(context, options, function (err, dirs) {
    // console.log("nodeModulePaths callback dirs = ", dirs);
    function tryDir(dir) {
      var pathname = join(split(dir), identifier);
      // console.log("pathname = ", pathname);
      loadAsFile(pathname, options, (err, absoluteFilename) => {
        if (err) {
          // console.log("err = ", err);
          loadAsDirectory(pathname, options, function (err, absoluteFilename) {
            if (err) {
              // console.log("err = ", err);
              if (dirs.length === 0) {
                callback(true);
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
  nodeModulePaths(context, options, function (err, dirs) {
    function tryDir(dir) {
      var pathname = path.join(dir, identifier);
      fs.stat(pathname, function (err, stat) {
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
    options.paths.forEach(function (path) {
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
