import db from './database.js';

/**
 * 收藏服务
 * 管理用户的收藏功能
 */

/**
 * 添加收藏
 * @param {Object} messageOrParams - 消息对象或收藏参数
 * @returns {Promise<number>} 收藏ID
 */
export async function addToFavorites(messageOrParams) {
        try {
                let favoriteData;
                
                // 判断是消息对象还是参数对象
                if (messageOrParams.id && messageOrParams.timestamp && messageOrParams.actorId) {
                        // 消息对象
                        const message = messageOrParams;
                        
                        // 获取作者信息
                        let authorName = '未知用户';
                        if (message.actorId === '__USER__') {
                                authorName = '你';
                        } else if (message.actorId === 'system') {
                                authorName = '系统';
                        } else {
                                // 从数据库获取角色名称
                                try {
                                        const actor = await db.actors.get(message.actorId);
                                        authorName = actor?.name || message.actorId;
                                } catch (e) {
                                        authorName = message.actorId;
                                }
                        }
                        
                        favoriteData = {
                                eventId: message.id || message.timestamp, // 使用timestamp作为备用ID
                                eventType: 'message',
                                authorId: message.actorId,
                                authorName: authorName,
                                content: {
                                        text: getMessageText(message.content),
                                        type: message.content?.type || 'text',
                                        originalContent: message.content
                                },
                                createTime: Date.now()
                        };
                } else {
                        // 参数对象
                        const { eventId, eventType, authorId, authorName, content, timestamp } = messageOrParams;
                        favoriteData = {
                                eventId,
                                eventType,
                                authorId,
                                authorName,
                                content,
                                createTime: timestamp || Date.now() // 使用传入的timestamp或当前时间
                        };
                }
                
                // 检查是否已经收藏
                const existing = await db.favorites
                        .where('eventId')
                        .equals(favoriteData.eventId)
                        .first();
                
                if (existing) {
                        throw new Error('已经收藏过了');
                }

                const favoriteId = await db.favorites.add(favoriteData);
                return favoriteId;
        } catch (error) {
                console.error('添加收藏失败:', error);
                throw error;
        }
}

/**
 * 从消息内容中提取文本
 * @param {Object} content - 消息内容
 * @returns {string} 文本内容
 */
function getMessageText(content) {
        if (!content) return '';
        
        switch (content.type) {
                case 'text':
                        return content.content || '';
                case 'sticker':
                        return `[表情包: ${content.name || '表情'}]`;
                case 'image':
                        if (content.subtype === 'text') {
                                return `[图片描述: ${content.description || '图片'}]`;
                        }
                        return `[图片: ${content.fileName || '图片'}]`;
                case 'voice':
                        return `[语音消息: ${content.text || '语音'}]`;
                case 'payment':
                        const paymentType = content.subtype === 'transfer' ? '转账' : '代付';
                        return `[${paymentType}: ¥${content.amount || 0}]`;
                case 'music-card':
                        const song = content.song || {};
                        return `[音乐分享: ${song.name || '歌曲'}]`;
                case 'call':
                        const callType = content.callType === 'voice' ? '语音' : '视频';
                        return `[${callType}通话邀请]`;
                case 'pat':
                        return `[拍一拍: ${content.message || '拍了拍'}]`;
                case 'system':
                        return content.content || '[系统消息]';
                default:
                        return content.content || content.text || '[消息]';
        }
}

/**
 * 移除收藏
 * @param {number} eventId - 事件ID
 * @param {string} eventType - 事件类型（可选，用于特殊处理）
 * @returns {Promise<void>}
 */
export async function removeFromFavorites(eventId, eventType = null) {
        try {
                // 对于批量收藏（type为batch），直接删除该条收藏记录
                // 不删除原本的event消息
                if (eventType === 'message_batch') {
                        await db.favorites
                                .where('eventId')
                                .equals(eventId)
                                .and(item => item.eventType === 'message_batch')
                                .delete();
                        console.log('已删除批量收藏记录，原消息保持不变');
                } else {
                        await db.favorites
                                .where('eventId')
                                .equals(eventId)
                                .delete();
                }
        } catch (error) {
                console.error('移除收藏失败:', error);
                throw error;
        }
}

/**
 * 检查是否已收藏
 * @param {number} eventId - 事件ID
 * @returns {Promise<boolean>}
 */
