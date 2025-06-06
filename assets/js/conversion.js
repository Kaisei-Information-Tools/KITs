// 変換係数データ
const units = {
  energy: {
    J: 1,
    kJ: 1000,
    "g/cal": 4.184,
    kcal: 4184,
    Wh: 3600,
    kWh: 3600000,
  },
  data: {
    bit: 1,
    kb: 1000,
    Mb: 1000000,
    Gb: 1000000000,
    Byte: 8,
    kB: 8000,
    MB: 8000000,
    GB: 8000000000,
    TB: 8000000000000,
  },
  volume: {
    立方メートル: 1,
    立方センチメートル: 0.000001,
    "ガロン(米)": 0.00378541,
    立方フィート: 0.0283168,
    立方インチ: 0.0000163871,
  },
  science: { mol: 1, L: 22.4, 個: 6.0e23 }, // デフォルトのアボガドロ数
  speed: { "m/s": 1, "km/h": 0.277778, "mile/h": 0.44704, kn: 0.514444 },
  frequency: { Hz: 1, kHz: 1000, MHz: 1000000, GHz: 1000000000 },
  pressure: { Pa: 1, hPa: 100, バール: 100000, トル: 133.322, 気圧: 101325 },
  time: {
    sec: 1,
    min: 60,
    hour: 3600,
    day: 86400,
    week: 604800,
    month: 2628000,
    year: 31536000,
  },
  temperature: { "℃": "celsius", "°F": "fahrenheit", K: "kelvin" },
  weight: { g: 1, kg: 1000, t: 1000000, mg: 0.001, ポンド: 453.592 },
  length: {
    mm: 0.001,
    cm: 0.01,
    m: 1,
    km: 1000,
    inch: 0.0254,
    feet: 0.3048,
    yard: 0.9144,
    mile: 1609.34,
  },
  area: {
    平方メートル: 1,
    平方キロメートル: 1000000,
    平方マイル: 2589988.11,
    平方フィート: 0.092903,
    平方インチ: 0.00064516,
    ha: 10000,
  },
};

// 単位リスト更新
function updateUnits() {
  const category = document.getElementById("category").value;
  const fromUnit = document.getElementById("fromUnit");
  const toUnit = document.getElementById("toUnit");

  fromUnit.innerHTML = "";
  toUnit.innerHTML = "";

  if (units[category]) {
    Object.keys(units[category]).forEach((unit) => {
      fromUnit.add(new Option(unit, unit));
      toUnit.add(new Option(unit, unit));
    });
  }

  document.getElementById("scienceSettings").style.display =
    category === "science" ? "block" : "none";
  saveToLocalStorage();
}

// 指数表記の調整
function adjustExponential(value, decimalPlaces) {
  if (value === 0) return `0`;

  let exponent = Math.floor(Math.log10(value)); // 元の桁数を取得
  let coefficient = value / Math.pow(10, exponent); // 1以上10未満に正規化

  // 表記を調整
  return `${coefficient.toFixed(decimalPlaces)}×10^${exponent + 23}`;
}

// **convert() の修正**
function convert() {
  const category = document.getElementById("category").value;
  const from = document.getElementById("fromUnit").value;
  const to = document.getElementById("toUnit").value;
  const inputValue = document.getElementById("value").value.trim();

  if (!inputValue || isNaN(inputValue)) {
    document.getElementById("result").innerText = "数値を入力してください。";
    return;
  }

  const value = parseFloat(inputValue);
  let decimalPlaces = getDecimalPlaces(inputValue);

  let avogadro = parseFloat(document.getElementById("avogadro").value);
  let molVolume = parseFloat(document.getElementById("molVolume").value);
  let result;

  if (category === "temperature") {
    result = convertTemperature(value, from, to);
  } else if (category === "science") {
    if (from === to) result = value;
    else if (from === "mol" && to === "L") result = value * molVolume;
    else if (from === "L" && to === "mol") result = value / molVolume;
    else if (from === "mol" && to === "個") result = value * avogadro;
    else if (from === "L" && to === "個") {
      result = (value / molVolume) * avogadro;
    } else if (units["science"][from] && to === "個") {
      result = value * units["science"][from] * avogadro;
    }
  } else if (units[category] && units[category][from] && units[category][to]) {
    result = (value * units[category][from]) / units[category][to];
  }

  // 「個」への変換時、指数表記の調整を適用
  if (
    to === "個" &&
    typeof result === "number" &&
    !isNaN(result) &&
    from !== "個"
  ) {
    result = adjustExponential(result, decimalPlaces);
  } else if (typeof result === "number" && !isNaN(result)) {
    result = result.toFixed(decimalPlaces);
  }

  document.getElementById("result").innerText = `結果: ${result} ${to}`;
  saveToLocalStorage();
}

// **入力値の有効数字を取得する関数**
function getDecimalPlaces(numStr) {
  // 前後の空白を除去し、符号を除く
  numStr = numStr.trim().replace(/^[+-]/, "");

  // 小数点を除去して数字のみの文字列に変換
  let digits = numStr.replace(".", "");

  // もし全てが0なら、有効数字は1とする
  if (/^0+$/.test(digits)) {
    return 0;
  }

  // 先行する0を削除し、残った文字の長さを返す
  digits = digits.replace(/^0+/, "");
  return digits.length - 1;
}

// 温度変換
function convertTemperature(value, from, to) {
  if (from === "℃" && to === "°F") return (value * 9) / 5 + 32;
  if (from === "℃" && to === "K") return value + 273.15;
  if (from === "°F" && to === "℃") return ((value - 32) * 5) / 9;
  if (from === "°F" && to === "K") return ((value - 32) * 5) / 9 + 273.15;
  if (from === "K" && to === "℃") return value - 273.15;
  if (from === "K" && to === "°F") return ((value - 273.15) * 9) / 5 + 32;
  return value;
}

// ローカルストレージ管理
function saveToLocalStorage() {
  ["category", "fromUnit", "toUnit", "value", "molVolume", "avogadro"].forEach(
    (id) => {
      const element = document.getElementById(id);
      if (element) localStorage.setItem(id, element.value);
    },
  );
}

function loadFromLocalStorage() {
  ["category", "fromUnit", "toUnit", "value", "molVolume", "avogadro"].forEach(
    (id) => {
      const element = document.getElementById(id);
      if (element && localStorage.getItem(id)) {
        element.value = localStorage.getItem(id);
      }
    },
  );
  updateUnits();
}

// 初期化処理
function initialize() {
  loadFromLocalStorage();
}

// ページ読み込み時に初期化
window.onload = initialize;
