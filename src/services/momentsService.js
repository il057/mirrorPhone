/**
 * 动态服务
 * 处理动态相关的业务逻辑，包括发布、点赞、评论等
 */

import db, { USER_ACTOR_ID } from './database.js';
import { showToast } from './uiService.js';

/**
 * 发布动态
 * @param {string} actorId - 发布者ID
 * @param {Object} postData - 动态数据
 * @returns {Promise<Object>} 创建的动态事件
 */
export async function createPost(actorId, postData) {
    try {
        const postEvent = {
            timestamp: Date.now(),
            actorId: actorId,
            contextId: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'post',
            content: {
                text: postData.content || postData.text || '',
                images: [], // AI不生成实际图片，只能发送图片描述动态
                imageDescription: postData.imageDescription || null,
                type: postData.postType || 'text'
            }
        };

        const result = await db.events.add(postEvent);
        console.log('动态已创建:', postEvent.contextId);

        // 返回完整的事件对象
        return { ...postEvent, id: result };
    } catch (error) {
        console.error('创建动态失败:', error);
        throw error;
    }
}

/**
 * 点赞动态
 * @param {string} actorId - 点赞者ID
 * @param {string} postId - 动态ID (contextId)
 * @returns {Promise<boolean>} 是否成功
 */
export async function likePost(actorId, postId) {
    try {
        // 检查动态是否存在
        const post = await db.events
            .where('contextId').equals(postId)
            .and(event => event.type === 'post')
            .first();

        if (!post) {
            throw new Error('动态不存在');
        }

        // 检查是否已经点赞过
        const existingLike = await db.events
            .where('contextId').equals(postId)
            .and(event => event.type === 'like' && event.actorId === actorId)
            .first();

        if (existingLike) {
            // 已经点赞过，取消点赞
            await db.events.delete(existingLike.id);
            console.log('取消点赞成功:', postId);
            return false; // 返回false表示取消点赞
        } else {
            // 创建点赞事件
            const likeEvent = {
                timestamp: Date.now(),
                actorId: actorId,
                contextId: postId, // 关联到动态
                type: 'like',
                content: {
                    targetType: 'post',
                    targetId: postId,
                    action: 'like'
                }
            };

            await db.events.add(likeEvent);
            console.log('点赞成功:', postId);
            return true; // 返回true表示点赞
        }
    } catch (error) {
        console.error('点赞操作失败:', error);
        throw error;
    }
}

/**
 * 评论动态
 * @param {string} actorId - 评论者ID
 * @param {string} postId - 动态ID (contextId)
 * @param {string} commentContent - 评论内容
 * @returns {Promise<Object>} 创建的评论事件
 */
export async function commentOnPost(actorId, postId, commentContent) {
    try {
        // 检查动态是否存在
        const post = await db.events
            .where('contextId').equals(postId)
            .and(event => event.type === 'post')
            .first();

        if (!post) {
            throw new Error('动态不存在');
        }

        // 创建评论事件
        const commentEvent = {
            timestamp: Date.now(),
            actorId: actorId,
            contextId: postId, // 关联到动态
            type: 'reply', // 使用reply类型以保持与现有系统的兼容性
            content: {
                targetType: 'post',
                targetId: postId,
                text: commentContent,
                action: 'comment'
            }
        };

        const result = await db.events.add(commentEvent);
        console.log('评论成功:', postId);
        
        // 返回完整的事件对象
        return { ...commentEvent, id: result };
    } catch (error) {
        console.error('评论失败:', error);
        throw error;
    }
}

/**
 * 获取动态的点赞用户列表
 * @param {string} postId - 动态ID
 * @returns {Promise<Array>} 点赞用户列表
 */
export async function getPostLikes(postId) {
    try {
        const likes = await db.events
            .where('contextId').equals(postId)
            .and(event => event.type === 'like')
            .toArray();

        const likeUsers = [];
        for (const like of likes) {
            let user;
            if (like.actorId === USER_ACTOR_ID) {
                // 用户的点赞，需要获取当前人格信息
                const defaultPersona = await db.actors
                    .filter(actor => actor.id && actor.id.startsWith('user_') && actor.isDefault)
                    .first();
                user = defaultPersona ? { ...defaultPersona, id: USER_ACTOR_ID } : null;
            } else {
                user = await db.actors.get(like.actorId);
            }

            if (user) {
                likeUsers.push({
                    ...user,
                    likeTimestamp: like.timestamp
                });
            }
        }

        return likeUsers;
    } catch (error) {
        console.error('获取点赞列表失败:', error);
        return [];
    }
}

/**
 * 获取动态的评论列表
 * @param {string} postId - 动态ID
 * @param {number} limit - 限制数量，默认为10
 * @returns {Promise<Array>} 评论列表
 */
export async function getPostComments(postId, limit = 10) {
    try {
        const comments = await db.events
            .where('contextId').equals(postId)
            .and(event => event.type === 'reply')
            .limit(limit)
            .reverse()
            .sortBy('timestamp');

        const commentList = [];
        for (const comment of comments) {
            let author;
            if (comment.actorId === USER_ACTOR_ID) {
                // 用户的评论，需要获取当前人格信息
                const defaultPersona = await db.actors
                    .filter(actor => actor.id && actor.id.startsWith('user_') && actor.isDefault)
                    .first();
                author = defaultPersona ? { ...defaultPersona, id: USER_ACTOR_ID } : null;
            } else {
                author = await db.actors.get(comment.actorId);
            }

            if (author) {
                commentList.push({
                    id: comment.id,
                    author: author,
                    content: comment.content,
                    timestamp: comment.timestamp
                });
            }
        }

        return commentList;
    } catch (error) {
        console.error('获取评论列表失败:', error);
        return [];
    }
}

/**
 * 检查用户是否已点赞某动态
 * @param {string} actorId - 用户ID
 * @param {string} postId - 动态ID
 * @returns {Promise<boolean>} 是否已点赞
 */
export async function isPostLiked(actorId, postId) {
    try {
        const like = await db.events
            .where('contextId').equals(postId)
            .and(event => event.type === 'like' && event.actorId === actorId)
            .first();

        return !!like;
    } catch (error) {
        console.error('检查点赞状态失败:', error);
        return false;
    }
}

/**
 * 获取动态统计信息
 * @param {string} postId - 动态ID
 * @returns {Promise<Object>} 统计信息
 */
export async function getPostStats(postId) {
    try {
        const [likes, comments] = await Promise.all([
            db.events
                .where('contextId').equals(postId)
                .and(event => event.type === 'like')
                .count(),
            db.events
                .where('contextId').equals(postId)
                .and(event => event.type === 'reply')
                .count()
        ]);

        return {
            likes,
            comments
        };
    } catch (error) {
        console.error('获取动态统计失败:', error);
        return { likes: 0, comments: 0 };
    }
}

export default {
    createPost,
    likePost,
    commentOnPost,
    getPostLikes,
    getPostComments,
    isPostLiked,
    getPostStats
};
