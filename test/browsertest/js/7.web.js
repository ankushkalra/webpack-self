/*******/webpackJsonp(7, {
/*******/10: function(module, exports, require) {

require.ensure(5, function(require) {
	window.test(require(/* ./a */16) === "a", "Duplicate module should work")
})

/*******/},
/*******/
/*******/11: function(module, exports, require) {

require.ensure(3, function(require) {
	require(/* ./acircular2 */13)
	window.test(true, "Circular async loading 1")
})

/*******/},
/*******/
/*******/12: function(module, exports, require) {

require.ensure(6, function(require) {
	window.test(require(/* ./b */17) === "a", "Duplicate indirect module should work")
})

/*******/},
/*******/
/*******/})