var greeting = require("./a");
var b = require("b");

greeting();

require.ensure(["c"], function (require) {
  require("b").xyz();
  var d = require("d");
});
