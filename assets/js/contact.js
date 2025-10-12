document.addEventListener('DOMContentLoaded', () => {
  // トップへ戻るボタン
  const toTop = document.getElementById('to-top');
  window.addEventListener('scroll', () => {
    toTop.style.display = window.scrollY > 200 ? 'flex' : 'none';
  });
  toTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ハンバーガーメニュー開閉
  const menuCheckbox = document.getElementById('menu');
  const sidebar = document.getElementById('sidebar');
  const content = document.getElementById('content');
  menuCheckbox.addEventListener('change', () => {
    sidebar.classList.toggle('visible', menuCheckbox.checked);
    content.classList.toggle('fullwidth', !menuCheckbox.checked);
  });

  // フォーム送信処理
  const form = document.querySelector('.contact-form form');
  const statusEl = document.getElementById('formStatus');
  const iframe = document.getElementById('hidden_iframe');

  // フォーム送信完了後、iframe が load イベントを発火
  iframe.addEventListener('load', () => {
    statusEl.style.display = 'block'; // 完了メッセージ表示
    form.reset(); // フォームリセット
  });
});
