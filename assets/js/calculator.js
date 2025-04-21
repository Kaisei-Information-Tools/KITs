const display = document.getElementById("display");
const maxDigits = 10000; // 最大桁数を設定

function appendNumber(number) {
  if (display.value.length < maxDigits) {
    insertAtCursor(number);
  } else {
    alert("最大桁数に達しました");
  }
}

function appendOperator(operator) {
  if (display.value.length < maxDigits) {
    insertAtCursor(operator);
  } else {
    alert("最大桁数に達しました");
  }
}

function clearDisplay() {
  display.value = "";
}

function calculateFactorial() {
  const currentDisplay = display.value;
  const number = parseInt(currentDisplay);
  if (isNaN(number)) {
    alert("無効な入力です");
    return;
  }
  display.value = factorial(number).toString().slice(0, maxDigits); // 桁数制限を適用
}

function factorial(n) {
  if (n === 0 || n === 1) {
    return 1;
  }
  return n * factorial(n - 1);
}

function calculateResult() {
  console.log(display.value);
  try {
    let result = display.value;
    console.log(result);
    const eggs = ["(^^)", "(^^)/", "(*^^*)", "(^-^)", "(^0^)"];
    if (eggs.includes(result)) {
      alert("見つかっちゃった(^^)!");
      return;
    }

    // Replace ^ with ** for exponentiation
    result = result.replace(/\^/g, "**");

    // Detect and calculate factorial
    result = result.replace(/(\d+)!/g, (_, n) => factorial(parseInt(n)));

    // Calculate the result using eval
    display.value = eval(result).toString().slice(0, maxDigits); // 桁数制限を適用
  } catch (error) {
    alert("計算式が無効です");
  }
}

function insertAtCursor(value) {
  display.value += value;
  display.selectionStart = display.selectionEnd = display.value.length;
}

document.addEventListener("keydown", function (event) {
  const key = event.key;

  if (!isNaN(key)) {
    // 数字キー
    appendNumber(key);
    console.log(key);
    event.preventDefault();
  } else if (["+", "-", "*", "/", "(", ")", "^", ".", "!"].includes(key)) {
    // 演算子キー
    appendOperator(key);
    console.log(key);
    event.preventDefault();
  } else if (key === "Enter" || key === "=") {
    // Enterキーまたは=キー
    calculateResult();
    event.preventDefault();
    console.log(key);
  } else if (key === "Backspace") {
    // バックスペースキー
    if (display.selectionStart === display.selectionEnd) {
      const start = display.selectionStart;
      if (start > 0) {
        display.value = display.value.slice(0, start - 1) +
          display.value.slice(start);
        display.selectionStart = display.selectionEnd = start - 1;
      }
    } else {
      const start = display.selectionStart;
      const end = display.selectionEnd;
      display.value = display.value.slice(0, start) + display.value.slice(end);
      display.selectionStart = display.selectionEnd = start;
    }
    event.preventDefault();
  } else if (key === "Delete") {
    // Deleteキー
    if (display.selectionStart === display.selectionEnd) {
      const start = display.selectionStart;
      display.value = display.value.slice(0, start) +
        display.value.slice(start + 1);
      display.selectionStart = display.selectionEnd = start;
    } else {
      const start = display.selectionStart;
      const end = display.selectionEnd;
      display.value = display.value.slice(0, start) + display.value.slice(end);
      display.selectionStart = display.selectionEnd = start;
    }
    event.preventDefault();
  } else if (key === "c" || key === "C") {
    // Cキー（クリア）
    clearDisplay();
    event.preventDefault();
  } else if (key === "Escape") {
    // Escキー（クリア）
    clearDisplay();
    event.preventDefault();
  }
});
