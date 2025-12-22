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
  const downloadBtn = document.getElementById('download-btn');
  const seatMap = document.getElementById('seat-map');
  const distModeRadios = document.getElementsByName('dist-mode');

  let isShuffling = false;

  init();

  function init() {
    // 1. イベントリスナー登録
    generateDummyBtn.addEventListener('click', () => {
      generateDummyMembers();
      saveSettings();
    });
    
    // レイアウト変更時: 無効化状態を引き継ぐ
    layoutSelect.addEventListener('change', () => {
      const currentDisabled = getDisabledIds(); // ★現在の無効席を記憶
      toggleNormalSettings();
      renderLayout();
      restoreDisabledSeats(currentDisabled);    // ★再描画後に復元
      updateCount();
      saveSettings(); 
    });

    // 行列変更時: 無効化状態を引き継ぐ
    [rowsInput, colsInput].forEach(el => {
      el.addEventListener('input', () => {
        if (layoutSelect.value === 'normal') {
          const currentDisabled = getDisabledIds(); // ★記憶
          renderLayout();
          restoreDisabledSeats(currentDisabled);    // ★復元
          updateCount();
          saveSettings();
        }
      });
    });

    // 配席モード変更時
    distModeRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        saveSettings();
      });
    });

    namesInput.addEventListener('input', () => {
      updateCount();
      saveSettings();
    });

    shuffleBtn.addEventListener('click', () => {
      if (!isShuffling) startShuffle();
    });

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
        saveSettings(); // 座席状態の保存
      }
    });

    // 2. 初期ロード
    if (!loadSettings()) {
      // 保存データがない場合のデフォルト
      toggleNormalSettings();
      generateDummyMembers();
      renderLayout();
    }
  }

  // --- ヘルパー関数: 無効化状態の取得・復元 ---
  function getDisabledIds() {
    return Array.from(document.querySelectorAll('.seat.disabled')).map(el => el.dataset.number);
  }

  function restoreDisabledSeats(ids) {
    if (!ids || ids.length === 0) return;
    ids.forEach(id => {
      // 新しいレイアウト内に同じ番号の席があれば無効化する
      const seat = seatMap.querySelector(`.seat[data-number="${id}"]`);
      if (seat) {
        seat.classList.add('disabled');
        seat.textContent = '';
        seat.classList.remove('active', 'empty');
      }
    });
  }

  // 番号のみ生成
  function generateDummyMembers() {
    const count = parseInt(dummyCountInput.value) || 0;
    if (count <= 0) return;
    let names = [];
    for(let i = 1; i <= count; i++) {
      names.push(`${i}`);
    }
    namesInput.value = names.join('\n');
    updateCount();
  }

  // 画像保存
  function saveAsImage() {
    const target = document.getElementById('capture-target');
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const originalBg = target.style.backgroundColor;
    target.style.backgroundColor = isDark ? '#1a1d23' : '#e8f0f7';

    html2canvas(target, {
      scale: 2,
      useCORS: true
    }).then(canvas => {
      const link = document.createElement('a');
      link.download = `seat_chart_${new Date().getTime()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      target.style.backgroundColor = originalBg;
    }).catch(err => {
      console.error('画像保存エラー:', err);
      alert('画像の保存に失敗しました');
    });
  }

  // --- 設定保存・読み込み ---
  function saveSettings() {
    const disabledIds = getDisabledIds();
    
    let distMode = 'front';
    for (const radio of distModeRadios) {
      if (radio.checked) {
        distMode = radio.value;
        break;
      }
    }

    const settings = {
      layout: layoutSelect.value,
      rows: rowsInput.value,
      cols: colsInput.value,
      names: namesInput.value,
      disabled: disabledIds,
      distMode: distMode
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
      if(settings.names !== undefined) namesInput.value = settings.names;

      if(settings.distMode) {
        for (const radio of distModeRadios) {
          if (radio.value === settings.distMode) {
            radio.checked = true;
          }
        }
      }

      toggleNormalSettings();
      renderLayout();
      // ロード時も無効化状態を復元
      restoreDisabledSeats(settings.disabled);
      updateCount();

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

  // --- レイアウト描画 ---
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

  // --- 座席取得ロジック (均等配置の修正) ---
  function getOrderedSeats() {
    let distMode = 'front';
    for (const radio of distModeRadios) {
      if (radio.checked) distMode = radio.value;
    }

    if (layoutSelect.value === 'normal' || distMode === 'front') {
      return Array.from(document.querySelectorAll('.seat:not(.disabled)'));
    }

    // 均等配置
    let deskUnits = [];
    const combinedHalves = document.querySelectorAll('.combined-half');
    if (combinedHalves.length > 0) {
      deskUnits = Array.from(combinedHalves);
    } else {
      deskUnits = Array.from(document.querySelectorAll('.table-group'));
    }

    const seatsPerDesk = deskUnits.map(desk => {
      return Array.from(desk.querySelectorAll('.seat:not(.disabled)'));
    });

    const orderedSeats = [];
    const maxSeatsInDesk = Math.max(...seatsPerDesk.map(arr => arr.length));

    for (let i = 0; i < maxSeatsInDesk; i++) {
      for (let d = 0; d < seatsPerDesk.length; d++) {
        if (seatsPerDesk[d][i]) {
          orderedSeats.push(seatsPerDesk[d][i]);
        }
      }
    }

    return orderedSeats;
  }

  async function startShuffle() {
    let names = getNames();
    const targetSeats = getOrderedSeats();
    const totalValidSeats = document.querySelectorAll('.seat:not(.disabled)').length;

    if (names.length === 0) {
      alert('参加者がいません。');
      return;
    }
    if (totalValidSeats === 0) {
      alert('有効な座席がありません。');
      return;
    }
    if (names.length > totalValidSeats) {
      alert(`人数(${names.length}名)が座席数(${totalValidSeats}席)を超えています。\n席替えできません。`);
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

    targetSeats.forEach(seat => {
      seat.classList.add('shuffling');
      seat.classList.remove('active', 'empty');
    });

    const duration = 1500;
    const interval = 50;
    const startTime = Date.now();

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      
      targetSeats.forEach(seat => {
        const rnd = names[Math.floor(Math.random() * names.length)];
        seat.textContent = rnd;
      });

      if (elapsed > duration) {
        clearInterval(timer);
        finalize(names, targetSeats);
        isShuffling = false;
        shuffleBtn.disabled = false;
        shuffleBtn.innerHTML = originalText;
        saveSettings();
      }
    }, interval);
  }

  function finalize(finalNames, seats) {
    const allValidSeats = document.querySelectorAll('.seat:not(.disabled)');
    allValidSeats.forEach(s => {
      s.classList.remove('shuffling', 'active');
      s.classList.add('empty');
      s.textContent = '空席';
    });

    seats.forEach((seat, index) => {
      if (index < finalNames.length) {
        seat.classList.remove('empty');
        seat.textContent = finalNames[index];
        seat.classList.add('active');
        seat.style.opacity = '0';
        seat.style.transform = 'scale(0.5)';
        setTimeout(() => {
          seat.style.opacity = '1';
          seat.style.transform = 'scale(1)';
        }, index * 20);
      }
    });
  }
});
