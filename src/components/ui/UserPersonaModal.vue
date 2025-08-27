<template>
        <div class="modal-overlay" @click="handleOverlayClick">
                <div class="modal-content" @click.stop>
                        <div class="modal-header">
                                <h2>用户人格预设管理</h2>
                                <button class="close-button" @click="$emit('close')">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" 
                                                        stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                </button>
                        </div>

                        <div class="modal-body">
                <!-- 现有人格预设列表 -->
                <div class="personas-list">
                        <div 
                                v-for="persona in userPersonas" 
                                :key="persona.id"
                                class="persona-accordion"
                        >
                                <div class="persona-header" @click="togglePersonaExpanded(persona.id)">
                                        <div class="persona-info">
                                                <div class="persona-avatar">
                                                        <img v-if="persona.avatar" :src="persona.avatar" :alt="persona.name">
                                                        <div v-else class="avatar-placeholder">{{ getInitial(persona.name) }}</div>
                                                </div>
                                                <div class="persona-name-section">
                                                        <span class="persona-name">{{ persona.name }}</span>
                                                        <span class="persona-realname">{{ persona.realName }}</span>
                                                </div>
                                        </div>
                                        <div class="persona-header-actions">
                                                <button 
                                                        class="star-button" 
                                                        @click.stop="toggleDefault(persona.id)"
                                                        :class="{ active: persona.isDefault }"
                                                >
                                                        <svg width="20" height="20" viewBox="0 0 24 24">
                                                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" 
                                                                        :fill="persona.isDefault ? '#FFD700' : 'none'" 
                                                                        :stroke="persona.isDefault ? '#FFD700' : 'currentColor'" 
                                                                        stroke-width="2"/>
                                                        </svg>
                                                </button>
                                                <svg class="expand-icon" :class="{ rotated: expandedPersonas.includes(persona.id) }" viewBox="0 0 24 24" width="20" height="20">
                                                        <path d="M7 10l5 5 5-5z" fill="currentColor"/>
                                                </svg>
                                        </div>
                                </div>

                                <transition name="accordion">
                                        <div v-show="expandedPersonas.includes(persona.id)" class="persona-content">
                                                <div class="form-section">
                                                        <div class="form-group avatar-group">
                                                                <div class="avatar-picker-container">
                                                                        <div class="avatar-picker" @click="pickAvatar(persona)">
                                                                                <img v-if="persona.avatar" :src="persona.avatar" :alt="persona.name">
                                                                                <div v-else class="avatar-placeholder">{{ getInitial(persona.name) }}</div>
                                                                                <div class="avatar-overlay">点击更换</div>
                                                                        </div>
                                                                </div>
                                                        </div>

                                                        <div class="form-row">
                                                                <div class="form-group">
                                                                        <label>昵称</label>
                                                                        <input v-model="persona.name" type="text" placeholder="输入昵称">
                                                                </div>
                                                                <div class="form-group">
                                                                        <label>真实姓名</label>
                                                                        <input v-model="persona.realName" type="text" placeholder="输入真实姓名">
                                                                </div>
                                                        </div>

                                                        <div class="form-group">
                                                                <label>别名</label>
                                                                <input v-model="persona.aliasesStr" type="text" placeholder="用逗号分隔多个别名">
                                                        </div>

                                                        <div class="form-row">
                                                                <div class="form-group">
                                                                        <label>性别</label>
                                                                        <MainDropdown
                                                                                v-model="persona.gender"
                                                                                :options="genderOptions"
                                                                                placeholder="选择性别"
                                                                        />
                                                                </div>
                                                                <div class="form-group">
                                                                        <label>生日</label>
                                                                        <input v-model="persona.birthday" type="date">
                                                                </div>
                                                        </div>

                                                        <div class="form-group">
                                                                <label>人格描述</label>
                                                                <textarea v-model="persona.persona" placeholder="描述这个人格的特点、性格、背景等"></textarea>
                                                        </div>
                                                </div>

                                                <!-- 可见分组/群聊 -->
                                                <div class="groups-accordion">
                                                        <div class="groups-header" @click="toggleGroupsExpanded(persona.id)">
                                                                <span>可见分组/群聊</span>
                                                                <svg class="expand-icon" :class="{ rotated: expandedGroups.includes(persona.id) }" viewBox="0 0 24 24" width="20" height="20">
                                                                        <path d="M7 10l5 5 5-5z" fill="currentColor"/>
                                                                </svg>
                                                        </div>
                                                        <transition name="accordion">
                                                                <div v-show="expandedGroups.includes(persona.id)" class="groups-selection">
                                                                        <div class="groups-grid">
                                                                                <label v-for="group in availableGroups" :key="group.id" class="group-item" :class="{ disabled: isGroupBoundToOther(group.id, persona.id) }">
                                                                                        <input 
                                                                                                type="checkbox" 
                                                                                                :value="group.id"
                                                                                                v-model="persona.groupIds"
                                                                                                :disabled="isGroupBoundToOther(group.id, persona.id)"
                                                                                        >
                                                                                        <span>{{ group.name }}</span>
                                                                                        <small v-if="isGroupBoundToOther(group.id, persona.id)" class="bound-indicator">已绑定</small>
                                                                                </label>
                                                                                <label v-for="groupChat in groupChats" :key="groupChat.id" class="group-item" :class="{ disabled: isGroupBoundToOther(groupChat.id, persona.id) }">
                                                                                        <input 
                                                                                                type="checkbox" 
                                                                                                :value="groupChat.id"
                                                                                                v-model="persona.groupIds"
                                                                                                :disabled="isGroupBoundToOther(groupChat.id, persona.id)"
                                                                                        >
                                                                                        <span>{{ groupChat.name }} (群聊)</span>
                                                                                        <small v-if="isGroupBoundToOther(groupChat.id, persona.id)" class="bound-indicator">已绑定</small>
                                                                                </label>
                                                                        </div>
                                                                </div>
                                                        </transition>
                                                </div>

                                                <!-- 操作按钮 -->
                                                <div class="persona-actions">
                                                        <button class="save-button" @click="savePersona(persona)">保存</button>
                                                        <button class="delete-button" @click="deletePersona(persona)" v-if="!persona.isNew">删除</button>
                                                </div>
                                        </div>
                                </transition>
                        </div>
                </div>                                <!-- 创建新人格预设按钮 -->
                                <button class="create-new-button" @click="createNewPersona">
                                        <svg width="20" height="20" viewBox="0 0 24 24">
                                                <path d="M12 5v14m-7-7h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                        创建新的人格预设
                                </button>
                        </div>
                </div>
        </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useObservable } from '@vueuse/rxjs';
