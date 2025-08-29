// src/services/incrementalBackupService.js
import db from './database.js';
import { syncToGist } from './gistService.js';
import { syncToNutstore } from './nutstoreService.js';
import { showToast } from './uiService.js';

/**
 * 增量备份服务
 * 跟踪数据变更并提供智能备份功能
 */

// 本地存储键名
const BACKUP_STATE_KEY = 'mirrorPhone_backupState';
const AUTO_BACKUP_SETTINGS_KEY = 'mirrorPhone_autoBackupSettings';

/**
 * 获取增量备份状态
 */
export function getBackupState() {
        const stored = localStorage.getItem(BACKUP_STATE_KEY);
        if (stored) {
                try {
                        return JSON.parse(stored);
                } catch {
                        return createDefaultBackupState();
                }
        }
        return createDefaultBackupState();
}

/**
 * 创建默认备份状态
 */
function createDefaultBackupState() {
        return {
                lastFullBackup: null,
                lastIncrementalBackup: null,
                tableLastModified: {},
                changeCount: 0,
                backupVersion: 1
        };
}

/**
 * 保存备份状态
 */
function saveBackupState(state) {
        localStorage.setItem(BACKUP_STATE_KEY, JSON.stringify(state));
}

/**
 * 获取自动备份设置
 */
export function getAutoBackupSettings() {
        const stored = localStorage.getItem(AUTO_BACKUP_SETTINGS_KEY);
        if (stored) {
                try {
                        return JSON.parse(stored);
                } catch {
                        return createDefaultAutoBackupSettings();
                }
        }
        return createDefaultAutoBackupSettings();
}

/**
 * 创建默认自动备份设置
 */
function createDefaultAutoBackupSettings() {
        return {
                enabled: false,
                interval: 24 * 60 * 60 * 1000, // 24小时
                maxChanges: 50, // 达到50个变更时自动备份
                lastAutoBackup: null
        };
}

/**
 * 保存自动备份设置
 */
export function saveAutoBackupSettings(settings) {
        localStorage.setItem(AUTO_BACKUP_SETTINGS_KEY, JSON.stringify(settings));
}

/**
 * 记录表的修改
 */
export function recordTableModification(tableName) {
        const state = getBackupState();
        const now = Date.now();
        
        state.tableLastModified[tableName] = now;
        state.changeCount += 1;
        
        saveBackupState(state);
        
        // 检查是否需要自动备份
        checkAutoBackup();
}

/**
 * 检查是否需要自动备份
 */
async function checkAutoBackup() {
        const settings = getAutoBackupSettings();
        if (!settings.enabled) return;
        
        const state = getBackupState();
        const now = Date.now();
        
        // 检查是否达到变更阈值或时间间隔
        const changeThresholdReached = state.changeCount >= settings.maxChanges;
        const timeThresholdReached = settings.lastAutoBackup && 
                (now - settings.lastAutoBackup) >= settings.interval;
        
        if (changeThresholdReached || timeThresholdReached) {
                try {
                        await performAutoBackup();
                } catch (error) {
                        console.error('自动备份失败:', error);
                        // 不显示错误提示，避免干扰用户
                }
        }
}

/**
 * 执行自动备份
 */
async function performAutoBackup() {
        const globalSettings = await db.globalSettings.get('global');
        if (!globalSettings) {
                return; // 无法获取全局设置
        }

        // 检查是否有有效的同步配置
        const syncServiceType = globalSettings.syncServiceType || 'github';
        let canSync = false;

        if (syncServiceType === 'github') {
                canSync = globalSettings.githubToken && globalSettings.githubToken.trim() !== '';
        } else if (syncServiceType === 'nutstore') {
                canSync = globalSettings.nutstoreEmail && globalSettings.nutstoreEmail.trim() !== '' &&
                         globalSettings.nutstoreToken && globalSettings.nutstoreToken.trim() !== '';
        }

        if (!canSync) {
                return; // 没有配置有效的同步服务，无法自动备份
        }
        
        try {
                if (syncServiceType === 'github') {
                        await syncToGist(globalSettings.githubToken, globalSettings.githubGistId);
                } else if (syncServiceType === 'nutstore') {
                        await syncToNutstore(globalSettings.nutstoreEmail, globalSettings.nutstoreToken, globalSettings.nutstorePath);
                }
                
                // 更新备份状态
                const state = getBackupState();
                const settings = getAutoBackupSettings();
                const now = Date.now();
                
                state.lastFullBackup = now;
                state.changeCount = 0;
                settings.lastAutoBackup = now;
                
                saveBackupState(state);
                saveAutoBackupSettings(settings);
                
                console.log('自动备份完成');
                showToast('数据已自动备份到云端', 'success');
        } catch (error) {
                console.error('自动备份失败:', error);
                throw error;
        }
}

