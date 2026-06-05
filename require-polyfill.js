module.exports = function(req) {
  if (!req.webpackPolyfill) {
    var oldReq = req;
    req = function(name) {
      return oldReq(name);
    };
    req.__proto__ = oldReq;
    req.webpackPolyfill = true;
  }
  if (!req.ensure) {
    req.ensure = function(array, callback) {
      callback(req);
    };
  }
  if (!req.context) {
    req.context = function(contextName) {
      return function(name) {
        return req(contextName + "/" + name);
      }
    }
  }
  return req;
}
