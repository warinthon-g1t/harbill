// Service worker: เก็บไฟล์ของแอปไว้ในเครื่อง เพื่อให้เปิดได้แม้ไม่มีอินเทอร์เน็ต
// เมื่อแก้ไฟล์ใด ๆ แล้ว push ขึ้นไปใหม่ ให้เปลี่ยนเลขเวอร์ชันด้านล่าง (เช่น v2 → v3)
const CACHE = 'harbill-v1';

const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './fonts/fonts.css',
  './fonts/manrope-latin-300-normal.woff2',
  './fonts/manrope-latin-400-normal.woff2',
  './fonts/manrope-latin-500-normal.woff2',
  './fonts/manrope-latin-600-normal.woff2',
  './fonts/noto-sans-thai-thai-300-normal.woff2',
  './fonts/noto-sans-thai-thai-400-normal.woff2',
  './fonts/noto-sans-thai-thai-500-normal.woff2',
  './fonts/noto-sans-thai-thai-600-normal.woff2',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-64.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ใช้ไฟล์ในเครื่องก่อน (เร็ว + ออฟไลน์ได้) แล้วค่อยอัปเดตจากเน็ตเบื้องหลัง
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const key = req.mode === 'navigate' ? './index.html' : req;
      const cached = await cache.match(key, { ignoreSearch: true });
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) cache.put(key, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
