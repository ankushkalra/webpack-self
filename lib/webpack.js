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

function webpack(options, callback) {
  buildDeps(options.entry, (err, depTree) => {
    if (err) {
      console.log(err);
      throw err;
    }

    var buffer = [];

    if (options.output) {
      if (!options.outputJsonpFunction)
        options.outputJsonpFunction = "webpackJsonp";
      var outputPostfix = "." + options.output;
      if (!options.outputSrcPrefix) {
        options.scriptSrcPrefix = options.scriptSrcPrefix || "";
      }

      var fileSizeMap = {};
      var chunksCount = 0;
      for (var chunkId in depTree.chunks) {
        var buffer = [];
        var chunk = depTree.chunks[chunkId];
        chunksCount++;
        var filename = path.join(
          options.outputDirectory,
          chunk.id === 0 ? options.output : chunk.id + outputPostfix,
        );
        if (chunk.id === 0) {
          if (Object.keys(depTree.chunks).length > 1) {
            buffer.push(templateAsync);
            buffer.push("/******/({a:");
            buffer.push(stringify(outputPostfix));
            buffer.push(", b: ");
            buffer.push(stringify(options.outputJsonpFunction));
            buffer.push(", c: ");
            buffer.push(stringify(options.scriptSrcPrefix));
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
        buffer = buffer.join("");
        fs.writeFile(filename, buffer, "utf-8", function (err) {
          if (err) throw err;
        });
        fileSizeMap[path.basename(filename)] = buffer.length;
      }
      buffer = {};
      buffer.chunkCount = chunksCount;
      buffer.modulesCount = Object.keys(depTree.modulesById).length;
      var sum = 0;
      for (var chunkId in depTree.chunks) {
        for (var moduleId in depTree.chunks[chunkId].modules) {
          if (depTree.chunks[chunkId].modules[moduleId] === "include") sum++;
        }
      }
      buffer.modulesIncludingDuplicates = sum;
      buffer.modulesPerChunk = Math.round((sum / chunksCount) * 10) / 10;
      sum = 0;
      for (var moduleId in depTree.chunks[0].modules) {
        if (depTree.chunks[0].modules[moduleId] === "include") sum++;
      }
      buffer.modulesFirstChunk = sum;
      buffer.fileSizes = fileSizeMap;
      callback(null, buffer);
    } else {
      throw new Error("output is required");
    }
  });
}

function stringify(value) {
  return "'" + value + "'";
}

module.exports = webpack;
