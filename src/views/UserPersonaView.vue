<template>
        <div class="page-container">
                <AppHeader title="人格管理">
                        <template #left>
                                <button class="back-button" @click="goBack">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-chevron-left" viewBox="0 0 16 16">
                                                <path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
                                        </svg>
                                </button>
                        </template>
                        <template #right>
                                <button class="save-all-button" @click="saveAllChanges" :disabled="!hasUnsavedChanges">
                                        保存
                                </button>
                        </template>
                </AppHeader>

                <main class="page-content content">
                        <!-- 现有人格预设列表 -->
                        <div class="personas-list">
                                <div
                                        class="persona-accordion"
                                        v-for="persona in userPersonas"
                                        :key="persona.id"
                                >
                                        <div class="persona-header" @click="togglePersonaExpanded(persona.id)">
                                                <div class="persona-info">
                                                        <div class="persona-avatar">
                                                                <img v-if="persona.avatar" :src="persona.avatar" :alt="persona.name">
                                                                <div v-else class="avatar-placeholder">{{ getInitial(persona.name) }}</div>
                                                        </div>
                                                        <div class="persona-name-section">
                                                                <div class="persona-name">{{ persona.name }}</div>
                                                                <div class="persona-realname" v-if="persona.realName">{{ persona.realName }}</div>
                                                        </div>
                                                </div>
                                                <div class="persona-header-actions">
                                                        <button
                                                                class="star-button"
                                                                :class="{ active: persona.isDefault }"
                                                                @click.stop="toggleDefault(persona.id)"
                                                                title="设为默认"
                                                        >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-star-fill" viewBox="0 0 16 16">
                                                                        <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.32 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
                                                                </svg>
                                                        </button>
                                                        <svg class="expand-icon" :class="{ rotated: expandedPersonas.includes(persona.id) }" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                                <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
                                                        </svg>
                                                </div>
                                        </div>

                                        <!-- 人格内容编辑区域 -->
                                        <transition name="accordion">
                                                <div v-show="expandedPersonas.includes(persona.id)" class="persona-content">
                                                        <div class="form-section">
                                                                <!-- 头像放在最上方 -->
                                                                <div class="form-group avatar-group">
                                                                        <label>头像</label>
                                                                        <div class="avatar-picker-container">
                                                                                <div class="avatar-picker" @click="pickAvatar(persona)">
                                                                                        <img v-if="persona.avatar" :src="persona.avatar" alt="头像">
                                                                                        <div v-else class="avatar-placeholder">{{ getInitial(persona.name) }}</div>
                                                                                        <div class="avatar-overlay">点击选择头像</div>
                                                                                </div>
                                                                        </div>
                                                                </div>

                                                                <div class="form-row">
                                                                        <div class="form-group">
                                                                                <label>昵称 *</label>
                                                                                <input v-model="persona.name" type="text" placeholder="输入昵称">
                                                                        </div>
                                                                        <div class="form-group">
                                                                                <label>真实姓名</label>
                                                                                <input v-model="persona.realName" type="text" placeholder="输入真实姓名">
                                                                        </div>
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
                                                                        <label>别名</label>
                                                                        <input v-model="persona.aliasesStr" type="text" placeholder="用逗号分隔多个别名">
                                                                </div>

                                                                <div class="form-group">
                                                                        <label>人格描述</label>
                                                                        <textarea v-model="persona.persona" placeholder="描述这个人格的特点、性格等" rows="4"></textarea>
                                                                </div>

                                                                <!-- 分组选择 -->
                                                                <div class="groups-accordion">
                                                                        <div class="groups-header" @click="toggleGroupsExpanded(persona.id)">
                                                                                <span>可见分组/群聊</span>
                                                                                <svg class="expand-icon" :class="{ rotated: expandedGroups.includes(persona.id) }" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                                                        <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
                                                                                </svg>
                                                                        </div>

                                                                        <transition name="accordion">
                                                                                <div v-if="expandedGroups.includes(persona.id)" class="groups-selection">
                                                                                        <div class="groups-grid">
                                                                                                <div
                                                                                                        class="group-item"
                                                                                                        v-for="group in availableGroups"
                                                                                                        :key="group.id"
                                                                                                >
                                                                                                        <input
                                                                                                                type="checkbox"
                                                                                                                :id="`group-${persona.id}-${group.id}`"
                                                                                                                :value="group.id"
                                                                                                                v-model="persona.groupIds"
                                                                                                                :disabled="isGroupBoundToOther(group.id, persona.id)"
                                                                                                        >
                                                                                                        <label :for="`group-${persona.id}-${group.id}`">{{ group.name }}</label>
                                                                                                        <span v-if="isGroupBoundToOther(group.id, persona.id)" class="bound-indicator">已绑定</span>
                                                                                                </div>
                                                                                                <div
                                                                                                        class="group-item"
                                                                                                        v-for="groupChat in groupChats"
                                                                                                        :key="groupChat.id"
                                                                                                >
                                                                                                        <input
                                                                                                                type="checkbox"
                                                                                                                :id="`groupChat-${persona.id}-${groupChat.id}`"
                                                                                                                :value="groupChat.id"
                                                                                                                v-model="persona.groupIds"
                                                                                                                :disabled="isGroupBoundToOther(groupChat.id, persona.id)"
                                                                                                        >
                                                                                                        <label :for="`groupChat-${persona.id}-${groupChat.id}`">{{ groupChat.name }} (群聊)</label>
                                                                                                        <span v-if="isGroupBoundToOther(groupChat.id, persona.id)" class="bound-indicator">已绑定</span>
                                                                                                </div>
                                                                                        </div>
                                                                                </div>
                                                                        </transition>
                                                                </div>

                                                                <!-- 删除按钮 -->
                                                                <div class="persona-actions">
                                                                        <button class="delete-button" @click="deletePersona(persona)" v-if="!persona.isNew">删除</button>
                                                                </div>
                                                        </div>
                                                </div>
                                        </transition>
                                </div>
                        </div>

                        <!-- 创建新人格预设按钮 -->
                        <button class="create-new-button" @click="createNewPersona">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-plus-circle" viewBox="0 0 16 16">
                                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                                        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                                </svg>
                                创建新的人格预设
                        </button>
                </main>
        </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useObservable } from '@vueuse/rxjs';
