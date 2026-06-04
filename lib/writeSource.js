function stringify(str) {
  return '"' + str.replace(/\\/g, "\\\\").replace(/\"/g, '\\"') + '"';
}

module.exports = function(module, options) {
  if(!module.source) {
    if(module.requireMap) {
      var extensions = (options.resolve && options.resolve.extensions) || [".web.js", ".js"];
      var extensionsAccess = [];
      extensions.forEach(function(ext) {
        extensionsAccess.push("||map[name+\"");
        extensionsAccess.push(ext.replace(/\\/g, "\\\\").replace(/"/g, "\\\""));
        extensionsAccess.push("\"]");
      });

      return "/***/function err(name) { throw new Error(\"Cannot find module '\"+name+\"'\") }\n"+
        "/***/module.exports = function(name) {\n" +
        "/***/\tvar map = " + JSON.stringify(module.requireMap) + ";\n" +
        "/***/\treturn require(map[name]" + extensionsAccess.join("") + "||(err(name)));\n" +
        "/***/};";
    }
    return;
  }

  var replaces = [];
  function genReplaceRequire(requireItem) {
    if (requireItem.id !== undefined) {
      var prefix = "";
      // console.log("requireItem.name = ", requireItem);
      if (requireItem.name) {
        prefix += "/* " + requireItem.name + " */";
      }
      if (requireItem.expressionRange) {
        replaces.push({
          from: requireItem.expressionRange[0],
          to: requireItem.expressionRange[1],
          value: "require(" + prefix + requireItem.id + ")",
        });
      } else if (requireItem.valueRange) {
        replaces.push({
          from: requireItem.valueRange[0],
          to: requireItem.valueRange[1],
          value: prefix + requireItem.id
        });
      }
    }
  }

  function genContextReplaces(contextItem) {
    // console.log("contextItem = ", contextItem);
    var postfix = "";
    var prefix = "";
    // console.log("contextItem.name = ", contextItem.name);
    if (contextItem.name) {
      prefix += "/* " + contextItem.name + " */";
    }
    if (contextItem.require) {
      replaces.push({
        from: contextItem.calleeRange[0],
        to: contextItem.calleeRange[1],
        value:
          "require(" +
          prefix +
          ((contextItem.id || "throw new Error('there is not id for this')") +
            "") +
          ")",
      });
      if (contextItem.replace) {
        replaces.push({
          from: contextItem.replace[0][0],
          to: contextItem.replace[0][1],
          value: stringify(contextItem.replace[1]),
        });
      }
    } else {
      replaces.push({
        from: contextItem.expressionRange[0],
        to: contextItem.expressionRange[1],
        value:
          "require(" +
          prefix +
          ((contextItem.id || "throw new Error('there is not id for this')") +
            "") +
          ")" +
          postfix,
      });
    }
  }

  if (module.requires) {
    module.requires.forEach(genReplaceRequire);
  }

  if (module.contexts) {
    module.contexts.forEach(genContextReplaces);
  }

  if (module.asyncs) {
    module.asyncs.forEach(function genReplacesAsync(asyncItem) {
      if (asyncItem.requires) {
        asyncItem.requires.forEach(genReplaceRequire);
      }
      if (asyncItem.asyncs) {
        asyncItem.asyncs.forEach(genReplacesAsync);
      }
      if (asyncItem.contexts) {
        asyncItem.contexts.forEach(genContextReplaces);
      }
      if (asyncItem.namesRange) {
        replaces.push({
          from: asyncItem.namesRange[0],
          to: asyncItem.namesRange[1],
          value: (asyncItem.chunkId || "0") + "",
        });
      }
    });
  }

  var source = module.source;
  const result = [];

  // console.log("replaces = ", replaces);
  replaces
    .sort((a, b) => {
      return b.from - a.from;
    })
    .forEach((r) => {
      var { from, to, value } = r;
      source = source.slice(0, from) + value + source.slice(to + 1);
    });

  result.push(source);
  var res = result.join("");
  return res;
};
