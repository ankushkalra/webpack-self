/*******/webpackJsonp(10, {
/*******/15: function(module, exports, require) {

require.ensure(6, function(require) {
	window.test(require(/* ./a */19) === "a", "Duplicate module should work")
})

/*******/},
/*******/
/*******/18: function(module, exports, require) {

require.ensure(7, function(require) {
	window.test(require(/* ./b */20) === "a", "Duplicate indirect module should work")
})

/*******/},
/*******/
/*******/})