// トップへ戻るボタン
const toTop = document.getElementById("to-top");
if (toTop) {
  window.addEventListener("scroll", () => {
    toTop.style.display = window.scrollY > 200 ? "flex" : "none";
  });
  toTop.addEventListener(
    "click",
    () => window.scrollTo({ top: 0, behavior: "smooth" }),
  );
}

// サイドバー切り替え処理
const menuCheckbox = document.getElementById("menu");
const sidebar = document.getElementById("sidebar");
const content = document.getElementById("content");
// 初回チェックで状態反映
const handleSidebarToggle = () => {
  if (menuCheckbox && sidebar && content) {
    if (menuCheckbox.checked) {
      sidebar.classList.add("visible");
      sidebar.classList.remove("hidden");
      content.classList.remove("fullwidth");
    } else {
      sidebar.classList.remove("visible");
      sidebar.classList.add("hidden");
      content.classList.add("fullwidth");
    }
  }
};

// イベント設定
if (menuCheckbox) {
  menuCheckbox.addEventListener("change", handleSidebarToggle);
}

// 読み込み時にも適用
handleSidebarToggle();

// Theme toggle functionality
const themeToggle = document.getElementById("theme-toggle");

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    // Toggle between dark and light mode
    // When data-theme attribute is removed, the page uses default light mode styles
    if (currentTheme === "dark") {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    }
  });
}
