let startTime;
let updatedTime;
let difference = 0;
let savedTime = 0;
let timerInterval;
let running = false;
let lapLength = 0;

const $DISPLAY = document.getElementById("display");
const $TOGGLE_BUTTON = document.getElementById("toggle");
const $RESET_BUTTON = document.getElementById("reset");
const $LAP_BUTTON = document.getElementById("lap");
const $LAP_CONTAINER = document.getElementById("lap-container");

const $FOOTER = document.getElementsByTagName("footer")[0];

const START_BUTTON_NAME = "Start";
const STOP_BUTTON_NAME = "Stop";

// Function to get colors based on current theme
function getButtonColors() {
  const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    start: isDarkMode ? "#5ce878" : "#60d351",
    stop: isDarkMode ? "#ec4899" : "#d351a1"
  };
}

function toggleStop() {
  const colors = getButtonColors();
  if (!running) {
    startTime = new Date().getTime() - savedTime;
    timerInterval = setInterval(updateTime, 10);
    $TOGGLE_BUTTON.textContent = STOP_BUTTON_NAME;
    $TOGGLE_BUTTON.style.backgroundColor = colors.stop;
    running = true;
  } else {
    clearInterval(timerInterval);
    savedTime = difference;
    $TOGGLE_BUTTON.textContent = START_BUTTON_NAME;
    $TOGGLE_BUTTON.style.backgroundColor = colors.start;
    running = false;
  }
}

function reset() {
  const colors = getButtonColors();
  clearInterval(timerInterval);
  $DISPLAY.textContent = "00:00:00.00";
  $TOGGLE_BUTTON.textContent = START_BUTTON_NAME;
  $TOGGLE_BUTTON.style.backgroundColor = colors.start;
  running = false;
  difference = 0;
  savedTime = 0;
  lapLength = 0;
  $LAP_CONTAINER.innerHTML = "<h3>Laps</h3>";
  // $FOOTER.style.position = "fixed";
}

function updateTime() {
  updatedTime = new Date().getTime();
  difference = updatedTime - startTime;

  const hours = Math.floor(difference / (1000 * 60 * 60)).toString().padStart(
    2,
    "0",
  );
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
    .toString().padStart(2, "0");
  const seconds = Math.floor((difference % (1000 * 60)) / 1000).toString()
    .padStart(2, "0");
  const milliseconds = Math.floor((difference % 1000) / 10).toString().padStart(
    2,
    "0",
  );

  $DISPLAY.textContent = `${hours}:${minutes}:${seconds}.${milliseconds}`;
}

function createLap() {
  const lapTime = $DISPLAY.textContent;
  const lapElement = document.createElement("div");
  lapElement.className = "lap";

  const lapTimeDisplay = document.createElement("div");
  lapTimeDisplay.className = "lap-time";
  lapTimeDisplay.textContent = lapTime;

  const lapButtons = document.createElement("div");
  // const lapDisplay = document.createElement('div');
  // lapDisplay.className = 'lap-display';
  // lapDisplay.textContent = lapTime;

  // const lapStartStopButton = document.createElement('button');
  // lapStartStopButton.textContent = STOP_BUTTON_NAME;
  // lapStartStopButton.className = 'lap-stop-toggle';
  // lapStartStopButton.addEventListener('click', function() {
  //     if (lapRunning) {
  //         clearInterval(lapTimerInterval);
  //         lapSavedTime = lapDifference;
  //         lapStartStopButton.textContent = START_BUTTON_NAME;
  //         lapStartStopButton.style.backgroundColor = START_BUTTON_COLOR;
  //         lapRunning = false;
  //     } else {
  //         lapStartTime = new Date().getTime() - lapSavedTime;
  //         lapTimerInterval = setInterval(updateLapTime, 10);
  //         lapStartStopButton.textContent = STOP_BUTTON_NAME;
  //         lapStartStopButton.style.backgroundColor = STOP_BUTTON_COLOR;
  //         lapRunning = true;
  //     }
  // });

  const lapRemoveButton = document.createElement("button");
  lapRemoveButton.textContent = "Remove";
  lapRemoveButton.className = "button border stopwatch-buttons reset-button";
  lapRemoveButton.addEventListener("click", () => lapElement.remove());

  // lapButtons.appendChild(lapStartStopButton);
  lapButtons.appendChild(lapRemoveButton);
  lapElement.appendChild(lapTimeDisplay);
  // lapElement.appendChild(lapDisplay);
  lapElement.appendChild(lapButtons);
  $LAP_CONTAINER.appendChild(lapElement);

  // let lapStartTime = new Date().getTime();
  // let lapUpdatedTime;
  // let lapDifference = parseTimeToMillis(lapTime);
  // let lapSavedTime = 0;
  // let lapTimerInterval;
  // let lapRunning = true;

  // function updateLapTime() {
  //     lapUpdatedTime = new Date().getTime();
  //     lapDifference = lapUpdatedTime - lapStartTime + lapSavedTime;
  //
  //     const lapHours = Math.floor(lapDifference / (1000 * 60 * 60)).toString().padStart(2, '0');
  //     const lapMinutes = Math.floor((lapDifference % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
  //     const lapSeconds = Math.floor((lapDifference % (1000 * 60)) / 1000).toString().padStart(2, '0');
  //     const lapMilliseconds = Math.floor((lapDifference % 1000) / 10).toString().padStart(2, '0');
  //
  //     lapDisplay.textContent = `${lapHours}:${lapMinutes}:${lapSeconds}.${lapMilliseconds}`;
  // }

  // lapTimerInterval = setInterval(updateLapTime, 10);
  if (document.body.clientHeight >= window.innerHeight) {
    // $FOOTER.style.position = 'static';
  }
}

// function parseTimeToMillis(time) {
//   const [hours, minutes, secondsAndMillis] = time.split(':');
//   const [seconds, millis] = secondsAndMillis.split('.');
//
//   return (
//     parseInt(hours, 10) * 60 * 60 * 1000 +
//     parseInt(minutes, 10) * 60 * 1000 +
//     parseInt(seconds, 10) * 1000 +
//     parseInt(millis, 10) * 10
//   );
// }

// Initialize button color based on current theme
(function initButtonColor() {
  const colors = getButtonColors();
  $TOGGLE_BUTTON.style.backgroundColor = colors.start;
})();

$TOGGLE_BUTTON.addEventListener("click", toggleStop);
$RESET_BUTTON.addEventListener("click", reset);
$LAP_BUTTON.addEventListener("click", createLap);
