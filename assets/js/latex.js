const editor = document.getElementById("editor");
const preview = document.getElementById("preview");
const openCHTMLBtn = document.getElementById("openCHTMLBtn");
const LOCAL_STORAGE_KEY = "latexEditorContent";

// ローカルストレージから保存された内容を読み込み
window.addEventListener("load", () => {
  const savedContent = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (savedContent) {
    editor.value = savedContent;
    updatePreview();
  }
});

// 入力があるたびにプレビューを更新し、ローカルストレージに保存
editor.addEventListener("input", () => {
  const latexText = editor.value;
  localStorage.setItem(LOCAL_STORAGE_KEY, latexText);
  updatePreview();
});

// プレビューを更新する関数（KaTeX使用）
function updatePreview() {
  const latexText = editor.value;
  try {
    const html = katex.renderToString(latexText, {
      throwOnError: false,
      displayMode: true,
    });
    preview.innerHTML = html;
  } catch (err) {
    preview.innerHTML =
      `<span style="color: red;">Error rendering LaTeX</span>`;
    console.error("KaTeX Error:", err);
  }
}

// CHTMLを新しいタブで開くボタンの機能（KaTeX対応）
openCHTMLBtn.addEventListener("click", () => {
  try {
    const latexText = editor.value;
    const html = katex.renderToString(latexText, {
      throwOnError: false,
      displayMode: true,
    });

    const cssHref =
      "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css";

    const fullHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>KaTeX Output</title>
        <link rel="stylesheet" href="${cssHref}" />
      </head>
      <body>
        ${html}
      </body>
      </html>
    `;

    const blob = new Blob([fullHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  } catch (err) {
    console.error("Error generating or opening KaTeX output:", err);
  }
});

