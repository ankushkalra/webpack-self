var esprima = require("esprima");

var types = {
  VariableDeclaration: "VariableDeclaration",
  ExpressionStatement: "ExpressionStatement",
  BlockStatement: "BlockStatement",
  IfStatement: "IfStatement",
  ReturnStatement: "ReturnStatement",
  ThrowStatement: "ThrowStatement",
  FunctionDeclaration: "FunctionDeclaration",
  WhileStatement: "WhileStatement",
  DoWhileStatement: "DoWhileStatement",
};

function walkStatements(context, statements) {
  statements.forEach((s) => walkStatement(context, s));
}

function walkStatement(context, statement) {

  switch (statement.type) {
    case types.BlockStatement:
      console.log("statement = ", statement);
      statement.body.forEach((statement) => walkStatement(context, statement));
      break;
    case types.ExpressionStatement:
      walkExpression(context, statement.expression);
      break;
    case types.IfStatement:
      walkExpression(context, statement.test);
      walkExpression(context, statement.consequent);
      if (statement.alternate)
        walkExpression(context, statement.alternate);
      break;
    case types.ReturnStatement:
    case types.ThrowStatement:
      if (statement.argument)
        walkExpression(context, statement.argument);
      break;
    case types.WhileStatement:
    case types.DoWhileStatement:
      walkExpression(context, statement.test);
      walkExpression(context, statement.body);
      break;
    case types.FunctionDeclaration:
      if (statement.name in context.options.overwrites) {
        // console.log("statement.name = ", statement.name);
        context.overwrite.push(statement.name);
      }
      var old = addOverwrites(context, statement.params);
      if (statement.body.type === types.BlockStatement) {
        walkStatement(context, statement.body);
      } else {
        walkExpression(context, statement.body);
      }
      context.overwrite.length = old;
      break;
    case types.VariableDeclaration:
      if (statement.declarations)
        walkVariableDeclarators(context, statement.declarations);
      break;
    default:
      break;
  }
}

var expressionTypes = {
  ArrayExpression: "ArrayExpression",
  ObjectExpression: "ObjectExpression",
  CallExpression: "CallExpression",
  FunctionExpression: "FunctionExpression",
  MemberExpression: "MemberExpression",
  Identifier: "Identifier",
  BinaryExpression: "BinaryExpression",
  Literal: "Literal",
  AssignmentExpression: "AssignmentExpression",
  LogicalExpression: "LogicalExpression",
  ConditionalExpression: "ConditionalExpression",
  NewExpression: "NewExpression",
  UpdateExpression: "UpdateExpression",
  UnaryExpression: "UnaryExpression",
};

function walkVariableDeclarators(context, declarators) {
  declarators.forEach(declarator => {
    console.log("declarator = ", declarator);
    switch (declarator.type) {
      case "VariableDeclarator":
        if (declarator.id.type === "Identifier" && declarator.id.name in context.options.overwrites) {
          context.overwrite.push(declarator.id.name);
          console.log("push context.overwrite = ", context.overwrite);
        }
        if (declarator.init)
          walkExpression(context, declarator.init);
        break;
    }
  });
}

function walkExpressions(context, expressions) {
  expressions.forEach((expression) => {
    walkExpression(context, expression);
  });
}

