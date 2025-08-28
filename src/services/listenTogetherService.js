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
                if (!actorId || typeof actorId !== 'string' || actorId.trim() === '') {
                        throw new Error(`无效的 actorId: ${actorId}`);
                }
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
                        isActive: Boolean(true), // 确保是布尔值
                        startTime: Number(Date.now()), // 确保是数字
                        lastUpdateTime: Number(Date.now()) // 确保是数字
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
                if (!actorId || typeof actorId !== 'string') return 0;
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
 * 安全地获取活跃的一起听会话
 * @returns {Array} 活跃会话数组
 */
const getActiveSessionsSafely = async () => {
        try {
                // 首先尝试使用索引查询
                return await db.listenTogetherSessions.where('isActive').equals(true).toArray();
        } catch (indexError) {
                //console.warn('索引查询失败，使用全表扫描:', indexError);
                // 如果索引查询失败，使用全表扫描
                try {
                        const allSessions = await db.listenTogetherSessions.toArray();
                        return allSessions.filter(session => session && session.isActive === true);
                } catch (scanError) {
                        console.error('全表扫描也失败，可能存在数据损坏:', scanError);
                        // 触发数据清理
                        await cleanupCorruptedSessions();
                        return [];
                }
        }
};

/**
 * 结束所有正在进行的一起听会话
 */
export const endAllActiveListenTogetherSessions = async () => {
        try {
                const activeSessions = await getActiveSessionsSafely();
                
                for (const session of activeSessions) {
                        if (session && session.actorId) {
                                await endListenTogetherSession(session.actorId);
                        }
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
                const count = await db.listenTogetherSessions.count();
                if (count === 0) {
                        return null; // 如果表是空的，直接返回 null
                }
                
                const activeSessions = await getActiveSessionsSafely();
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
                if (!actorId || typeof actorId !== 'string') return false;
                const count = await db.listenTogetherSessions.count();
                if (count === 0) {
                        return false; // 如果表是空的，直接返回 false
                }
                
                // 直接通过主键查询，避免使用可能有问题的索引
                const session = await db.listenTogetherSessions.get(actorId);
                return session && session.isActive === true;
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
                // 确保actorId是有效的字符串，防止无效查询
                if (!actorId || typeof actorId !== 'string') {
                        console.warn('获取总一起听时长: actorId无效', actorId);
                        return 0;
                }
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
                
                // 尝试获取所有会话数据，如果失败则清空表
                try {
                        const sessions = await db.listenTogetherSessions.toArray();
                        console.log('当前会话数据:', sessions);
                        
                        // 检查每个会话的数据完整性
                        const validSessions = [];
                        for (const session of sessions) {
                                // 验证会话数据的有效性
                                if (session.id && 
                                    typeof session.actorId === 'string' && 
                                    typeof session.isActive === 'boolean' &&
                                    typeof session.startTime === 'number') {
                                        validSessions.push(session);
                                } else {
                                        console.warn('发现无效会话数据:', session);
                                }
                        }
                        
                        // 如果有无效数据，重建表
                        if (validSessions.length !== sessions.length) {
                                console.log(`重建一起听会话表，保留 ${validSessions.length} 个有效会话`);
                                await db.listenTogetherSessions.clear();
                                if (validSessions.length > 0) {
                                        await db.listenTogetherSessions.bulkPut(validSessions);
                                }
                        }
                } catch (accessError) {
                        console.warn('无法访问会话数据，清空表:', accessError);
                        await db.listenTogetherSessions.clear();
                }
                
                console.log('一起听会话数据清理完成');
                return true;
        } catch (error) {
                console.error('清理一起听会话数据失败:', error);
                return false;
        }
};

/**
 * 调试函数：检查数据库状态
 */
export const debugListenTogetherSessions = async () => {
        try {
                console.log('=== 一起听会话调试信息 ===');
                
                // 检查表计数
                const count = await db.listenTogetherSessions.count();
                console.log('会话总数:', count);
                
                // 尝试获取所有数据
                try {
                        const allSessions = await db.listenTogetherSessions.toArray();
                        console.log('所有会话数据:', allSessions);
                        
                        // 检查每个会话的类型
                        allSessions.forEach((session, index) => {
                                console.log(`会话 ${index}:`, {
                                        id: session.id,
                                        idType: typeof session.id,
                                        actorId: session.actorId,
                                        actorIdType: typeof session.actorId,
                                        isActive: session.isActive,
                                        isActiveType: typeof session.isActive,
                                        startTime: session.startTime,
                                        startTimeType: typeof session.startTime
                                });
                        });
                } catch (arrayError) {
                        console.error('获取所有会话数据失败:', arrayError);
                }
                
                // 尝试使用索引查询
                try {
                        const activeByIndex = await db.listenTogetherSessions.where('isActive').equals(true).toArray();
                        console.log('通过索引查询的活跃会话:', activeByIndex);
                } catch (indexError) {
                        console.error('索引查询失败:', indexError);
                }
                
                console.log('=== 调试信息结束 ===');
        } catch (error) {
                console.error('调试失败:', error);
        }
};