// フォントサイズを調整する関数
function adjustFontSize(delta) {
  const editor = window.editor;
  const selection = editor.model.document.selection;

  editor.model.change((writer) => {
    const selectedElements = selection.getSelectedBlocks();
    for (const element of selectedElements) {
      const currentFontSize = element.getAttribute("fontSize") || "16px";
      const currentSize = parseInt(currentFontSize, 10);
      const newSize = currentSize + delta;
      if (newSize >= 1) {
        writer.setAttribute("fontSize", newSize + "px", element);
      }
    }
  });
}

ClassicEditor.create(document.querySelector("#editor"), {
  toolbar: [
    "heading",
    "|",
    "bold",
    "italic",
    "underline",
    "strikethrough",
    "|",
    "fontFamily",
    "|",
    "fontColor",
    "fontBackgroundColor",
    "|",
    "link",
    "bulletedList",
    "numberedList",
    "blockQuote",
    "|",
    "fontSize",
    "|",
    "undo",
    "redo",
  ],
  language: "ja",
  fontSize: {
    options: [8, 10, 12, 16, 20, 24, 36],
  },
  fontFamily: {
    options: [
      "default",
      "Arial, sans-serif",
      "Georgia, serif",
      "Impact, Charcoal, sans-serif",
      "Tahoma, Geneva, sans-serif",
      "Verdana, Geneva, sans-serif",
      "Comic Sans MS, cursive",
      "Courier New, Courier, monospace",
      "Lucida Console, Monaco, monospace",
      "Times New Roman, Times, serif",
      "Roboto, sans-serif",
      "Noto Sans JP, sans-serif",
      "Noto Serif JP, serif",
    ],
  },
  image: {
    toolbar: ["imageTextAlternative"],
  },
  table: {
    contentToolbar: ["tableColumn", "tableRow", "mergeTableCells"],
  },
  bulletedList: {
    types: ["bulleted", "circled", "disc", "squared"],
  },
  heading: {
    options: [
      {
        model: "paragraph",
        title: "標準テキスト",
        class: "ck-heading_paragraph",
      },
      {
        model: "heading1",
        view: "h1",
        title: "見出し 1",
        class: "ck-heading_heading1",
      },
      {
        model: "heading2",
        view: "h2",
        title: "見出し 2",
        class: "ck-heading_heading2",
      },
      {
        model: "heading3",
        view: "h3",
        title: "見出し 3",
        class: "ck-heading_heading3",
      },
    ],
  },
  link: {
    addTargetToExternalLinks: true,
  },
  blockQuote: {
    toolbar: ["blockQuote"],
  },
  list: {
    toolbar: ["bulletedList", "numberedList"],
  },
  table: {
    contentToolbar: ["tableColumn", "tableRow", "mergeTableCells"],
  },
  typing: {
    transformations: {
      remove: ["link"],
    },
  },
  contentsCss: [
    "https://cdn.jsdelivr.net/npm/@material-ui/core@4.11.4/dist/material-ui.min.css",
    "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&display=swap",
    "https://fonts.googleapis.com/icon?family=Material+Icons",
    "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css",
    "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap-theme.min.css",
  ],
})
  .then((editor) => {
    window.editor = editor;

    // ツールバーのコンテナにクラスを追加
    const toolbarElement = editor.ui.view.toolbar.element;
    toolbarElement.classList.add("btn-group");
    toolbarElement.classList.add("btn-group-sm");

    // ツールバーのコンテナから ck-reset_all クラスを削除
    toolbarElement.classList.remove("ck-reset_all");

    const editorElement = editor.ui.view.element;

    editorElement.classList.remove("ck-reset");

    const topElement = editorElement.querySelector(
      ".ck-editor__top.ck-reset_all",
    );

    if (topElement) {
      // クラスを削除
      topElement.classList.remove("ck-reset_all");
    }

    const toolbarButtons = editor.ui.view.toolbar.items._items;
    toolbarButtons.forEach((button) => {
      if (button.type === "button") {
        button.element.classList.add("btn");
        button.element.classList.add("btn-theme-black");
        button.element.classList.add("btn-sm");
        button.element.classList.remove("ck-off");
      }
    });
  })
  .catch((error) => {
    console.error(error);
  });

document.getElementById("captureBtn").addEventListener("click", function () {
  domtoimage
    .toPng(document.querySelector(".ck-editor__editable"))
    .then(function (dataUrl) {
      let link = document.createElement("a");
      link.download = "editor-content.png";
      link.href = dataUrl;
      link.click();
    })
    .catch(function (error) {
      console.error("oops, something went wrong!", error);
    });
});

document
  .getElementsByClassName("btn-theme-2")[0]
  .addEventListener("click", function () {
    document
      .getElementsByClassName("dropdown-menu-theme")[0]
      .classList.toggle("show");
  });

document.addEventListener("click", function (event) {
  const targetElement = document.getElementsByClassName("btn-theme-2")[0];

  if (targetElement && !targetElement.contains(event.target)) {
    document
      .getElementsByClassName("dropdown-menu-theme")[0]
      .classList.remove("show");
  }
});
