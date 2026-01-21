var fs = require("fs");
var path = require("path");

function resolve(identifier, callback) {
  var modulePath;
  if (identifier.startsWith(".")) {
    modulePath = path.join(process.cwd(), identifier);
  } else {
    modulePath = path.join(process.cwd(), "node_modules", identifier);
  }

  var extensions = ["", ".js"];
  var pos = 0,
    result;

  function tryCb(modulePath, callback) {
    var ext = extensions[pos];
    fs.stat((result = modulePath + ext), (err, stats) => {
      if (err || !stats || !stats.isFile()) {
        pos++;
        if (pos >= extensions.length) callback(err);
        tryCb(modulePath, callback);
        return;
      }
      callback(null, result);
    });
  }

  tryCb(modulePath, callback);
}

module.exports = resolve;
