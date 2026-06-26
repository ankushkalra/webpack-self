/*******/webpackJsonp(8, {
/*******/16: function(module, exports, require) {

require.ensure(4, function(require) {
	require(/* ./acircular */15)
	window.test(true, "Circular async loading 2")
})

/*******/},
/*******/
/*******/19: function(module, exports, require) {

require.ensure(6, function(require) {
	window.test(require(/* ./a */14) === "a", "Duplicate module should work")
})

/*******/},
/*******/
/*******/20: function(module, exports, require) {

require.ensure(5, function(require) {
	window.test(require(/* ./b */17) === "a", "Duplicate indirect module should work")
})

/*******/},
/*******/
/*******/})