/*******/webpackJsonp(8, {
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
/*******/})