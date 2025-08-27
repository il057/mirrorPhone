<template>
        <div class="page-container">
                <AppHeader :title="isNew ? '创建新角色' : '编辑资料'">
                        <template #left>
                                <button class="header-action-button" @click="handleBack">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                                stroke-width="1.5" stroke="currentColor" width="24" height="24">
                                                <path stroke-linecap="round" stroke-linejoin="round"
                                                        d="M15.75 19.5L8.25 12l7.5-7.5" />
                                        </svg>
                                </button>
                        </template>
                        <template #right>
                                <button @click="saveChanges" class="header-action-button">保存</button>
                        </template>
                </AppHeader>

                <main class="edit-content content" v-if="actor">
                        <!-- 头像部分 -->
                        <section class="form-section avatar-section">
                                <div class="avatar-wrapper">
                                        <div class="avatar">
                                                <span class="avatar-initial">{{ getInitial(actor.name) }}</span>
                                        </div>
                                </div>
                                <p class="avatar-prompt">更换头像</p>
                        </section>

                        <!-- 基本信息与人设 -->
                        <AccordionItem title="基本信息与人设" :default-expanded="true">
                                <div class="form-group">
                                        <label for="nickname">昵称</label>
                                        <input id="nickname" type="text" v-model="actor.name" placeholder="必填" />
                                </div>
                                <div class="form-group">
                                        <label for="realName">名字</label>
                                        <input id="realName" type="text" v-model="actor.realName" />
                                </div>
                                <div class="form-group">
                                        <label for="birthday">生日</label>
                                        <input id="birthday" type="date" v-model="actor.birthday" />
                                </div>
                                <div class="form-group">
                                        <label for="gender">性别</label>
                                        <MainDropdown
                                                v-model="actor.gender"
                                                :options="genderOptions"
                                                placeholder="选择性别"
                                        />
                                </div>
                                <div class="form-group dropdown-group">
                                        <label for="group">分组</label>
                                        <MainDropdown
                                                v-model="actor.groupIds[0]"
                                                :options="groupOptions"
                                                placeholder="选择分组"
                                                @change="handleGroupChange"
                                        />
                                </div>
                                <div class="form-group textarea-group">
                                        <label for="persona">人设描述</label>
                                        <textarea 
                                                id="persona" 
                                                v-model="actor.persona" 
                                                rows="8"
                                                placeholder="描述角色的性格、背景、特点等..."
                                        ></textarea>
                                </div>
                        </AccordionItem>

                        <!-- 单人世界书 -->
                        <AccordionItem title="单人世界书">
                                <div class="worldbook-section">
                                        <p class="section-description">
                                                为此角色选择专属的世界书，这些世界书只对该角色有效。
                                        </p>
                                        <CheckboxList
                                                v-model="actor.worldbookIds"
                                                :options="worldbookOptions"
                                                @change="handleWorldbookChange"
                                        />
                                        <button @click="openWorldbookManagement" class="secondary-btn">
                                                管理世界书
                                        </button>
                                </div>
                        </AccordionItem>

                        <!-- 初始关系设定/好感印象 -->
                        <AccordionItem v-if="isNew" title="初始关系设定" :default-expanded="true">
                                <div class="relationship-section">
                                        <!-- 对你的初始好感度 -->
                                        <div class="relationship-item">
                                                <h4>对你的好感度</h4>
                                                <RangeSlider
                                                        v-model="initialUserRelationship.score"
                                                        :min="-1000"
                                                        :max="1000"
                                                        label="好感度"
                                                />
                                        </div>
                                        
                                        <!-- 对你的关系 -->
                                        <div class="form-group">
                                                <label for="userRelationType">对你的关系</label>
                                                <input 
                                                        id="userRelationType" 
                                                        type="text" 
                                                        v-model="initialUserRelationship.type"
                                                        placeholder="例如：朋友、恋人、陌生人..."
                                                />
                                        </div>
                                </div>
                        </AccordionItem>

                        <!-- 好感印象与记忆管理（编辑模式） -->
                        <AccordionItem v-else title="好感印象与记忆管理">
                                <div class="impression-section">
                                        <!-- 对你的好感度（只读） -->
                                        <div class="relationship-display">
                                                <h4>对你的好感度</h4>
                                                <div class="score-display">
                                                        <span class="score-value">{{ userRelationship?.score || 0 }}</span>
                                                        <div class="score-bar">
                                                                <div 
                                                                        class="score-fill"
                                                                        :style="{ width: getScorePercentage(userRelationship?.score || 0) }"
                                                                ></div>
                                                        </div>
                                                </div>
                                                <p class="relationship-type">关系：{{ userRelationship?.type || '未设置' }}</p>
                                        </div>

                                        <!-- 印象标签 -->
                                        <div class="tags-section">
                                                <h4>印象标签</h4>
                                                <TagsManager
                                                        v-model:tags="userRelationship.tags"
                                                        :editable="true"
                                                        @tag-added="handleTagAdded"
                                                        @tag-removed="handleTagRemoved"
                                                        @tag-edited="handleTagEdited"
                                                />
                                        </div>

                                        <!-- 记忆摘要管理 -->
                                        <div class="memory-section">
                                                <h4>记忆摘要管理</h4>
                                                <div class="placeholder-content">
                                                        <p>此功能待开发。</p>
                                                </div>
                                        </div>
                                </div>
                        </AccordionItem>

                        <!-- 聊天设置 -->
                        <AccordionItem title="聊天设置">
                                <div class="chat-settings-section">
                                        <!-- 聊天背景 -->
                                        <div class="setting-item">
                                                <h4>聊天背景</h4>
                                                <div class="placeholder-content">
                                                        <p>此功能待开发。</p>
                                                </div>
                                        </div>

                                        <!-- 聊天气泡样式 -->
                                        <div class="setting-item">
                                                <h4>聊天气泡样式</h4>
                                                <div class="placeholder-content">
                                                        <p>此功能待开发。</p>
                                                </div>
                                        </div>
                                </div>
                        </AccordionItem>

                        <!-- 高级设置 -->
                        <AccordionItem title="高级设置">
                                <div class="advanced-settings-section">
                                        <!-- 上下文记忆条数 -->
                                        <div class="setting-item">
                                                <h4>上下文记忆条数</h4>
                                                <div class="memory-settings">
                                                        <div class="memory-setting-row">
                                                                <label>私聊</label>
                                                                <input 
                                                                        type="number" 
                                                                        v-model.number="actor.contextMemorySettings.privateChat"
                                                                        min="1"
                                                                        max="200"
                                                                        class="memory-input"
                                                                />
                                                        </div>
                                                        <div class="memory-setting-row">
                                                                <label>群聊</label>
                                                                <input 
                                                                        type="number" 
                                                                        v-model.number="actor.contextMemorySettings.groupChat"
                                                                        min="1"
                                                                        max="100"
                                                                        class="memory-input"
                                                                />
                                                        </div>
                                                        <div class="memory-setting-row">
                                                                <label>记忆</label>
                                                                <input 
                                                                        type="number" 
                                                                        v-model.number="actor.contextMemorySettings.memory"
                                                                        min="1"
                                                                        max="20"
                                                                        class="memory-input"
                                                                />
                                                        </div>
                                                        <div class="memory-setting-row">
                                                                <label>日记</label>
                                                                <input 
                                                                        type="number" 
                                                                        v-model.number="actor.contextMemorySettings.diary"
                                                                        min="1"
                                                                        max="20"
                                                                        class="memory-input"
                                                                />
                                                        </div>
                                                        <div class="memory-setting-row">
                                                                <label>回忆</label>
                                                                <input 
                                                                        type="number" 
                                                                        v-model.number="actor.contextMemorySettings.recall"
                                                                        min="1"
                                                                        max="20"
                                                                        class="memory-input"
                                                                />
                                                        </div>
                                                        <div class="memory-setting-row">
                                                                <label>动态</label>
                                                                <input 
                                                                        type="number" 
                                                                        v-model.number="actor.contextMemorySettings.moments"
                                                                        min="1"
                                                                        max="20"
                                                                        class="memory-input"
                                                                />
                                                        </div>
                                                </div>
                                        </div>

                                        <!-- 语音设定 -->
                                        <div class="setting-item">
                                                <h4>语音设定</h4>
                                                <div class="placeholder-content">
                                                        <p>此功能待开发。</p>
                                                </div>
                                        </div>
                                </div>
                        </AccordionItem>

                        <!-- 危险操作 -->
                        <section v-if="!isNew" class="form-section danger-zone">
                                <button class="danger-btn">拉黑</button>
                                <button class="danger-btn">清空聊天记录</button>
                                <button @click="deleteCharacter" class="danger-btn delete">删除角色</button>
                        </section>
                </main>
        </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useObservable } from '@vueuse/rxjs';
