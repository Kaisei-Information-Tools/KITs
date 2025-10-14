// 時計更新（日時と時間を改行）
function updateClock() {
  const el = document.getElementById("clock");
  const now = new Date();
  const dateOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  };
  const timeOptions = {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  };
  const dateStr = now.toLocaleDateString("ja-JP", dateOptions);
  const timeStr = now.toLocaleTimeString("ja-JP", timeOptions);
  el.textContent = `${dateStr}\n${timeStr}`; // 改行付き
}
setInterval(updateClock, 1000);
updateClock();
