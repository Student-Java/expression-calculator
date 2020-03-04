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
const OPERATORS_TO_NORMALIZE = () => Object.keys(BINARY_OPERATORS).filter(op => op !== '-' && op !== '+').join('\\');
const NORMALIZE_REGEXP = new RegExp(`-[0-9.]+[${OPERATORS_TO_NORMALIZE()}]-?[0-9.]+`);

const expressionCalculator = (expr) => compute(expr.replace(WHITESPACES_REGEXP, ''));

const compute = (expr) => {
  return findDeepestPair(expr)
    ? compute(expr.replace(`(${(findDeepestPair(expr))})`, computeSimpleExpression(findDeepestPair(expr))))
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
  for (let [operator, func] of Object.entries(BINARY_OPERATORS)) {
    let regExp = RegExp(`${OPERAND_REGEXP}\\${operator}${OPERAND_REGEXP}`);
    while (expr.match(regExp)) {
      let matches = expr.match(regExp);
      let computation = func(+matches[1], +matches[2]);
      if (!isFinite(computation)) {
        throw new Error("TypeError: Division by zero.");
      }
      let {normExpr, normComputation} = normalizeExpr(expr, matches[0], computation);
      expr = normExpr.replace(matches[0], normComputation);
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