import { liveQuery } from 'dexie';
import db from '../services/database.js';
import AppHeader from '../components/layout/Header.vue';
import MainDropdown from '../components/ui/MainDropdown.vue';
import AccordionItem from '../components/ui/AccordionItem.vue';
import RangeSlider from '../components/ui/RangeSlider.vue';
import TagsManager from '../components/ui/TagsManager.vue';
import CheckboxList from '../components/ui/CheckboxList.vue';
import { showToast, showConfirm, showWorldbookEditModal, showManageGroupsModal } from '../services/uiService.js';
import { USER_ACTOR_ID } from '../services/database.js';

const route = useRoute();
const router = useRouter();

const actorId = ref(route.params.id);
const isNew = computed(() => !actorId.value);

const actor = ref(null);

// 获取当前用户ID（使用统一的用户标识符）
const currentUserId = USER_ACTOR_ID;

// 获取可用分组
const availableGroups = useObservable(
        liveQuery(() => db.groups.filter(g => g.id !== 'group_special').toArray()),
        { initialValue: [] }
);

// 获取世界书数据
const allWorldbooks = useObservable(
        liveQuery(() => db.worldbooks.toArray()),
        { initialValue: [] }
);

// 获取分组已绑定的世界书
const groupWorldbooks = useObservable(
        liveQuery(() => db.groups.toArray()),
        { initialValue: [] }
);

