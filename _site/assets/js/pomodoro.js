let timer;
let isWorkTime = true;
let remainingRepeats;
let workTime, breakTime, totalTime;
let isPaused = false;
let pausedTime;

const timerDisplay = document.getElementById('timerDisplay');
const statusDisplay = document.getElementById('statusDisplay');
const workMinutes = document.getElementById('workMinutes');
const workSeconds = document.getElementById('workSeconds');
const breakMinutes = document.getElementById('breakMinutes');
const breakSeconds = document.getElementById('breakSeconds');
const repeatCount = document.getElementById('repeatCount');
const setButton = document.querySelector('.set-button');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');

const beepSound = new Audio('assets/sounds/alerm.mp3');
const endSound = new Audio('assets/sounds/alerm.mp3');

setButton.addEventListener('click', setTimer);
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);

function setTimer() {
    workTime = parseInt(workMinutes.value) * 60 + parseInt(workSeconds.value);
    breakTime = parseInt(breakMinutes.value) * 60 + parseInt(breakSeconds.value);
    remainingRepeats = parseInt(repeatCount.value);
    updateDisplay(workTime);
}

function startTimer() {
    if (!workTime || !breakTime) {
        alert('時間を設定してください。');
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
}

function pauseTimer() {
    if (!isPaused) {
        clearInterval(timer);
        isPaused = true;
        pausedTime = totalTime;
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
                statusDisplay.textContent = '休憩中';
            } else {
                clearInterval(timer);
            }
        } else {
            totalTime = workTime;
            isWorkTime = true;
            statusDisplay.textContent = '作業中';
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
}

function updateDisplay(time) {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    if (time <= 3) {
        timerDisplay.style.color = '#ff0000'; // 赤色
    } else if (time <= 5) {
        timerDisplay.style.color = '#0000ff'; // 青色
    } else {
        timerDisplay.style.color = '#000000'; // 黒色（デフォルト）
    }
}
