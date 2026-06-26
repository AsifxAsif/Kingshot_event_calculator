// sw.js - Service Worker for caching
const CACHE_NAME = 'kingshot-cache-v1';
const IMAGE_CACHE = 'kingshot-images-v1';
// Files to cache on install (critical files only)
const FILES_TO_CACHE = ['/Kingshot_event_calculator/', '/Kingshot_event_calculator/index.html', '/Kingshot_event_calculator/style.css', '/Kingshot_event_calculator/js/app.js'];
// Install event - cache critical files
self.addEventListener('install', event => {
	event.waitUntil(caches.open(CACHE_NAME).then(cache => {
		return cache.addAll(FILES_TO_CACHE).catch(error => {
			console.warn('Some files failed to cache:', error);
			// Continue with what we have
		});
	}).then(() => self.skipWaiting()));
});
// Fetch event - serve from cache if available
self.addEventListener('fetch', event => {
	const url = new URL(event.request.url);
	// Handle image requests separately
	if (url.pathname.includes('/assets/')) {
		event.respondWith(caches.open(IMAGE_CACHE).then(cache => {
			return cache.match(event.request).then(response => {
				return response || fetch(event.request).then(fetchResponse => {
					if (fetchResponse.status === 200) {
						cache.put(event.request, fetchResponse.clone());
					}
					return fetchResponse;
				});
			});
		}));
		return;
	}
	// Handle JSON data files
	if (url.pathname.includes('/data/')) {
		event.respondWith(caches.open(CACHE_NAME).then(cache => {
			return cache.match(event.request).then(response => {
				return response || fetch(event.request).then(fetchResponse => {
					if (fetchResponse.status === 200) {
						cache.put(event.request, fetchResponse.clone());
					}
					return fetchResponse;
				});
			});
		}));
		return;
	}
	// Default: cache then network
	event.respondWith(caches.open(CACHE_NAME).then(cache => {
		return cache.match(event.request).then(response => {
			return response || fetch(event.request).then(fetchResponse => {
				if (fetchResponse.status === 200) {
					cache.put(event.request, fetchResponse.clone());
				}
				return fetchResponse;
			});
		});
	}));
});
// Activate event - clean old caches
self.addEventListener('activate', event => {
	event.waitUntil(caches.keys().then(cacheNames => {
		return Promise.all(cacheNames.filter(name => {
			return name !== CACHE_NAME && name !== IMAGE_CACHE;
		}).map(name => caches.delete(name)));
	}).then(() => self.clients.claim()));
});