// 关系数据
const initialUserRelationship = ref({
        score: 0,
        type: '朋友'
});

const userRelationship = ref({
        score: 0,
        type: '',
        tags: []
});

// 下拉菜单选项
const genderOptions = [
        { label: '男', value: '男' },
        { label: '女', value: '女' },
        { label: '未知', value: '未知' },
        { label: '自定义...', value: 'custom' }
];

const groupOptions = computed(() => {
        const options = [
                { label: '未分组', value: undefined }
        ];
        
        // 添加现有分组
        availableGroups.value.forEach(group => {
                options.push({
                        label: group.name,
                        value: group.id
                });
        });
        
        // 添加新建分组选项
        options.push({
                label: '新建分组...',
                value: 'new_group'
        });
        
        return options;
});

// 世界书选项
const worldbookOptions = computed(() => {
        const currentGroupId = actor.value?.groupIds?.[0];
        const groupBindings = groupWorldbooks.value.find(g => g.id === currentGroupId)?.worldbookIds || [];
        
        return allWorldbooks.value.map(wb => ({
                label: wb.name,
                value: wb.id,
                disabled: groupBindings.includes(wb.id),
                description: groupBindings.includes(wb.id) ? '(已通过分组绑定)' : ''
        }));
});

// 监听分组变化，更新世界书选项
watch(() => actor.value?.groupIds?.[0], async (newGroupId) => {
        // 这里可以添加分组变化时的逻辑
        console.log('分组已变更为:', newGroupId);
}, { immediate: true });

const getInitial = (name) => {
        if (!name) return '#';
        return name.charAt(0).toUpperCase();
};

watch(() => actor.value?.gender, (newGender) => {
        if (newGender === 'custom') {
                const customGender = prompt('请输入自定义性别:');
                actor.value.gender = customGender || '';
        }
});

// 处理分组变化
const handleGroupChange = async (option) => {
        if (option.value === 'new_group') {
                const groupName = prompt('请输入新分组的名称:');
                if (groupName) {
                        try {
                                const newGroupId = await db.groups.add({
                                        id: `group_${Date.now()}`,
                                        name: groupName,
                                        order: (await db.groups.orderBy('order').last())?.order + 1 || 1
                                });
                                actor.value.groupIds = [newGroupId];
                        } catch (error) {
                                console.error('创建分组失败:', error);
                                showToast('创建分组失败', 'error');
                                actor.value.groupIds = [undefined]; // 回退到未分组
                        }
                } else {
                        actor.value.groupIds = [undefined]; // 取消时回退到未分组
                }
        }
};

