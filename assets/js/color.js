document.addEventListener('DOMContentLoaded', () => {
    // --- 要素取得 ---
    const imageLoader = document.getElementById('image-loader');
    const preview = document.getElementById('preview');
    const previewContainer = document.getElementById('preview-container');
    const placeholderText = document.getElementById('placeholder-text');
    const infoArea = document.getElementById('info-area');
    const colorPreview = document.getElementById('color-preview');
    const hexCodeEl = document.getElementById('hex-code');
    const rgbCodeEl = document.getElementById('rgb-code');
    const sourceCanvas = document.getElementById('source-canvas');
    const loupe = document.getElementById('loupe');
    const focusMarker = document.getElementById('focus-marker');
    const hoverMarker = document.getElementById('hover-marker'); // 追加

    // --- 状態 ---
    let isLocked = false;

    // --- Canvas設定 ---
    const contextOptions = { 
        willReadFrequently: true,
        colorSpace: 'srgb' 
    };
    const sourceCtx = sourceCanvas.getContext('2d', contextOptions);
    const loupeCtx = loupe.getContext('2d', contextOptions);
    loupe.width = 150;
    loupe.height = 150;

    // --- 関数定義 ---

    // 色情報更新
    function updateColorInfo(x, y) {
        if (x < 0 || x >= sourceCanvas.width || y < 0 || y >= sourceCanvas.height) return;

        const pixel = sourceCtx.getImageData(x, y, 1, 1).data;
        const [r, g, b] = pixel;

        const toHex = (c) => ('0' + c.toString(16)).slice(-2);
        const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
        const rgb = `rgb(${r}, ${g}, ${b})`;

        colorPreview.style.backgroundColor = hex;
        hexCodeEl.textContent = hex;
        rgbCodeEl.textContent = rgb;
    }

    // ルーペ描画 & 位置更新
    function updateLoupe(pageX, pageY, imageX, imageY) {
        const loupeSize = 150;
        const zoomFactor = 10;
        
        // ★修正: ルーペをカーソルの右下にずらして表示 (指で隠れないように)
        const offset = 20; 
        loupe.style.left = `${pageX + offset}px`;
        loupe.style.top = `${pageY + offset}px`;
        
        loupeCtx.imageSmoothingEnabled = false;
        loupeCtx.clearRect(0, 0, loupeSize, loupeSize);
        
        // 元画像から切り出し
        loupeCtx.drawImage(
            sourceCanvas,
            imageX - (loupeSize / zoomFactor / 2),
            imageY - (loupeSize / zoomFactor / 2),
            loupeSize / zoomFactor,
            loupeSize / zoomFactor,
            0, 0, loupeSize, loupeSize
        );
        
        // 中心線（十字）
        loupeCtx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        loupeCtx.lineWidth = 1;
        loupeCtx.beginPath();
        loupeCtx.moveTo(loupeSize / 2, 0);
        loupeCtx.lineTo(loupeSize / 2, loupeSize);
        loupeCtx.moveTo(0, loupeSize / 2);
        loupeCtx.lineTo(loupeSize, loupeSize / 2);
        loupeCtx.stroke();
        
        loupeCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        loupeCtx.beginPath();
        loupeCtx.moveTo(loupeSize / 2 + 1, 0);
        loupeCtx.lineTo(loupeSize / 2 + 1, loupeSize);
        loupeCtx.moveTo(0, loupeSize / 2 + 1);
        loupeCtx.lineTo(loupeSize, loupeSize / 2 + 1);
        loupeCtx.stroke();
    }

    // ★追加: ターゲット枠（赤い四角）の位置更新
    function updateHoverMarker(imageX, imageY) {
        if (!preview.src) return;

        const rect = preview.getBoundingClientRect();
        const containerRect = previewContainer.getBoundingClientRect();
        
        // 画像の表示倍率（縮小されている場合に対応）
        const scaleX = rect.width / preview.naturalWidth;
        const scaleY = rect.height / preview.naturalHeight;

        // 画像上の1ピクセルが画面上で何ピクセルになるか
        const pixelW = scaleX;
        const pixelH = scaleY;

        // 画面上での位置（コンテナ相対）
        // 画像の左端(rect.left)からの距離 + コンテナ内での画像のオフセット
        const imageLeftInContainer = rect.left - containerRect.left;
        const imageTopInContainer = rect.top - containerRect.top;

        const markerLeft = imageLeftInContainer + (imageX * scaleX);
        const markerTop = imageTopInContainer + (imageY * scaleY);

        hoverMarker.style.width = `${Math.max(1, pixelW)}px`;
        hoverMarker.style.height = `${Math.max(1, pixelH)}px`;
        hoverMarker.style.left = `${markerLeft}px`;
        hoverMarker.style.top = `${markerTop}px`;
        hoverMarker.style.display = 'block';
    }

    // --- イベントリスナー ---

    // 1. ファイル選択
    imageLoader.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            if (preview.src) {
                URL.revokeObjectURL(preview.src);
            }
            preview.src = URL.createObjectURL(file);
            
            isLocked = false;
            focusMarker.style.display = 'none';
            hoverMarker.style.display = 'none';
            hexCodeEl.textContent = '-';
            rgbCodeEl.textContent = '-';
            colorPreview.style.backgroundColor = '#ffffff';
        }
    });

    // 2. 読み込み完了
    preview.addEventListener('load', () => {
        placeholderText.style.display = 'none';
        preview.style.display = 'block';
        infoArea.style.display = 'block';

        sourceCanvas.width = preview.naturalWidth;
        sourceCanvas.height = preview.naturalHeight;
        sourceCtx.drawImage(preview, 0, 0);
    });

    // 3. マウス移動
    previewContainer.addEventListener('mousemove', (e) => {
        if (!preview.src || isLocked) return;

        // カーソルが画像の上にあるか判定
        const rect = preview.getBoundingClientRect();
        if (
            e.clientX < rect.left || 
            e.clientX > rect.right || 
            e.clientY < rect.top || 
            e.clientY > rect.bottom
        ) {
            loupe.style.display = 'none';
            hoverMarker.style.display = 'none';
            return;
        }

        loupe.style.display = 'block';

        // 座標計算
        const scaleX = preview.naturalWidth / rect.width;
        const scaleY = preview.naturalHeight / rect.height;
        
        // Math.floorでピクセル整数値にする
        const imageX = Math.floor((e.clientX - rect.left) * scaleX);
        const imageY = Math.floor((e.clientY - rect.top) * scaleY);
        
        updateColorInfo(imageX, imageY);
        updateLoupe(e.pageX, e.pageY, imageX, imageY);
        updateHoverMarker(imageX, imageY); // ターゲット枠更新
    });

    // 4. クリック（ロック）
    previewContainer.addEventListener('click', (e) => {
        if (!preview.src) return;
        
        // 画像外クリックなら無視
        const rect = preview.getBoundingClientRect();
        if (
            e.clientX < rect.left || 
            e.clientX > rect.right || 
            e.clientY < rect.top || 
            e.clientY > rect.bottom
        ) {
            return;
        }

        isLocked = !isLocked;

        // ロックした瞬間の位置で情報を更新
        const scaleX = preview.naturalWidth / rect.width;
        const scaleY = preview.naturalHeight / rect.height;
        const imageX = Math.floor((e.clientX - rect.left) * scaleX);
        const imageY = Math.floor((e.clientY - rect.top) * scaleY);
        
        updateColorInfo(imageX, imageY);

        if (isLocked) {
            loupe.style.display = 'none';
            hoverMarker.style.display = 'none'; // ホバー枠は消す

            // 固定用マーカー（丸印）を表示
            const containerRect = previewContainer.getBoundingClientRect();
            // ターゲット枠と同じ計算で位置出し
            const imageLeftInContainer = rect.left - containerRect.left;
            const imageTopInContainer = rect.top - containerRect.top;
            
            // ピクセルの中心に丸を置くための計算
            const pixelW = rect.width / preview.naturalWidth;
            const pixelH = rect.height / preview.naturalHeight;
            
            const markerLeft = imageLeftInContainer + (imageX * (1/scaleX)) + (pixelW / 2);
            const markerTop = imageTopInContainer + (imageY * (1/scaleY)) + (pixelH / 2);

            focusMarker.style.left = `${markerLeft}px`;
            focusMarker.style.top = `${markerTop}px`;
            focusMarker.style.display = 'block';

        } else {
            focusMarker.style.display = 'none';
            loupe.style.display = 'block';
            updateLoupe(e.pageX, e.pageY, imageX, imageY);
            updateHoverMarker(imageX, imageY);
        }
    });

    // 5. マウスアウト
    previewContainer.addEventListener('mouseleave', () => { 
        if (!isLocked) {
            loupe.style.display = 'none'; 
            hoverMarker.style.display = 'none';
        }
    });
});
