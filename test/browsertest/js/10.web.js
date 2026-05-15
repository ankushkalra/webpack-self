/*******/webpackJsonp(10, {
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
/*******/})