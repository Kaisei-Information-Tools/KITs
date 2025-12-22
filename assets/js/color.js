document.addEventListener('DOMContentLoaded', () => {
    // --- 必要なHTML要素を取得 ---
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

    // --- 状態管理 ---
    let isLocked = false; // 色情報を固定するかのフラグ

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

    // 色情報の更新
    function updateColorInfo(x, y) {
        if (x < 0 || x >= sourceCanvas.width || y < 0 || y >= sourceCanvas.height) return;

        const pixel = sourceCtx.getImageData(x, y, 1, 1).data;
        const [r, g, b] = pixel;

        const toHex = (c) => ('0' + c.toString(16)).slice(-2);
        const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
        const rgb = `rgb(${r}, ${g}, ${b})`;

        // UI更新
        colorPreview.style.backgroundColor = hex;
        hexCodeEl.textContent = hex;
        rgbCodeEl.textContent = rgb;
    }

    // ルーペの描画
    function updateLoupe(pageX, pageY, imageX, imageY) {
        const loupeSize = 150;
        const zoomFactor = 10;
        
        // カーソル位置にルーペを追従させる
        loupe.style.left = `${pageX}px`;
        loupe.style.top = `${pageY}px`;
        
        loupeCtx.imageSmoothingEnabled = false; // ドットをくっきり表示
        loupeCtx.clearRect(0, 0, loupeSize, loupeSize);
        
        // 元画像の一部を拡大して描画
        loupeCtx.drawImage(
            sourceCanvas,
            imageX - (loupeSize / zoomFactor / 2),
            imageY - (loupeSize / zoomFactor / 2),
            loupeSize / zoomFactor,
            loupeSize / zoomFactor,
            0, 0, loupeSize, loupeSize
        );
        
        // 中心線の描画（十字）
        loupeCtx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        loupeCtx.lineWidth = 1;
        loupeCtx.beginPath();
        loupeCtx.moveTo(loupeSize / 2, 0);
        loupeCtx.lineTo(loupeSize / 2, loupeSize);
        loupeCtx.moveTo(0, loupeSize / 2);
        loupeCtx.lineTo(loupeSize, loupeSize / 2);
        loupeCtx.stroke();
        
        // 中心線の縁取り（白）で見やすく
        loupeCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        loupeCtx.beginPath();
        loupeCtx.moveTo(loupeSize / 2 + 1, 0);
        loupeCtx.lineTo(loupeSize / 2 + 1, loupeSize);
        loupeCtx.moveTo(0, loupeSize / 2 + 1);
        loupeCtx.lineTo(loupeSize, loupeSize / 2 + 1);
        loupeCtx.stroke();
    }

    // --- イベントリスナー ---

    // 1. ファイル選択時
    imageLoader.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            if (preview.src) {
                URL.revokeObjectURL(preview.src);
            }
            preview.src = URL.createObjectURL(file);
            
            // リセット処理
            isLocked = false;
            focusMarker.style.display = 'none';
            hexCodeEl.textContent = '-';
            rgbCodeEl.textContent = '-';
            colorPreview.style.backgroundColor = '#ffffff';
        }
    });

    // 2. 画像読み込み完了時
    preview.addEventListener('load', () => {
        placeholderText.style.display = 'none';
        preview.style.display = 'block';
        infoArea.style.display = 'block'; // 情報エリアを表示

        // Canvasに画像を描画（色取得用）
        sourceCanvas.width = preview.naturalWidth;
        sourceCanvas.height = preview.naturalHeight;
        sourceCtx.drawImage(preview, 0, 0);
    });

    // 3. 画像上でマウス移動時
    preview.addEventListener('mousemove', (e) => {
        if (!preview.src || isLocked) return;

        // 画面上の座標を画像のピクセル座標に変換
        const rect = preview.getBoundingClientRect();
        const scaleX = preview.naturalWidth / rect.width;
        const scaleY = preview.naturalHeight / rect.height;
        const imageX = Math.floor((e.clientX - rect.left) * scaleX);
        const imageY = Math.floor((e.clientY - rect.top) * scaleY);
        
        updateColorInfo(imageX, imageY);
        updateLoupe(e.pageX, e.pageY, imageX, imageY);
    });

    // 4. 画像クリック時（ロック/解除）
    preview.addEventListener('click', (e) => {
        if (!preview.src) return;

        isLocked = !isLocked;

        const rect = preview.getBoundingClientRect();
        const scaleX = preview.naturalWidth / rect.width;
        const scaleY = preview.naturalHeight / rect.height;
        const imageX = Math.floor((e.clientX - rect.left) * scaleX);
        const imageY = Math.floor((e.clientY - rect.top) * scaleY);
        
        updateColorInfo(imageX, imageY);

        if (isLocked) {
            // ロック時：ルーペを消してマーカーを表示
            loupe.style.display = 'none';

            const containerRect = previewContainer.getBoundingClientRect();
            const markerX = e.clientX - containerRect.left;
            const markerY = e.clientY - containerRect.top;

            focusMarker.style.left = `${markerX}px`;
            focusMarker.style.top = `${markerY}px`;
            focusMarker.style.display = 'block';

        } else {
            // 解除時：マーカーを消してルーペを表示
            focusMarker.style.display = 'none';
            loupe.style.display = 'block';
            updateLoupe(e.pageX, e.pageY, imageX, imageY);
        }
    });

    // 5. マウス操作によるルーペの表示制御
    preview.addEventListener('mouseenter', () => { 
        if (preview.src && !isLocked) {
            loupe.style.display = 'block'; 
        }
    });

    preview.addEventListener('mouseleave', () => { 
        loupe.style.display = 'none'; 
    });
});
