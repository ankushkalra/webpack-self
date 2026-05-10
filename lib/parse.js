var esprima = require("esprima");

var types = {
  VariableDeclaration: "VariableDeclaration",
  ExpressionStatement: "ExpressionStatement",
  BlockStatement: "BlockStatement",
  ReturnStatement: "ReturnStatement",
  ThrowStatement: "ThrowStatement",
  FunctionDeclaration: "FunctionDeclaration",

};

function walkStatements(context, statements) {
  statements.forEach((s) => walkStatement(context, s));
}

function walkStatement(context, statement) {
  switch (statement.type) {
    case types.VariableDeclaration:
      walkDeclarations(context, statement.declarations);
      break;
    case types.ExpressionStatement:
      walkExpression(context, statement.expression);
      break;
    case types.BlockStatement:
      statement.body.forEach((statement) => walkStatement(context, statement));
      break;
    case types.ReturnStatement:
    case types.ThrowStatement:
      if (statement.argument)
        walkExpression(context, statement.argument);
      break;
    case types.FunctionDeclaration:
      if (statement.body.type === types.BlockStatement) {
        walkStatement(context, statement.body);
      } else {
        walkExpression(context, statement.body);
      }
    default:
      break;
  }
}

function walkDeclarations(context, declarations) {
  declarations.forEach((d) => walkDeclaration(context, d));
}

function walkDeclaration(context, declaration) {
  if (declaration.init) walkExpression(context, declaration.init);
}

var expressionTypes = {
  CallExpression: "CallExpression",
  FunctionExpression: "FunctionExpression",
  MemberExpression: "MemberExpression",
  BinaryExpression: "BinaryExpression",
  Literal: "Literal",
  AssignmentExpression: "AssignmentExpression",
  LogicalExpression: "LogicalExpression",
  ConditionalExpression: "ConditionalExpression",
  NewExpression: "NewExpression"
};

function walkExpressions(context, expressions) {
  expressions.forEach((expression) => {
    walkExpression(context, expression);
  });
}

function walkExpression(context, expression) {
  switch (expression.type) {
    case expressionTypes.FunctionExpression:
      if (expression.body.type === types.BlockStatement)
        walkStatement(context, expression.body);
      else
        walkExpression(context, expression.body);
      break;
    case expressionTypes.BinaryExpression:
    case expressionTypes.AssignmentExpression:
    case expressionTypes.LogicalExpression:
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
      console.log("expression.callee = ", expression);
      // console.log("expression.arguments = ", expression.arguments);
      if (
        expression.callee &&
        expression.arguments &&
        expression.arguments.length == 1 &&
        expression.callee.type === "Identifier" &&
        expression.callee.name === "require"
      ) {
        console.log(">>>>> context parse called");
        var param = parseCalculatedString(expression.arguments[0]);
        console.log("test value = ", param.value);
        if (param.code) {
          var pos = param.value.indexOf("/");
          if (pos === -1) {
            throw new Error("require a module by variable is not supported");
          } else {
            var match = /\/[^\/]*$/.exec(param.value);
            // regex to match the filename or the last path segment from a file path or URL
            console.log("match = ", match);
            console.log("param = ", param);
            console.log("callee.range = ", expression.callee.range);
            var dirname = param.value.substring(0, match.index);
            var remainder = "." + param.value.substring(match.index);
            context.contexts = context.contexts || [];
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
          context.requires = context.requires || [];
          context.requires.push({
            name: param.value,
            nameRange: param.range,
            line: expression.loc.start.line,
            column: expression.loc.start.column,
          });
        }
      }
      if (
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
        var newContext = {
          requires: [],
          namesRange: expression.arguments[0].range,
          line: expression.loc.start.line,
          column: expression.loc.start.column,
        };

        param.forEach(function (r) {
          newContext.requires.push({ name: r });
        });
        context.asyncs.push(newContext);
        context = newContext;
      }
      if (
        expression.callee &&
        expression.arguments &&
        expression.arguments.length == 1 &&
        expression.callee.type === expressionTypes.MemberExpression &&
        expression.callee.object.type === "Identifier" &&
        expression.callee.object.name === "require" &&
        expression.callee.property.type === "Identifier" &&
        expression.callee.property.name in { context: 1 }
      ) {
        var param = parseString(expression.arguments[0]);
        context.contexts = context.contexts || [];
        var newContext = {
          name: param,
          expressionRange: [expression.callee.range[0], expression.range[1]],
          line: expression.loc.start.line,
          column: expression.loc.start.column,
        };
        context.contexts.push(newContext);
      }
      if (expression.callee) walkExpression(context, expression.callee);
      if (expression.arguments) {
        walkExpressions(context, expression.arguments);
      }
      break;
    case expressionTypes.MemberExpression:
      walkExpression(context, expression.object);
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
    case expressionTypes.Literal:
      return { range: expression.range, value: expression.value + "" };
  }
  return { value: "", code: true };
}

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
        expression.elements.forEach(function (expr) {
          arr.push(parseString(expr));
        });
      return arr;
  }
  return [parseString(expression)];
}

function parse(source) {
  var ast = esprima.parse(source, { loc: true, range: true, raw: true });
  if (!ast || typeof ast !== "object") {
    throw new Error("Source couldn't be parsed");
  }
  var context = {};
  walkStatements(context, ast.body);
  return context;
}

module.exports = parse;
