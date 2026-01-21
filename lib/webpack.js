var fs = require("fs");
var path = require("path");
var writeChunk = require("./writeChunk");
var buildDeps = require("./buildDeps");

var templateAsync = fs.readFileSync(
  path.join(__dirname, "./templateAsync.js"),
  "utf-8",
);
var templateSingle = fs.readFileSync(
  path.join(__dirname, "./templateSingle.js"),
  "utf-8",
);

function webpack(options) {
  buildDeps(options.entry, (err, depTree) => {
    if (err) {
      console.log(err);
      throw err;
    }
    console.log("writing....");
    console.log("write depTree = ", depTree.chunks);

    var output = options.output;
    var buffer = [];

    if (!options.outputJsonpFunction)
      options.outputJsonpFunction = "webpackJsonp";
    var outputPostfix = "." + options.output;

    for (var chunkId in depTree.chunks) {
      var buffer = [];
      var chunk = depTree.chunks[chunkId];
      var filename = path.join(
        chunk.id === 0 ? output : chunk.id + outputPostfix,
      );
      if (chunk.id === 0) {
        if (Object.keys(depTree.chunks).length > 1) {
          buffer.push(templateAsync);
          buffer.push("/******/({a:");
          buffer.push(stringify(outputPostfix));
          buffer.push(", b: ");
          buffer.push(stringify(options.outputJsonpFunction));
          buffer.push(",");
        } else {
          buffer.push(templateSingle);
          buffer.push("({\n");
        }
      } else {
        var buffer = [];
        buffer.push(options.outputJsonpFunction);
        buffer.push("(" + chunkId + ", {\n");
      }
      buffer.push(writeChunk(depTree, chunk));
      buffer.push("/*******/})");
      fs.writeFileSync(filename, buffer.join(""));
    }
  });
}

function stringify(value) {
  return "'" + value + "'";
}

module.exports = webpack;