import { liveQuery } from 'dexie';
import { useRouter } from 'vue-router';
import db from '../services/database.js';
import AppHeader from '../components/layout/Header.vue';
import MainDropdown from '../components/ui/MainDropdown.vue';
import { showToast, showConfirm, showUploadChoiceModal, showAvatarPickerModal } from '../services/uiService.js';
import { setDefaultUserPersona } from '../services/userPersonaService.js';

const router = useRouter();

const userPersonas = ref([]);
const expandedPersonas = ref([]);
const expandedGroups = ref([]);
const hasUnsavedChanges = ref(false);
const originalPersonas = ref([]);

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

// 返回上一页
const goBack = () => {
        router.back();
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

// 检查是否有未保存的更改
const checkForChanges = () => {
        const currentData = JSON.stringify(userPersonas.value.map(p => ({
                id: p.id,
                name: p.name,
                realName: p.realName,
                gender: p.gender,
                birthday: p.birthday,
                aliasesStr: p.aliasesStr,
                persona: p.persona,
                avatar: p.avatar,
                groupIds: p.groupIds,
                isDefault: p.isDefault
        })));

        const originalData = JSON.stringify(originalPersonas.value.map(p => ({
                id: p.id,
                name: p.name,
                realName: p.realName,
                gender: p.gender,
                birthday: p.birthday,
                aliasesStr: p.aliasesStr,
                persona: p.persona,
                avatar: p.avatar,
                groupIds: p.groupIds,
                isDefault: p.isDefault
        })));

        hasUnsavedChanges.value = currentData !== originalData;
};

// 保存所有更改
const saveAllChanges = async () => {
        try {
                let successCount = 0;
                let errorCount = 0;

                for (const persona of userPersonas.value) {
                        try {
                                if (!persona.name) {
                                        showToast(`"${persona.realName || '未命名'}" 的昵称不能为空`, 'error');
                                        errorCount++;
                                        continue;
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
                                } else {
                                        // 更新现有人格预设
                                        await db.actors.update(persona.id, dataToSave);
                                }

                                successCount++;
                        } catch (error) {
                                console.error(`保存人格预设失败 (${persona.name}):`, error);
                                errorCount++;
                        }
                }

                // 更新原始数据
                originalPersonas.value = JSON.parse(JSON.stringify(userPersonas.value));
                hasUnsavedChanges.value = false;

                if (errorCount === 0) {
                        showToast(`成功保存 ${successCount} 个人格预设`, 'success');
                } else {
                        showToast(`保存完成：${successCount} 成功，${errorCount} 失败`, errorCount > 0 ? 'error' : 'success');
                }
        } catch (error) {
                console.error('批量保存失败:', error);
                showToast('保存失败', 'error');
        }
};// 加载用户人格预设
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

                // 保存原始数据用于比较
                originalPersonas.value = JSON.parse(JSON.stringify(userPersonas.value));

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
                        }
                        checkForChanges();
                        showToast('已设为默认人格', 'success');
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
                        checkForChanges();
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
                        showToast('创建成功', 'success');
                } else {
                        // 更新现有人格预设
                        await db.actors.update(persona.id, dataToSave);
                        showToast('保存成功', 'success');
                }
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
                        const index = userPersonas.value.indexOf(persona);
                        if (index > -1) {
                                userPersonas.value.splice(index, 1);
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
        checkForChanges();
};

onMounted(() => {
        loadUserPersonas();
});

// 监听人格数据变化
watch(userPersonas, () => {
        checkForChanges();
}, { deep: true });
</script>

<style scoped>
.page-container {
        display: flex;
        flex-direction: column;
        height: 100vh;
        background-color: var(--bg-primary);
}

.back-button {
        background: none;
        border: none;
        color: var(--text-primary);
        cursor: pointer;
        padding: 8px;
        border-radius: 6px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
}

.back-button:hover {
        color: var(--accent-primary);
}

.save-all-button {
        border: none;
        color: white;
        cursor: pointer;
        padding: 8px 16px;
        border-radius: 6px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
        font-weight: 500;
}

.save-all-button:disabled {
        color: var(--text-secondary);
        cursor: not-allowed;
        background-color: transparent;
}

.page-content {
        flex: 1;
        overflow-y: auto;
        padding-left: 20px;
        padding-right: 20px;
}

.personas-list {
        margin-bottom: 10px;
        margin-top: 0px;
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
        padding: 20px;
        background-color: var(--bg-primary);
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

/* iOS Safari 日期输入框修复 */
.form-group input[type="date"] {
        -webkit-appearance: none;
        appearance: none;
        height: 44px; /* 确保与iOS Safari的触摸目标一致 */
        min-height: 44px;
        padding: 10px 12px;
        font-size: 16px; /* 防止iOS Safari自动缩放 */
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
        outline: none;
        border-color: var(--accent-primary);
        box-shadow: var(--accent-glow-shadow);
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

.groups-selection {
        padding: 16px;
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
        background-color: var(--bg-primary);
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
}

.group-item:hover {
        background-color: var(--bg-card);
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
        .page-content {
                padding-left: 15px;
                padding-right: 15px;
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
