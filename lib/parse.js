var esprima = require("esprima");

var types = {
  VariableDeclaration: "VariableDeclaration",
  ExpressionStatement: "ExpressionStatement",
  BlockStatement: "BlockStatement",
};

function traverse(context, program) {
  walkStatements(context, program.body, context.requires);
  return context;
}

function walkStatements(context, expressions) {
  expressions.forEach((s) => walkStatement(context, s));
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
      console.log("statement = ", JSON.stringify(statement, null, 2));
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
};

function walkExpressions(context, expressions) {
  expressions.forEach((expression) => {
    walkExpression(context, expression);
  });
}

function walkExpression(context, expression) {
  switch (expression.type) {
    case expressionTypes.CallExpression:
      if (
        expression.callee.type === "Identifier" &&
        expression.callee.name === "require"
      ) {
        var name = expression.arguments[0].value;

        context.requires.push({ ...expression.arguments[0], name });
      }
      if (
        expression.callee.type === expressionTypes.MemberExpression &&
        expression.callee.object.type === "Identifier" &&
        expression.callee.object.name === "require" &&
        expression.callee.property.type === "Identifier" &&
        expression.callee.property.name in { ensure: 1, async: 1 }
      ) {
        var elem = expression.arguments[0].elements;
        context.asyncs = context.asyncs || [];
        console.log("namesRange = ", expression.arguments[0].range);
        var newContext = {
          requires: [],
          namesRange: expression.arguments[0].range,
        };
        elem.forEach(function (r) {
          newContext.requires.push({ ...r, name: r.value });
        });
        context.asyncs.push(newContext);
      }
      if (expression.callee) walkExpression(context, expression.callee);
      if (expression.arguments) {
        walkExpressions(context, expression.arguments);
      }
      break;
    case expressionTypes.FunctionExpression:
      walkStatement(context, expression.body);
      break;
    case expressionTypes.MemberExpression:
      walkExpression(context, expression.object);
      break;
    default:
      break;
  }
}

function parse(source) {
  var ast = esprima.parse(source, { range: true });
  var context = { requires: [] };
  var context = traverse(context, ast);
  return context;
}

module.exports = parse;
