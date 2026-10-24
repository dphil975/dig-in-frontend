/**
 * Service Worker for Dig In
 * Enables push notifications and background sync
 */

const CACHE_NAME = 'dig-in-v1';
const urlsToCache = [
    '/',
    'recipe-cards-premium.html',
    'barcode-scanner.html',
    'analytics-dashboard.html',
    'analytics-tracker.js',
    'notification-service.js',
    'pairing-intelligence.js'
];

// Install event
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
            .then(() => self.skipWaiting())
    );
});

// Activate event
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request).then(response => {
                    // Clone the response
                    const responseClone = response.clone();

                    // Cache successful responses
                    if (response.status === 200) {
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseClone);
                        });
                    }

                    return response;
                });
            })
            .catch(() => {
                // Offline fallback
                return new Response('Offline - please reconnect', {
                    status: 503,
                    statusText: 'Service Unavailable',
                    headers: new Headers({
                        'Content-Type': 'text/plain'
                    })
                });
            })
    );
});

// Push notification event
self.addEventListener('push', event => {
    const options = {
        body: event.data ? event.data.text() : 'Time to scan your food!',
        icon: '🍽️',
        badge: '🍽️',
        tag: 'meal-reminder',
        requireInteraction: false
    };

    event.waitUntil(
        self.registration.showNotification('Dig In Meal Reminder', options)
    );
});

// Notification click event
self.addEventListener('notificationclick', event => {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(clientList => {
            // Check if app is already open
            for (let client of clientList) {
                if (client.url === '/' && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not open, open it
            if (clients.openWindow) {
                return clients.openWindow('/barcode-scanner.html');
            }
        })
    );
});

// Periodic background sync (for meal reminders)
self.addEventListener('sync', event => {
    if (event.tag === 'meal-reminder-sync') {
        event.waitUntil(
            // Send meal reminder
            self.registration.showNotification('Dig In Meal Time!', {
                body: 'Don\'t forget to scan your meal!',
                icon: '🍽️',
                tag: 'meal-reminder'
            })
        );
    }
});

// Message handling for background tasks
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CHECK_MEAL_TIME') {
        // Check if it's meal time and send notification
        const mealTimes = event.data.mealTimes;
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        Object.entries(mealTimes).forEach(([meal, data]) => {
            if (data.enabled && data.time === currentTime) {
                self.registration.showNotification(`Time for ${meal}!`, {
                    body: 'Scan your meal to track nutrition',
                    icon: '🍽️',
                    tag: `meal-${meal}`,
                    actions: [
                        { action: 'scan', title: '📱 Scan Now' },
                        { action: 'later', title: 'Later' }
                    ]
                });
            }
        });
    }
});
