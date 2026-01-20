const CACHE_NAME = 'zen-terminal-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './manifest.json',
    './js/main.js',
    './js/terminal.js',
    './js/state.js',
    './js/auth.js',
    './js/theme.js',
    './js/focus.js',
    './js/break.js',
    './js/input-manager.js',
    './js/command-registry.js',
    './js/commands-logic.js',
    './js/commands.js',
    './js/audio.js',
    './js/firebase-config.js',
    // External libraries (cache them so they work offline)
    'https://cdn.jsdelivr.net/npm/xterm@5.1.0/css/xterm.css',
    'https://cdn.jsdelivr.net/npm/xterm@5.1.0/lib/xterm.js',
    'https://cdn.jsdelivr.net/npm/xterm-addon-fit@0.7.0/lib/xterm-addon-fit.js'
];

// 1. Install Service Worker & Cache Assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// 2. Serve from Cache (Offline Support)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            // Return cached response if found, else fetch from network
            return response || fetch(event.request);
        })
    );
});

// 3. Update Service Worker (Cleanup old caches)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(
                keyList.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
});
