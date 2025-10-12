// 時計更新（日時と時間を改行）
function updateClock() {
  const el = document.getElementById('clock');
  const now = new Date();
  const dateOptions = {
    year: 'numeric', month: 'long', day: 'numeric',
    weekday: 'short'
  };
  const timeOptions = {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  };
  const dateStr = now.toLocaleDateString('ja-JP', dateOptions);
  const timeStr = now.toLocaleTimeString('ja-JP', timeOptions);
  el.textContent = `${dateStr}\n${timeStr}`;  // 改行付き
}
setInterval(updateClock, 1000);
updateClock();

// トップへ戻るボタン
const toTop = document.getElementById('to-top');
window.addEventListener('scroll', () => {
  toTop.style.display = window.scrollY > 200 ? 'flex' : 'none';
});
toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// サイドバー切り替え処理
const menuCheckbox = document.getElementById('menu');
const sidebar = document.getElementById('sidebar');
const content = document.getElementById('content');
// 初回チェックで状態反映
const handleSidebarToggle = () => {
  if (menuCheckbox.checked) {
    sidebar.classList.add('visible');
    sidebar.classList.remove('hidden');
    content.classList.remove('fullwidth');
  } else {
    sidebar.classList.remove('visible');
    sidebar.classList.add('hidden');
    content.classList.add('fullwidth');
  }
};

// イベント設定
menuCheckbox.addEventListener('change', handleSidebarToggle);

// 読み込み時にも適用
handleSidebarToggle();
