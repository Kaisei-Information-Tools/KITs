// DOM要素の取得
const imageInput = document.getElementById("image-input");
const previewContainer = document.getElementById("preview-container");
const imagePreview = document.getElementById("image-preview");
const optionsContainer = document.getElementById("options-container");
const convertContainer = document.getElementById("convert-container");

const formatSelect = document.getElementById("format-select");
const qualityControl = document.getElementById("quality-control");
const qualitySlider = document.getElementById("quality-slider");
const qualityValue = document.getElementById("quality-value");

const convertBtn = document.getElementById("convert-btn");

let originalFile = null;

// ファイルが選択されたときの処理
imageInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (
    file &&
    (file.type.startsWith("image/") || file.type === "image/svg+xml")
  ) {
    originalFile = file;
    const reader = new FileReader();

    reader.onload = (e) => {
      imagePreview.src = e.target.result;
      previewContainer.classList.remove("hidden");
      optionsContainer.classList.remove("hidden");
      convertContainer.classList.remove("hidden");
    };

    reader.readAsDataURL(file);
  }
});

// フォーマットが変更されたときの処理（画質スライダーの表示/非表示）
formatSelect.addEventListener("change", () => {
  const selectedFormat = formatSelect.value;
  // JPEGとWebPの場合のみ画質スライダーを表示
  if (selectedFormat === "jpeg" || selectedFormat === "webp") {
    qualityControl.classList.remove("hidden");
  } else {
    qualityControl.classList.add("hidden");
  }
});

// 画質スライダーが動かされたときの処理
qualitySlider.addEventListener("input", () => {
  qualityValue.textContent = qualitySlider.value;
});

// ファイルをダウンロードさせるためのヘルパー関数
function downloadFile(dataUrl, fileName) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 「変換してダウンロード」ボタンが押されたときの処理
convertBtn.addEventListener("click", () => {
  if (!originalFile) {
    alert("先に画像を選択してください。");
    return;
  }

  const format = formatSelect.value;
  const baseName = originalFile.name.replace(/\.[^.]*$/, '') || "converted_image";
  const fileName = `${baseName}.${format}`;

  // --- SVGへの簡易変換処理 ---
  // (ラスター画像をSVGファイル内に<image>タグで埋め込む)
  if (format === "svg") {
    // Validate and encode the Data URL for safe SVG embedding
    let safeDataUrl = "";
    if (typeof imagePreview.src === "string" && imagePreview.src.startsWith("data:image/")) {
      safeDataUrl = encodeURIComponent(imagePreview.src);
    } else {
      alert("不正な画像データです。");
      return;
    }
    const svgContent =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${imagePreview.naturalWidth}" height="${imagePreview.naturalHeight}">
        <image href="${safeDataUrl}" width="100%" height="100%" />
      </svg>`;
    const svgBlob = new Blob([svgContent], {
      type: "image/svg+xml;charset=utf-8",
    });
    const svgUrl = URL.createObjectURL(svgBlob);
    downloadFile(svgUrl, fileName);
    URL.revokeObjectURL(svgUrl); // メモリを解放
    return;
  }

  // --- Canvasを使った変換処理 (PNG, JPEG, WebP, GIF, BMP) ---
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");

    // JPEGに変換する場合、背景を白で塗りつぶす (透過部分が黒くなるのを防ぐため)
    if (format === "jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(img, 0, 0);

    const mimeType = `image/${format}`;
    const quality = parseFloat(qualitySlider.value);
    let dataUrl;

    // 品質指定が可能なフォーマットの場合
    if (format === "jpeg" || format === "webp") {
      dataUrl = canvas.toDataURL(mimeType, quality);
    } else {
      // PNG, GIF, BMPなどの場合
      dataUrl = canvas.toDataURL(mimeType);
    }

    // toDataURLが指定フォーマットに対応していない場合、ブラウザはPNGを返す
    // そのため、ユーザーはBMPを選択してもPNGがDLされる可能性がある
    if (format === "bmp" && !dataUrl.startsWith("data:image/bmp")) {
      alert(
        "お使いのブラウザはBMP形式への変換をサポートしていないようです。代わりにPNGとしてダウンロードされます。",
      );
      // ファイル名も修正
      const newFileName = `${baseName}.png`;
      downloadFile(dataUrl, newFileName);
    } else {
      downloadFile(dataUrl, fileName);
    }
  };

  // SVGをCanvasで扱えるようにするための設定
  img.src = imagePreview.src;
});