function walkExpression(context, expression) {
  switch (expression.type) {
    case expressionTypes.ArrayExpression:
      if (expression.elements)
        walkExpressions(context, expression.elements);
      break;
    case expressionTypes.ObjectExpression:
      expression.properties.forEach(function(prop) {
        walkExpression(context, prop.value);
      });
      break;
    case expressionTypes.FunctionExpression:
      var old = addOverwrites(context, expression.params);
      if (expression.body.type === types.BlockStatement)
        walkStatement(context, expression.body);
      else
        walkExpression(context, expression.body);
      context.overwrite.length = old;
      break;
    case expressionTypes.UpdateExpression:
      walkExpression(context, expression.argument);
      break;
    case expressionTypes.UnaryExpression:
      if(expression.operator === "typeof" &&
        expression.argument &&
        expression.argument.type === "Identifier" &&
        expression.argument.name === "require")
        break;
      walkExpression(context, expression.argument);
      break;
    case expressionTypes.BinaryExpression:
    case expressionTypes.LogicalExpression:
      walkExpression(context, expression.left);
      walkExpression(context, expression.right);
      break;
    case expressionTypes.AssignmentExpression:
      if (expression.left.type !== "Identifier" ||
        expression.left.name !== "require")
        walkExpression(context, expression.left);
      walkExpression(context, expression.right);
      break;
    case expressionTypes.ConditionalExpression:
      walkExpression(context, expression.test);
      walkExpression(context, expression.alternate);
      walkExpression(context, expression.consequent);
      break;
    case expressionTypes.NewExpression:
      walkExpression(context, expression.callee);
      if (expression.arguments)
        walkExpression(context, expression.arguments);
      break;
    case expressionTypes.CallExpression:
      // console.log("expression.callee = ", expression);
      // console.log("expression.arguments = ", expression.arguments);
      var noCallee = false;
      // console.log("context.overwrite = ", context.overwrite);
      if (context.overwrite.indexOf("require") === -1 &&
        expression.callee &&
        expression.arguments &&
        expression.arguments.length == 1 &&
        expression.callee.type === "Identifier" &&
        expression.callee.name === "require"
      ) {
        // console.log(">>>>> context parse called expression = ", expression);
        var param = parseCalculatedString(expression.arguments[0]);
        // console.log(">>>>>>>> test value = ", param.conditional);
        if (param.conditional) {
          context.requires = context.requires || [];
          param.conditional.forEach(function(paramItem) {
            context.requires.push({
              name: paramItem.value,
              valueRange: paramItem.range,
              line: expression.loc.start.line,
              column: expression.loc.start.column,
            })
          });
        } else if (param.code) {
          var pos = param.value.indexOf("/");
          context.contexts = context.contexts || [];
          console.log("pos = ", pos);
          if (pos === -1) {
            var newContext = {
              name: ".",
              require: true,
              calleeRange: expression.callee.range,
              line: expression.loc.start.line,
              column: expression.loc.start.column,
            }
            context.contexts.push(newContext);
          } else {
            var match = /\/[^\/]*$/.exec(param.value);
            // regex to match the filename or the last path segment from a file path or URL
            // console.log("match = ", match);
            // console.log("param = ", param);
            // console.log("callee.range = ", expression.callee.range);
            var dirname = param.value.substring(0, match.index);
            var remainder = "." + param.value.substring(match.index);
            var newContext = {
              name: dirname,
              require: true,
              replace: [param.range, remainder],
              calleeRange: expression.callee.range,
              line: expression.loc.start.line,
              column: expression.loc.start.column,
            };
            context.contexts.push(newContext);
          }
        } else {
          // normal require
          context.requires = context.requires || [];
          context.requires.push({
            name: param.value,
            expressionRange: [expression.callee.range[0], expression.range[1]],
            line: expression.loc.start.line,
            column: expression.loc.start.column,
          });
        }
        noCallee = true;
      }
      if (context.overwrite.indexOf("require") === -1 &&
        expression.callee &&
        expression.arguments &&
        expression.arguments.length >= 1 &&
        expression.callee.type === expressionTypes.MemberExpression &&
        expression.callee.object.type === "Identifier" &&
        expression.callee.object.name === "require" &&
        expression.callee.property.type === "Identifier" &&
        expression.callee.property.name in { ensure: 1, async: 1 }
      ) {
        var param = parseStringArray(expression.arguments[0]);
        context.asyncs = context.asyncs || [];
        // console.log("context.overwrite = ", context.overwrite);
        var newContext = {
          requires: [],
          namesRange: expression.arguments[0].range,
          line: expression.loc.start.line,
          column: expression.loc.start.column,
          ignoreOverride: true,
          overwrite: context.overwrite.slice(),
          options: context.options
        };

        param.forEach(function(r) {
          newContext.requires.push({ name: r });
        });
        context.asyncs.push(newContext);
        context = newContext;
        noCallee = true;
      }
      if (
        context.overwrite.indexOf("require") === -1 &&
        expression.callee &&
        expression.arguments &&
        expression.arguments.length == 1 &&
        expression.callee.type === expressionTypes.MemberExpression &&
        expression.callee.object.type === "Identifier" &&
        expression.callee.object.name === "require" &&
        expression.callee.property.type === "Identifier" &&
        expression.callee.property.name in { context: 1 }
      ) {
        console.log("is this context");
        var param = parseString(expression.arguments[0]);
        context.contexts = context.contexts || [];
        var newContext = {
          name: param,
          expressionRange: [expression.callee.range[0], expression.range[1]],
          line: expression.loc.start.line,
          column: expression.loc.start.column,
        };
        context.contexts.push(newContext);
        noCallee = true;
      }
      if (context.overwrite.indexOf("require") === -1 &&
        expression.callee &&
        expression.callee.type === expressionTypes.MemberExpression &&
        expression.callee.object.type === "Identifier" &&
        expression.callee.object.name === "require" &&
        expression.callee.property.type === "Identifier" &&
        expression.callee.property.name in { valueOf: 1 }) {
        noCallee = true;
      }
      // console.log("expression.callee ", expression.callee, noCallee);
      if (expression.callee && !noCallee) {
        walkExpression(context, expression.callee);
      }
      if (expression.arguments) {
        // console.log("expression.arguments  = ", expression.arguments);
        walkExpressions(context, expression.arguments);
      }
      break;
    case expressionTypes.MemberExpression:
      if (expression.object.type === "Identifier" &&
        expression.object.name === "module" &&
        expression.property.type === "Identifier" &&
        expression.property.name === "exports")
        break;
      walkExpression(context, expression.object);
      if (expression.property.type !== "Identifier")
        walkExpression(context, expression.property);
      break;
    case expressionTypes.Identifier:
      // console.log("context.overwrite = ", context.overwrite);
      if (context.overwrite.indexOf("require") === -1 && expression.name === "require") {
        console.log("expression.name = ", expression);
        console.log("creating context = ");
        context.contexts = context.contexts || [];
        var newContext = {
          name: ".",
          warn: "Identifier",
          require: true,
          calleeRange: [expression.range[0], expression.range[1]],
          line: expression.loc.start.line,
          column: expression.loc.start.column,
        }
        context.contexts.push(newContext);
      } else if (context.overwrite.indexOf(expression.name) === -1 &&
        expression.name in context.options.overwrites) {
        // console.log("else");
        context.requires = context.requires || [];
        context.requires.push({
          name: context.options.overwrites[expression.name],
          expressionRange: expression.range,
          line: expression.loc.start.line,
          column: expression.loc.start.column,
        });
      }
      break;
    default:
      break;
  }
}

