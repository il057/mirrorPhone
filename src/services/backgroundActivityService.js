// src/services/backgroundActivityService.js
import db from './database.js';
import { triggerBackgroundActivity } from './aiChatAPIService.js';

let activityTimer = null;

export async function startBackgroundActivityTimer() {
        if (activityTimer) {
                clearInterval(activityTimer);
        }

        const settings = (await db.globalSettings.get('global'))?.backgroundActivity;
        const interval = settings?.interval || 100000; // 默认100秒

        activityTimer = setInterval(async () => {
                const currentSettings = (await db.globalSettings.get('global'))?.backgroundActivity;
                if (currentSettings?.enabled) {
                        triggerBackgroundActivity();
                }
        }, interval);

        console.log(`Background activity timer started with interval: ${interval}ms`);
}

export function stopBackgroundActivityTimer() {
        if (activityTimer) {
                clearInterval(activityTimer);
                activityTimer = null;
                console.log('Background activity timer stopped.');
        }
}