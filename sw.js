const CACHE_NAME = "kits-cache-v1";
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
  "/assets/js/apa.js",
  "/assets/js/pomodoro.js",
  "/assets/js/stopwatch.js",
  "/assets/js/timer.js",
  "/assets/js/todo.js",
  "/assets/js/clock.js",
  "/assets/js/count.js",
  "/assets/js/group.js",
  "/assets/js/charcount.js",
  "/assets/js/tinysegmenter.js",
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
];

// インストール時にキャッシュ
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    }),
  );
});

// フェッチ時にキャッシュを利用（オフライン時対応）
self.addEventListener("fetch", (event) => {
  if (event.request.url.startsWith("https://fonts.googleapis.com")) {
    // Google Fonts はキャッシュに追加
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
        .catch(() => caches.match(event.request)),
    );
  } else {
    event.respondWith(
      caches
        .match(event.request)
        .then((response) => {
          return (
            response ||
            fetch(event.request).then((networkResponse) => {
              return caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse.clone());
                return networkResponse;
              });
            })
          );
        })
        .catch(() => {
          return caches.match("/index.html"); // オフライン時に index.html を表示
        }),
    );
  }
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