function parseCalculatedString(expression) {
  switch (expression.type) {
    case expressionTypes.BinaryExpression:
      if (expression.operator === "+") {
        var left = parseCalculatedString(expression.left);
        var right = parseCalculatedString(expression.right);
        if (left.code) {
          return { range: left.range, value: left.value, code: true };
        } else if (right.code) {
          return {
            range: [
              left.range[0],
              right.range ? right.range[1] : left.range[1],
            ],
            value: left.value + right.value,
            code: true,
          };
        } else {
          return {
            range: [left.range[0], right.range[1]],
            value: left.value + right.value,
          };
        }
      }
      break;
    case expressionTypes.ConditionalExpression:
      var consequent = parseCalculatedString(expression.consequent);
      var alternate = parseCalculatedString(expression.alternate);
      var items = [];
      if (consequent.conditional)
        Array.prototype.push.apply(items, consequent.conditional);
      else if (!consequent.code)
        items.push(consequent);
      else
        break;
      if (alternate.conditional)
        Array.prototype.push.apply(items, alternate.conditional);
      else if (!alternate.code)
        items.push(alternate);
      else
        break;
      return { value: "", code: true, conditional: items };
    case expressionTypes.Literal:
      return { range: expression.range, value: expression.value + "" };
  }
  return { value: "", code: true };
}

function addOverwrites(context, params) {
  var l = context.overwrite.length;
  if (!params) return l;
  params.forEach(function(param) {
    if (context.ignoreOverride) {
      context.ignoreOverride = false;
      return;
    }
    if (param.type === "Identifier" &&
      param.name in context.options.overwrites)
      context.overwrite.push(param.name);
  });
  return l;
};

function parseString(expression) {
  switch (expression.type) {
    case expressionTypes.BinaryExpression:
      if (expression.operator == "+")
        return parseString(expression.left) + parseString(expression.right);
      break;
    case expressionTypes.Literal:
      return expression.value + "";
  }
  throw new Error(
    expression.type + " is not supported as parameter for require",
  );
}

function parseStringArray(expression) {
  switch (expression.type) {
    case "ArrayExpression":
      var arr = [];
      if (expression.elements)
        expression.elements.forEach(function(expr) {
          arr.push(parseString(expr));
        });
      return arr;
  }
  return [parseString(expression)];
}

function parse(source, options) {
  var ast = esprima.parse(source, { loc: true, range: true, raw: true });
  if (!ast || typeof ast !== "object")
    throw new Error("Source couldn't be parsed");
  options = options || {};
  options.overwrites = options.overwrites || {};
  options.overwrites.require = true;
  var context = {
    options: options,
    overwrite: []
  };
  console.log("overwrites - ", options.overwrites);
  walkStatements(context, ast.body);
  return context;
}

module.exports = parse;
