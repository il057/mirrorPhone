import db from './database.js';

/**
 * 收藏服务
 * 管理用户的收藏功能
 */

/**
 * 添加收藏
 * @param {Object} params - 收藏参数
 * @param {number} params.eventId - 事件ID
 * @param {string} params.eventType - 事件类型
 * @param {string} params.authorId - 作者ID
 * @param {string} params.authorName - 作者名称
 * @param {Object} params.content - 内容快照
 * @returns {Promise<number>} 收藏ID
 */
export async function addToFavorites({ eventId, eventType, authorId, authorName, content }) {
        try {
                // 检查是否已经收藏
                const existing = await db.favorites
                        .where('eventId')
                        .equals(eventId)
                        .first();
                
                if (existing) {
                        throw new Error('已经收藏过了');
                }

                const favoriteId = await db.favorites.add({
                        eventId,
                        eventType,
                        authorId,
                        authorName,
                        content,
                        createTime: Date.now()
                });

                return favoriteId;
        } catch (error) {
                console.error('添加收藏失败:', error);
                throw error;
        }
}

/**
 * 移除收藏
 * @param {number} eventId - 事件ID
 * @returns {Promise<void>}
 */
export async function removeFromFavorites(eventId) {
        try {
                await db.favorites
                        .where('eventId')
                        .equals(eventId)
                        .delete();
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
