// src/services/backgroundActivityService.js
import db from './database.js';
import { triggerBackgroundActivity, generateOfflineSummary } from './aiChatAPIService.js';

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
                // 检查并触发离线总结
                if (currentSettings?.personalSettings?.offlineSimulation?.enabled) {
                        await checkAndTriggerOfflineSummaries(currentSettings.personalSettings.offlineSimulation);
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
async function checkAndTriggerOfflineSummaries(offlineSettings) {
        const intervalMillis = (offlineSettings.intervalHours || 24) * 60 * 60 * 1000;
        const groupsToSummarize = await db.groups.where('offlineSummaryEnabled').equals(1).toArray();

        for (const group of groupsToSummarize) {
                const lastSummary = await db.offlineSummaries
                        .where('groupId').equals(group.id)
                        .last();

                const lastSummaryTime = lastSummary ? lastSummary.timestamp : 0;
                const now = Date.now();

                if (now - lastSummaryTime > intervalMillis) {
                        console.log(`Triggering offline summary for group: ${group.name}`);
                        try {
                                // 调用AI服务生成总结，带进度回调
                                await generateOfflineSummary(group.id, {
                                        onProgress: (message) => {
                                                console.log(`[Background] ${group.name}: ${message}`);
                                        }
                                });
                        } catch (error) {
                                console.error(`Failed to generate offline summary for group ${group.name}:`, error);
                                // 记录失败，但继续处理其他分组
                        }
                }
        }
}