var webpack = require("../lib/webpack");

var argv = require("optimist")
.usage("Usage: $0 <input> <output>")
.demand(1)
  .argv;

var options = {
  entry: argv._[0],
  output: argv._[1] || "output.js",
};

webpack(options);
