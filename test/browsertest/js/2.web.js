/******/webpackJsonp(2, {
/******/3: function(module, exports, require) {

require.ensure(3, function(require) {
	require(6)
	window.test(true, "Circular async loading 1")
})

/******/},
/******/
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
/******/})