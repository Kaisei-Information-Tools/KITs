const editor = document.getElementById("editor");
const preview = document.getElementById("preview");
const openCHTMLBtn = document.getElementById("openCHTMLBtn");
const LOCAL_STORAGE_KEY = "latexEditorContent";

// タブ切替
const tabs = document.querySelectorAll(".tab");
const toolbars = document.querySelectorAll(".toolbar");
tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    toolbars.forEach(tb => tb.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(tab.dataset.target).classList.add("active");
  });
});

// 初期化
window.addEventListener("load", () => {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (saved) editor.value = saved;
  updatePreview();
});

document.querySelectorAll("button[data-insert]").forEach(btn => {
  btn.addEventListener("click", () => insertAtCursor(btn.dataset.insert));
});

function insertAtCursor(text) {
  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  const before = editor.value.substring(0, start);
  const after = editor.value.substring(end);

  editor.value = before + text + after;

  const brace = text.indexOf("{}");
  if (brace !== -1) {
    editor.selectionStart = editor.selectionEnd = start + brace + 1;
  } else {
    editor.selectionStart = editor.selectionEnd = start + text.length;
  }

  localStorage.setItem(LOCAL_STORAGE_KEY, editor.value);
  updatePreview();
}

editor.addEventListener("input", () => {
  localStorage.setItem(LOCAL_STORAGE_KEY, editor.value);
  updatePreview();
});

function updatePreview() {
  try {
    const latexText = editor.value.replace(/\\\\/g, "\\");
    preview.innerHTML = katex.renderToString(latexText, {
      throwOnError: false,
      displayMode: true,
    });
  } catch (e) {
    preview.innerHTML = `<span style="color:red;">エラー: ${e.message}</span>`;
  }
}

openCHTMLBtn.addEventListener("click", () => {
  const latexText = editor.value.replace(/\\\\/g, "\\");
  const html = katex.renderToString(latexText, {
    throwOnError: false,
    displayMode: true,
  });
  const css = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css";
  const w = window.open();
  w.document.write(`<html><head><link rel="stylesheet" href="${css}"></head><body>${html}</body></html>`);
});
