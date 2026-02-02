var esprima = require("esprima");

var types = {
  VariableDeclaration: "VariableDeclaration",
  ExpressionStatement: "ExpressionStatement",
  BlockStatement: "BlockStatement",
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
  AssignmentExpression: "AssignmentExpression",
  LogicalExpression: "LogicalExpression",
};

function walkExpressions(context, expressions) {
  expressions.forEach((expression) => {
    walkExpression(context, expression);
  });
}

function walkExpression(context, expression) {
  switch (expression.type) {
    case expressionTypes.FunctionExpression:
      walkStatement(context, expression.body);
      break;
    case expressionTypes.BinaryExpression:
    case expressionTypes.AssignmentExpression:
    case expressionTypes.LogicalExpression:
      walkExpression(context, expression.left);
      walkExpression(context, expression.right);
      break;
    case expressionTypes.CallExpression:
      if (
        expression.callee &&
        expression.arguments &&
        expression.arguments.length >= 1 &&
        expression.callee.type === "Identifier" &&
        expression.callee.name === "require"
      ) {
        var param = parseString(expression.arguments[0]);
        context.requires = context.requires || [];
        context.requires.push({
          name: param,
          nameRange: expression.arguments[0].range,
          line: expression.loc.start.line,
          column: expression.loc.start.column,
        });
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

function parseString(string) {
  return string.value;
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
  var ast = esprima.parse(source, { loc: true, range: true });
  if (!ast || typeof ast !== "object") {
    throw new Error("Source couldn't be parsed");
  }
  var context = {};
  walkStatements(context, ast.body);
  return context;
}

module.exports = parse;
