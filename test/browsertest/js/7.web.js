/******/webpackJsonp(7, {
/******/4: function(module, exports, require) {

require.ensure(5, function(require) {
	window.test(require(8) === "a", "Duplicate module should work")
})

/******/},
/******/
/******/5: function(module, exports, require) {

require.ensure(6, function(require) {
	window.test(require(7) === "a", "Duplicate indirect module should work")
})

/******/},
/******/
/******/6: function(module, exports, require) {

require.ensure(4, function(require) {
	require(3)
	window.test(true, "Circular async loading 2")
})

/******/},
/******/
/******/})