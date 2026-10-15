// 选品记录页 - 离线缓存 Service Worker
// 策略：优先走网络（4 秒超时），超时或失败则用本地缓存。
// 这样联网时永远拿到最新版，没信号时也能秒开记录。
var VERSION = 'v1';
var CACHE = 'ywxp-' + VERSION;
var PAGE = './s-7b71dd3a3cadb5d9.html';
var ASSETS = [
  PAGE,
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(ASSETS.map(function (u) {
      return c.add(u)['catch'](function () {});
    }));
  }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.map(function (k) {
      if (k !== CACHE) { return caches.delete(k); }
      return null;
    }));
  }).then(function () {
    return self.clients.claim();
  }));
});

function fromCache(req) {
  return caches.match(req).then(function (hit) {
    if (hit) { return hit; }
    if (req.mode === 'navigate') { return caches.match(PAGE); }
    return new Response('', { status: 504, statusText: 'offline' });
  });
}

function timeout(ms) {
  return new Promise(function (resolve) {
    setTimeout(function () { resolve(null); }, ms);
  });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') { return; }
  var u;
  try { u = new URL(req.url); } catch (err) { return; }
  if (u.origin !== self.location.origin) { return; }
  var net = fetch(req).then(function (res) {
    if (res && res.status === 200 && res.type === 'basic') {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(req, copy); });
    }
    return res;
  });
  e.respondWith(
    Promise.race([net, timeout(4000)]).then(function (res) {
      if (res) { return res; }
      return fromCache(req);
    })['catch'](function () {
      return fromCache(req);
    })
  );
});