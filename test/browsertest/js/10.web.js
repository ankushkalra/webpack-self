/*******/webpackJsonp(10, {
/*******/13: function(module, exports, require) {

require.ensure(5, function(require) {
	window.test(require(/* ./a */18) === "a", "Duplicate module should work")
})

/*******/},
/*******/
/*******/14: function(module, exports, require) {

require.ensure(6, function(require) {
	window.test(require(/* ./b */19) === "a", "Duplicate indirect module should work")
})

/*******/},
/*******/
/*******/})