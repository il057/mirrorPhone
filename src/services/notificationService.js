// src/services/notificationService.js
import { showToast } from './uiService';

/**
 * 请求用户授权通知
 * @returns {Promise<boolean>} 是否获得授权
 */
export async function requestNotificationPermission() {
        if (!('Notification' in window)) {
                showToast('此浏览器不支持桌面通知', 'error');
                return false;
        }

        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
                return true;
        } else {
                showToast('您已拒绝通知权限', 'info');
                return false;
        }
}

/**
 * 显示一个本地通知
 * @param {string} title - 通知标题
 * @param {string} body - 通知正文
 * @param {string} [url='/'] - 点击通知后打开的URL
 * @returns {Promise<void>}
 */
export async function showLocalNotification(title, body, url = '/') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
                console.warn('Notification permission not granted.');
                return;
        }

        const registration = await navigator.serviceWorker.ready;
        const options = {
                body: body,
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-192x192.png',
                vibrate: [100, 50, 100],
                data: {
                        url: url
                }
        };

        // 使用 Service Worker 来显示通知，这样可以统一处理点击事件
        await registration.showNotification(title, options);
}