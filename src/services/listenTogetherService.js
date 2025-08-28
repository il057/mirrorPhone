/**
 * 一起听音乐服务
 * 管理一起听音乐的状态和计时逻辑
 */

import db from './database.js';
import spotifyService from './spotifyService.js';

/**
 * 开始一起听会话
 * @param {string} actorId - 角色ID
 */
export const startListenTogetherSession = async (actorId) => {
        try {
                // 确保只有一个活跃会话：结束其他正在进行的一起听会话
                await endAllActiveListenTogetherSessions();
                
                // 清理可能存在的旧会话数据
                try {
                        await db.listenTogetherSessions.delete(actorId);
                } catch (deleteError) {
                        console.warn('清理旧会话数据时出错:', deleteError);
                }
                
                const session = {
                        id: String(actorId), // 确保ID是字符串
                        actorId: String(actorId),
                        isActive: true,
                        startTime: Date.now(),
                        lastUpdateTime: Date.now()
                };
                
                await db.listenTogetherSessions.put(session);
                console.log('一起听会话已开始:', session);
                
                return session;
        } catch (error) {
                console.error('开始一起听会话失败:', error);
                throw error;
        }
};

/**
 * 结束一起听会话
 * @param {string} actorId - 角色ID
 */
export const endListenTogetherSession = async (actorId) => {
        try {
                const session = await db.listenTogetherSessions.get(actorId);
                if (session && session.isActive) {
                        // 计算本次会话时长
                        const duration = Date.now() - session.startTime;
                        
                        // 更新角色的总一起听时长
                        const actor = await db.actors.get(actorId);
                        if (actor) {
                                const currentTotal = actor.listenTogetherTotalDuration || 0;
                                await db.actors.update(actorId, {
                                        listenTogetherTotalDuration: currentTotal + duration
                                });
                        }
                        
                        // 删除会话记录
                        await db.listenTogetherSessions.delete(actorId);
                        
                        console.log(`一起听会话已结束，本次时长: ${Math.floor(duration / 1000)}秒`);
                        return duration;
                }
                return 0;
        } catch (error) {
                console.error('结束一起听会话失败:', error);
                throw error;
        }
};

/**
 * 结束所有正在进行的一起听会话
 */
export const endAllActiveListenTogetherSessions = async () => {
        try {
                const activeSessions = await db.listenTogetherSessions.where('isActive').equals(true).toArray();
                
                for (const session of activeSessions) {
                        await endListenTogetherSession(session.actorId);
                }
        } catch (error) {
                console.error('结束所有一起听会话失败:', error);
        }
};

/**
 * 获取当前一起听会话
 * @returns {Object|null} 当前活跃的一起听会话
 */
export const getCurrentListenTogetherSession = async () => {
        try {
                const activeSessions = await db.listenTogetherSessions.where('isActive').equals(true).toArray();
                return activeSessions.length > 0 ? activeSessions[0] : null;
        } catch (error) {
                console.error('获取当前一起听会话失败:', error);
                return null;
        }
};

/**
 * 检查是否与指定角色正在一起听
 * @param {string} actorId - 角色ID
 * @returns {boolean} 是否正在一起听
 */
export const isListeningTogetherWith = async (actorId) => {
        try {
                const session = await db.listenTogetherSessions.get(actorId);
                return session && session.isActive;
        } catch (error) {
                console.error('检查一起听状态失败:', error);
                return false;
        }
};

/**
 * 获取角色的总一起听时长
 * @param {string} actorId - 角色ID
 * @returns {number} 总时长（毫秒）
 */
export const getTotalListenTogetherDuration = async (actorId) => {
        try {
                const actor = await db.actors.get(actorId);
                return actor?.listenTogetherTotalDuration || 0;
        } catch (error) {
                console.error('获取总一起听时长失败:', error);
                return 0;
        }
};

/**
 * 获取当前会话的时长
 * @param {string} actorId - 角色ID
 * @returns {number} 当前会话时长（毫秒）
 */
export const getCurrentSessionDuration = async (actorId) => {
        try {
                const session = await db.listenTogetherSessions.get(actorId);
                if (session && session.isActive) {
                        return Date.now() - session.startTime;
                }
                return 0;
        } catch (error) {
                console.error('获取当前会话时长失败:', error);
                return 0;
        }
};

/**
 * 测试一起听功能
 * @param {string} actorId - 测试用的角色ID
 */
