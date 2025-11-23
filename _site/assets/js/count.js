let count = 0;

const $counter = document.getElementById('counter');
const $newValue = document.getElementById('newValue');
const $newValueBox = document.getElementById('newValueBox');
const $confirmNewValue = document.getElementById('confirmNewValue');
const $reset = document.getElementById('reset');
const $resetBox = document.getElementById('resetBox');
const $resetYes = document.getElementById('resetYes');
const $resetNo = document.getElementById('resetNo');

const $increases = document.getElementsByName('increase');
const $decreases = document.getElementsByName('decrease');
const $customIncrease = document.getElementById('customIncrease');
const $customIncreaseValue = document.getElementById('customIncreaseValue');
const $customDecrease = document.getElementById('customDecrease');
const $customDecreaseValue = document.getElementById('customDecreaseValue');
const $multiplier = document.getElementById('multiplier');
const $multiply = document.getElementById('multiply');
const $divider = document.getElementById('divider');
const $divide = document.getElementById('divide');

window.onload = function (){
  count = 0;

  // ページロード時にlocalStorageからカウント値を取得
  if (localStorage.getItem('counterValue')) {
      count = parseInt(localStorage.getItem('counterValue'));
  }

  // 初期表示のカウンターを更新
  updateCounter();
};

function updateCounter() {
  $counter.textContent = count;
  localStorage.setItem('counterValue', count); // カウンターの値をlocalStorageに保存
};

// カウンターをクリックしたときに数値を変更
$counter.addEventListener('click', () => {
  $newValueBox.style.display = 'block';
});

$confirmNewValue.addEventListener('click', () => {
  let newValue = parseInt($newValue.value);
  if (!isNaN(newValue)) {
    count = newValue;
    updateCounter();
  }
  $newValueBox.style.display = 'none';
});

// +10^n
$increases.forEach((v, k) => {
  v.addEventListener('click', () => {
    count += 10 ** k;
    updateCounter();
  })
});

// -10^n
$decreases.forEach((v, k) => {
  v.addEventListener('click', () => {
    count -= 10 ** k;
    updateCounter();
  })
});

$reset.addEventListener('click', () => {
  $resetBox.style.display = 'block'; // 確認ダイアログを表示
});

$resetYes.addEventListener('click', () => {
  count = 0; // カウントをリセット
  updateCounter();
  $resetBox.style.display = 'none'; // ダイアログを非表示
});

$resetNo.addEventListener('click', () => {
  $resetBox.style.display = 'none'; // ダイアログを非表示
});

$customIncrease.addEventListener('click', () => {
  const customValue = parseInt($customIncreaseValue.value);
  if (!isNaN(customValue)) {
    count += customValue;
    updateCounter();
  }
});

$customDecrease.addEventListener('click', () => {
  const customValue = parseInt($customDecreaseValue.value);
  if (!isNaN(customValue)) {
    count -= customValue;
    updateCounter();
  }
});

// n倍にする処理
$multiply.addEventListener('click', () => {
  const multiplier = parseFloat($multiplier.value);
  if (!isNaN(multiplier)) { 
    count *= multiplier;
    updateCounter();
  }
});

// n分の1にする処理
$divide.addEventListener('click', () => {
  const divider = parseFloat($divider.value);
  if (!isNaN(divider) && divider !== 0) {  // ゼロ除算回避
    count /= divider;
    updateCounter();
  }
});