import { liveQuery } from 'dexie';
import db from '../../services/database.js';
import MainDropdown from './MainDropdown.vue';
import { showToast, showConfirm, showUploadChoiceModal, showAvatarPickerModal } from '../../services/uiService.js';
import { setDefaultUserPersona } from '../../services/userPersonaService.js';

const emit = defineEmits(['close', 'personaChanged']);

const userPersonas = ref([]);
const expandedPersonas = ref([]);
const expandedGroups = ref([]);

// 性别选项
const genderOptions = [
        { label: '男', value: '男' },
        { label: '女', value: '女' },
        { label: '其他', value: '其他' }
];

// 获取可用分组（排除特别关心）
const availableGroups = useObservable(
        liveQuery(() => db.groups.filter(g => g.id !== 'group_special').toArray()),
        { initialValue: [] }
);

// 获取群聊
const groupChats = useObservable(
        liveQuery(() => db.actors.filter(a => a.isGroup === 1).toArray()),
        { initialValue: [] }
);

// 当前默认人格
const currentDefaultPersona = computed(() => {
        return userPersonas.value.find(p => p.isDefault);
});

const getInitial = (name) => {
        if (!name) return '?';
        return name.charAt(0).toUpperCase();
};

const handleOverlayClick = () => {
        emit('close');
};

// 切换人格预设展开/收起（改进逻辑，如果展开新的则收起其他的）
const togglePersonaExpanded = (personaId) => {
        const index = expandedPersonas.value.indexOf(personaId);
        if (index > -1) {
                // 如果当前已展开，则收起
                expandedPersonas.value.splice(index, 1);
        } else {
                // 如果当前未展开，则收起所有其他的，只展开当前的
                expandedPersonas.value = [personaId];
                // 同时收起所有分组菜单
                expandedGroups.value = [];
        }
};

// 切换分组展开/收起
const toggleGroupsExpanded = (personaId) => {
        const index = expandedGroups.value.indexOf(personaId);
        if (index > -1) {
                expandedGroups.value.splice(index, 1);
        } else {
                expandedGroups.value.push(personaId);
        }
};

