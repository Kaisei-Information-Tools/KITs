const $timers = document.getElementById('timers');
const $footer = document.getElementsByTagName('footer')[0];
const audio = new Audio('assets/sounds/alerm.mp3');
let timers = {};

const TIMER_ID_OFFSET = 'timer'.length;
const startAllTimer = () => { document.querySelectorAll('.timer').forEach(timer => startTimer(timer.id.substr(TIMER_ID_OFFSET))) }
const stopAllTimer = () => { document.querySelectorAll('.timer').forEach(timer => stopTimer(timer.id.substr(TIMER_ID_OFFSET))) }

function addTimer() {
  const timerId = parseInt(Object.keys(timers).pop()) + 1 || 0;
  timers[timerId] = {
    timeLeft: 0,
    isRunning: false,
    intervalId: 0
  };

  const $timer = document.createElement('div');
  $timer.className = 'timer border';
  $timer.id = `timer${timerId}`;
  $timer.innerHTML = `
      <div class="input-container">
        <input type="number" class="timer-input border" id="minutes-${timerId}" min="0" placeholder="分" value="0"/>
        <span>分</span>
        <input type="number" class="timer-input border" id="seconds-${timerId}" min="0" max="59" placeholder="秒" value="0"/>
        <span>秒</span>
      </div>
      <button id="startButton-${timerId}" class="button timer-button start-button border" onclick="startTimer('${timerId}')">Start</button>
      <button id="stopButton-${timerId}" class="button timer-button stop-button border" onclick="stopTimer('${timerId}')" style="display: none;">Stop</button>
      <button class="button timer-button delete-button border" onclick="deleteTimer('${timerId}')">Delete</button>
      <div class="timer-display" id="timer-display-${timerId}">00:00</div>
    `;
  $timers.appendChild($timer);

  if (document.body.clientHeight >= window.innerHeight) $footer.style.position = 'static';
}


function startTimer(timerId) {
  const timer = timers[timerId];

  const $minutesInput = document.getElementById(`minutes-${timerId}`);
  const $secondsInput = document.getElementById(`seconds-${timerId}`);

  let minutes = parseInt($minutesInput.value) || 0;
  let seconds = parseInt($secondsInput.value) || 0;

  let inputSeconds = minutes * 60 + seconds;
  if (timer.timeLeft === 0) timer.timeLeft = inputSeconds;

  if (timer.timeLeft > 0) {
    timer.isRunning = true;
    updateTimer(timerId); // 押された瞬間に実行
    timer.intervalId = setInterval(() => updateTimer(timerId), 1000);
    $minutesInput.disabled = true;
    $secondsInput.disabled = true;

    document.getElementById(`startButton-${timerId}`).style.display = 'none';
    document.getElementById(`stopButton-${timerId}`).style.display = 'inline';
  }
}

function stopTimer(timerId) {
  clearInterval(timers[timerId].intervalId);
  timers[timerId].isRunning = false;
  document.getElementById(`minutes-${timerId}`).disabled = false;
  document.getElementById(`seconds-${timerId}`).disabled = false;

  document.getElementById(`startButton-${timerId}`).style.display = 'inline';
  document.getElementById(`stopButton-${timerId}`).style.display = 'none';
}

function deleteTimer(timerId) {
  if (timers[timerId]) {
    clearInterval(timers[timerId].intervalId);
    delete timers[timerId];
  }
  document.getElementById(`timer${timerId}`).remove();

  if (document.body.clientHeight < window.innerHeight) $footer.style.position = 'fixed';
}

function updateTimer(timerId) {
  const timer = timers[timerId];
  let minutes = Math.floor(timer.timeLeft / 60);
  let seconds = timer.timeLeft % 60;

  document.getElementById(`timer-display-${timerId}`).textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  if (timer.timeLeft === 0) {
    clearInterval(timer.intervalId);
    timer.isRunning = false;
    notifyUser(timerId);
  } else {
    timer.timeLeft--;
  }
}

function notifyUser(timerId) {
  if (document.getElementById('toggle-sound').checked) audio.play();
  if (Notification.permission === 'granted') {
    new Notification('タイマー', { body: `${timerId}の時間が経過しました` });
  } else {
    console.log(`${timerId}の時間が経過しました`);
  }
  stopTimer(timerId);
}

