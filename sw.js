const CACHE_NAME = "kits-cache-v4"; // バージョン変更（キャッシュの更新を確実にする）
const urlsToCache = [
  "/",
  "/index.html",
  "/assets/favicon/android-chrome-192x192.png",
  "/assets/favicon/android-chrome-512x512.png",
  "/assets/favicon/favicon.ico",
  "/apa.html",
  "/clock.html",
  "/count.html",
  "/group.html",
  "/kundoku.html",
  "/pomodoro.html",
  "/stopwatch.html",
  "/timer.html",
  "/todo.html",
  "/charcount.html",
  "/conversion.html",
  "/assets/css/apa.css",
  "/assets/css/base.css",
  "/assets/css/button.css",
  "/assets/css/clock.css",
  "/assets/css/count.css",
  "/assets/css/group.css",
  "/assets/css/index.css",
  "/assets/css/reset.css",
  "/assets/css/stopwatch.css",
  "/assets/css/timer.css",
  "/assets/css/todo.css",
  "/assets/css/kundoku.css",
  "/assets/css/pomodoro.css",
  "/assets/css/charcount.css",
  "/assets/css/conversion.css",
  "/assets/js/apa.js",
  "/assets/js/pomodoro.js",
  "/assets/js/stopwatch.js",
  "/assets/js/timer.js",
  "/assets/js/todo.js",
  "/assets/js/clock.js",
  "/assets/js/count.js",
  "/assets/js/group.js",
  "/assets/js/charcount.js",
  "/assets/js/conversion.js",
  "/assets/sounds/alerm.mp3",
  "/assets/images/apa.svg",
  "/assets/images/calculator.svg",
  "/assets/images/clock.svg",
  "/assets/images/count.svg",
  "/assets/images/group.svg",
  "/assets/images/kundoku.svg",
  "/assets/images/logo.svg",
  "/assets/images/memo.svg",
  "/assets/images/number.svg",
  "/assets/images/plus.svg",
  "/assets/images/pomodoro.svg",
  "/assets/images/stopwatch.svg",
  "/assets/images/timer.svg",
  "/assets/images/todo.svg",
  "/assets/images/vertical.svg",
  "/assets/images/charcount.svg",
  "/assets/images/conversion.svg",
];

// インストール時にキャッシュ
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    }),
  );
});

// フェッチ時の処理（Google Fonts は別対応）
self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // Google Fonts のキャッシュ処理
  if (
    url.startsWith("https://fonts.googleapis.com") ||
    url.startsWith("https://fonts.gstatic.com")
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return fetch(event.request)
          .then((response) => {
            cache.put(event.request, response.clone()); // キャッシュに保存
            return response;
          })
          .catch(() => caches.match(event.request)); // オフライン時はキャッシュを利用
      }),
    );
    return;
  }

  // 一般リソースはネットワーク優先
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
      .catch(() => caches.match(event.request))
      .catch(() => caches.match("/index.html")),
  );
});

// 古いキャッシュを削除
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        }),
      );
    }),
  );
});
