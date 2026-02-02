var fs = require("fs");
var path = require("path");

function resolve(context, identifier, options, callback) {
  var modulePath;

  if (identifier.startsWith("/") || identifier.startsWith(".")) {
    if (identifier.startsWith("/")) {
      modulePath = identifier;
    } else if (identifier.startsWith(".")) {
      modulePath = path.join(context, identifier);
    }
    loadAsFile(modulePath, (err, absoluteFilename) => {
      if (err) {
        loadAsDirectory(modulePath, callback);
        return;
      }
      callback(null, absoluteFilename);
    });
  } else {
    loadNodeModules(context, identifier, options, callback);
    return;
  }
}

function loadAsFile(modulePath, callback) {
  var extensions = ["", ".js"];
  var pos = 0,
    result;

  function tryCb(modulePath, callback) {
    var ext = extensions[pos];
    fs.stat((result = modulePath + ext), (err, stats) => {
      if (err || !stats || !stats.isFile()) {
        pos++;
        if (pos >= extensions.length) {
          callback(err);
          return;
        }
        tryCb(modulePath, callback);
        return;
      }
      callback(null, result);
    });
  }

  tryCb(modulePath, callback);
}

function loadAsDirectory(dirname, callback) {
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
        loadAsFile(path.join(dirname, mainModule), callback);
      });
    } else {
      loadAsFile(path.join(dirname, mainModule), callback);
    }
  });
}

function loadNodeModules(context, identifier, options, callback) {
  nodeModulePaths(context, options, function (err, dirs) {
    if (err) {
      callback(err);
      return;
    }
    function tryDir(dir) {
      var pathname = path.join(dir, identifier);
      loadAsFile(pathname, (err, result) => {
        if (err) {
          loadAsDirectory(pathname, function (err, absoluteFilename) {
            if (err) {
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
        callback(null, result);
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

module.exports = resolve;
