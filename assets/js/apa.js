// それぞれ取得
let inputData = {
  author: document.getElementById("author"),
  site: document.getElementById("site"),
  publisher: document.getElementById("publisher"),
  journal: document.getElementById("journal"),
  pageName: document.getElementById("page-name"),
  title: document.getElementById("title"),
  edition: document.getElementById("edition"),
  volume: document.getElementById("volume"),
  pageCount: document.getElementById("page-count"),
  url: document.getElementById("url"),
  autoGetButton: document.getElementById("auto-get-data"),
  publish: {
    year: document.getElementById("publish-year"),
    month: document.getElementById("publish-month"),
    day: document.getElementById("publish-day"),
  },
  access: {
    year: document.getElementById("access-year"),
    month: document.getElementById("access-month"),
    day: document.getElementById("access-day"),
  },
};

const $result = document.getElementById("result");

const $webButton = document.getElementById("source-web");
const $journalButton = document.getElementById("source-journal");
const $bookButton = document.getElementById("source-book");

let mode;

$webButton.addEventListener("click", () => {
  mode = changeMode("web");
});
$journalButton.addEventListener("click", () => {
  mode = changeMode("journal");
});
$bookButton.addEventListener("click", () => {
  mode = changeMode("book");
});
document.getElementById("create-button").addEventListener("click", () => {
  const webNeeds = [
    inputData.pageName,
    inputData.url,
    inputData.access.year,
    inputData.access.month,
    inputData.access.day,
  ];
  const journalNeeds = [
    inputData.author,
    inputData.journal,
    inputData.title,
    inputData.volume,
    inputData.pageCount,
    inputData.publish.year,
  ];
  const bookNeeds = [
    inputData.author,
    inputData.publisher,
    inputData.title,
    inputData.publish.year,
  ];

  if (mode !== "web") {
    inputData.publish.month.value = "";
    inputData.publish.day.value = "";
  }

  if (mode === "web") createAPA(webNeeds);
  if (mode === "journal") createAPA(journalNeeds);
  if (mode === "book") createAPA(bookNeeds);
});
document.getElementById("reset-button").addEventListener("click", resetForms);
document
  .getElementById("textarea-copy-button")
  .addEventListener("click", copyResult);
document
  .getElementById("textarea-reset-button")
  .addEventListener("click", resetResult);

window.onload = function () {
  $result.innerHTML = localStorage.getItem("apa-result") || "";
  setAccessDateDefault();

  mode = changeMode("web");
};

function setAccessDateDefault() {
  const monthName = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // 現在の日付を取得
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();

  // 閲覧日を今日の日付に設定
  inputData.access.year.value = year;
  inputData.access.month.value = monthName[month];
  inputData.access.day.value = day;
}

function resetForms() {
  document
    .getElementsByName("apa-input-data")
    .forEach((elm) => (elm.value = ""));
  setAccessDateDefault();
}

async function copyResult() {
  const result = new ClipboardItem({
    "text/plain": new Blob([$result.textContent], { type: "text/plain" }),
    "text/html": new Blob([$result.innerHTML], { type: "text/html" }),
  });
  await navigator.clipboard.write([result]);

  alert("Copied!");
}

function resetResult() {
  $result.innerHTML = "";
  localStorage.setItem("apa-result", "");
}

function changeMode(mode) {
  let inputBlocks = {
    web: ["site", "page-name", "access"],
    journal: ["journal", "title", "detail", "volume", "page-count"],
    book: ["publisher", "title", "detail", "edition"],
  };
  inputBlocks[mode] = inputBlocks[mode].map((id) => id + "-block");

  document.getElementsByName("form-block").forEach((block) => {
    if (inputBlocks[mode].includes(block.id)) {
      block.style.setProperty("display", "block");
    } else block.style.setProperty("display", "none");
  });

  const modeButton = {
    web: $webButton,
    journal: $journalButton,
    book: $bookButton,
  };
  document.getElementsByClassName("selected")[0].classList.remove("selected");
  modeButton[mode].classList.add("selected");

  const $authorRequired = document.getElementById("author-required");
  const $urlRequired = document.getElementById("url-required");
  const $publishRequired = document.getElementById("publish-required");
  const $detailRequired = document.getElementById("detail-required");
  const $titleLabel = document.getElementById("title-label");

  if (mode === "web") {
    $authorRequired.style.setProperty("display", "none");
    $urlRequired.style.setProperty("display", "inline");
    $publishRequired.style.setProperty("display", "none");
    inputData.autoGetButton.style.setProperty("display", "inline");
    inputData.publish.month.style.setProperty("display", "inline");
    inputData.publish.day.style.setProperty("display", "inline");
  } else {
    $authorRequired.style.setProperty("display", "inline");
    $urlRequired.style.setProperty("display", "none");
    $publishRequired.style.setProperty("display", "inline");
    inputData.autoGetButton.style.setProperty("display", "none");
    inputData.publish.month.style.setProperty("display", "none");
    inputData.publish.day.style.setProperty("display", "none");
    if (mode === "journal") {
      $detailRequired.style.setProperty("display", "inline");
      $titleLabel.innerHTML = '論文タイトル <span class="required">*</span>';
    }
    if (mode === "book") {
      $detailRequired.style.setProperty("display", "none");
      $titleLabel.innerHTML = '書籍名 <span class="required">*</span>';
    }
  }
  return mode;
}