// 检查分组是否被其他人格绑定
const isGroupBoundToOther = (groupId, currentPersonaId) => {
        return userPersonas.value.some(persona => 
                persona.id !== currentPersonaId && 
                persona.groupIds && 
                persona.groupIds.includes(groupId)
        );
};


// 加载用户人格预设
const loadUserPersonas = async () => {
        try {
                console.log('Loading user personas...');
                const personas = await db.actors.filter(actor => 
                        actor.id && actor.id.startsWith('user_')
                ).toArray();
                
                console.log('Found personas:', personas);
                
                // 处理别名字符串
                userPersonas.value = personas.map(persona => ({
                        ...persona,
                        aliasesStr: Array.isArray(persona.aliases) ? persona.aliases.join(', ') : '',
                        groupIds: persona.groupIds || []
                }));

                // 确保有且仅有一个默认人格
                const defaultPersonas = userPersonas.value.filter(p => p.isDefault);
                
                if (defaultPersonas.length === 0 && userPersonas.value.length > 0) {
                        // 如果没有默认人格，设置第一个为默认
                        userPersonas.value[0].isDefault = true;
                        await db.actors.update(userPersonas.value[0].id, { isDefault: true });
                } else if (defaultPersonas.length > 1) {
                        // 如果有多个默认人格，只保留第一个
                        for (let i = 1; i < defaultPersonas.length; i++) {
                                defaultPersonas[i].isDefault = false;
                                await db.actors.update(defaultPersonas[i].id, { isDefault: false });
                        }
                }
                
                console.log('Processed personas:', userPersonas.value);
        } catch (error) {
                console.error('加载用户人格预设失败:', error);
                showToast('加载人格预设失败', 'error');
        }
};

// 切换默认人格
const toggleDefault = async (personaId) => {
        try {
                const success = await setDefaultUserPersona(personaId);
                if (success) {
                        // 更新本地状态
                        userPersonas.value.forEach(p => p.isDefault = false);
                        const persona = userPersonas.value.find(p => p.id === personaId);
                        if (persona) {
                                persona.isDefault = true;
                                
                                // 通知父组件人格已变更
                                emit('personaChanged', persona);
                                showToast('默认人格已更新', 'success');
                        }
                } else {
                        showToast('设置默认人格失败', 'error');
                }
        } catch (error) {
                console.error('设置默认人格失败:', error);
                showToast('设置默认人格失败', 'error');
        }
};

// 选择头像
const pickAvatar = async (persona) => {
        try {
                // 使用__USER__作为头像库ID，所有用户人格共享头像库
                const result = await showAvatarPickerModal(persona.id, '__USER__');
                if (result) {
                        persona.avatar = result;
                }
        } catch (error) {
                console.error('选择头像失败:', error);
                showToast('选择头像失败', 'error');
        }
};

// 保存人格预设
const savePersona = async (persona) => {
        try {
                if (!persona.name) {
                        showToast('昵称不能为空', 'error');
                        return;
                }

                // 处理别名
                const aliases = persona.aliasesStr 
                        ? persona.aliasesStr.split(/[,，]/).map(s => s.trim()).filter(s => s) 
                        : [];

                // 创建一个纯净的数据对象，避免Vue响应式引用
                const dataToSave = {
                        id: persona.id,
                        name: persona.name,
                        realName: persona.realName,
                        gender: persona.gender,
                        avatar: persona.avatar,
                        aliases: aliases,
                        type: 'user',
                        isDefault: Boolean(persona.isDefault),
                        groupIds: Array.isArray(persona.groupIds) ? [...persona.groupIds] : [],
                        avatarLibrary: Array.isArray(persona.avatarLibrary) ? [...persona.avatarLibrary] : []
                };

                if (persona.isNew) {
                        // 新建人格预设
                        dataToSave.id = `user_${Date.now()}`;
                        await db.actors.add(dataToSave);
                        persona.id = dataToSave.id;
                        persona.isNew = false;
                        
                        // 更新展开列表中的ID
                        const expandedIndex = expandedPersonas.value.indexOf(persona.id);
                        if (expandedIndex === -1) {
                                // 如果使用的是临时ID，替换为新ID
                                const tempIndex = expandedPersonas.value.findIndex(id => id.startsWith('new_persona_'));
                                if (tempIndex > -1) {
                                        expandedPersonas.value[tempIndex] = dataToSave.id;
                                }
                        }
                } else {
                        // 更新现有人格预设
                        await db.actors.put(dataToSave);
                }

                // 如果是默认人格，需要更新其他人格的默认状态
                if (persona.isDefault) {
                        await db.actors
                                .filter(actor => actor.id && actor.id.startsWith('user_') && actor.id !== persona.id)
                                .modify({ isDefault: false });
                        
                        // 通知父组件人格已变更
                        emit('personaChanged', persona);
                }

                showToast('保存成功', 'success');
        } catch (error) {
                console.error('保存人格预设失败:', error);
                showToast('保存失败', 'error');
        }
};