/**
 * 手动触发增量备份
 */
export async function performIncrementalBackup() {
        const state = getBackupState();
        const changedTables = getChangedTablesSinceLastBackup();
        
        if (changedTables.length === 0) {
                showToast('没有检测到数据变更', 'info');
                return;
        }
        
        const globalSettings = await db.globalSettings.get('global');
        if (!globalSettings) {
                throw new Error('无法获取全局设置');
        }

        // 检查是否有有效的同步配置
        const syncServiceType = globalSettings.syncServiceType || 'github';
        let canSync = false;

        if (syncServiceType === 'github') {
                canSync = globalSettings.githubToken && globalSettings.githubToken.trim() !== '';
        } else if (syncServiceType === 'nutstore') {
                canSync = globalSettings.nutstoreEmail && globalSettings.nutstoreEmail.trim() !== '' &&
                         globalSettings.nutstoreToken && globalSettings.nutstoreToken.trim() !== '';
        }

        if (!canSync) {
                const serviceName = syncServiceType === 'github' ? 'GitHub Token' : '坚果云邮箱和Access Token';
                throw new Error(`请先配置 ${serviceName}`);
        }
        
        try {
                // 执行完整备份（因为增量备份需要更复杂的合并逻辑）
                if (syncServiceType === 'github') {
                        await syncToGist(globalSettings.githubToken, globalSettings.githubGistId);
                } else if (syncServiceType === 'nutstore') {
                        await syncToNutstore(globalSettings.nutstoreEmail, globalSettings.nutstoreToken, globalSettings.nutstorePath);
                }
                
                // 更新状态
                const now = Date.now();
                state.lastIncrementalBackup = now;
                state.changeCount = 0;
                
                saveBackupState(state);
                
                showToast(`已备份 ${changedTables.length} 个已变更的表`, 'success');
        } catch (error) {
                console.error('增量备份失败:', error);
                throw error;
        }
}

/**
 * 获取自上次备份以来变更的表
 */
function getChangedTablesSinceLastBackup() {
        const state = getBackupState();
        const lastBackup = state.lastFullBackup || state.lastIncrementalBackup || 0;
        
        return Object.entries(state.tableLastModified)
                .filter(([_, timestamp]) => timestamp > lastBackup)
                .map(([tableName, _]) => tableName);
}

/**
 * 获取备份统计信息
 */
export function getBackupStats() {
        const state = getBackupState();
        const settings = getAutoBackupSettings();
        const changedTables = getChangedTablesSinceLastBackup();
        
        return {
                lastFullBackup: state.lastFullBackup,
                lastIncrementalBackup: state.lastIncrementalBackup,
                changeCount: state.changeCount,
                changedTablesCount: changedTables.length,
                autoBackupEnabled: settings.enabled,
                lastAutoBackup: settings.lastAutoBackup,
                nextAutoBackup: settings.enabled && settings.lastAutoBackup ? 
                        settings.lastAutoBackup + settings.interval : null
        };
}

/**
 * 重置备份状态
 */
export function resetBackupState() {
        const state = createDefaultBackupState();
        saveBackupState(state);
}

// 监听数据库操作，自动记录变更
// 这需要在应用启动时调用
export function initializeBackupTracking() {
        // 重写数据库操作方法来跟踪变更
        const originalMethods = {};
        const tableNames = [
                'actors', 'groups', 'conversations', 'events', 'relationships', 
                'memories', 'globalSettings', 'apiProfiles', 'ttsProfiles',
                'homeScreenLayout', 'fonts', 'globalAlbum', 'listenTogetherSessions',
                'widgetSettings', 'stickers', 'worldbooks', 'worldbookGroups', 'favorites'
        ];
        
        tableNames.forEach(tableName => {
                const table = db[tableName];
                if (!table) return;
                
                // 包装 add, put, delete, clear 方法
                ['add', 'put', 'delete', 'clear', 'bulkAdd', 'bulkPut', 'bulkDelete'].forEach(methodName => {
                        const originalMethod = table[methodName];
                        if (typeof originalMethod === 'function') {
                                table[methodName] = function(...args) {
                                        const result = originalMethod.apply(this, args);
                                        
                                        // 异步记录变更
                                        if (result && typeof result.then === 'function') {
                                                result.then(() => {
                                                        recordTableModification(tableName);
                                                }).catch(() => {
                                                        // 操作失败时不记录变更
                                                });
                                        } else {
                                                recordTableModification(tableName);
                                        }
                                        
                                        return result;
                                };
                        }
                });
        });
}
