const dayName = ["日", "月", "火", "水", "木", "金", "土"];

function updateClock() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const date = now.getDate();
  const day = now.getDay();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  // パディングを追加
  let month_formatted = ("0" + (month + 1)).slice(-2) + "月";
  let date_formatted = ("0" + date).slice(-2) + "日";
  let hours_formatted = ("0" + hours).slice(-2);
  let minutes_formatted = ("0" + minutes).slice(-2);
  let seconds_formatted = ("0" + seconds).slice(-2);

  // 時計の表示を更新
  document.getElementById("clock").innerHTML = year +
    "年" +
    month_formatted +
    date_formatted +
    "(" +
    dayName[day] +
    ")" +
    "<br/>" +
    hours_formatted +
    ":" +
    minutes_formatted +
    "." +
    seconds_formatted;
}

setInterval(updateClock, 100);
updateClock();

document.addEventListener(
  "keydown",
  (function () {
    const SEQUENCES = {
      rainbow: "rainbow",
      golden: "golden",
      silver: "silver",
      platinum: "platinum",
      amethyst: "amethyst",
      topaz: "topaz",
      ruby: "ruby",
      emerald: "emerald",
      diamond: "diamond",
      sapphire: "sapphire",
      opal: "opal",
      peridot: "peridot",
      rosegold: "rosegold",
      obsidian: "obsidian",
      aquamarine: "aquamarine",
      quartz: "quartz",
      bismuth: "bismuth",
      watermelontourmaline: "watermelontourmaline",
      mystictopaz: "mystictopaz",
      catseye: "catseye",
      alexandrite: "alexandrite",
      amber: "amber",
      pearl: "pearl",
    };
    const CLOCK = document.getElementById("clock");
    const currentKeyIndex = {
      rainbow: 0,
      golden: 0,
      silver: 0,
      platinum: 0,
      amethyst: 0,
      ruby: 0,
      topaz: 0,
      emerald: 0,
      diamond: 0,
      sapphire: 0,
      opal: 0,
      peridot: 0,
      rosegold: 0,
      obsidian: 0,
      aquamarine: 0,
      quartz: 0,
      bismuth: 0,
      watermelontourmaline: 0,
      mystictopaz: 0,
      catseye: 0,
      alexandrite: 0,
      amber: 0,
      pearl: 0,
    };
    const DEFAULT_COLOR_STATUS = "normal";
    let colorStatus = DEFAULT_COLOR_STATUS;

    function checkKey(key, color) {
      const colorLetters = SEQUENCES[color];
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
      Object.keys(SEQUENCES).forEach((key) => CLOCK.classList.remove(key));
      if (colorStatus != DEFAULT_COLOR_STATUS) CLOCK.classList.add(colorStatus);
    }

    return function (event) {
      const key = event.key.toLowerCase();
      Object.keys(SEQUENCES).forEach((color) => checkKey(key, color));
    };
  })(),
);
