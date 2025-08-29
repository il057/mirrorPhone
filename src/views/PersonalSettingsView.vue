<template>
        <div class="page-container">
                <AppHeader title="个人设置" :override-back-action="goBackToMe">
                        <template #right>
                                <button @click="saveSettings" class="header-action-button">保存</button>
                        </template>
                </AppHeader>

                <main class="settings-content content">
                        <!-- 个性设置 -->
                        <AccordionItem title="个性设置" :defaultExpanded="true">
                                <!-- 打字模拟设置 -->
                                <div class="setting-section">
                                        <div class="setting-header">
                                                <h3>打字模拟</h3>
                                                <div class="toggle-switch">
                                                        <input type="checkbox" id="typing-simulation"
                                                                v-model="settings.typingSimulation.enabled"
                                                                @change="onTypingSimulationToggle" />
                                                        <label for="typing-simulation" class="toggle-label">
                                                                <span class="toggle-slider"></span>
                                                        </label>
                                                </div>
                                        </div>
                                        <p class="setting-description">
                                                开启后，AI回复将模拟真实的拼音打字效果；关闭后将使用随机间隔时间发送消息
                                        </p>

                                        <!-- 打字速度设置 -->
                                        <div v-show="settings.typingSimulation.enabled" class="speed-setting">
                                                <RangeSlider v-model="settings.typingSimulation.speed" :min="1"
                                                        :max="10" :step="1" label="打字速度" />
                                                <div class="speed-indicator">
                                                        <span class="speed-text">{{
                                                                getSpeedText(settings.typingSimulation.speed) }}</span>
                                                </div>
                                        </div>
                                </div>

                                <!-- 语音自动转文字设置 -->
                                <div class="setting-section">
                                        <div class="setting-header">
                                                <h3>语音自动转文字</h3>
                                                <div class="toggle-switch">
                                                        <input type="checkbox" id="voice-to-text"
                                                                v-model="settings.voiceToText.enabled" disabled />
                                                        <label for="voice-to-text" class="toggle-label disabled">
                                                                <span class="toggle-slider"></span>
                                                        </label>
                                                </div>
                                        </div>
                                        <p class="setting-description placeholder">
                                                语音消息自动转换为文字（功能开发中...）
                                        </p>
                                </div>

                                <!-- 语音消息显示设置 -->
                                <div class="setting-section">
                                        <div class="setting-header">
                                                <h3>语音消息自动显示文字</h3>
                                                <div class="toggle-switch">
                                                        <input type="checkbox" id="voice-auto-show"
                                                                v-model="settings.voiceMessage.autoShowText" />
                                                        <label for="voice-auto-show" class="toggle-label">
                                                                <span class="toggle-slider"></span>
                                                        </label>
                                                </div>
                                        </div>
                                        <p class="setting-description">
                                                开启后，语音消息将自动显示文字内容；关闭后需点击语音气泡查看文字
                                        </p>
                                </div>

                                <!-- 一起听自动接受设置 -->
                                <div class="setting-section">
                                        <div class="setting-header">
                                                <h3>自动接受一起听邀请</h3>
                                                <div class="toggle-switch">
                                                        <input type="checkbox" id="auto-accept-listen-together"
                                                                v-model="settings.musicSharing.autoAcceptListenTogether" />
                                                        <label for="auto-accept-listen-together" class="toggle-label">
                                                                <span class="toggle-slider"></span>
                                                        </label>
                                                </div>
                                        </div>
                                        <p class="setting-description">
                                                开启后，角色会自动接受一起听音乐的邀请。注意：角色发起的邀请仍需您手动接受
                                        </p>
                                </div>
                        </AccordionItem>

                        <!-- 世界设置 -->
                        <AccordionItem title="世界设置" :defaultExpanded="false">
                                <div class="setting-section">
                                        <div class="setting-header">
                                                <h3>离线总结与模拟</h3>
                                                <div class="toggle-switch">
                                                        <input type="checkbox" id="offline-simulation"
                                                                v-model="settings.offlineSimulation.enabled" />
                                                        <label for="offline-simulation" class="toggle-label">
                                                                <span class="toggle-slider"></span>
                                                        </label>
                                                </div>
                                        </div>
                                        <p class="setting-description">
                                                角色离线时的智能模拟和情报生成。
                                        </p>
                                        <div v-if="settings.offlineSimulation.enabled" class="speed-setting">
                                                <div class="form-group">
                                                        <label>离线总结触发间隔（小时）</label>
                                                        <RangeSlider v-model="settings.offlineSimulation.intervalHours"
                                                                :min="1" :max="72" :step="1" />
                                                </div>
                                        </div>
                                </div>

                                <div class="setting-section">
                                        <div class="setting-header">
                                                <h3>分组世界书与离线总结</h3>
                                        </div>
                                        <p class="setting-description">
                                                为每个角色分组绑定世界书，并选择是否为该分组开启离线总结。
                                        </p>

                                        <div class="group-worldbook-list">
                                                <div v-for="group in groups" :key="group.id" class="group-item"
                                                        :class="{ expanded: expandedGroups.includes(group.id) }">
                                                        <div class="group-header" @click="toggleGroup(group.id)">
                                                                <div class="group-info">
                                                                        <h4>{{ group.name }}</h4>
                                                                        <span class="group-stats">
                                                                                {{ getGroupCharCount(group.id) }}个角色 |
                                                                                {{ getGroupWorldbookCount(group.id)
                                                                                }}个世界书
                                                                        </span>
                                                                </div>
                                                                <svg class="expand-icon"
                                                                        :class="{ rotated: expandedGroups.includes(group.id) }">
                                                                        <path d="M7 10l5 5 5-5z" fill="currentColor" />
                                                                </svg>
                                                        </div>

                                                        <div v-show="expandedGroups.includes(group.id)"
                                                                class="group-content">
                                                                <div class="setting-header"
                                                                        style="margin-bottom: 15px;">
                                                                        <h5>开启离线总结</h5>
                                                                        <div class="toggle-switch">
                                                                                <input type="checkbox"
                                                                                        :id="'offline-summary-' + group.id"
                                                                                        v-model="groupOfflineSummaryBindings[group.id]" />
                                                                                <label :for="'offline-summary-' + group.id"
                                                                                        class="toggle-label">
                                                                                        <span
                                                                                                class="toggle-slider"></span>
                                                                                </label>
                                                                        </div>
                                                                </div>

                                                                <div class="worldbook-section">
                                                                        <h5>绑定世界书分组</h5>
                                                                        <div class="worldbook-checkboxes">
                                                                                <label v-for="wbGroup in worldbookGroups"
                                                                                        :key="wbGroup.id"
                                                                                        class="checkbox-item">
                                                                                        <input type="checkbox"
                                                                                                :value="wbGroup.id"
                                                                                                v-model="groupWorldbookBindings[group.id]" />
                                                                                        <span class="checkbox-label">{{
                                                                                                wbGroup.name }}</span>
                                                                                </label>
                                                                        </div>
                                                                </div>

                                                                <div class="characters-section">
                                                                        <h5>分组内角色</h5>
                                                                        <div class="character-list">
                                                                                <div v-for="character in getGroupCharacters(group.id)"
                                                                                        :key="character.id"
                                                                                        class="character-item">
                                                                                        <div class="character-info">
                                                                                                <div class="avatar">
                                                                                                        <img v-if="character.currentAvatar || character.avatar"
                                                                                                                :src="character.currentAvatar || character.avatar"
                                                                                                                :alt="character.name">
                                                                                                        <span v-else
                                                                                                                class="avatar-initial">{{
                                                                                                                getInitial(character.name)
                                                                                                                }}</span>
                                                                                                </div>
                                                                                                <span
                                                                                                        class="character-name">{{
                                                                                                        character.name
                                                                                                        }}</span>
                                                                                        </div>
                                                                                        <button @click="openCharacterWorldbooks(character)"
                                                                                                class="bind-worldbook-btn">
                                                                                                个人世界书
                                                                                        </button>
                                                                                </div>
                                                                        </div>
                                                                </div>
                                                        </div>
                                                </div>
                                        </div>
                                </div>
                        </AccordionItem>
                </main>

                <!-- 角色世界书绑定模态框 -->
                <div v-if="showCharacterWorldbookModal" class="modal-overlay" @click="closeCharacterWorldbookModal">
                        <div class="modal-content" @click.stop>
                                <div class="modal-header">
                                        <h3>{{ selectedCharacter?.name }} - 个人世界书</h3>
                                        <button @click="closeCharacterWorldbookModal" class="close-btn">×</button>
                                </div>
                                <div class="modal-body">
                                        <p class="modal-description">
                                                为 {{ selectedCharacter?.name }} 绑定个人专属的世界书分组
                                        </p>
                                        <div class="worldbook-checkboxes">
                                                <label v-for="wbGroup in availableWorldbookGroups" :key="wbGroup.id"
                                                        class="checkbox-item"
                                                        :class="{ disabled: isWorldbookGroupDisabled(wbGroup.id) }">
                                                        <input type="checkbox" :value="wbGroup.id"
                                                                v-model="characterWorldbookBindings[selectedCharacter?.id]"
                                                                :disabled="isWorldbookGroupDisabled(wbGroup.id)" />
                                                        <span class="checkbox-label">
                                                                {{ wbGroup.name }}
                                                                <span v-if="isWorldbookGroupDisabled(wbGroup.id)"
                                                                        class="disabled-text">
                                                                        (已被分组绑定)
                                                                </span>
                                                        </span>
                                                </label>
                                        </div>
                                </div>
                                <div class="modal-actions">
                                        <button @click="closeCharacterWorldbookModal"
                                                class="modal-btn cancel">取消</button>
                                        <button @click="saveCharacterWorldbooks" class="modal-btn confirm">保存</button>
                                </div>
                        </div>
                </div>

                <!-- Toast 提示 -->
        </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useObservable } from '@vueuse/rxjs';
