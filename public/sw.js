// public/sw.js

// Service Worker 安装事件
self.addEventListener('install', event => {
        console.log('Service Worker: Fired install event', event);
        // Fired when the browser installs the service worker.
        // Here we can cache some static assets.
        self.skipWaiting();
});

// Service Worker 激活事件
self.addEventListener('activate', event => {
        console.log('Service Worker: Fired activate event', event);
        // Fired when the service worker is activated.
        // Here we can clean up old caches.
});

// 监听推送事件
self.addEventListener('push', event => {
        console.log('Service Worker: Received push event', event);

        const data = event.data ? event.data.json() : {
                title: '镜',
                body: '你有一条新消息。',
                icon: '/icons/icon-192x192.png'
        };

        const options = {
                body: data.body,
                icon: data.icon,
                badge: '/icons/icon-192x192.png', // Small icon for notification bar
                vibrate: [100, 50, 100],
                data: {
                        url: data.url || '/' // URL to open on click
                }
        };

        event.waitUntil(
                self.registration.showNotification(data.title, options)
        );
});

// 监听通知点击事件
self.addEventListener('notificationclick', event => {
        event.notification.close();
        const urlToOpen = event.notification.data.url || '/';

        event.waitUntil(
                clients.matchAll({
                        type: 'window',
                        includeUncontrolled: true
                }).then(clientList => {
                        if (clientList.length > 0) {
                                // 如果应用已打开，则聚焦到现有窗口
                                return clientList[0].focus();
                        }
                        // 否则，打开新窗口
                        return clients.openWindow(urlToOpen);
                })
        );
});