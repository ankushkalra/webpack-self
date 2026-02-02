module.exports = function (module) {
  var replaces = [];
  function genReplaceRequire(requireItem) {
    if (requireItem.nameRange) {
      replaces.push({
        from: requireItem.nameRange[0],
        to: requireItem.nameRange[1],
        value: "" + requireItem.id,
      });
    }
  }

  if (module.requires) {
    module.requires.forEach(genReplaceRequire);
  }

  if (module.asyncs) {
    module.asyncs.forEach(function genReplacesAsync(asyncItem) {
      if (asyncItem.requires) {
        asyncItem.requires.forEach(genReplaceRequire);
      }
      if (asyncItem.asyncs) {
        asyncItem.asyncs.forEach(genReplacesAsync);
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
