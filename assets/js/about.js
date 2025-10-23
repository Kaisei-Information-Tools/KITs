// サイドバーの開閉制御
const menuCheckbox = document.getElementById('menu');
const sidebar       = document.getElementById('sidebar');
const content       = document.querySelector('.content');

function handleSidebarToggle() {
  if (menuCheckbox.checked) {
    sidebar.classList.remove('hidden');
    content.classList.remove('fullwidth');
  } else {
    sidebar.classList.add('hidden');
    content.classList.add('fullwidth');
  }
}

// 初期状態反映＆トグル監視
menuCheckbox.addEventListener('change', handleSidebarToggle);
handleSidebarToggle();

document.addEventListener('DOMContentLoaded', function () {
  const menuCheckbox = document.getElementById('menu');
  const sidebar = document.getElementById('sidebar');
  const content = document.querySelector('.content');

  // 要素が存在するか確認してから処理を行う
  if (menuCheckbox && sidebar && content) {
    function handleSidebarToggle() {
      if (menuCheckbox.checked) {
        sidebar.classList.remove('hidden');
        content.classList.remove('fullwidth');
      } else {
        sidebar.classList.add('hidden');
        content.classList.add('fullwidth');
      }
    }

    menuCheckbox.addEventListener('change', handleSidebarToggle);
    handleSidebarToggle(); // 初期状態を反映
  } else {
    console.warn("一部の要素が見つかりませんでした: menu, sidebar, content");
  }
});


function openPolicyModal() {
  document.getElementById('policy-modal').style.display = 'block';
}

function closePolicyModal() {
  document.getElementById('policy-modal').style.display = 'none';
}
       
