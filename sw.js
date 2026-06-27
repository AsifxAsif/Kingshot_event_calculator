// sw.js - Optimized Service Worker with aggressive caching
const CACHE_NAME = 'kingshot-cache-v3';
const IMAGE_CACHE = 'kingshot-images-v3';
const DATA_CACHE = 'kingshot-data-v3';
// Files to cache on install - critical files only
const FILES_TO_CACHE = ['./', './index.html', './style.css', './js/app.js'];
// Install event - cache critical files
self.addEventListener('install', event => {
	event.waitUntil(caches.open(CACHE_NAME).then(cache => {
		return cache.addAll(FILES_TO_CACHE).catch(error => {
			console.warn('Some files failed to cache:', error);
		});
	}).then(() => self.skipWaiting()));
});
// Activate event - clean old caches and claim clients
self.addEventListener('activate', event => {
	event.waitUntil(Promise.all([
		caches.keys().then(cacheNames => {
			return Promise.all(cacheNames.filter(name => {
				return name !== CACHE_NAME && name !== IMAGE_CACHE && name !== DATA_CACHE;
			}).map(name => caches.delete(name)));
		}),
		self.clients.claim()
	]));
});
// Fetch event - optimized with stale-while-revalidate strategy
self.addEventListener('fetch', event => {
	const url = new URL(event.request.url);
	// Handle image requests - cache first, then network
	if (url.pathname.includes('/assets/')) {
		event.respondWith(caches.open(IMAGE_CACHE).then(cache => {
			return cache.match(event.request).then(response => {
				if (response) return response;
				return fetch(event.request).then(fetchResponse => {
					if (fetchResponse && fetchResponse.status === 200) {
						cache.put(event.request, fetchResponse.clone());
					}
					return fetchResponse;
				});
			});
		}));
		return;
	}
	// Handle JSON data files - cache first, then network
	if (url.pathname.includes('/data/')) {
		event.respondWith(caches.open(DATA_CACHE).then(cache => {
			return cache.match(event.request).then(response => {
				if (response) return response;
				return fetch(event.request).then(fetchResponse => {
					if (fetchResponse && fetchResponse.status === 200) {
						cache.put(event.request, fetchResponse.clone());
					}
					return fetchResponse;
				});
			});
		}));
		return;
	}
	// Default: stale-while-revalidate for HTML, CSS, JS
	event.respondWith(caches.open(CACHE_NAME).then(cache => {
		return cache.match(event.request).then(response => {
			const fetchPromise = fetch(event.request).then(fetchResponse => {
				if (fetchResponse && fetchResponse.status === 200) {
					cache.put(event.request, fetchResponse.clone());
				}
				return fetchResponse;
			});
			return response || fetchPromise;
		});
	}));
});
