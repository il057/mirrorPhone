/**
 * 回忆服务
 * 处理回忆的创建、编辑、删除等功能
 */

import { createApp } from 'vue';
import db from './database.js';
import MemoryEditModal from '../components/ui/MemoryEditModal.vue';

/**
 * 确保容器存在
 */
function getModalsContainer() {
        let container = document.getElementById('modals-container');
        if (!container) {
                container = document.createElement('div');
                container.id = 'modals-container';
                document.body.appendChild(container);
        }
        return container;
}

/**
 * 显示回忆编辑模态框
 * @param {Object|null} memory - 要编辑的回忆对象，新建时传null
 * @param {string} actorId - 拥有者ID（默认用户人格ID）
 * @param {string|null} relatedActorId - 相关角色ID（用于筛选）
 * @returns {Promise<boolean>} - 返回是否保存了更改
 */
export function showMemoryEditModal(memory = null, actorId = '__USER__', relatedActorId = null) {
        return new Promise((resolve) => {
                const container = getModalsContainer();
                const modalWrapper = document.createElement('div');
                container.appendChild(modalWrapper);

                const cleanup = () => {
                        modalApp.unmount();
                        if (container.contains(modalWrapper)) {
                                container.removeChild(modalWrapper);
                        }
                };

                const modalApp = createApp(MemoryEditModal, {
                        isOpen: true,
                        memory: memory,
                        actorId: actorId,
                        relatedActorId: relatedActorId,
                        onClose: () => {
                                cleanup();
                                resolve(false);
                        },
                        onSave: () => {
                                cleanup();
                                resolve(true);
                        }
                });

                modalApp.mount(modalWrapper);
        });
}

/**
 * 创建新回忆
 * @param {Object} memoryData - 回忆数据
 * @returns {Promise<Object>} - 返回创建的回忆对象
 */
export async function createMemory(memoryData) {
        const memory = {
                actorId: memoryData.actorId,
                type: memoryData.type,
                content: memoryData.content,
                keywords: memoryData.keywords || [],
                timestamp: Date.now(),
                targetDate: memoryData.targetDate || null,
                relatedActorId: memoryData.relatedActorId || null
        };

        const id = await db.memories.add(memory);
        return { ...memory, id };
}

/**
 * 更新回忆
 * @param {number} memoryId - 回忆ID
 * @param {Object} updateData - 更新数据
 * @returns {Promise<void>}
 */
export async function updateMemory(memoryId, updateData) {
        await db.memories.update(memoryId, updateData);
}

/**
 * 删除回忆
 * @param {number} memoryId - 回忆ID
 * @returns {Promise<void>}
 */
export async function deleteMemory(memoryId) {
        await db.memories.delete(memoryId);
}

/**
 * 获取指定用户的回忆列表
 * @param {string} actorId - 用户ID
 * @param {string|null} relatedActorId - 相关角色ID（可选）
 * @returns {Promise<Array>} - 回忆列表
 */
export async function getMemories(actorId, relatedActorId = null) {
        let query = db.memories.where('actorId').equals(actorId);
        
        const memories = await query.reverse().toArray();
        
        if (relatedActorId) {
                return memories.filter(memory => memory.relatedActorId === relatedActorId);
        }
        
        return memories;
}

/**
 * 根据关键词搜索回忆
 * @param {string} actorId - 用户ID
 * @param {string} keyword - 关键词
 * @returns {Promise<Array>} - 匹配的回忆列表
 */
export async function searchMemoriesByKeyword(actorId, keyword) {
        const memories = await db.memories
                .where('actorId').equals(actorId)
                .and(memory => memory.keywords && memory.keywords.includes(keyword))
                .toArray();
        
        return memories;
}

/**
 * 获取即将到来的纪念日/倒计时
 * @param {string} actorId - 用户ID
 * @param {number} days - 未来天数范围
 * @returns {Promise<Array>} - 即将到来的纪念日列表
 */
export async function getUpcomingCountdowns(actorId, days = 30) {
        const now = new Date();
        const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        
        const memories = await db.memories
                .where('actorId').equals(actorId)
                .and(memory => 
                        (memory.type === 'date' || memory.type === 'countdown' || memory.type === 'anniversary') &&
                        memory.targetDate &&
                        new Date(memory.targetDate) >= now &&
                        new Date(memory.targetDate) <= futureDate
                )
                .toArray();
        
        return memories.sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate));
}
