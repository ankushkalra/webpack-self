function stringify(str) {
  return '"' + str.replace(/\\/g, "\\\\").replace(/\"/g, '\\"') + '"';
}

module.exports = function (module) {
  var replaces = [];
  function genReplaceRequire(requireItem) {
    if (requireItem.nameRange && requireItem.id !== undefined) {
      var prefix = "";
      if (requireItem.name) {
        prefix += "/* " + requireItem.name + " */";
      }
      replaces.push({
        from: requireItem.nameRange[0],
        to: requireItem.nameRange[1],
        value: prefix + requireItem.id,
      });
    }
  }

  function genContextReplaces(contextItem) {
    console.log("contextItem = ", contextItem);
    var postfix = "";
    var prefix = "";
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
      replaces.push({
        from: contextItem.replace[0][0],
        to: contextItem.replace[0][1],
        value: stringify(contextItem.replace[1]),
      });
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

  const result = [];
  var source = module.source;

  replaces
    .sort((a, b) => {
      return b.from - a.to;
    })
    .forEach((r) => {
      var { from, to, value } = r;
      source = source.slice(0, from) + value + source.slice(to + 1);
    });

  result.push(source);
  var res = result.join("");
  return res;
};
