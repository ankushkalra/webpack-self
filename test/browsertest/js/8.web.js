/******/webpackJsonp(8, {
/******/14: function(module, exports, require) {

require.ensure(6, function(require) {
	window.test(require(/* ./b */19) === "a", "Duplicate indirect module should work")
})

/******/},
/******/
/******/15: function(module, exports, require) {

require.ensure(5, function(require) {
	window.test(require(/* ./a */18) === "a", "Duplicate module should work")
})

/******/},
/******/
/******/16: function(module, exports, require) {

require.ensure(4, function(require) {
	require(/* ./acircular */13)
	window.test(true, "Circular async loading 2")
})

/******/},
/******/
/******/})