// 世界书相关方法
const handleWorldbookChange = (selectedIds) => {
        // 确保 actor.worldbookIds 存在
        if (!actor.value.worldbookIds) {
                actor.value.worldbookIds = [];
        }
        actor.value.worldbookIds = selectedIds;
};

const openWorldbookManagement = () => {
        showManageGroupsModal('worldbookGroups');
};

// 关系管理方法
const getScorePercentage = (score) => {
        const percentage = ((score + 1000) / 2000) * 100;
        return `${Math.max(0, Math.min(100, percentage))}%`;
};

// 标签管理方法
const handleTagAdded = async (tag) => {
        if (!isNew.value) {
                await updateRelationshipTags();
        }
};

const handleTagRemoved = async (tagName) => {
        if (!isNew.value) {
                await updateRelationshipTags();
        }
};

const handleTagEdited = async ({ oldTag, newTag }) => {
        if (!isNew.value) {
                await updateRelationshipTags();
        }
};

const updateRelationshipTags = async () => {
        if (!userRelationship.value) return;
        
        try {
                await db.relationships
                        .where(['sourceId', 'targetId'])
                        .equals([actorId.value, currentUserId])
                        .modify({ tags: userRelationship.value.tags || [] });
        } catch (error) {
                console.error('更新标签失败:', error);
                showToast('更新标签失败', 'error');
        }
};

// 加载数据
onMounted(async () => {
        if (isNew.value) {
                actor.value = {
                        name: '',
                        realName: '',
                        birthday: '',
                        gender: '男',
                        groupIds: [],
                        persona: '',
                        specialCare: 0,
                        isGroup: 0,
                        worldbookIds: [],
                        contextMemorySettings: {
                                privateChat: 50,
                                groupChat: 20,
                                memory: 2,
                                diary: 2,
                                recall: 3,
                                moments: 3
                        }
                };
        } else {
                const data = await db.actors.get(actorId.value);
                if (data) {
                        actor.value = { ...data };
                        if (!Array.isArray(actor.value.groupIds)) {
                                actor.value.groupIds = [];
                        }
                        if (!Array.isArray(actor.value.worldbookIds)) {
                                actor.value.worldbookIds = [];
                        }
                        // 确保上下文记忆设置存在
                        if (!actor.value.contextMemorySettings) {
                                actor.value.contextMemorySettings = {
                                        privateChat: 50,
                                        groupChat: 20,
                                        memory: 2,
                                        diary: 2,
                                        recall: 3,
                                        moments: 3
                                };
                        }
                        
                        // 加载关系数据（角色对你的关系）
                        const relationship = await db.relationships
                                .where('sourceId')
                                .equals(actorId.value)
                                .and(rel => rel.targetId === currentUserId)
                                .first();
                        
                        if (relationship) {
                                userRelationship.value = {
                                        score: relationship.score || 0,
                                        type: relationship.type || '',
                                        tags: relationship.tags || []
                                };
                        } else {
                                userRelationship.value = {
                                        score: 0,
                                        type: '',
                                        tags: []
                                };
                        }
                } else {
                        showToast('找不到该角色', 'error');
                        router.push('/');
                }
        }
});

const saveChanges = async () => {
        if (!actor.value.name) {
                showToast('昵称不能为空', 'error');
                return;
        }
        
        try {
                // 只保存可克隆的普通对象和数组
                const dataToSave = JSON.parse(JSON.stringify({
                        ...actor.value,
                        groupIds: actor.value.groupIds?.[0] ? [actor.value.groupIds[0]] : [],
                        worldbookIds: Array.isArray(actor.value.worldbookIds) ? [...actor.value.worldbookIds] : []
                }));
                
                if (isNew.value) {
                        dataToSave.id = `char_${Date.now()}`;
                        await db.actors.add(dataToSave);
                        
                        // 简单创建基本关系
                        try {
                                await db.relationships.add({
                                        sourceId: dataToSave.id,
                                        targetId: currentUserId,
                                        score: initialUserRelationship.value.score,
                                        type: initialUserRelationship.value.type
                                });
                        } catch (relationError) {
                                console.warn('创建关系失败，但角色已创建:', relationError);
                        }
                        
                        showToast('角色创建成功', 'success');
                        router.push(`/profile/${dataToSave.id}`);
                } else {
                        await db.actors.put(dataToSave);
                        showToast('资料保存成功', 'success');
                        router.push(`/profile/${actorId.value}`);
                }
        } catch (error) {
                showToast(`保存失败: ${error.message}`, 'error');
                console.error(error);
        }
};

