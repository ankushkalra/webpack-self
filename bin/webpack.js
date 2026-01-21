var webpack = require("../lib/webpack");
var fs = require("fs");
var path = require("path");

var argv = require("optimist")
  .usage("Usage: $0 <entry> <output>")

  .boolean("single")
  .describe("single", "Disable code splitting")
  .default("single", false)

  .string("script-src-prefix")
  .describe("single", "Path prefix for javascript loading")

  .demand(1).argv;

var output = argv._[1];

if (output && output[0] !== "/" && output[1] !== ":") {
  output = path.join(process.cwd(), output);
}

var options = {
  entry: argv._[0],
};

if (argv["script-src-prefix"]) {
  options.scriptSrcPrefix = argv["script-src-prefix"];
}

output = output || path.join(process.cwd(), "js", "web.js");
if (!options.outputDirectory) options.outputDirectory = path.dirname(output);
var basename = path.basename(output);
if (!options.output) options.output = basename;

if (!options.outputPostfix) options.outputPostfix = "." + path.dirname(output);
var outExists = fs.existsSync(options.outputDirectory);
if (!outExists) fs.mkdirSync(options.outputDirectory);

webpack(options, function (err, stats) {
  if (err) {
    console.error(err);
    return;
  }
  console.log("stats = ", stats);
});
