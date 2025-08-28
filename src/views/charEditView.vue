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
                                <div class="avatar-wrapper" @click="openAvatarPicker">
                                        <div class="avatar">
                                                <img v-if="actor.currentAvatar" :src="actor.currentAvatar"
                                                        :alt="actor.name" class="avatar-image">
                                                <span v-else class="avatar-initial">{{ getInitial(actor.name) }}</span>
                                        </div>
                                </div>
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
                                        <MainDropdown v-model="actor.gender" :options="genderOptions"
                                                placeholder="选择性别" />
                                </div>
                                <div class="form-group dropdown-group">
                                        <label for="group">分组</label>
                                        <MainDropdown v-model="actor.groupIds[0]" :options="groupOptions"
                                                placeholder="选择分组" @change="handleGroupChange" />
                                </div>
                                <div class="form-group textarea-group">
                                        <label for="persona">人设描述</label>
                                        <textarea id="persona" v-model="actor.persona" rows="8"
                                                placeholder="描述角色的性格、背景、特点等..."></textarea>
                                </div>
                        </AccordionItem>

                        <!-- 单人世界书 -->
                        <AccordionItem title="单人世界书">
                                <div class="worldbook-section">
                                        <p class="section-description">
                                                为此角色选择专属的世界书分组，这些世界书只对该角色有效。
                                        </p>
                                        <CheckboxList v-model="actor.worldbookGroupIds" :options="worldbookOptions"
                                                @change="handleWorldbookChange" />
                                </div>
                        </AccordionItem>

                        <!-- 初始关系设定/好感印象 -->
                        <AccordionItem v-if="isNew" title="初始关系设定" :default-expanded="true">
                                <div class="relationship-section">
                                        <!-- 对你的初始好感度 -->
                                        <div class="relationship-item">
                                                <h4>对你的好感度</h4>
                                                <RangeSlider v-model="initialUserRelationship.score" :min="-1000"
                                                        :max="1000" label="好感度" />
                                        </div>

                                        <!-- 对你的关系 -->
                                        <div class="form-group">
                                                <label for="userRelationType">对你的关系</label>
                                                <input id="userRelationType" type="text"
                                                        v-model="initialUserRelationship.type"
                                                        placeholder="例如：朋友、恋人、陌生人..." />
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
                                                        <span class="score-value">{{ userRelationship?.score || 0
                                                                }}</span>
                                                        <div class="score-bar">
                                                                <div class="score-fill"
                                                                        :style="{ width: getScorePercentage(userRelationship?.score || 0) }">
                                                                </div>
                                                        </div>
                                                </div>
                                                <p class="relationship-type">关系：{{ userRelationship?.type || '未设置' }}
                                                </p>
                                        </div>

                                        <!-- 印象标签 -->
                                        <div class="tags-section">
                                                <h4>印象标签</h4>
                                                <TagsManager v-model:tags="userRelationship.tags" :editable="true"
                                                        :allowAdd="false" @tag-added="handleTagAdded"
                                                        @tag-removed="handleTagRemoved" @tag-edited="handleTagEdited" />
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
                                        <!-- 聊天预览 -->
                                        <div class="setting-item">
                                                <h4>聊天预览</h4>
                                                <div class="chat-preview-wrapper">
                                                        <div class="chat-preview"
                                                                :style="{ backgroundImage: chatBackground ? `url(${chatBackground})` : 'none' }">
                                                                <!-- 用户消息气泡 -->
                                                                <div class="message-bubble user-message">
                                                                        <div class="avatar-mini">
                                                                                <img v-if="userAvatar" :src="userAvatar"
                                                                                        alt="你"
                                                                                        class="avatar-image-mini">
                                                                                <span v-else
                                                                                        class="avatar-initial-mini">你</span>
                                                                        </div>
                                                                        <div class="message-content" :style="{ 
                                                                                        backgroundColor: currentBubbleStyle.userBubbleBg,
                                                                                        color: currentBubbleStyle.userBubbleText
                                                                                }">示例消息</div>
                                                                </div>
                                                                <!-- 角色消息气泡 -->
                                                                <div class="message-bubble char-message">
                                                                        <div class="avatar-mini">
                                                                                <img v-if="actor.currentAvatar"
                                                                                        :src="actor.currentAvatar"
                                                                                        :alt="actor.name"
                                                                                        class="avatar-image-mini">
                                                                                <span v-else
                                                                                        class="avatar-initial-mini">{{
                                                                                        getInitial(actor.name) }}</span>
                                                                        </div>
                                                                        <div class="message-content" :style="{ 
                                                                                        backgroundColor: currentBubbleStyle.charBubbleBg,
                                                                                        color: currentBubbleStyle.charBubbleText
                                                                                }">角色回复示例</div>
                                                                </div>
                                                        </div>
                                                </div>
                                        </div>

                                        <!-- 聊天背景 -->
                                        <div class="setting-item">
                                                <h4>聊天背景</h4>
                                                <div class="background-settings">
                                                        <div class="current-background">
                                                                <span>当前背景：</span>
                                                                <span class="background-type">{{ getChatBackgroundType()
                                                                        }}</span>
                                                                <button @click="changeChatBackground"
                                                                        class="change-background-btn">修改</button>
                                                        </div>
                                                </div>
                                        </div>

                                        <!-- 聊天气泡样式 -->
                                        <div class="setting-item">
                                                <div class="setting-header">
                                                        <h4>聊天气泡样式</h4>
                                                        <button v-if="!isEditingBubblePresets" @click="toggleEditMode"
                                                                class="edit-presets-btn">
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                                                                        viewBox="0 0 24 24" stroke-width="1.5"
                                                                        stroke="currentColor">
                                                                        <path stroke-linecap="round"
                                                                                stroke-linejoin="round"
                                                                                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                                </svg>
                                                        </button>
                                                        <button v-else @click="exitEditMode"
                                                                class="edit-presets-btn done">
                                                                完成
                                                        </button>
                                                </div>
                                                <div class="bubble-style-section">
                                                        <!-- 预设区域 -->
                                                        <div class="preset-grid">
                                                                <!-- 添加新预设按钮 -->
                                                                <div class="preset-item add-preset"
                                                                        @click="toggleBubbleEditor"
                                                                        :class="{ active: isAddingBubblePreset }">
                                                                        <div class="add-icon">+</div>
                                                                        <span>添加预设</span>
                                                                </div>

                                                                <!-- 现有预设 -->
                                                                <div v-for="preset in bubbleStylePresets"
                                                                        :key="preset.name"
                                                                        class="preset-item bubble-preset"
                                                                        :class="{ active: activeBubblePreset?.name === preset.name }"
                                                                        @click="selectBubblePreset(preset)">
                                                                        <!-- 删除按钮（编辑模式下显示） -->
                                                                        <button v-if="isEditingBubblePresets && !preset.isDefault"
                                                                                @click.stop="deleteBubblePreset(preset)"
                                                                                class="delete-preset-btn">
                                                                                <svg xmlns="http://www.w3.org/2000/svg"
                                                                                        fill="none" viewBox="0 0 24 24"
                                                                                        stroke-width="1.5"
                                                                                        stroke="currentColor">
                                                                                        <path stroke-linecap="round"
                                                                                                stroke-linejoin="round"
                                                                                                d="M6 18L18 6M6 6l12 12" />
                                                                                </svg>
                                                                        </button>

                                                                        <div class="bubble-preview-gradient" :style="{ 
                                                                                background: `linear-gradient(45deg, ${preset.charBubbleBg} 0%, ${preset.userBubbleBg} 33%, ${preset.userBubbleText} 66%, ${preset.charBubbleText} 100%)`
                                                                        }"></div>
                                                                        <span class="preset-name">{{ preset.name
                                                                                }}</span>
                                                                </div>
                                                        </div>

                                                        <!-- 颜色编辑器（展开时显示） -->
                                                        <div v-if="isAddingBubblePreset"
                                                                class="bubble-color-editor-minimal">
                                                                <div class="color-inputs-row">
                                                                        <input type="color"
                                                                                v-model="editableBubbleStyle.charBubbleBg"
                                                                                @input="handleBubbleStyleChange"
                                                                                class="color-picker-mini"
                                                                                title="角色气泡背景" />
                                                                        <input type="color"
                                                                                v-model="editableBubbleStyle.charBubbleText"
                                                                                @input="handleBubbleStyleChange"
                                                                                class="color-picker-mini"
                                                                                title="角色气泡文字" />
                                                                        <input type="color"
                                                                                v-model="editableBubbleStyle.userBubbleBg"
                                                                                @input="handleBubbleStyleChange"
                                                                                class="color-picker-mini"
                                                                                title="用户气泡背景" />
                                                                        <input type="color"
                                                                                v-model="editableBubbleStyle.userBubbleText"
                                                                                @input="handleBubbleStyleChange"
                                                                                class="color-picker-mini"
                                                                                title="用户气泡文字" />
                                                                </div>

                                                                <!-- 保存按钮 -->
                                                                <button @click="saveBubblePreset"
                                                                        class="save-bubble-preset-btn-mini">
                                                                        保存预设
                                                                </button>
                                                        </div>

                                                        <!-- CSS样式预设占位符 -->
                                                        <div class="css-presets-section">
                                                                <h5>已保存的CSS样式预设</h5>
                                                                <div class="placeholder-content">
                                                                        <p>此功能将在后续版本中提供。</p>
                                                                </div>
                                                        </div>
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
                                                                <input type="number"
                                                                        v-model.number="actor.contextMemorySettings.privateChat"
                                                                        min="1" max="200" class="memory-input" />
                                                        </div>
                                                        <div class="memory-setting-row">
                                                                <label>群聊</label>
                                                                <input type="number"
                                                                        v-model.number="actor.contextMemorySettings.groupChat"
                                                                        min="1" max="100" class="memory-input" />
                                                        </div>
                                                        <div class="memory-setting-row">
                                                                <label>记忆</label>
                                                                <input type="number"
                                                                        v-model.number="actor.contextMemorySettings.memory"
                                                                        min="1" max="20" class="memory-input" />
                                                        </div>
                                                        <div class="memory-setting-row">
                                                                <label>日记</label>
                                                                <input type="number"
                                                                        v-model.number="actor.contextMemorySettings.diary"
                                                                        min="1" max="20" class="memory-input" />
                                                        </div>
                                                        <div class="memory-setting-row">
                                                                <label>回忆</label>
                                                                <input type="number"
                                                                        v-model.number="actor.contextMemorySettings.recall"
                                                                        min="1" max="20" class="memory-input" />
                                                        </div>
                                                        <div class="memory-setting-row">
                                                                <label>动态</label>
                                                                <input type="number"
                                                                        v-model.number="actor.contextMemorySettings.moments"
                                                                        min="1" max="20" class="memory-input" />
                                                        </div>
                                                </div>
                                        </div>

                                        <!-- 语音设定 -->
                                        <div class="setting-item">
                                                <h4>语音设定</h4>
                                                <div class="form-group">
                                                        <label>TTS 方案</label>
                                                        <MainDropdown v-model="actor.ttsProfileId"
                                                                :options="ttsProfileOptions" placeholder="选择 TTS 方案" />
                                                </div>
                                                <div v-if="actor.ttsProfileId" class="form-group">
                                                        <label>声音模型</label>
                                                        <div class="model-group">
                                                                <MainDropdown v-if="availableVoices.length > 0"
                                                                        v-model="actor.voiceId" :options="voiceOptions"
                                                                        placeholder="选择声音" />
                                                                <input v-else type="text" v-model="actor.voiceId"
                                                                        placeholder="请先拉取声音列表">

                                                                <button @click="fetchVoices"
                                                                        :disabled="isFetchingVoices"
                                                                        class="pull-button">
                                                                        {{ isFetchingVoices ? '拉取中...' : '拉取声音' }}
                                                                </button>
                                                        </div>
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
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
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
import { showToast, showConfirm, showAvatarPickerModal, showAlbumPickerModal, promptForInput } from '../services/uiService.js';
import { USER_ACTOR_ID } from '../services/database.js';
import { getBubbleStylePresets, saveBubbleStylePresets, initializeDefaultBubbleStyles } from '../services/bubbleStyleService.js';
import { applyActorTheme, restoreOriginalTheme } from '../services/themeService.js';
import { fetchElevenLabsVoices } from '../services/elevenLabsService.js'; 

