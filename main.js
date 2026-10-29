'use strict';

const display = document.querySelector('[data-display]');
const expressionDisplay = document.querySelector('[data-expression]');
const keypad = document.querySelector('.keypad');

let currentInput = '0';
let storedValue = null;
let pendingOperator = null;
let waitingForOperand = false;
let completedExpression = '';
let errorMessage = '';

const operatorSymbols = {
  '+': '+',
  '-': '−',
  '*': '×',
  '/': '÷',
};

function formatInput(value) {
  const [integer, fraction] = value.split('.');
  const groupedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return fraction === undefined ? groupedInteger : `${groupedInteger}.${fraction}`;
}

function calculate(left, operator, right) {
  switch (operator) {
    case '+':
      return left + right;
    case '-':
      return left - right;
    case '*':
      return left * right;
    case '/':
      return right === 0 ? null : left / right;
    default:
      return null;
  }
}

function formatResult(value) {
  if (!Number.isFinite(value)) {
    return null;
  }
  return String(Number(value.toPrecision(12)));
}

function render() {
  display.textContent = errorMessage || formatInput(currentInput);
  display.classList.toggle('is-error', Boolean(errorMessage));

  if (errorMessage) {
    expressionDisplay.textContent = 'Hubi gelintaada';
    return;
  }

  if (pendingOperator !== null && storedValue !== null) {
    const left = formatInput(String(storedValue));
    const operator = operatorSymbols[pendingOperator];
    if (waitingForOperand) {
      expressionDisplay.textContent = `${left} ${operator}`;
      return;
    }

    const result = calculate(storedValue, pendingOperator, Number(currentInput));
    const formattedResult = result === null ? null : formatResult(result);
    expressionDisplay.textContent = formattedResult === null
      ? `${left} ${operator} ${formatInput(currentInput)}`
      : `${left} ${operator} ${formatInput(currentInput)} = ${formatInput(formattedResult)}`;
    return;
  }

  expressionDisplay.textContent = completedExpression || '\u00a0';
}

function clearAll() {
  currentInput = '0';
  storedValue = null;
  pendingOperator = null;
  waitingForOperand = false;
  completedExpression = '';
  errorMessage = '';
  render();
}

function setError(message) {
  currentInput = '0';
  storedValue = null;
  pendingOperator = null;
  waitingForOperand = true;
  completedExpression = '';
  errorMessage = message;
  render();
}

function inputDigit(digit) {
  if (errorMessage) {
    clearAll();
  }

  if (waitingForOperand) {
    currentInput = digit;
    waitingForOperand = false;
  } else if (currentInput.replace('-', '').replace('.', '').length < 15) {
    currentInput = currentInput === '0' ? digit : `${currentInput}${digit}`;
  }

  if (pendingOperator === null) {
    completedExpression = '';
  }
  render();
}

function inputDecimal() {
  if (errorMessage) {
    clearAll();
  }

  if (waitingForOperand) {
    currentInput = '0.';
    waitingForOperand = false;
  } else if (!currentInput.includes('.')) {
    currentInput += '.';
  }

  if (pendingOperator === null) {
    completedExpression = '';
  }
  render();
}

function chooseOperator(operator) {
  if (errorMessage) {
    clearAll();
    return;
  }

  if (pendingOperator !== null && !waitingForOperand) {
    const result = calculate(storedValue, pendingOperator, Number(currentInput));
    const formattedResult = result === null ? null : formatResult(result);
    if (formattedResult === null) {
      setError(result === null ? 'Eber laguma qaybin karo' : 'Natiijadu xad-dhaaf ayay tahay');
      return;
    }
    currentInput = formattedResult;
    storedValue = result;
  } else if (storedValue === null || pendingOperator === null) {
    storedValue = Number(currentInput);
  }

  pendingOperator = operator;
  waitingForOperand = true;
  completedExpression = '';
  render();
}

function performEquals() {
  if (errorMessage || pendingOperator === null || waitingForOperand) {
    return;
  }

  const rightValue = Number(currentInput);
  const expression = `${formatInput(String(storedValue))} ${operatorSymbols[pendingOperator]} ${formatInput(currentInput)}`;
  const result = calculate(storedValue, pendingOperator, rightValue);
  const formattedResult = result === null ? null : formatResult(result);

  if (formattedResult === null) {
    setError(result === null ? 'Eber laguma qaybin karo' : 'Natiijadu xad-dhaaf ayay tahay');
    return;
  }

  currentInput = formattedResult;
  storedValue = null;
  pendingOperator = null;
  waitingForOperand = true;
  completedExpression = `${expression} =`;
  render();
}

function toggleSign() {
  if (errorMessage) {
    clearAll();
    return;
  }
  if (currentInput !== '0') {
    currentInput = currentInput.startsWith('-') ? currentInput.slice(1) : `-${currentInput}`;
  }
  render();
}

function backspace() {
  if (errorMessage) {
    clearAll();
    return;
  }
  if (waitingForOperand) {
    return;
  }

  currentInput = currentInput.length > 1
    ? currentInput.slice(0, -1)
    : '0';
  if (currentInput === '-') {
    currentInput = '0';
  }
  render();
}

keypad.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) {
    return;
  }

  if (button.dataset.digit !== undefined) {
    inputDigit(button.dataset.digit);
  } else if (button.dataset.operator) {
    chooseOperator(button.dataset.operator);
  } else {
    switch (button.dataset.action) {
      case 'clear':
        clearAll();
        break;
      case 'decimal':
        inputDecimal();
        break;
      case 'equals':
        performEquals();
        break;
      case 'sign':
        toggleSign();
        break;
      case 'backspace':
        backspace();
        break;
      default:
        break;
    }
  }
});

document.addEventListener('keydown', (event) => {
  if (/^\d$/.test(event.key)) {
    inputDigit(event.key);
  } else if (event.key === '.' || event.key === ',') {
    inputDecimal();
  } else if (['+', '-', '*', '/'].includes(event.key)) {
    chooseOperator(event.key);
  } else if (event.key === 'Enter' || event.key === '=') {
    event.preventDefault();
    performEquals();
  } else if (event.key === 'Backspace') {
    backspace();
  } else if (event.key === 'Escape' || event.key === 'Delete') {
    clearAll();
  }
});

render();