import { liveQuery } from 'dexie';
import { useRouter } from 'vue-router';
import db from '../services/database.js';
import AppHeader from '../components/layout/Header.vue';
import AccordionItem from '../components/ui/AccordionItem.vue';
import RangeSlider from '../components/ui/RangeSlider.vue';
import { showToast } from '../services/uiService.js';
import { getPersonalSettings, savePersonalSettings } from '../services/personalSettingsService.js';

const router = useRouter();

// 响应式数据
const settings = reactive({
        typingSimulation: {
                enabled: true,
                speed: 5 // 1-10，5为中等速度
        },
        voiceToText: {
                enabled: false
        },
        voiceMessage: {
                autoShowText: true // 默认自动显示语音内容
        },
        musicSharing: {
                autoAcceptListenTogether: false // 默认关闭自动接受一起听邀请
        },
        offlineSimulation: {
                enabled: true,
                intervalHours: 24 // 离线总结触发间隔
        }
});

// 界面状态
const expandedGroups = ref([]);
const showCharacterWorldbookModal = ref(false);
const selectedCharacter = ref(null);

// 绑定关系数据
const groupWorldbookBindings = reactive({});
const characterWorldbookBindings = reactive({});
const groupOfflineSummaryBindings = reactive({});

// Toast引用已移除，使用showToast函数

