// --- 必要なHTML要素を取得 ---
const imageLoader = document.getElementById('image-loader');
const preview = document.getElementById('preview');
const placeholderText = document.getElementById('placeholder-text');
const infoArea = document.getElementById('info-area');
const colorPreview = document.getElementById('color-preview');
const hexCodeEl = document.getElementById('hex-code');
const rgbCodeEl = document.getElementById('rgb-code');
const sourceCanvas = document.getElementById('source-canvas');
const loupe = document.getElementById('loupe'); // ルーペ要素

// --- Canvasのコンテキスト設定（色の精度を維持） ---
const contextOptions = { 
    willReadFrequently: true,
    colorSpace: 'srgb' 
};
const sourceCtx = sourceCanvas.getContext('2d', contextOptions);
// ルーペ用にもコンテキストを設定
const loupeCtx = loupe.getContext('2d', contextOptions);
loupe.width = 150; // ルーペのサイズをJavaScriptで設定
loupe.height = 150;

// 1. ファイルが選択されたら画像をプレビューに表示
imageLoader.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        // メモリリークを防ぐため、既存のURLオブジェクトを解放
        if (preview.src) {
            URL.revokeObjectURL(preview.src);
        }
        preview.src = URL.createObjectURL(file);
    }
});

// 2. 画像の読み込みが完了したら、Canvasに描画し、UIを表示する
preview.addEventListener('load', () => {
    placeholderText.style.display = 'none';
    preview.style.display = 'block';
    infoArea.style.display = 'block';

    sourceCanvas.width = preview.naturalWidth;
    sourceCanvas.height = preview.naturalHeight;
    sourceCtx.drawImage(preview, 0, 0);
});

// 3. 画像上でマウスが動いたときの主要な処理
preview.addEventListener('mousemove', (e) => {
    if (!preview.src) return;

    // マウスの座標を、画像の元サイズでの座標に変換する
    const rect = preview.getBoundingClientRect();
    const scaleX = preview.naturalWidth / rect.width;
    const scaleY = preview.naturalHeight / rect.height;
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);
    
    if (x < 0 || x >= sourceCanvas.width || y < 0 || y >= sourceCanvas.height) return;

    // 色情報の取得
    const pixel = sourceCtx.getImageData(x, y, 1, 1).data;
    const [r, g, b] = pixel;

    // 取得したRGB値をHEXとRGB形式の文字列に変換する
    const toHex = (c) => ('0' + c.toString(16)).slice(-2);
    const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    const rgb = `rgb(${r}, ${g}, ${b})`;

    // UIの更新
    colorPreview.style.backgroundColor = hex;
    hexCodeEl.textContent = hex;
    rgbCodeEl.textContent = rgb;

    // ルーペの更新
    updateLoupe(e.clientX, e.clientY, x, y);
});

// --- ルーペの描画関数 ---
function updateLoupe(clientX, clientY, imageX, imageY) {
    const loupeSize = 150; // ルーペの表示サイズ
    const zoomFactor = 10; // 拡大率
    
    // ルーペの位置をマウスカーソルの位置に設定
    loupe.style.left = `${clientX}px`;
    loupe.style.top = `${clientY}px`;
    
    loupeCtx.imageSmoothingEnabled = false; // ピクセルをくっきり表示
    loupeCtx.clearRect(0, 0, loupeSize, loupeSize);
    
    // ソース画像からルーペの中心に対応する部分を切り出して拡大描画
    loupeCtx.drawImage(
        sourceCanvas,
        imageX - (loupeSize / zoomFactor / 2),
        imageY - (loupeSize / zoomFactor / 2),
        loupeSize / zoomFactor,
        loupeSize / zoomFactor,
        0, 0, loupeSize, loupeSize
    );
    
    // 中心ピクセルを示す十字線を描画
    loupeCtx.strokeStyle = '#333';
    loupeCtx.lineWidth = 2;
    loupeCtx.beginPath();
    loupeCtx.moveTo(loupeSize / 2, 0);
    loupeCtx.lineTo(loupeSize / 2, loupeSize);
    loupeCtx.moveTo(0, loupeSize / 2);
    loupeCtx.lineTo(loupeSize, loupeSize / 2);
    loupeCtx.stroke();
}

// --- ルーペの表示/非表示制御 ---
preview.addEventListener('mouseenter', () => { 
    if (preview.src) loupe.style.display = 'block'; 
});

preview.addEventListener('mouseleave', () => { 
    loupe.style.display = 'none'; 
});