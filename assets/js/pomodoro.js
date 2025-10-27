let timer;
let isWorkTime = true;
let remainingRepeats;
let workTime, breakTime, totalTime;
let isPaused = false;
let pausedTime;

const timerDisplay = document.getElementById("timerDisplay");
const statusDisplay = document.getElementById("statusDisplay");
const workMinutes = document.getElementById("workMinutes");
const workSeconds = document.getElementById("workSeconds");
const breakMinutes = document.getElementById("breakMinutes");
const breakSeconds = document.getElementById("breakSeconds");
const repeatCount = document.getElementById("repeatCount");
const setButton = document.querySelector(".set-button");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");

const beepSound = new Audio("assets/sounds/alerm.mp3");
const endSound = new Audio("assets/sounds/alerm.mp3");

setButton.addEventListener("click", setTimer);
startBtn.addEventListener("click", startTimer);
pauseBtn.addEventListener("click", pauseTimer);
resetBtn.addEventListener("click", resetTimer);

function setTimer() {
    // 入力値のバリデーションと0分0秒のチェック
    if (validateInput(workMinutes, 0, 999) && validateInput(workSeconds, 0, 59) &&
        validateInput(breakMinutes, 0, 999) && validateInput(breakSeconds, 0, 59) &&
        validateInput(repeatCount, 1, 999)) {
        
        workTime = parseInt(workMinutes.value) * 60 + parseInt(workSeconds.value);
        breakTime = parseInt(breakMinutes.value) * 60 + parseInt(breakSeconds.value);

        // 作業時間または休憩時間が0分0秒の場合、エラーメッセージを表示
        if (workTime === 0 || breakTime === 0) {
            alert('作業時間または休憩時間は0分0秒以外に設定してください。');
            return;
        }

        remainingRepeats = parseInt(repeatCount.value);
        totalTime = workTime; // 初回設定時にtotalTimeを初期化
        updateDisplay(totalTime); // 表示を更新

        // 状態表示の更新
        statusDisplay.textContent = "設定完了";
        statusDisplay.style.backgroundColor = "#00008B"; // 濃い青色に設定
        statusDisplay.style.color = "#FFFFFF"; // 白色

    } else {
        alert("無効な値が入力されています。");
    }
}

function validateInput(inputElement, min, max) {
  const value = parseInt(inputElement.value);
  return !isNaN(value) && value >= min && value <= max;
}

function startTimer() {
  if (!workTime || !breakTime) {
    alert("時間を設定してください。");
    return;
  }
  if (isPaused) {
    isPaused = false;
    totalTime = pausedTime;
    updateDisplay(totalTime);
    timer = setInterval(tick, 1000);
  } else {
    clearInterval(timer);
    totalTime = workTime;
    isWorkTime = true;
    updateDisplay(totalTime);
    timer = setInterval(tick, 1000);
  }
  statusDisplay.textContent = isWorkTime ? "作業中" : "休憩中";
  statusDisplay.style.backgroundColor = isWorkTime ? "#006400" : "#FF8C00"; // 濃い緑色または濃いオレンジ色
  statusDisplay.style.color = "#FFFFFF"; // 白色
}

function pauseTimer() {
  if (!isPaused) {
    clearInterval(timer);
    isPaused = true;
    pausedTime = totalTime;
    statusDisplay.textContent = "一時停止中";
    statusDisplay.style.backgroundColor = "#505050"; // 濃いグレー
    statusDisplay.style.color = "#FFFFFF"; // 白色
  } else {
    startTimer();
  }
}

function tick() {
  if (totalTime <= 0) {
    endSound.play();
    if (isWorkTime) {
      if (remainingRepeats > 0) {
        totalTime = breakTime;
        isWorkTime = false;
        statusDisplay.textContent = "休憩中";
        statusDisplay.style.backgroundColor = "#FF8C00"; // 濃いオレンジ色
        statusDisplay.style.color = "#FFFFFF"; // 白色
      } else {
        clearInterval(timer);
        statusDisplay.textContent = "完了";
        statusDisplay.style.backgroundColor = "#00008B"; // 濃い青色
        statusDisplay.style.color = "#FFFFFF"; // 白色
      }
    } else {
      totalTime = workTime;
      isWorkTime = true;
      statusDisplay.textContent = "作業中";
      statusDisplay.style.backgroundColor = "#006400"; // 濃い緑色
      statusDisplay.style.color = "#FFFFFF"; // 白色
      remainingRepeats--;
    }
  } else {
    totalTime--;
    if (totalTime <= 3) {
      beepSound.play();
    }
  }
  updateDisplay(totalTime);
}

function resetTimer() {
  clearInterval(timer);
  updateDisplay(0);
  isPaused = false;
  statusDisplay.textContent = "停止中";
  statusDisplay.style.backgroundColor = "#B22222"; // 濃い赤色
  statusDisplay.style.color = "#FFFFFF"; // 白色
}

function updateDisplay(time) {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  timerDisplay.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  if (time <= 3) {
    timerDisplay.style.color = "#ff0000"; // 赤色
  } else if (time <= 5) {
    timerDisplay.style.color = "#0000ff"; // 青色
  } else {
    timerDisplay.style.color = "#000000"; // 黒色（デフォルト）
  }
}