const route = useRoute();
const router = useRouter();

const actorId = ref(route.params.id);
const isNew = computed(() => !actorId.value);

// 记录来源页面，用于新建角色后的返回导航
const fromPage = ref(route.query.from || 'contacts');

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

// 获取世界书分组数据
const worldbookGroups = useObservable(
        liveQuery(() => db.worldbookGroups.toArray()),
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

// 聊天设置相关
const chatBackground = ref('');
const userAvatar = ref('');

// 聊天气泡样式相关
const isAddingBubblePreset = ref(false);
const isEditingBubblePresets = ref(false);
const activeBubblePreset = ref(null);
const bubbleStylePresets = ref([]);

// 默认气泡样式
const defaultBubbleStyle = {
        charBubbleBg: '#f0f0f0',
        charBubbleText: '#333333',
        userBubbleBg: '#007aff',
        userBubbleText: '#ffffff'
};

// 当前编辑的气泡样式
const editableBubbleStyle = ref({ ...defaultBubbleStyle });

// 当前应用的气泡样式
const currentBubbleStyle = computed(() => {
        // 如果正在编辑新预设，使用编辑中的样式实现实时预览
        if (isAddingBubblePreset.value) {
                return editableBubbleStyle.value;
        }
        // 否则使用激活的预设或默认样式
        return activeBubblePreset.value || defaultBubbleStyle;
});

// 监听颜色编辑变化，实时应用主题色
watch(editableBubbleStyle, async (newStyle) => {
        if (isAddingBubblePreset.value && actor.value) {
                // 实时应用颜色变化到主题色（用于编辑时的预览）
                const root = document.documentElement;
                root.style.setProperty('--accent-primary', newStyle.userBubbleBg);
                root.style.setProperty('--accent-text', newStyle.userBubbleText);
                root.style.setProperty('--char-bubble-bg', newStyle.charBubbleBg);
                root.style.setProperty('--char-bubble-text', newStyle.charBubbleText);
                root.style.setProperty('--user-bubble-bg', newStyle.userBubbleBg);
                root.style.setProperty('--user-bubble-text', newStyle.userBubbleText);
        }
}, { deep: true });

// 长按定时器
let longPressTimer = null;

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
        return worldbookGroups.value.map(group => ({
                label: group.name,
                value: group.id,
                disabled: false,
                description: `包含 ${group.worldbookIds?.length || 0} 个世界书`
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
                const groupName = await promptForInput('新建分组', '请输入新分组的名称', false, false);
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
        // 确保 actor.worldbookGroupIds 存在（存储世界书分组ID而不是单个世界书ID）
        if (!actor.value.worldbookGroupIds) {
                actor.value.worldbookGroupIds = [];
        }
        actor.value.worldbookGroupIds = selectedIds;
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

// 头像相关方法
const openAvatarPicker = async () => {
        // 对于新角色，先检查是否已经有基本信息
        if (isNew.value && !actor.value.name) {
                showToast('请先填写角色昵称', 'info');
                return;
        }
        
        // 对于新角色，使用临时ID；对于已存在的角色，使用真实ID
        const actorIdForAvatar = actor.value.id || `temp_char_${Date.now()}`;
        const selectedAvatar = await showAvatarPickerModal(actorIdForAvatar);
        if (selectedAvatar) {
                actor.value.currentAvatar = selectedAvatar;
                // 如果是新角色，将临时ID记录下来，保存时需要迁移头像库
                if (isNew.value) {
                        actor.value.tempAvatarLibraryId = actorIdForAvatar;
                }
        }
};

// 聊天背景相关方法
const getChatBackgroundType = () => {
        if (!chatBackground.value) return '默认背景';
        if (chatBackground.value.startsWith('http')) return '自定义URL';
        return '默认背景';
};

const changeChatBackground = async () => {
        try {
                // 直接使用相册选择器
                const selectedPhoto = await showAlbumPickerModal();
                if (selectedPhoto) {
                        chatBackground.value = selectedPhoto.url;
                        // 保存到角色数据
                        if (actor.value) {
                                actor.value.chatBackground = selectedPhoto.url;
                        }
                        showToast('聊天背景已更新', 'success');
                }
        } catch (error) {
                console.error('更新聊天背景失败:', error);
                showToast('更新聊天背景失败', 'error');
        }
};

// 气泡样式相关方法
const toggleEditMode = () => {
        isEditingBubblePresets.value = true;
};

const exitEditMode = () => {
        isEditingBubblePresets.value = false;
};

const toggleBubbleEditor = () => {
        isAddingBubblePreset.value = !isAddingBubblePreset.value;
        if (isAddingBubblePreset.value) {
                // 重置编辑器
                editableBubbleStyle.value = { ...defaultBubbleStyle };
        }
};

const handleBubbleStyleChange = () => {
        // 实时更新预览 - 直接更新当前气泡样式
        // 这样在编辑时就能看到实时效果
};

const selectBubblePreset = async (preset) => {
        activeBubblePreset.value = preset;
        isAddingBubblePreset.value = false;
        
        // 立即更新角色的气泡样式预设并保存到数据库
        if (actor.value) {
                actor.value.bubbleStylePreset = preset.name;
                await db.actors.update(actor.value.id, { bubbleStylePreset: preset.name });
                
                // 强制应用气泡样式作为主题色（立即更新界面主题）
                await applyActorTheme(actor.value.id, true, true);
        }
        
        showToast(`已应用气泡样式：${preset.name}`, 'success');
};

const saveBubblePreset = async () => {
        const name = await promptForInput('保存气泡样式', '请为你的气泡样式命名');
        if (name) {
                const newPreset = {
                        name,
                        charBubbleBg: editableBubbleStyle.value.charBubbleBg,
                        charBubbleText: editableBubbleStyle.value.charBubbleText,
                        userBubbleBg: editableBubbleStyle.value.userBubbleBg,
                        userBubbleText: editableBubbleStyle.value.userBubbleText,
                        isDefault: false
                };
                
                // 检查名称是否已存在
                const existingIndex = bubbleStylePresets.value.findIndex(p => p.name === name);
                if (existingIndex >= 0) {
                        const confirmed = await showConfirm('替换预设', `预设"${name}"已存在，是否替换？`);
                        if (confirmed) {
                                bubbleStylePresets.value[existingIndex] = newPreset;
                        } else {
                                return;
                        }
                } else {
                        bubbleStylePresets.value.push(newPreset);
                }
                
                // 保存到数据库
                await saveBubblePresetsToDatabase();
                
                // 应用新预设
                activeBubblePreset.value = newPreset;
                isAddingBubblePreset.value = false;
                
                if (actor.value) {
                        actor.value.bubbleStylePreset = newPreset.name;
                }
                
                showToast(`气泡样式"${name}"已保存`, 'success');
        }
};

const deleteBubblePreset = async (preset) => {
        const confirmed = await showConfirm('删除预设', `确定要删除气泡样式"${preset.name}"吗？`);
        if (confirmed) {
                const index = bubbleStylePresets.value.findIndex(p => p.name === preset.name);
                if (index >= 0) {
                        bubbleStylePresets.value.splice(index, 1);
                        
                        // 如果删除的是当前激活的预设，重置为默认
                        if (activeBubblePreset.value?.name === preset.name) {
                                activeBubblePreset.value = null;
                                if (actor.value) {
                                        actor.value.bubbleStylePreset = null;
                                }
                        }
                        
                        await saveBubblePresetsToDatabase();
                        showToast(`气泡样式"${preset.name}"已删除`, 'success');
                }
        }
};

const loadBubblePresetsFromDatabase = async () => {
        try {
                bubbleStylePresets.value = await getBubbleStylePresets();
                if (bubbleStylePresets.value.length === 0) {
                        bubbleStylePresets.value = await initializeDefaultBubbleStyles();
                }
        } catch (error) {
                console.error('加载气泡样式预设失败:', error);
        }
};

const saveBubblePresetsToDatabase = async () => {
        try {
                await saveBubbleStylePresets(bubbleStylePresets.value);
        } catch (error) {
                console.error('保存气泡样式预设失败:', error);
        }
};


// TTS 相关状态
const ttsProfiles = ref([]);
const isFetchingVoices = ref(false);
const availableVoices = ref([]);

const ttsProfileOptions = computed(() => {
        return ttsProfiles.value.map(profile => ({
                label: profile.profileName,
                value: profile.id
        }));
});

const voiceOptions = computed(() => {
        return availableVoices.value.map(voice => ({
                label: `${voice.name} (${voice.labels.gender}, ${voice.labels.age})`,
                value: voice.voice_id
        }));
});


// 拉取声音列表
const fetchVoices = async () => {
        if (!actor.value.ttsProfileId) {
                showToast('请先选择一个 TTS 方案。', 'info');
                return;
        }

        const selectedProfile = ttsProfiles.value.find(p => p.id === actor.value.ttsProfileId);
        if (!selectedProfile || !selectedProfile.apiKey) {
                showToast('选择的 TTS 方案无效或缺少 API Key。', 'error');
                return;
        }

        isFetchingVoices.value = true;
        try {
                const voices = await fetchElevenLabsVoices(selectedProfile.apiKey);
                availableVoices.value = voices;
                showToast(`成功获取 ${voices.length} 个声音模型！`, 'success');

                // 如果当前角色的 voiceId 不在列表中，则清空
                if (actor.value.voiceId && !voices.some(v => v.voice_id === actor.value.voiceId)) {
                        actor.value.voiceId = null;
                }
        } catch (error) {
                showToast(`拉取声音失败: ${error.message}`, 'error');
        } finally {
                isFetchingVoices.value = false;
        }
};




// 加载数据
onMounted(async () => {
        if (isNew.value) {
                actor.value = {
                        name: '',
                        realName: '',
                        signature: '',
                        birthday: '',
                        gender: '未知',
                        groupIds: [],
                        persona: '',
                        specialCare: 0,
                        isGroup: 0,
                        worldbookIds: [],
                        worldbookGroupIds: [],
                        currentAvatar: '',
                        chatBackground: '',
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
                // 加载 TTS 预设方案
                ttsProfiles.value = await db.ttsProfiles.toArray();
                if (data) {
                        actor.value = { ...data };
                        if (!Array.isArray(actor.value.groupIds)) {
                                actor.value.groupIds = [];
                        }
                        if (!Array.isArray(actor.value.worldbookIds)) {
                                actor.value.worldbookIds = [];
                        }
                        if (!Array.isArray(actor.value.worldbookGroupIds)) {
                                actor.value.worldbookGroupIds = [];
                        }
                        // 加载聊天背景
                        chatBackground.value = actor.value.chatBackground || '';
                        
                        
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
        
        // 加载气泡样式预设
        await loadBubblePresetsFromDatabase();
        
        // 如果角色有保存的气泡样式预设，应用它
        if (!isNew.value && actor.value && actor.value.bubbleStylePreset) {
                const savedPreset = bubbleStylePresets.value.find(p => p.name === actor.value.bubbleStylePreset);
                if (savedPreset) {
                        activeBubblePreset.value = savedPreset;
                        // 应用气泡样式作为主题色（使用用户保存的主题选择）
                        await applyActorTheme(actor.value.id, null);
                }
        }
        
        // 加载用户头像（从用户人格中获取）
        try {
                const userEntity = await db.actors.get(currentUserId);
                if (userEntity && userEntity.currentAvatar) {
                        userAvatar.value = userEntity.currentAvatar;
                }
        } catch (error) {
                console.warn('无法加载用户头像:', error);
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
                        worldbookIds: Array.isArray(actor.value.worldbookIds) ? [...actor.value.worldbookIds] : [],
                        worldbookGroupIds: Array.isArray(actor.value.worldbookGroupIds) ? [...actor.value.worldbookGroupIds] : [],
                        currentAvatar: actor.value.currentAvatar || '',
                        chatBackground: actor.value.chatBackground || '',
                        bubbleStylePreset: activeBubblePreset.value?.name || null,
                        ttsProfileId: actor.value.ttsProfileId || null, 
                        voiceId: actor.value.voiceId || null 
                }));
                
                // 删除临时字段
                delete dataToSave.tempAvatarLibraryId;
                
                if (isNew.value) {
                        dataToSave.id = `char_${Date.now()}`;
                        
                        // 如果有临时头像库，需要迁移
                        if (actor.value.tempAvatarLibraryId) {
                                try {
                                        // 获取临时头像库数据
                                        const tempEntity = await db.actors.get(actor.value.tempAvatarLibraryId);
                                        if (tempEntity && tempEntity.avatarLibrary) {
                                                dataToSave.avatarLibrary = tempEntity.avatarLibrary;
                                                // 删除临时实体
                                                await db.actors.delete(actor.value.tempAvatarLibraryId);
                                        }
                                } catch (error) {
                                        console.warn('迁移头像库失败:', error);
                                }
                        }
                        
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
                        // 新建角色保存后，跳转到profile页面，并记录来源页面
                        router.push(`/profile/${dataToSave.id}?from=${fromPage.value}`);
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
                        await db.transaction('rw', db.actors, db.conversations, db.events, db.relationships, db.memories, db.favorites, async () => {
                                const id = actorId.value;
                                await db.actors.delete(id);
                                await db.conversations.delete(id);
                                await db.events.where({ actorId: id }).delete();
                                await db.events.where({ contextId: id }).delete();
                                await db.relationships.where({ sourceId: id }).or('targetId').equals(id).delete();
                                await db.memories.where({ actorId: id }).delete();
                                // 清理该角色的所有收藏
                                await db.favorites.where({ authorId: id }).delete();
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

// 组件卸载时恢复原始主题
onUnmounted(() => {
        restoreOriginalTheme();
});
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

.avatar-wrapper {
        cursor: pointer;
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
        overflow: hidden;
}

.avatar-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 12px;
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
        background-color: rgba(255, 55, 41, 0.1);
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

/* 聊天预览样式 */
.chat-preview-wrapper {
        margin: 15px 0;
}

.chat-preview {
        background-color: var(--bg-primary);
        background-size: cover;
        background-position: center;
        border-radius: 12px;
        padding: 15px;
        min-height: 120px;
        border: 1px solid var(--border-color);
}

.message-bubble {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin-bottom: 12px;
}

.message-bubble:last-child {
        margin-bottom: 0;
}

.user-message {
        flex-direction: row-reverse;
}

.char-message {
        flex-direction: row;
}

.avatar-mini {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        overflow: hidden;
}

.avatar-image-mini {
        width: 100%;
        height: 100%;
        object-fit: cover;
}

.avatar-initial-mini {
        font-size: 12px;
        font-weight: 600;
        color: var(--accent-primary);
}

.message-content {
        background-color: var(--bg-card);
        padding: 8px 12px;
        border-radius: 12px;
        font-size: 14px;
        max-width: 200px;
        word-wrap: break-word;
}

.user-message .message-content {
        background-color: var(--accent-primary);
        color: var(--accent-text);
}

.background-settings {
        display: flex;
        flex-direction: column;
        gap: 10px;
}

.current-background {
        display: flex;
        align-items: center;
        gap: 10px;
        justify-content: space-between;
}

.background-type {
        color: var(--text-secondary);
        font-size: 14px;
}

.change-background-btn {
        padding: 6px 12px;
        background-color: var(--accent-primary);
        color: var(--accent-text);
        border: none;
        border-radius: 6px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
}

.change-background-btn:hover {
        background-color: var(--accent-darker);
}

/* 气泡样式相关样式 */
.setting-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
}

.edit-presets-btn {
        padding: 6px 12px;
        background: none;
        border: none;
        border-radius: 6px;
        color: var(--text-primary);
        cursor: pointer;
        font-size: 15px;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: all 0.2s ease;
}

.edit-presets-btn:hover {
        border-color: var(--accent-primary);
        color: var(--accent-primary);
}

.edit-presets-btn.done {
        background-color: var(--accent-primary);
        color: var(--accent-text);
        border-color: var(--accent-primary);
}

.edit-presets-btn svg {
        width: 14px;
        height: 14px;
}

.bubble-style-section {
        margin-top: 15px;
}

.preset-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 8px;
        margin-bottom: 20px;
}

.preset-item {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        background-color: var(--bg-card);
        min-height: 80px;
        justify-content: center;
}

.preset-item:hover {
        transform: translateY(-1px);
}

.preset-item.active {
        box-shadow: 0 0 0 1px var(--accent-primary);
}

.add-preset {
        border: 2px dashed var(--border-color);
        background-color: transparent;
        justify-content: center;
        min-height: 60px;
}

.add-preset:hover {
        border-color: var(--accent-primary);
        background-color: var(--bg-secondary);
}

.add-preset.active {
        border-color: var(--accent-primary);
        background-color: var(--bg-secondary);
}

.add-icon {
        font-size: 20px;
        font-weight: bold;
        color: var(--accent-primary);
        margin-bottom: 4px;
}

.preset-name {
        font-size: 11px;
        color: var(--text-secondary);
        text-align: center;
        margin-top: 6px;
        line-height: 1.2;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 100%;
}

.bubble-preview-gradient {
        width: 40px;
        height: 40px;
        border-radius: 6px;
        border: 1px solid var(--border-color);
        margin-bottom: 6px;
}

.bubble-preview-compact {
        display: flex;
        flex-direction: column;
        gap: 4px;
        width: 100%;
}

.color-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 11px;
}

.color-row .label {
        color: var(--text-secondary);
        font-weight: 500;
}

.color-dots {
        display: flex;
        gap: 4px;
}

.color-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 1px solid var(--border-color);
}

.delete-preset-btn {
        position: absolute;
        top: -6px;
        right: -6px;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background-color: #ff4444;
        color: white;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        z-index: 10;
}

.delete-preset-btn svg {
        width: 10px;
        height: 10px;
}

.bubble-color-editor {
        background-color: var(--bg-secondary);
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 20px;
        border: 1px solid var(--border-color);
}

.color-editor-compact {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 16px;
}

.color-row-editor {
        display: flex;
        justify-content: space-between;
        align-items: center;
}

.color-row-editor .label {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-primary);
        min-width: 80px;
}

.color-inputs {
        display: flex;
        gap: 8px;
}

.color-picker-compact {
        width: 32px;
        height: 32px;
        border: 1px solid var(--border-color);
        border-radius: 50%;
        cursor: pointer;
        background: none;
        padding: 0;
}

.save-bubble-preset-btn {
        width: 100%;
        padding: 10px;
        background-color: var(--accent-primary);
        color: var(--accent-text);
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.2s ease;
}

.save-bubble-preset-btn:hover {
        background-color: var(--accent-darker);
}

/* 新的紧凑型颜色编辑器 */
.bubble-color-editor-minimal {
        background-color: var(--bg-secondary);
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 16px;
        border: 1px solid var(--border-color);
}

.color-inputs-row {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
        justify-content: center;
}

.color-picker-mini {
        width: 24%;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        cursor: pointer;
        background: none;
        padding: 0;
}

.save-bubble-preset-btn-mini {
        width: 100%;
        padding: 8px;
        background-color: var(--accent-primary);
        color: var(--accent-text);
        border: none;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.2s ease;
}

.save-bubble-preset-btn-mini:hover {
        background-color: var(--accent-darker);
}

.css-presets-section {
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid var(--border-color);
}

.css-presets-section h5 {
        margin: 0 0 15px 0;
        color: var(--text-primary);
        font-size: 16px;
        font-weight: 600;
}
.model-group {
        display: flex;
        gap: 10px;
        align-items: center;
        width: 100%;
}

.model-group input,
.model-group .main-dropdown {
        flex-grow: 1;
}

.model-group input {
        height: 48px;
}

.pull-button {
        padding: 0 20px;
        height: 48px;
        background-color: var(--bg-secondary);
        color: var(--text-primary);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        cursor: pointer;
        white-space: nowrap;
}

.pull-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
}

/* 响应式设计 */
@media (max-width: 768px) {
        .preset-grid {
                flex-direction: column;
        }
        
        .preset-item {
                min-width: 100%;
        }
        
        .color-row-editor {
                flex-direction: column;
                align-items: flex-start;
                gap: 8px;
        }
        
        .color-row-editor .label {
                min-width: auto;
        }
}
</style>