function createAPA(needs) {
  // 必須事項の確認
  if (needs.filter((need) => !need.value).length) {
    alert("必須事項を入力してください");
    return;
  }

  // 作成年月日をフォーマット
  const getFormatPublish = (year, month, day) => {
    if (year && month && day) return `${year}, ${month}, ${day}`;
    else if (year && month) return `${year}, ${month}`;
    else if (year) return `${year}`;
    else return "n.d.";
  };

  // 共通変数
  let publish = getFormatPublish(
    inputData.publish.year.value,
    inputData.publish.month.value,
    inputData.publish.day.value,
  );
  let author = inputData.author.value || inputData.site.value;
  let begin = `${author} (${publish})`;
  let result;
  let common;
  let url = inputData.url.value;
  let pageName = inputData.pageName.value;
  let site = inputData.site.value;
  let edition = inputData.edition.value;
  let publisherName = inputData.publisher.value;

  // APAスタイル作成
  switch (mode) {
    case "web":
      if (!author) {
        alert("Error: 著者名またはサイト名を入力してください");
        return;
      }
      common =
        `Retrieved ${inputData.access.month.value}, ${inputData.access.day.value}, ${inputData.access.year.value}, from ${url}`;
      if (site == author) result = `${begin}. <i>${pageName}</i>. ${common}`;
      else if (site) {
        result = `${begin}. <i>${pageName}</i>. ${site}. ${common}`;
      } else result = `${begin}. <i>${pageName}</i>. ${common}`;
      break;

    case "journal":
      common =
        `${begin}. ${inputData.title.value}. <i>${inputData.journal.value}, ${inputData.volume.value}</i>, ${inputData.pageCount.value}`;
      if (url) result = `${common}. ${url}`;
      else result = common;
      break;

    case "book":
      common = `${begin}. <i>${inputData.title.value}</i>`;
      if (edition && url) {
        result = `${common}(${edition}). ${publisherName}. ${url}`;
      } else if (edition) result = `${common}(${edition}). ${publisherName}`;
      else if (url) result = `${common}. ${publisherName}. ${url}`;
      else result = `${common}. ${publisherName}`;
      break;

    default:
      alert("Error: モードが無効です");
      return;
  }

  // 作成したものを表示 & ローカルストレージ保存
  if (!result) return;
  result += "<br />";
  $result.innerHTML += result;
  localStorage.setItem("apa-result", $result.innerHTML);
}

async function getDataWithAPI() {
  if (URL.canParse(inputData.url.value)) {
    const res = await fetch(
      `https://web-info-api.onrender.com/api/get-info?url=${inputData.url.value}`,
    );
    const datas = await res.json();
    inputData.site.value = datas.title || "";
    inputData.pageName.value = datas.subtitle || "";
    inputData.author.value = datas.author || "";
    if (datas.creationDate) {
      inputData.publish.year.value = datas.creationDate.split("-")[0];
      inputData.publish.month.value = new Intl.DateTimeFormat("en", {
        month: "long",
      }).format(new Date(datas.creationDate));
      inputData.publish.day.value = datas.creationDate
        .split("-")[2]
        .replace(new RegExp("^0+"), "");
    } else {
      inputData.publish.year.value = "";
      inputData.publish.month.value = "";
      inputData.publish.day.value = "";
    }
  } else {
    alert("有効なURLを入力してください");
  }
}

document
  .getElementById("auto-get-data")
  .addEventListener("click", getDataWithAPI);