const deleteCharacter = async () => {
        const confirmed = await showConfirm(
                '删除角色',
                `确定要永久删除角色 "${actor.value.name}" 吗？所有相关数据（聊天记录、记忆等）都将被清除，此操作无法撤销。`
        );
        if (confirmed) {
                try {
                        await db.transaction('rw', db.actors, db.conversations, db.events, db.relationships, db.memories, async () => {
                                const id = actorId.value;
                                await db.actors.delete(id);
                                await db.conversations.delete(id);
                                await db.events.where({ actorId: id }).delete();
                                await db.events.where({ contextId: id }).delete();
                                await db.relationships.where({ sourceId: id }).or('targetId').equals(id).delete();
                                await db.memories.where({ actorId: id }).delete();
                        });
                        showToast('角色已删除', 'success');
                        router.push('/chat/contacts');
                } catch (error) {
                        showToast(`删除失败: ${error.message}`, 'error');
                        console.error(error);
                }
        }
};

// 处理返回导航
const handleBack = () => {
        // 检查是否从profile页面来的
        const fromProfile = route.query.from === 'profile';
        
        if (!isNew.value && actorId.value) {
                // 编辑模式
                if (fromProfile) {
                        // 从profile来的，返回到profile页面并添加标识避免循环
                        router.push(`/profile/${actorId.value}?from=edit`);
                } else {
                        // 其他来源，返回上一页或联系人页面
                        if (window.history.length > 1) {
                                router.back();
                        } else {
                                router.push('/chat/contacts');
                        }
                }
        } else {
                // 新建模式，返回联系人页面
                router.push('/chat/contacts');
        }
};
</script>

<style scoped>
.header-action-button {
        font-size: 16px;
        font-weight: 600;
        color: var(--accent-primary);
        background: none;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 8px;
}

.header-action-button svg {
        width: 24px;
        height: 24px;
}

.edit-content {
        flex-grow: 1;
        overflow-y: auto;
        padding: 20px;
        padding-top: calc(var(--header-height) + 20px);
        padding-bottom: 50px;
}

/* 头像部分 */
.avatar-section {
        background: none;
        padding: 0;
        text-align: center;
        margin-bottom: 30px;
}

.avatar-wrapper .avatar {
        width: 100px;
        height: 100px;
        border-radius: 12px;
        display: flex;
        justify-content: center;
        align-items: center;
        font-weight: bold;
        margin: 0 auto;
}

.avatar-initial {
        color: var(--accent-primary);
        font-size: 50px;
}

.avatar-prompt {
        color: var(--accent-primary);
        font-size: 14px;
        margin-top: 10px;
        cursor: pointer;
}

/* 表单组件 */
.form-group {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid var(--border-color);
        position: relative;
}

.form-group:last-child {
        border-bottom: none;
}

.textarea-group {
        flex-direction: column;
        align-items: flex-start;
}

/* 确保下拉菜单有足够的 z-index */
.dropdown-group {
        z-index: 100;
        position: relative;
}

.form-group label {
        color: var(--text-primary);
        font-weight: 500;
        margin-bottom: 0;
}

.form-group input,
.form-group textarea {
        flex-grow: 1;
        padding: 8px 12px;
        border-radius: 6px;
        border: 1px solid var(--border-color);
        background-color: var(--bg-secondary);
        color: var(--text-primary);
        text-align: right;
        font-size: 16px;
        transition: all 0.2s ease;
}

.form-group input::placeholder,
.form-group textarea::placeholder {
        color: var(--text-secondary);
}

.form-group textarea {
        width: 100%;
        box-sizing: border-box;
        text-align: left;
        margin-top: 10px;
        height: 120px;
        resize: vertical;
}

