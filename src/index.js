const functions = {
  // precedence matters
  '/': (a, b) => a / b,
  '*': (a, b) => a * b,
  '-': (a, b) => a - b,
  '+': (a, b) => a + b,
}

function expressionCalculator(expr) {
  let number = compute(expr.replace(/\s/g, ''));

  if (isNaN(number)) {
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

  if (str.match(/([(])[^()]+[)]/)) {
    let start = str.match(/([(])[^()]+[)]/).index;
    let end = str.slice(index).match(/[)]/).index;
    result = {start, end};
  }

  return result;
};

let computeExpressionRecursively = (expr, dp) => {
  let expression = expr.substr(dp.start + 1, dp.end - dp.start - 1);
  let computation = computeSimpleExpression(expression);
  expression = `(${expression})`;
  let {normExpr, normComputation} = normalizeExpr(expr, expression, computation);
  return compute(normExpr.replace(RegExp(expression.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), normComputation));
};

const computeSimpleExpression = (expr) => {
  for (let [operator, func] of Object.entries(functions)) {
    let regExp = RegExp(`(-?[0-9.]+)\\${operator}(-?[0-9.]+)`, 'g');
    while (expr.match(regExp)) {
      let matches = expr.match(regExp);
      let expression = matches[0];
      let {a, b} = getOperands(expression, operator);
      let computation = func(a, b);
      if (!isFinite(computation)) {
        throw new Error("TypeError: Division by zero.");
      }
      let {normExpr, normComputation} = normalizeExpr(expr, expression, computation);
      expr = normExpr.replace(RegExp(expression.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), normComputation);
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

let replaceStringSymbol = (str, ind, symbolToPut) => {
  return `${str.substr(0, ind - 1)}${symbolToPut}${str.substr(ind)}`;
};

let numberToString = (number) =>
  (+number)
    .toFixed(100)
    .replace(/0+$/, '')
    .replace(/\.$/, '');

module.exports = {
  expressionCalculator
};
