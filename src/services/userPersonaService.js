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
                        .filter(actor => actor.id && actor.id.startsWith('user_persona_') && actor.isDefault)
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
                        .filter(actor => actor.id && actor.id.startsWith('user_persona_'))
                        .modify({ isDefault: false });
                
                // 设置新的默认人格
                await db.actors.update(personaId, { isDefault: true });
                
                // 应用默认人格到未绑定的实体
                await applyDefaultPersonaToUnbound();
                
                return true;
        } catch (error) {
                console.error('Failed to set default user persona:', error);
                return false;
        }
}

/**
 * 将默认人格应用到所有未绑定人格的分组、群聊和未分组角色
 * @returns {Promise<void>}
 */
export async function applyDefaultPersonaToUnbound() {
        try {
                const defaultPersona = await getDefaultUserPersona();
                if (!defaultPersona) {
                        console.log('No default persona found');
                        return;
                }

                // 获取所有已绑定人格的分组/群聊
                const allPersonas = await db.actors
                        .filter(actor => actor.id && actor.id.startsWith('user_persona_'))
                        .toArray();
                
                const boundGroupIds = new Set();
                allPersonas.forEach(persona => {
                        if (persona.groupIds && Array.isArray(persona.groupIds)) {
                                persona.groupIds.forEach(id => boundGroupIds.add(id));
                        }
                });

                // 获取所有分组
                const allGroups = await db.groups.filter(g => g.id !== 'group_special').toArray();
                
                // 获取所有群聊
                const allGroupChats = await db.actors.filter(a => a.isGroup === 1).toArray();

                // 将默认人格应用到未绑定的分组和群聊
                const unboundIds = [];
                
                allGroups.forEach(group => {
                        if (!boundGroupIds.has(group.id)) {
                                unboundIds.push(group.id);
                        }
                });
                
                allGroupChats.forEach(chat => {
                        if (!boundGroupIds.has(chat.id)) {
                                unboundIds.push(chat.id);
                        }
                });

                // 更新默认人格的groupIds
                if (unboundIds.length > 0) {
                        const currentGroupIds = defaultPersona.groupIds || [];
                        const newGroupIds = [...new Set([...currentGroupIds, ...unboundIds])];
                        
                        await db.actors.update(defaultPersona.id, { groupIds: newGroupIds });
                        console.log(`Applied default persona to ${unboundIds.length} unbound groups/chats`);
                }

        } catch (error) {
                console.error('Failed to apply default persona to unbound entities:', error);
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
                                actor.id.startsWith('user_persona_') && 
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
                        
                        // 将解除绑定的分组/群聊重新分配给默认人格
                        await applyDefaultPersonaToUnbound();
                        
                        return true;
                }
                return false;
        } catch (error) {
                console.error('Failed to unbind persona from group:', error);
                return false;
        }
}
