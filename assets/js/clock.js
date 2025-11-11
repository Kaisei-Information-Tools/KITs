// 全体を一つの即時実行関数で囲み、変数スコープを管理しやすくします。
(function () {
  // --- 共有する変数や定数を定義 ---
  const dayName = ["日", "月", "火", "水", "木", "金", "土"];
  const CLOCK_ELEMENT = document.getElementById("clock");

  // 表示のON/OFFを管理する状態変数
  let showYear = true; // true: 表示, false: 非表示
  let showDay = true; // true: 表示, false: 非表示
  let showMilli = false; // true: 表示, false: 非表示

  function updateClock() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const date = now.getDate();
    const day = now.getDay();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const milliseconds = now.getMilliseconds(); // ミリ秒を取得

    // パディングを追加
    let month_formatted = ("0" + (month + 1)).slice(-2) + "月";
    let date_formatted = ("0" + date).slice(-2) + "日";
    let hours_formatted = ("0" + hours).slice(-2);
    let minutes_formatted = ("0" + minutes).slice(-2);
    let seconds_formatted = ("0" + seconds).slice(-2);
    let milliseconds_formatted = ("00" + milliseconds).slice(-3); // ミリ秒は3桁でパディング

    // --- 表示する文字列を状態変数に応じて組み立てる ---
    let displayText = "";

    if (showYear) {
      displayText += year + "年";
    }

    displayText += month_formatted + date_formatted;

    if (showDay) {
      displayText += "(" + dayName[day] + ")";
    }

    displayText += "<br/>" +
      hours_formatted +
      ":" +
      minutes_formatted +
      "." +
      seconds_formatted;

    if (showMilli) {
      displayText += "." + milliseconds_formatted;
    }

    // 時計の表示を更新
    CLOCK_ELEMENT.innerHTML = displayText;
  }

  setInterval(updateClock, 100);
  updateClock();

  document.addEventListener(
    "keydown",
    (function () {
      // 色変更用のキーワード
      const COLOR_SEQUENCES = {
        rainbow: "rainbow", golden: "golden", silver: "silver",
        platinum: "platinum", amethyst: "amethyst", topaz: "topaz",
        ruby: "ruby", emerald: "emerald", diamond: "diamond",
        sapphire: "sapphire", opal: "opal", peridot: "peridot",
        rosegold: "rosegold", obsidian: "obsidian", aquamarine: "aquamarine",
        quartz: "quartz", bismuth: "bismuth", watermelontourmaline: "watermelontourmaline",
        mystictopaz: "mystictopaz", catseye: "catseye", alexandrite: "alexandrite",
        amber: "amber", pearl: "pearl",
      };
      
      // 表示切り替え用のキーワード
      const TOGGLE_SEQUENCES = {
        year: "year",
        day: "day",
        milli: "milli",
      };

      // すべてのキーワードをまとめて、入力状態を管理するオブジェクトを初期化
      const allSequences = { ...COLOR_SEQUENCES, ...TOGGLE_SEQUENCES };
      const currentKeyIndex = {};
      Object.keys(allSequences).forEach(key => currentKeyIndex[key] = 0);

      const DEFAULT_COLOR_STATUS = "normal";
      let colorStatus = DEFAULT_COLOR_STATUS;

      // 色変更をチェックする関数
      function checkColorKey(key, color) {
        const colorLetters = COLOR_SEQUENCES[color];
        if (colorLetters[currentKeyIndex[color]] === key) {
          currentKeyIndex[color]++;
          if (currentKeyIndex[color] === colorLetters.length) {
            if (colorStatus != color) colorStatus = color;
            else colorStatus = DEFAULT_COLOR_STATUS;
            changeColor();
            currentKeyIndex[color] = 0;
          }
        } else {
          currentKeyIndex[color] = 0;
        }
      }

      function changeColor() {
        Object.keys(COLOR_SEQUENCES).forEach((key) => CLOCK_ELEMENT.classList.remove(key));
        if (colorStatus != DEFAULT_COLOR_STATUS) CLOCK_ELEMENT.classList.add(colorStatus);
      }

      // 表示切り替えをチェックする関数
      function checkToggleKey(key, toggleType) {
        const toggleLetters = TOGGLE_SEQUENCES[toggleType];
        if (toggleLetters[currentKeyIndex[toggleType]] === key) {
          currentKeyIndex[toggleType]++;
          if (currentKeyIndex[toggleType] === toggleLetters.length) {
            // キーワードに応じて対応する状態変数を反転 (true ⇔ false)
            if (toggleType === "year") showYear = !showYear;
            if (toggleType === "day") showDay = !showDay;
            if (toggleType === "milli") showMilli = !showMilli;

            updateClock(); // 表示を即時更新
            currentKeyIndex[toggleType] = 0;
          }
        } else {
          currentKeyIndex[toggleType] = 0;
        }
      }

      return function (event) {
        const key = event.key.toLowerCase();
        // 色変更と表示切り替えの両方をチェック
        Object.keys(COLOR_SEQUENCES).forEach((color) => checkColorKey(key, color));
        Object.keys(TOGGLE_SEQUENCES).forEach((toggle) => checkToggleKey(key, toggle));
      };
    })(),
  );
})();