export async function isFavorited(eventId) {
        try {
                const favorite = await db.favorites
                        .where('eventId')
                        .equals(eventId)
                        .first();
                
                return !!favorite;
        } catch (error) {
                console.error('检查收藏状态失败:', error);
                return false;
        }
}

/**
 * 获取收藏列表
 * @param {Object} filters - 过滤条件
 * @param {string} [filters.authorId] - 按作者ID过滤
 * @param {string} [filters.eventType] - 按事件类型过滤
 * @param {number} [filters.limit] - 限制数量
 * @param {number} [filters.offset] - 偏移量
 * @returns {Promise<Array>} 收藏列表
 */
export async function getFavorites(filters = {}) {
        try {
                let query = db.favorites.orderBy('createTime').reverse();

                // 应用过滤条件
                if (filters.authorId && filters.eventType) {
                        query = db.favorites
                                .where('[authorId+eventType]')
                                .equals([filters.authorId, filters.eventType])
                                .reverse();
                } else if (filters.authorId) {
                        query = db.favorites
                                .where('authorId')
                                .equals(filters.authorId)
                                .reverse();
                } else if (filters.eventType) {
                        query = db.favorites
                                .where('eventType')
                                .equals(filters.eventType)
                                .reverse();
                }

                // 应用分页
                if (filters.offset) {
                        query = query.offset(filters.offset);
                }
                
                if (filters.limit) {
                        query = query.limit(filters.limit);
                }

                const favorites = await query.toArray();
                
                // 获取原始事件数据，添加时间戳信息
                const enrichedFavorites = await Promise.all(
                        favorites.map(async (favorite) => {
                                try {
                                        const originalEvent = await db.events.get(favorite.eventId);
                                        return {
                                                ...favorite,
                                                timestamp: originalEvent?.timestamp || favorite.createTime
                                        };
                                } catch (error) {
                                        console.warn(`无法获取事件 ${favorite.eventId} 的详细信息:`, error);
                                        return {
                                                ...favorite,
                                                timestamp: favorite.createTime
                                        };
                                }
                        })
                );

                return enrichedFavorites;
        } catch (error) {
                console.error('获取收藏列表失败:', error);
                return [];
        }
}

/**
 * 获取收藏统计信息
 * @returns {Promise<Object>} 统计信息
 */
export async function getFavoritesStats() {
        try {
                const total = await db.favorites.count();
                
                // 按类型统计
                const byType = {};
                const allFavorites = await db.favorites.toArray();
                
                allFavorites.forEach(fav => {
                        byType[fav.eventType] = (byType[fav.eventType] || 0) + 1;
                });

                // 按作者统计
                const byAuthor = {};
                allFavorites.forEach(fav => {
                        byAuthor[fav.authorId] = (byAuthor[fav.authorId] || 0) + 1;
                });

                return {
                        total,
                        byType,
                        byAuthor
                };
        } catch (error) {
                console.error('获取收藏统计失败:', error);
                return { total: 0, byType: {}, byAuthor: {} };
        }
}

/**
 * 删除指定作者的所有收藏
 * @param {string} authorId - 作者ID
 * @returns {Promise<void>}
 */
export async function deleteFavoritesByAuthor(authorId) {
        try {
                await db.favorites
                        .where('authorId')
                        .equals(authorId)
                        .delete();
                
                console.log(`已删除作者 ${authorId} 的所有收藏`);
        } catch (error) {
                console.error('删除作者收藏失败:', error);
                throw error;
        }
}

/**
 * 批量删除收藏
 * @param {Array<string>} eventIds - 事件ID数组
 * @returns {Promise<number>} 删除的数量
 */
export async function removeBatchFromFavorites(eventIds) {
        try {
                const deleteCount = await db.favorites
                        .where('eventId')
                        .anyOf(eventIds)
                        .delete();
                
                console.log(`批量删除了 ${deleteCount} 条收藏`);
                return deleteCount;
        } catch (error) {
                console.error('批量删除收藏失败:', error);
                throw error;
        }
}

/**
 * 切换收藏状态
 * @param {Object} params - 参数
 * @returns {Promise<boolean>} 返回新的收藏状态
 */
export async function toggleFavorite(params) {
        try {
                const isCurrentlyFavorited = await isFavorited(params.eventId);
                
                if (isCurrentlyFavorited) {
                        await removeFromFavorites(params.eventId);
                        return false;
                } else {
                        await addToFavorites(params);
                        return true;
                }
        } catch (error) {
                console.error('切换收藏状态失败:', error);
                throw error;
        }
}