// 获取所有分组
const groups = useObservable(
        liveQuery(() => db.groups.orderBy('order').toArray()),
        { initialValue: [] }
);

// 获取所有世界书分组
const worldbookGroups = useObservable(
        liveQuery(() => db.worldbookGroups.toArray()),
        { initialValue: [] }
);

// 获取所有角色
const characters = useObservable(
        liveQuery(() => db.actors.where('isGroup').equals(0).toArray()),
        { initialValue: [] }
);

// 计算属性
const availableWorldbookGroups = computed(() => {
        if (!selectedCharacter.value) return worldbookGroups.value;
        
        const characterGroupIds = selectedCharacter.value.groupIds || [];
        const boundWorldbookGroups = new Set();
        
        characterGroupIds.forEach(groupId => {
                const boundGroups = groupWorldbookBindings[groupId] || [];
                boundGroups.forEach(wbId => boundWorldbookGroups.add(wbId));
        });
        
        return worldbookGroups.value;
});

// 方法
const goBackToMe = () => {
        router.push('/chat/me');
};

const getSpeedText = (speed) => {
        const speedTexts = {
                1: '极慢', 2: '很慢', 3: '较慢', 4: '慢', 5: '中等',
                6: '快', 7: '较快', 8: '很快', 9: '极快', 10: '飞速'
        };
        return speedTexts[speed] || '中等';
};

const onTypingSimulationToggle = () => {
        // 可以在这里添加切换时的逻辑
        console.log('Typing simulation toggled:', settings.typingSimulation.enabled);
};

const toggleGroup = (groupId) => {
        const index = expandedGroups.value.indexOf(groupId);
        if (index > -1) {
                expandedGroups.value.splice(index, 1);
        } else {
                expandedGroups.value.push(groupId);
        }
};

const getGroupCharCount = (groupId) => {
        return characters.value.filter(char => 
                char.groupIds && char.groupIds.includes(groupId)
        ).length;
};