.form-group input:focus,
.form-group textarea:focus {
        outline: none;
        border-color: var(--accent-primary);
        box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

/* 部分样式 */
.section-description {
        color: var(--text-secondary);
        font-size: 14px;
        margin-bottom: 15px;
        line-height: 1.5;
}

.placeholder-content {
        text-align: center;
        color: var(--text-secondary);
        padding: 20px;
}

/* 世界书部分 */
.worldbook-section {
        padding: 0;
}

.secondary-btn {
        padding: 8px 16px;
        background-color: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        color: var(--text-primary);
        cursor: pointer;
        font-size: 14px;
        margin-top: 15px;
        transition: all 0.2s ease;
}

.secondary-btn:hover {
        background-color: var(--bg-primary);
        border-color: var(--accent-primary);
}

/* 关系设定部分 */
.relationship-section {
        padding: 0;
}

.relationship-item {
        margin-bottom: 25px;
}

.relationship-item h4 {
        margin: 0 0 15px 0;
        color: var(--text-primary);
        font-size: 16px;
}

/* 好感印象部分 */
.impression-section {
        padding: 0;
}

.relationship-display {
        background-color: var(--bg-secondary);
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 20px;
}

.relationship-display h4 {
        margin: 0 0 15px 0;
        color: var(--text-primary);
        font-size: 16px;
}

.score-display {
        display: flex;
        align-items: center;
        gap: 15px;
        margin-bottom: 10px;
}

.score-value {
        font-size: 24px;
        font-weight: 600;
        color: var(--accent-primary);
        min-width: 60px;
}

.score-bar {
        flex: 1;
        height: 8px;
        background-color: var(--bg-primary);
        border-radius: 4px;
        overflow: hidden;
        position: relative;
}

.score-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--accent-lighter) 0%, var(--accent-primary) 50%, var(--accent-darker) 100%);
        transition: width 0.3s ease;
        border-radius: 4px;
}

.relationship-type {
        color: var(--text-secondary);
        font-size: 14px;
        margin: 0;
}

.tags-section h4 {
        margin: 0 0 15px 0;
        color: var(--text-primary);
        font-size: 16px;
}

/* 设置项样式 */
.setting-item {
        margin-bottom: 25px;
}

.setting-item:last-child {
        margin-bottom: 0;
}

.setting-item h4 {
        margin: 0 0 15px 0;
        color: var(--text-primary);
        font-size: 16px;
}

.chat-settings-section,
.advanced-settings-section {
        padding: 0;
}

.memory-section {
        margin-top: 25px;
        padding-top: 20px;
        border-top: 1px solid var(--border-color);
}

.memory-section h4 {
        margin: 0 0 15px 0;
        color: var(--text-primary);
        font-size: 16px;
}

/* 危险操作区域 */
.danger-zone {
        background: none;
        padding: 0;
        margin-top: 30px;
}

.danger-btn {
        width: 100%;
        text-align: center;
        padding: 15px;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        cursor: pointer;
        background-color: var(--bg-card);
        color: var(--text-primary);
        margin-bottom: 10px;
        transition: all 0.2s ease;
}

.danger-btn:hover {
        background-color: var(--bg-secondary);
}

.danger-btn.delete {
        color: #f44336;
}

.danger-btn.delete:hover {
        background-color: rgba(244, 67, 54, 0.1);
}

/* 记忆设置样式 */
.memory-settings {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin-top: 1rem;
}

.memory-item {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
}

.memory-item label {
        font-weight: 500;
        font-size: 0.9rem;
        color: var(--text-secondary);
}

.memory-input {
        padding: 0.5rem;
        border: 1px solid var(--border-light);
        border-radius: 8px;
        background: var(--bg-card);
        color: var(--text-primary);
        font-size: 0.9rem;
        text-align: center;
}

.memory-input:focus {
        outline: none;
        border-color: var(--accent-primary);
        box-shadow: 0 0 0 2px var(--accent-primary)20;
}

/* 响应式设计 */
@media (max-width: 768px) {
        .edit-content {
                padding: 15px;
                padding-top: calc(var(--header-height) + 15px);
        }
        
        .form-group {
                flex-direction: column;
                align-items: flex-start;
                gap: 8px;
        }
        
        .form-group input {
                text-align: left;
                width: 100%;
                box-sizing: border-box;
        }
        
        .relationship-controls {
                gap: 12px;
        }
        
        .score-display {
                flex-direction: column;
                align-items: flex-start;
                gap: 10px;
        }
}
</style>