// 删除人格预设
const deletePersona = async (persona) => {
        const confirmed = await showConfirm(
                '删除人格预设',
                `确定要删除人格预设 "${persona.name}" 吗？此操作无法撤销。`
        );

        if (confirmed) {
                try {
                        await db.actors.delete(persona.id);
                        
                        // 从列表中移除
                        const index = userPersonas.value.findIndex(p => p.id === persona.id);
                        if (index > -1) {
                                userPersonas.value.splice(index, 1);
                        }

                        // 如果删除的是默认人格，设置第一个为默认
                        if (persona.isDefault && userPersonas.value.length > 0) {
                                userPersonas.value[0].isDefault = true;
                                await savePersona(userPersonas.value[0]);
                        }

                        showToast('删除成功', 'success');
                } catch (error) {
                        console.error('删除人格预设失败:', error);
                        showToast('删除失败', 'error');
                }
        }
};

// 创建新人格预设
const createNewPersona = () => {
        const newPersona = {
                id: `new_${Date.now()}`,
                name: '',
                realName: '',
                aliasesStr: '',
                gender: '',
                birthday: '',
                persona: '',
                avatar: '',
                groupIds: [],
                isDefault: false,
                isNew: true,
                type: 'user'
        };

        userPersonas.value.push(newPersona);
        expandedPersonas.value.push(newPersona.id);
};

onMounted(() => {
        loadUserPersonas();
});
</script>

<style scoped>
.modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        padding: 20px;
}

.modal-content {
        background-color: var(--bg-primary);
        border-radius: 12px;
        width: 100%;
        max-width: 600px;
        max-height: 90vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
}

.modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid var(--border-color);
}

.modal-header h2 {
        margin: 0;
        color: var(--text-primary);
        font-size: 18px;
        font-weight: 600;
}

.close-button {
        background: none;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 8px;
        border-radius: 6px;
        transition: all 0.2s ease;
}

.close-button:hover {
        color: var(--text-primary);
}

.modal-body {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
}

.personas-list {
        margin-bottom: 20px;
}

/* 人格预设手风琴样式 */
.persona-accordion {
        background-color: var(--bg-card);
        border-radius: 8px;
        margin-bottom: 15px;
        overflow: hidden;
}

.persona-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 15px 20px;
        cursor: pointer;
        background-color: var(--bg-card);
        transition: background-color 0.2s ease;
        border-bottom: 1px solid var(--border-color);
}

.persona-header:hover {
        background-color: var(--bg-secondary);
}

.persona-info {
        display: flex;
        align-items: center;
        gap: 12px;
}

.persona-header-actions {
        display: flex;
        align-items: center;
        gap: 12px;
}

.expand-icon {
        transition: transform 0.3s ease;
        color: var(--text-secondary);
}

.expand-icon.rotated {
        transform: rotate(180deg);
}

/* 分组手风琴样式 */
.groups-accordion {
        margin-top: 20px;
        background-color: var(--bg-secondary);
        border-radius: 8px;
        overflow: hidden;
}

.groups-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        cursor: pointer;
        background-color: var(--bg-secondary);
        transition: background-color 0.2s ease;
        border-bottom: 1px solid var(--border-color);
        font-weight: 500;
        color: var(--text-primary);
}

.groups-header:hover {
        background-color: var(--bg-primary);
}

/* 手风琴动画 */
.accordion-enter-active,
.accordion-leave-active {
        transition: all 0.3s ease;
        overflow: hidden;
}

.accordion-enter-from,
.accordion-leave-to {
        max-height: 0;
        opacity: 0;
}

.accordion-enter-to,
.accordion-leave-from {
        max-height: 1000px;
        opacity: 1;
}

.persona-info {
        display: flex;
        align-items: center;
        gap: 12px;
}

.persona-avatar {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--bg-secondary);
}

.persona-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
}