export const testListenTogetherFeature = async (actorId = 'test_actor') => {
        try {
                console.log('开始测试一起听功能...');
                
                // 清理现有会话
                await cleanupCorruptedSessions();
                
                // 测试开始会话
                console.log('测试开始会话...');
                const session = await startListenTogetherSession(actorId);
                console.log('✓ 开始会话成功:', session);
                
                // 测试检查状态
                console.log('测试检查状态...');
                const isActive = await isListeningTogetherWith(actorId);
                console.log('✓ 状态检查成功:', isActive);
                
                // 测试结束会话
                console.log('测试结束会话...');
                const duration = await endListenTogetherSession(actorId);
                console.log('✓ 结束会话成功，时长:', duration);
                
                console.log('✓ 一起听功能测试全部通过！');
                return true;
                
        } catch (error) {
                console.error('✗ 一起听功能测试失败:', error);
                return false;
        }
};

/**
 * 获取当前一起听会话的实时总时长
 * @param {string} actorId - 角色ID
 * @returns {number} 总时长（毫秒），包括当前会话
 */
export const getTotalListenTogetherDurationWithCurrent = async (actorId) => {
        try {
                // 确保actorId是有效的字符串
                if (!actorId || typeof actorId !== 'string') {
                        console.warn('获取总一起听时长: actorId无效', actorId);
                        return 0;
                }
                
                const actor = await db.actors.get(String(actorId));
                const historicalDuration = actor?.listenTogetherTotalDuration || 0;
                
                // 检查是否有正在进行的会话
                const session = await db.listenTogetherSessions.get(String(actorId));
                if (session && session.isActive) {
                        const currentSessionDuration = Date.now() - session.startTime;
                        return historicalDuration + currentSessionDuration;
                }
                
                return historicalDuration;
        } catch (error) {
                console.error('获取总一起听时长失败:', error);
                return 0;
        }
};

/**
 * 获取当前一起听会话信息（包括角色名称）
 * @returns {Object|null} 会话信息
 */
export const getCurrentListenTogetherSessionInfo = async () => {
        try {
                const session = await getCurrentListenTogetherSession();
                if (!session) return null;
                
                const actor = await db.actors.get(session.actorId);
                return {
                        ...session,
                        partner: actor?.name || '未知角色',
                        partnerId: session.actorId
                };
        } catch (error) {
                console.error('获取一起听会话信息失败:', error);
                return null;
        }
};

/**
 * 清理损坏的一起听会话数据
 */
export const cleanupCorruptedSessions = async () => {
        try {
                console.log('清理损坏的一起听会话数据...');
                
                // 检查并修复损坏的会话数据
                const sessions = await db.listenTogetherSessions.toArray();
                let cleanedCount = 0;
                
                for (const session of sessions) {
                        let needsUpdate = false;
                        const cleanSession = { ...session };
                        
                        // 确保基本字段存在和类型正确
                        if (!cleanSession.id || typeof cleanSession.id !== 'string') {
                                await db.listenTogetherSessions.delete(session.id);
                                cleanedCount++;
                                continue;
                        }
                        
                        if (!cleanSession.actorId || typeof cleanSession.actorId !== 'string') {
                                cleanSession.actorId = String(cleanSession.id);
                                needsUpdate = true;
                        }
                        
                        if (typeof cleanSession.isActive !== 'boolean') {
                                cleanSession.isActive = false;
                                needsUpdate = true;
                        }
                        
                        if (!cleanSession.startTime || typeof cleanSession.startTime !== 'number') {
                                cleanSession.startTime = Date.now();
                                needsUpdate = true;
                        }
                        
                        if (!cleanSession.lastUpdateTime || typeof cleanSession.lastUpdateTime !== 'number') {
                                cleanSession.lastUpdateTime = Date.now();
                                needsUpdate = true;
                        }
                        
                        // 删除已移除的字段
                        if (cleanSession.hasOwnProperty('playlistInfo')) {
                                delete cleanSession.playlistInfo;
                                needsUpdate = true;
                        }
                        
                        if (cleanSession.hasOwnProperty('currentTrack')) {
                                delete cleanSession.currentTrack;
                                needsUpdate = true;
                        }
                        
                        if (needsUpdate) {
                                await db.listenTogetherSessions.put(cleanSession);
                                cleanedCount++;
                        }
                }
                
                console.log(`一起听会话数据清理完成，修复了 ${cleanedCount} 条记录`);
                return true;
        } catch (error) {
                console.error('清理一起听会话数据失败:', error);
                // 如果清理失败，尝试完全重置表
                try {
                        await db.listenTogetherSessions.clear();
                        console.log('已重置一起听会话表');
                        return true;
                } catch (resetError) {
                        console.error('重置一起听会话表失败:', resetError);
                        return false;
                }
        }
};
