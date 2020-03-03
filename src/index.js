const FUNCTIONS = {
  // precedence matters
  '/': (a, b) => a / b,
  '*': (a, b) => a * b,
  '-': (a, b) => a - b,
  '+': (a, b) => a + b,
}

const WHITESPACES_REGEXP = /\s/g;
const FIRST_DEEPEST_BRACKET_REGEXP = /([(])[^()]+[)]/;
const CORRESPONDING_BRACKET_REGEXP = /[)]/;
const OPERAND_REGEXP = '(-?[0-9.]+)';

function expressionCalculator(expr) {
  let number = compute(expr.replace(WHITESPACES_REGEXP, ''));

  if (isNaN(number)) { // it's a dirty trick - don't say to anyone ;)
    throw Error("ExpressionError: Brackets must be paired");
  }

  return number;
}

let compute = (expr) => {
  let deepestPair = findDeepestPair(expr);

  return deepestPair
    ? computeExpressionRecursively(expr, deepestPair)
    : computeSimpleExpression(expr);
};

const findDeepestPair = (str, index = null) => {
  let result;

  if (str.match(FIRST_DEEPEST_BRACKET_REGEXP)) {
    let start = str.match(FIRST_DEEPEST_BRACKET_REGEXP).index;
    let end = str.slice(index).match(CORRESPONDING_BRACKET_REGEXP).index;
    result = {start, end};
  }

  return result;
};

let computeExpressionRecursively = (expr, dp) => {
  let expression = expr.substr(dp.start + 1, dp.end - dp.start - 1);
  let computation = computeSimpleExpression(expression);
  let expressionStr = `(${expression})`;
  let {normExpr, normComputation} = normalizeExpr(expr, expressionStr, computation);
  return compute(normExpr.replace(RegExp(escapeRegExpSymbols(expressionStr), 'g'), normComputation));
};

const computeSimpleExpression = (expr) => {
  for (let [operator, func] of Object.entries(FUNCTIONS)) {
    let regExp = RegExp(`${OPERAND_REGEXP}\\${operator}${OPERAND_REGEXP}`, 'g');
    while (expr.match(regExp)) {
      let matches = expr.match(regExp);
      let expression = matches[0];
      let {a, b} = getOperands(expression, operator);
      let computation = func(a, b);
      if (!isFinite(computation)) {
        throw new Error("TypeError: Division by zero.");
      }
      let {normExpr, normComputation} = normalizeExpr(expr, expression, computation);
      expr = normExpr.replace(RegExp(escapeRegExpSymbols(expression), 'g'), normComputation);
    }
  }

  return Number(expr);
};

let getOperands = (expression, operator) => {
  let ind = expression.lastIndexOf(operator);
  return {a: Number(expression.substr(0, ind)), b: Number(expression.substr(ind + 1))}
}

let normalizeExpr = (expression, searchStr, computation) => {
  let ind = expression.indexOf(searchStr);

  if (!ind) {
    return {normExpr: expression, normComputation: numberToString(computation)};
  }

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

let replaceStringSymbol = (str, ind, symbolToPut) => `${str.substr(0, ind - 1)}${symbolToPut}${str.substr(ind)}`;

let numberToString = (number) => (+number).toFixed(100).replace(/0+$/, '').replace(/\.$/, '');

let escapeRegExpSymbols = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = {
  expressionCalculator
};
