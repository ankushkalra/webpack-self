var webpack = require("../lib/webpack");
var fs = require("fs");
var path = require("path");

var argv = require("optimist")
  .usage("Usage: $0 <entry> <output>")

  .boolean("single")
  .describe("single", "Disable code splitting")
  .default("single", false)

  .boolean("min")
  .describe("min", "minifiy output")
  .default("min", false)

  .boolean("filenames")
  .describe("filenames", "Output Filenames Info file")
  .default("filenames", false)

  .string("script-src-prefix")
  .describe("single", "Path prefix for javascript loading")

  .string("options")
  .describe("options", "Options JSON file")

  .string("libary")
  .describe("libary", "Stores the exports in this variable")

  .demand(1).argv;

var output = argv._[1];

if (output && output[0] !== "/" && output[1] !== ":") {
  output = path.join(process.cwd(), output);
}

var options = {};

if (argv.options) {
  options = JSON.parse(fs.readFileSync(argv.options, "utf-8"));
}

options.entry = argv._[0];

if (argv["script-src-prefix"]) {
  options.scriptSrcPrefix = argv["script-src-prefix"];
}

if (argv.min) {
  options.minimize = true;
}

if (argv.libary) {
  options.libary = argv.libary;
}

if (argv.filenames) {
  options.includeFilenames = true;
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