const getGroupWorldbookCount = (groupId) => {
        return (groupWorldbookBindings[groupId] || []).length;
};

const getGroupCharacters = (groupId) => {
        return characters.value.filter(char => 
                char.groupIds && char.groupIds.includes(groupId)
        );
};

const getInitial = (name) => {
        if (!name) return '?';
        return name.charAt(0).toUpperCase();
};

const openCharacterWorldbooks = (character) => {
        selectedCharacter.value = character;
        showCharacterWorldbookModal.value = true;
};

const closeCharacterWorldbookModal = () => {
        showCharacterWorldbookModal.value = false;
        selectedCharacter.value = null;
};

const isWorldbookGroupDisabled = (worldbookGroupId) => {
        if (!selectedCharacter.value) return false;
        
        const characterGroupIds = selectedCharacter.value.groupIds || [];
        
        // 检查是否有任何角色所在的分组绑定了这个世界书分组
        return characterGroupIds.some(groupId => {
                const boundGroups = groupWorldbookBindings[groupId] || [];
                return boundGroups.includes(worldbookGroupId);
        });
};

const saveCharacterWorldbooks = async () => {
        if (!selectedCharacter.value) return;
        
        try {
                const characterId = selectedCharacter.value.id;
                const worldbookGroupIds = characterWorldbookBindings[characterId] || [];
                // 深拷贝以移除 reactive/Proxy
                const safeWbIds = JSON.parse(JSON.stringify(worldbookGroupIds));

                await db.actors.update(characterId, {
                        worldbookGroupIds: safeWbIds
                });
                
                showToast('角色世界书绑定已保存', 'success');
                closeCharacterWorldbookModal();
        } catch (error) {
                console.error('保存角色世界书绑定失败:', error);
                showToast('保存失败，请重试', 'error');
        }
};

const saveSettings = async () => {
        try {
                // 使用新的服务函数保存个人设置
                const success = await savePersonalSettings({
                        typingSimulation: settings.typingSimulation,
                        voiceToText: settings.voiceToText,
                        voiceMessage: settings.voiceMessage,
                        musicSharing: settings.musicSharing,
                        offlineSimulation: settings.offlineSimulation
                });
                
                if (!success) {
                        throw new Error('保存个人设置失败');
                }
                
                // 保存分组世界书和离线总结绑定
                for (const [groupId, worldbookIds] of Object.entries(groupWorldbookBindings)) {
                        if (Array.isArray(worldbookIds)) {
                                const safeArray = JSON.parse(JSON.stringify(worldbookIds));
                                // 保存为 0/1
                                const offlineSummaryEnabled = groupOfflineSummaryBindings[groupId] ? 1 : 0;
                                await db.groups.update(groupId, {
                                        worldbookIds: safeArray,
                                        offlineSummaryEnabled: offlineSummaryEnabled
                                });
                        }
                }
                
                showToast('设置已保存', 'success');
        } catch (error) {
                console.error('保存设置失败:', error);
                showToast('保存失败，请重试', 'error');
        }
};

// 初始化数据
const initializeData = async () => {
        try {
                // 使用新的服务函数加载个人设置
                const personalSettings = await getPersonalSettings();
                Object.assign(settings, personalSettings);
                
                // 加载分组世界书绑定
                const allGroups = await db.groups.toArray();
                allGroups.forEach(group => {
                        groupWorldbookBindings[group.id] = group.worldbookIds || [];
                        // 读取为布尔值
                        groupOfflineSummaryBindings[group.id] = group.offlineSummaryEnabled === 1;
                });
                
                // 加载角色世界书绑定
                const allCharacters = await db.actors.where('isGroup').equals(0).toArray();
                allCharacters.forEach(character => {
                        characterWorldbookBindings[character.id] = character.worldbookGroupIds || [];
                });
                
        } catch (error) {
                console.error('初始化设置数据失败:', error);
        }
};

onMounted(() => {
        initializeData();
});
</script>

<style scoped>


.setting-section {
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 1px solid var(--border-color);
}

.setting-section:last-child {
        border-bottom: none;
}

.setting-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
}

.setting-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary);
}

.setting-description {
        margin: 0 0 15px 0;
        font-size: 14px;
        color: var(--text-secondary);
        line-height: 1.4;
}

.setting-description.placeholder {
        font-style: italic;
        color: var(--text-secondary);
        opacity: 0.7;
}

