const BINARY_OPERATORS = {
  // precedence matters
  '/': (a, b) => {
    if (!b) {
      throw new Error("TypeError: Division by zero.");
    }
    return a / b;
  },
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
const OPERATORS_TO_NORMALIZE = () => Object.keys(BINARY_OPERATORS).filter(op => op !== '-' && op !== '+').join('\\');
const NORMALIZE_REGEXP = new RegExp(`-[0-9.]+[${OPERATORS_TO_NORMALIZE()}]-?[0-9.]+`);

const expressionCalculator = (expr) => compute(expr.replace(WHITESPACES_REGEXP, ''));

const compute = (expr) => {
  let deepestPair = findDeepestPair(expr);
  return deepestPair
    ? compute(expr.replace(`(${deepestPair})`, computeSimpleExpression(deepestPair)))
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

const computeSimpleExpression = (expr) => {
  for (let [operator, binaryFunction] of Object.entries(BINARY_OPERATORS)) {
    let regExp = RegExp(`${OPERAND_REGEXP}\\${operator}${OPERAND_REGEXP}`);
    let matches;
    while (matches = expr.match(regExp)) {
      let [expression, a, b] = matches;
      let computation = binaryFunction(+a, +b);
      let {normExpr, normComputation} = normalizeExpr(expr, expression, computation);
      expr = normExpr.replace(expression, normComputation);
    }
  }
  return Number(expr);
};

const normalizeExpr = (expression, searchStr, computation) => {
  return {
    normExpr: /[0-9]/.test(expression[expression.indexOf(searchStr) - 1]) ? expression.replace(NORMALIZE_REGEXP, `+${searchStr}`) : expression,
    normComputation: computation.toFixed(100).replace(/0+$/, '').replace(/\.$/, '')
  };
};

module.exports = {
  expressionCalculator
};
