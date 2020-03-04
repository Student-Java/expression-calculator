const BINARY_OPERATORS = {
  // precedence matters
  '/': (a, b) => a / b,
  '%': (a, b) => a % b,
  '^': (a, b) => a ** b,
  '*': (a, b) => a * b,
  '-': (a, b) => a - b,
  '+': (a, b) => a + b,
}

const WHITESPACES_REGEXP = /\s/g;
const DEEPEST_PARENTHESES_REGEXP = /\(([^()]*)\)/;
const HAS_PARENTHESES = /[()]/;
const OPERAND_REGEXP = '(-?[0-9.]+)';

const expressionCalculator = (expr) => compute(expr.replace(WHITESPACES_REGEXP, ''));

const compute = (expr) => {
  return findDeepestPair(expr)
    ? computeExpressionRecursively(expr, findDeepestPair(expr))
    : computeSimpleExpression(expr);
};

const findDeepestPair = (expr, index = null) => {
  if (expr.search(HAS_PARENTHESES) < 0) {
    return undefined;
  }

  if (expr.search(DEEPEST_PARENTHESES_REGEXP) < 0) {
    throw new Error('ExpressionError: Brackets must be paired');
  }

  return expr.match(DEEPEST_PARENTHESES_REGEXP)[1];
};

const computeExpressionRecursively = (expr, expression) => {
  let {normExpr, normComputation} = normalizeExpr(expr, `(${expression})`, computeSimpleExpression(expression));
  return compute(normExpr.replace(`(${expression})`, normComputation));
};

const computeSimpleExpression = (expr) => {
  for (let [operator, func] of Object.entries(BINARY_OPERATORS)) {
    let regExp = RegExp(`${OPERAND_REGEXP}\\${operator}${OPERAND_REGEXP}`);
    while (expr.match(regExp)) {
      let matches = expr.match(regExp);
      let computation = func(+matches[1], +matches[2]);
      if (!isFinite(computation)) {
        throw new Error("TypeError: Division by zero.");
      }
      let {normExpr, normComputation} = normalizeExpr(expr, matches[0], computation);
      expr = normExpr.replace(RegExp(escapeRegExpSymbols(matches[0]), 'g'), normComputation);
    }
  }

  return Number(expr);
};

const normalizeExpr = (expression, searchStr, computation) => {
  let ind = expression.indexOf(searchStr);

  if (computation < 0 && expression[ind - 1] === '-' || (expression[ind - 1] === '(' && expression[ind] === '-')) { // -- / -(-
    computation *= -1;
    expression = replaceStringSymbol(expression, ind, '+');
  } else if (computation < 0 && expression[ind - 1] === '+' || (expression[ind - 1] === '(' && expression[ind] === '+')) { // +- / +(-
    expression = replaceStringSymbol(expression, ind, '');
  } else if (computation >= 0 && /[0-9]/.test(expression[ind - 1])) { // 10-5*-2 => 10+10
    expression = replaceStringSymbol(expression, ind + 1, '+-');
  }

  return {normExpr: expression, normComputation: numberToString(computation)};
};

const replaceStringSymbol = (str, ind, symbolToPut) => `${str.substr(0, ind - 1)}${symbolToPut}${str.substr(ind)}`;

const numberToString = (number) => (+number).toFixed(100).replace(/0+$/, '').replace(/\.$/, '');

const escapeRegExpSymbols = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = {
  expressionCalculator
};
