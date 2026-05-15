/*******/webpackJsonp(2, {
/*******/3: function(module, exports, require) {

/***/module.exports = function(name) {
/***/	var map = {"./acircular2.js":10,"./acircular.js":7,"./circular.js":4,"./duplicate.js":9,"./duplicate2.js":8,"./index.web.js":0,"./singluar.js":1,"./a.js":13,"./index.js":16,"./b.js":14,"./circular2.js":15};
/***/ console.log('name = ', name);/***/	var value = require(map[name]|| map[name + ".web.js"]|| map[name + ".js"]);
/***/ console.log('value = ', value);/***/	return value;/***/};

/*******/},
/*******/
/*******/7: function(module, exports, require) {

require.ensure(4, function(require) {
	require(/* ./acircular2 */10)
	window.test(true, "Circular async loading 1")
})

/*******/},
/*******/
/*******/8: function(module, exports, require) {

require.ensure(6, function(require) {
	window.test(require(/* ./b */14) === "a", "Duplicate indirect module should work")
})

/*******/},
/*******/
/*******/9: function(module, exports, require) {

require.ensure(5, function(require) {
	window.test(require(/* ./a */13) === "a", "Duplicate module should work")
})

/*******/},
/*******/
/*******/10: function(module, exports, require) {

require.ensure(3, function(require) {
	require(/* ./acircular */7)
	window.test(true, "Circular async loading 2")
})

/*******/},
/*******/
/*******/13: function(module, exports, require) {

module.exports = "a";

/*******/},
/*******/
/*******/14: function(module, exports, require) {

module.exports = require(/* ./a */13);

/*******/},
/*******/
/*******/15: function(module, exports, require) {

module.exports = 2;
module.exports = require(/* ./circular2 */15);

/*******/},
/*******/
/*******/16: function(module, exports, require) {

window.test(false, "index.js should be replaced with index.web.js");

/*******/},
/*******/
/*******/})