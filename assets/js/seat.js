document.addEventListener('DOMContentLoaded', () => {
  // DOM要素
  const layoutSelect = document.getElementById('layout-mode');
  const normalSettings = document.getElementById('normal-settings');
  const rowsInput = document.getElementById('rows');
  const colsInput = document.getElementById('cols');
  const namesInput = document.getElementById('names');
  const dummyCountInput = document.getElementById('dummy-count');
  const generateDummyBtn = document.getElementById('generate-dummy-btn');
  const countDisplay = document.getElementById('count-display');
  const shuffleBtn = document.getElementById('shuffle-btn');
  const downloadBtn = document.getElementById('download-btn'); // 画像保存ボタン
  const seatMap = document.getElementById('seat-map');

  let isShuffling = false;

  init();

  function init() {
    generateDummyBtn.addEventListener('click', () => {
      generateDummyMembers();
      saveSettings();
    });
    
    layoutSelect.addEventListener('change', () => {
      toggleNormalSettings();
      renderLayout();
      updateCount();
      saveSettings();
    });

    [rowsInput, colsInput].forEach(el => {
      el.addEventListener('input', () => {
        if (layoutSelect.value === 'normal') {
          renderLayout();
          updateCount();
          saveSettings();
        }
      });
    });

    namesInput.addEventListener('input', () => {
      updateCount();
      saveSettings();
    });

    shuffleBtn.addEventListener('click', () => {
      if (!isShuffling) startShuffle();
    });

    // ★追加: 画像保存処理
    downloadBtn.addEventListener('click', () => {
      saveAsImage();
    });

    seatMap.addEventListener('click', (e) => {
      if (isShuffling) return;
      const seat = e.target.closest('.seat');
      if (seat) {
        seat.classList.toggle('disabled');
        if (seat.classList.contains('disabled')) {
          seat.textContent = '';
          seat.classList.remove('active', 'empty');
        } else {
          seat.textContent = seat.dataset.number;
        }
        updateCount();
        saveSettings();
      }
    });

    if (!loadSettings()) {
      toggleNormalSettings();
      generateDummyMembers();
      renderLayout();
    }
  }

  // ★変更: 名前ではなく番号のみを生成
  function generateDummyMembers() {
    const count = parseInt(dummyCountInput.value) || 0;
    if (count <= 0) return;
    let names = [];
    for(let i = 1; i <= count; i++) {
      names.push(`${i}`); // "学生"を削除し番号のみに
    }
    namesInput.value = names.join('\n');
    updateCount();
  }

  // ★追加: 画像として保存する関数
  function saveAsImage() {
    const target = document.getElementById('capture-target'); // .classroom-container
    
    // キャプチャ中は一時的に背景色を明確にする（透過防止）
    // 現在のテーマを確認
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const originalBg = target.style.backgroundColor;
    target.style.backgroundColor = isDark ? '#1a1d23' : '#e8f0f7';

    html2canvas(target, {
      scale: 2, // 高画質で保存
      useCORS: true
    }).then(canvas => {
      // リンクを生成してクリックさせる
      const link = document.createElement('a');
      link.download = `seat_chart_${new Date().getTime()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      // スタイルを戻す
      target.style.backgroundColor = originalBg;
    }).catch(err => {
      console.error('画像保存に失敗しました:', err);
      alert('画像の保存に失敗しました');
    });
  }

  // --- 保存機能 (LocalStorage) ---
  function saveSettings() {
    const disabledIds = Array.from(document.querySelectorAll('.seat.disabled')).map(el => el.dataset.number);
    const settings = {
      layout: layoutSelect.value,
      rows: rowsInput.value,
      cols: colsInput.value,
      names: namesInput.value,
      disabled: disabledIds
    };
    localStorage.setItem('seatToolSettings', JSON.stringify(settings));
  }

  function loadSettings() {
    const json = localStorage.getItem('seatToolSettings');
    if (!json) return false;
    try {
      const settings = JSON.parse(json);
      if(settings.layout) layoutSelect.value = settings.layout;
      if(settings.rows) rowsInput.value = settings.rows;
      if(settings.cols) colsInput.value = settings.cols;
      if(settings.names) namesInput.value = settings.names;

      toggleNormalSettings();
      renderLayout();
      updateCount();

      if (settings.disabled && Array.isArray(settings.disabled)) {
        settings.disabled.forEach(num => {
          const seat = seatMap.querySelector(`.seat[data-number="${num}"]`);
          if (seat) {
            seat.classList.add('disabled');
            seat.textContent = '';
          }
        });
        updateCount();
      }
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  function toggleNormalSettings() {
    if (layoutSelect.value === 'normal') {
      normalSettings.style.display = 'flex';
    } else {
      normalSettings.style.display = 'none';
    }
  }

  function renderLayout() {
    seatMap.innerHTML = '';
    const mode = layoutSelect.value;

    switch(mode) {
      case 'normal':
        renderNormal();
        break;
      case 'science1': 
        renderTablePattern(5, 2, '2x2');
        break;
      case 'science2': 
        renderTablePattern(2, 5, '1x4');
        break;
      case 'combined': 
        renderTablePattern(3, 2, 'vertical-combined');
        break;
      case 'dice5': 
        renderDice5();
        break;
    }
  }

  function renderNormal() {
    const rows = parseInt(rowsInput.value) || 6;
    const cols = parseInt(colsInput.value) || 6;
    seatMap.style.gridTemplateColumns = `repeat(${cols}, auto)`;
    const total = rows * cols;
    for(let i=0; i<total; i++) {
      const group = document.createElement('div');
      group.className = 'table-group mode-normal';
      group.appendChild(createSeat(i + 1));
      seatMap.appendChild(group);
    }
  }

  function renderTablePattern(gridCols, gridRows, type) {
    seatMap.style.gridTemplateColumns = `repeat(${gridCols}, auto)`;
    const totalTables = gridCols * gridRows;
    let seatCounter = 1;

    for(let i=0; i<totalTables; i++) {
      const table = createTableElement(type, seatCounter);
      if (type === '2x2' || type === '1x4') seatCounter += 4;
      if (type === 'vertical-combined') seatCounter += 8;
      seatMap.appendChild(table);
    }
  }

  function renderDice5() {
    seatMap.style.gridTemplateColumns = `repeat(3, auto)`;
    const map = [
      1, 0, 1,
      0, 1, 0,
      1, 0, 1
    ];
    let seatCounter = 1;
    map.forEach(isActive => {
      if (isActive) {
        const table = createTableElement('vertical-combined', seatCounter);
        seatCounter += 8;
        seatMap.appendChild(table);
      } else {
        const spacer = document.createElement('div');
        spacer.style.width = "140px";
        seatMap.appendChild(spacer);
      }
    });
  }

  function createTableElement(type, startNum) {
    if (type === 'vertical-combined') {
      const container = document.createElement('div');
      container.className = 'combined-container';
      
      const topTable = document.createElement('div');
      topTable.className = 'combined-half top';
      for(let j=0; j<4; j++) {
        topTable.appendChild(createSeat(startNum + j));
      }
      
      const bottomTable = document.createElement('div');
      bottomTable.className = 'combined-half bottom';
      for(let j=0; j<4; j++) {
        bottomTable.appendChild(createSeat(startNum + 4 + j));
      }

      container.appendChild(topTable);
      container.appendChild(bottomTable);
      return container;
    }

    const table = document.createElement('div');
    table.className = 'table-group';

    if (type === '2x2') {
      table.style.gridTemplateColumns = 'repeat(2, 1fr)';
      for(let j=0; j<4; j++) table.appendChild(createSeat(startNum + j));
    } 
    else if (type === '1x4') {
      table.style.gridTemplateColumns = 'repeat(4, 1fr)';
      for(let j=0; j<4; j++) table.appendChild(createSeat(startNum + j));
    } 
    
    return table;
  }

  function createSeat(number) {
    const seat = document.createElement('div');
    seat.className = 'seat';
    seat.dataset.number = number; 
    seat.textContent = number;
    return seat;
  }

  function updateCount() {
    const names = getNames();
    const validSeats = document.querySelectorAll('.seat:not(.disabled)');
    countDisplay.textContent = `人数: ${names.length}名 / 有効席: ${validSeats.length}席`;
    if (names.length > validSeats.length) {
      countDisplay.classList.add('text-warning-custom');
      countDisplay.innerHTML += ' <i class="fa-solid fa-triangle-exclamation"></i>';
    } else {
      countDisplay.classList.remove('text-warning-custom');
    }
  }

  function getNames() {
    return namesInput.value.split('\n').map(n => n.trim()).filter(n => n !== '');
  }

  async function startShuffle() {
    let names = getNames();
    const validSeats = Array.from(document.querySelectorAll('.seat:not(.disabled)'));
    
    if (names.length === 0) {
      alert('参加者がいません。');
      return;
    }
    if (validSeats.length === 0) {
      alert('有効な座席がありません。');
      return;
    }

    isShuffling = true;
    shuffleBtn.disabled = true;
    const originalText = shuffleBtn.innerHTML;
    shuffleBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> シャッフル中...';

    for (let i = names.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [names[i], names[j]] = [names[j], names[i]];
    }

    validSeats.forEach(seat => {
      seat.classList.add('shuffling');
      seat.classList.remove('active', 'empty');
    });

    const duration = 1500;
    const interval = 50;
    const startTime = Date.now();

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      
      validSeats.forEach(seat => {
        const rnd = names[Math.floor(Math.random() * names.length)];
        seat.textContent = rnd;
      });

      if (elapsed > duration) {
        clearInterval(timer);
        finalize(names, validSeats);
        isShuffling = false;
        shuffleBtn.disabled = false;
        shuffleBtn.innerHTML = originalText;
        saveSettings();
      }
    }, interval);
  }

  function finalize(finalNames, seats) {
    seats.forEach((seat, index) => {
      seat.classList.remove('shuffling');
      if (index < finalNames.length) {
        seat.textContent = finalNames[index];
        seat.classList.add('active');
        seat.style.opacity = '0';
        seat.style.transform = 'scale(0.5)';
        setTimeout(() => {
          seat.style.opacity = '1';
          seat.style.transform = 'scale(1)';
        }, index * 20);
      } else {
        seat.textContent = '空席';
        seat.classList.add('empty');
      }
    });
  }
});
