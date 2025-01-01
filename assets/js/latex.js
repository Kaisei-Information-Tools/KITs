// エディタとプレビュー領域、ボタンの取得
const editor = document.getElementById("editor");
const preview = document.getElementById("preview");
const openCHTMLBtn = document.getElementById("openCHTMLBtn");
const LOCAL_STORAGE_KEY = "latexEditorContent";

// MathJaxの設定
MathJax = {
  tex: {
    inlineMath: [
      ["$", "$"],
      ["\\(", "\\)"],
    ],
  },
  chtml: { scale: 1, matchFontHeight: true },
};

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

// プレビューを更新する関数
function updatePreview() {
  const latexText = editor.value;
  preview.innerHTML = `\\[${latexText}\\]`;
  if (typeof MathJax !== "undefined" && MathJax.typesetPromise) {
    MathJax.typesetPromise([preview]).catch((err) =>
      console.error("MathJax Error:", err)
    );
  } else {
    console.error("MathJax is not loaded or typesetPromise is unavailable.");
  }
}

// CHTMLを新しいタブで開くボタンの機能
openCHTMLBtn.addEventListener("click", async () => {
  try {
    // MathJaxの処理を完了させる
    await MathJax.typesetPromise([preview]);
    const mathElement = preview.querySelector("mjx-container");
    if (!mathElement) {
      console.error("CHTML element not found!");
      return;
    }
    const getAccessibleCSS = () => {
      const cssRules = [];
      Array.from(document.styleSheets).forEach((styleSheet) => {
        try {
          // `cssRules`が安全に読み取れる場合のみ処理を続行
          if (styleSheet.cssRules) {
            Array.from(styleSheet.cssRules).forEach((rule) => {
              cssRules.push(rule.cssText);
            });
          }
        } catch (e) {
          console.warn(
            "Cannot access CSS rules from a stylesheet:",
            styleSheet.href,
          );
        }
      });
      return cssRules.join("\n");
    };
    const cssText = getAccessibleCSS();

    // CHTMLの外部CSSを含む完全なHTMLを生成
    const chtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>MathJax CHTML Output</title>
        <style>${cssText}</style>
      </head>
      <body>
        ${mathElement.outerHTML}
      </body>
      </html>
    `;

    // データURLを生成し、新しいタブで開く
    const chtmlBlob = new Blob([chtml], { type: "text/html" });
    const chtmlURL = URL.createObjectURL(chtmlBlob);
    window.open(chtmlURL, "_blank");
  } catch (err) {
    console.error("Error generating or opening CHTML:", err);
  }
});