.avatar-placeholder {
        font-size: 18px;
        font-weight: 600;
        color: var(--accent-primary);
}

.persona-name-section {
        display: flex;
        flex-direction: column;
        gap: 2px;
}

.persona-name {
        font-weight: 600;
        color: var(--text-primary);
        font-size: 16px;
}

.persona-realname {
        font-size: 14px;
        color: var(--text-secondary);
}

.star-button {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.2s ease;
        color: var(--text-secondary);
}

.star-button:hover {
        color: #FFD700;
}

.star-button.active {
        color: #FFD700;
}

/* 人格内容编辑样式 */
.persona-content {
        padding-top: 10px;
        padding-left: 10px;
        padding-right: 10px;
        text-align: left;
}

.form-section {
        margin-bottom: 20px;
}

.form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-bottom: 16px;
}

.form-group {
        margin-bottom: 16px;
}

.form-group.avatar-group {
        margin-bottom: 20px;
}

.avatar-picker-container {
        display: flex;
        justify-content: center;
        margin-top: 8px;
}

.form-group label {
        display: block;
        margin-bottom: 6px;
        font-weight: 500;
        color: var(--text-primary);
        font-size: 14px;
}

.form-group input,
.form-group select,
.form-group textarea {
        width: 100%;
        box-sizing: border-box;
        padding: 10px 12px;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        background-color: var(--bg-secondary);
        color: var(--text-primary);
        font-size: 14px;
        transition: all 0.2s ease;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
        outline: none;
        border-color: var(--accent-primary);
        box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.form-group textarea {
        height: 100px;
        resize: vertical;
}

/* 头像选择器 */
.avatar-picker {
        width: 80px;
        height: 80px;
        border-radius: 8px;
        overflow: hidden;
        cursor: pointer;
        position: relative;
        background-color: var(--bg-secondary);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px dashed var(--border-color);
        transition: all 0.2s ease;
}

.avatar-picker:hover {
        border-color: var(--accent-primary);
}

.avatar-picker img {
        width: 100%;
        height: 100%;
        object-fit: cover;
}

.avatar-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        opacity: 0;
        transition: opacity 0.2s ease;
}

.avatar-picker:hover .avatar-overlay {
        opacity: 1;
}

/* 分组选择样式 */
.groups-accordion {
        margin-top: 20px;
}

.groups-selection {
        margin-top: 10px;
}

.groups-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 8px;
}

.group-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background-color: var(--bg-secondary);
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
}

.group-item:hover {
        background-color: var(--bg-primary);
}

.group-item.disabled {
        opacity: 0.6;
        cursor: not-allowed;
        background-color: var(--bg-card);
}

.group-item.disabled:hover {
        background-color: var(--bg-card);
}

.group-item input[type="checkbox"] {
        width: auto;
        margin: 0;
}

.group-item input[type="checkbox"]:disabled {
        cursor: not-allowed;
}

.bound-indicator {
        font-size: 12px;
        color: var(--text-secondary);
        margin-left: auto;
        font-style: italic;
}

/* 操作按钮 */
.persona-actions {
        display: flex;
        gap: 12px;
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid var(--border-color);
}

.save-button,
.delete-button {
        flex: 1;
        padding: 12px 20px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
}

.save-button {
        background-color: var(--accent-primary);
        color: white;
}

.save-button:hover {
        background-color: var(--accent-darker);
}

.delete-button {
        background-color: var(--bg-secondary);
        color: #f44336;
        border: 1px solid #f44336;
}

.delete-button:hover {
        background-color: rgba(244, 67, 54, 0.1);
}

/* 创建新人格按钮 */
.create-new-button {
        width: 100%;
        padding: 16px;
        border: 2px dashed var(--border-color);
        background: none;
        color: var(--text-secondary);
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-size: 14px;
        transition: all 0.2s ease;
}

.create-new-button:hover {
        border-color: var(--accent-primary);
        color: var(--accent-primary);
        background-color: rgba(76, 175, 80, 0.05);
}

/* 响应式设计 */
@media (max-width: 768px) {
        .modal-overlay {
                padding: 10px;
        }
        
        .modal-content {
                max-height: 95vh;
        }
        
        .form-row {
                grid-template-columns: 1fr;
                gap: 12px;
        }
        
        .groups-grid {
                grid-template-columns: 1fr;
        }
        
        .persona-actions {
                flex-direction: column;
        }
}
</style>
