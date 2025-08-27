import db from './database.js';

/**
 * 用户人格管理服务
 */

/**
 * 获取当前默认用户人格
 * @returns {Promise<Object|null>} 默认用户人格对象
 */
export async function getDefaultUserPersona() {
        try {
                const defaultPersona = await db.actors
                        .filter(actor => actor.id && actor.id.startsWith('user_') && actor.isDefault)
                        .first();
                return defaultPersona;
        } catch (error) {
                console.error('Failed to get default user persona:', error);
                return null;
        }
}

/**
 * 设置默认用户人格
 * @param {string} personaId - 人格ID
 * @returns {Promise<boolean>} 是否成功设置
 */
export async function setDefaultUserPersona(personaId) {
        try {
                // 取消所有人格的默认状态
                await db.actors
                        .filter(actor => actor.id && actor.id.startsWith('user_'))
                        .modify({ isDefault: false });
                
                // 设置新的默认人格
                await db.actors.update(personaId, { isDefault: true });
                
                return true;
        } catch (error) {
                console.error('Failed to set default user persona:', error);
                return false;
        }
}

/**
 * 获取指定分组/群聊绑定的用户人格
 * @param {string} groupId - 分组或群聊ID
 * @returns {Promise<Object|null>} 绑定的用户人格对象
 */
export async function getUserPersonaForGroup(groupId) {
        try {
                const persona = await db.actors
                        .filter(actor => 
                                actor.id && 
                                actor.id.startsWith('user_') && 
                                actor.groupIds && 
                                actor.groupIds.includes(groupId)
                        )
                        .first();
                
                return persona;
        } catch (error) {
                console.error('Failed to get user persona for group:', error);
                return null;
        }
}

/**
 * 获取未分组角色应使用的用户人格（默认人格）
 * @returns {Promise<Object|null>} 用户人格对象
 */
export async function getUserPersonaForUngrouped() {
        return await getDefaultUserPersona();
}

/**
 * 解除人格与分组/群聊的绑定
 * @param {string} personaId - 人格ID
 * @param {string} groupId - 分组或群聊ID
 * @returns {Promise<boolean>} 是否成功解除绑定
 */
export async function unbindPersonaFromGroup(personaId, groupId) {
        try {
                const persona = await db.actors.get(personaId);
                if (persona && persona.groupIds) {
                        const newGroupIds = persona.groupIds.filter(id => id !== groupId);
                        await db.actors.update(personaId, { groupIds: newGroupIds });
                        return true;
                }
                return false;
        } catch (error) {
                console.error('Failed to unbind persona from group:', error);
                return false;
        }
}

/**
 * 根据角色信息获取当前上下文应使用的用户人格ID
 * @param {Object} actor - 当前对话的角色对象
 * @returns {Promise<string|null>} 有效的用户人格ID，如果没有则返回null
 */
export async function getEffectiveUserPersonaId(actor) {
        try {
                if (!actor) return null;
                
                // 获取角色的分组ID
                const groupId = actor.groupIds?.[0];
                
                if (groupId) {
                        // 获取该分组绑定的用户人格
                        const boundPersona = await getUserPersonaForGroup(groupId);
                        if (boundPersona) {
                                return boundPersona.id;
                        }
                }
                
                // 没有分组或没有绑定的人格，使用默认人格
                const defaultPersona = await getDefaultUserPersona();
                return defaultPersona ? defaultPersona.id : null;
        } catch (error) {
                console.error('Failed to get effective user persona ID:', error);
                return null;
        }
}