/* 速度设置 */
.speed-setting {
        margin-top: 15px;
        padding: 15px;
        background-color: var(--bg-secondary);
        border-radius: 8px;
}

.speed-indicator {
        text-align: center;
        margin-top: 10px;
}

.speed-text {
        font-weight: 600;
        color: var(--accent-primary);
}

/* 分组世界书列表 */
.group-worldbook-list {
        margin-top: 15px;
}

.group-item {
        border: 1px solid var(--border-color);
        border-radius: 8px;
        margin-bottom: 10px;
        overflow: hidden;
}

.group-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px;
        cursor: pointer;
        background-color: var(--bg-card);
        transition: background-color 0.2s ease;
}

.group-header:hover {
        background-color: var(--bg-secondary);
}

.group-info h4 {
        margin: 0 0 5px 0;
        font-size: 16px;
        color: var(--text-primary);
}

.group-stats {
        font-size: 12px;
        color: var(--text-secondary);
}

.expand-icon {
        width: 20px;
        height: 20px;
        transition: transform 0.3s ease;
        color: var(--text-secondary);
}

.expand-icon.rotated {
        transform: rotate(180deg);
}

.group-content {
        padding: 20px;
        background-color: var(--bg-primary);
}

.worldbook-section,
.characters-section {
        margin-bottom: 20px;
}

.worldbook-section h5,
.characters-section h5 {
        margin: 0 0 10px 0;
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
}

.worldbook-checkboxes {
        display: flex;
        flex-direction: column;
        gap: 8px;
}

.checkbox-item {
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        padding: 8px;
        border-radius: 6px;
        transition: background-color 0.2s ease;
}

.checkbox-item:hover:not(.disabled) {
        background-color: var(--bg-secondary);
}

.checkbox-item.disabled {
        cursor: not-allowed;
        opacity: 0.5;
}

.checkbox-item input {
        margin: 0;
}

.checkbox-label {
        font-size: 14px;
        color: var(--text-primary);
}

.disabled-text {
        color: var(--text-secondary);
        font-size: 12px;
}

/* 角色列表 */
.character-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
}

.character-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        background-color: var(--bg-card);
        border-radius: 6px;
}

.character-info {
        display: flex;
        align-items: center;
        gap: 10px;
}

.avatar {
        width: 32px;
        height: 32px;
        border-radius: 6px;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: var(--bg-secondary);
        overflow: hidden;
}

.avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
}

.avatar-initial {
        color: var(--accent-primary);
        font-size: 14px;
        font-weight: bold;
}

.character-name {
        font-size: 14px;
        color: var(--text-primary);
}

.bind-worldbook-btn {
        padding: 6px 12px;
        background-color: var(--button-bg);
        border: 1px solid var(--button-border);
        border-radius: 6px;
        color: var(--button-text);
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
}

.bind-worldbook-btn:hover {
        background-color: var(--button-bg-hover);
}

/* 模态框样式 */
.modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: var(--overlay-bg);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
}

.modal-content {
        background-color: var(--bg-card);
        border-radius: 12px;
        padding: 0;
        max-width: 90%;
        width: 400px;
        max-height: 80vh;
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

.modal-header h3 {
        margin: 0;
        font-size: 18px;
        color: var(--text-primary);
}

.close-btn {
        background: none;
        border: none;
        font-size: 24px;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
}

.close-btn:hover {
        color: var(--text-primary);
}

.modal-body {
        padding: 20px;
        flex: 1;
        overflow-y: auto;
}

.modal-description {
        margin: 0 0 15px 0;
        font-size: 14px;
        color: var(--text-secondary);
}

.modal-actions {
        display: flex;
        gap: 10px;
        padding: 20px;
        border-top: 1px solid var(--border-color);
}

.modal-btn {
        flex: 1;
        padding: 10px;
        border: 1px solid var(--button-border);
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s ease;
}

.modal-btn.cancel {
        background-color: var(--bg-secondary);
        color: var(--text-primary);
}

.modal-btn.confirm {
        background-color: var(--accent-primary);
        color: var(--accent-text);
        border-color: var(--accent-primary);
}

.modal-btn:hover {
        opacity: 0.8;
}

/* Header Action Button */
.header-action-button {
        background: none;
        border: none;
        color: var(--text-primary);
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        padding: 8px 16px;
        border-radius: 6px;
        transition: all 0.2s ease;
}

.header-action-button:hover {
        color: var(--accent-primary);
}
</style>
