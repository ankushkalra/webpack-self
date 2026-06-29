var webpack = require("../lib/webpack");
var fs = require("fs");
var path = require("path");
var sprintf = require("sprintf").sprintf;

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
  .describe("script-src-prefix", "Path prefix for javascript loading")

  .string("options")
  .describe("options", "Options JSON file")

  .string("libary")
  .describe("libary", "Stores the exports in this variable")

  .boolean("colors")
  .describe("colors", "Output Stats with colors")
  .default("colors", false)

  .boolean("json")
  .describe("json", "Output Stats as JSON")
  .default("json", false)

  .boolean("by-size")
  .describe("by-size", "Sort modules by size in stats")
  .default("by-size", false)

  .boolean("verbose")
  .describe("verbose", "Output dependencies in stats")
  .default("verbose", false)

  .string("alias")
  .describe("alias", "Set a alias name for a module. ex. http=http-browserify")


  .demand(1).argv;

var input = argv._[0],
  output = argv._[1];

if (input && input[0] !== "/" && input[1] !== ":") {
  input = path.join(process.cwd(), input);
}

if (output && output[0] !== "/" && output[1] !== ":") {
  output = path.join(process.cwd(), output);
}

var options = {};

if (argv.options) {
  options = JSON.parse(fs.readFileSync(argv.options, "utf-8"));
}

options.input = input;

if (argv["script-src-prefix"]) {
  options.scriptSrcPrefix = argv["script-src-prefix"];
}

if (argv.min) {
  options.minimize = true;
}

if (argv.filenames) {
  options.includeFilenames = true;
}

if (argv.libary) {
  options.libary = argv.libary;
}

if (argv.alias) {
  if (typeof argv.alias === "string")
    argv.alias = [argv.alias];
  options.resolve = options.resolve || {};
  options.resolve.alias = options.resolve.alias || {};
  var aliasObj = options.resolve.alias;
  argv.alias.forEach(function(alias) {
    alias = alias.split("=");
    aliasObj[alias[0]] = alias[1];
  });
}

// console.log("argv = ", argv);

if (argv.single) {
  webpack(input, options, function(err, source) {
    if (err) {
      console.error(err);
      return;
    }
    if (output) {
      fs.writeFileSync(output, source, "utf-8");
    } else {
      process.stdout.write(source);
    }
  });
} else {
  output = output || path.join(process.cwd(), "js", "web.js");
  if (!options.outputDirectory) options.outputDirectory = path.dirname(output);
  if (!options.output) options.output = path.basename(output);
  if (!options.outputPostfix)
    options.outputPostfix = "." + path.basename(output);
  var outExists = fs.existsSync(options.outputDirectory);
  if (!outExists) fs.mkdirSync(options.outputDirectory);

  console.log("webpack called else");
  webpack(input, options, function(err, stats) {
    if (err) {
      console.error(err);
      return;
    }
    if (argv.json)
      console.log(util.inspect(stats, false, 10, argv.colors));
    else {
      console.log("json false stats = ", stats);
      function c(str) {
        return argv.colors ? str : "";
      }
      console.log("Chunks: "+c("\033[1m") + stats.chunkCount + c("\033[22m"));
      console.log("Modules: "+c("\033[1m") + stats.modulesCount + c("\033[22m"));
      if (stats.fileModules) {
        console.log();
        console.log(" <id>  <size>  <filename>");
        if (argv.verbose)
          console.log("       <reason> from <filename>");
        for (var file in stats.fileModules) {
          console.log(c("\033[1m\033[32m") + file + c("\033[39m\033[22m"));
          var modules = stats.fileModules[file];
          if(argv["by-size"])
            modules.sort(function(a,b) {
              return b.size - a.size;
            });
          modules.forEach(function (module) {
            console.log(" "+c("\033[1m") + sprintf("%3s", module.id) + " " + (typeof module.size === "number" ? sprintf("%9s", Math.round(module.size)+""): " no-size  ") + " " + module.filename || module.dirname);
          });
        }
      }
    }
  });
}
