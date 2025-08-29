<template>
        <div class="page-container">
                <AppHeader title="设置">
                        <template #right>
                                <button @click="saveChanges" class="header-action-button">保存</button>
                        </template>
                </AppHeader>

                <main class="settings-content content">
                        <section class="settings-card">
                                <div class="card-header">
                                        <h2>AI API 设置</h2>
                                        <div class="profile-actions">
                                                <button @click="addNewProfile('api')" class="action-button">+
                                                        新增</button>
                                                <button @click="deleteCurrentProfile('api')"
                                                        :disabled="!activeProfileId" class="action-button delete">-
                                                        删除</button>
                                        </div>
                                </div>

                                <div class="form-group">
                                        <label>当前方案</label>
                                        <MainDropdown v-model="activeProfileId" :options="profileOptions"
                                                placeholder="-- 请选择一个方案 --" />
                                </div>

                                <div v-if="currentProfile" class="profile-form">
                                        <div class="form-group">
                                                <label>方案名称</label>
                                                <input type="text" v-model="currentProfile.profileName"
                                                        placeholder="为你的方案起个名字">
                                        </div>
                                        <div class="form-group">
                                                <label>API 服务商</label>
                                                <MainDropdown v-model="currentProfile.connectionType"
                                                        :options="connectionTypeOptions" placeholder="选择服务商" />
                                        </div>
                                        <div v-if="currentProfile.connectionType === 'proxy'" class="form-group">
                                                <label>AI API 地址 (反代)</label>
                                                <input type="url" v-model="currentProfile.apiUrl"
                                                        placeholder="https://your-proxy-url/v1">
                                        </div>
                                        <div class="form-group">
                                                <label>AI API 密钥</label>
                                                <input type="password" v-model="currentProfile.apiKey"
                                                        placeholder="你的 API Key">
                                        </div>
                                        <div class="form-group">
                                                <label>AI 模型</label>
                                                <div class="model-group">
                                                        <MainDropdown v-if="availableModels.length > 0"
                                                                v-model="currentProfile.model" :options="modelOptions"
                                                                placeholder="选择模型" />
                                                        <input v-else type="text" v-model="currentProfile.model"
                                                                placeholder="例如: gemini-2.5-pro">

                                                        <button @click="handleFetchModels" :disabled="isFetchingModels"
                                                                class="pull-button">
                                                                {{ isFetchingModels ? '拉取中...' : '拉取' }}
                                                        </button>
                                                </div>
                                        </div>
                                </div>
                        </section>

                        <section class="settings-card">
                                <div class="card-header">
                                        <h2>ElevenLabs TTS</h2>
                                        <div class="profile-actions">
                                                <button @click="addNewProfile('tts')" class="action-button">+
                                                        新增</button>
                                                <button @click="deleteCurrentProfile('tts')"
                                                        :disabled="!activeTtsProfileId" class="action-button delete">-
                                                        删除</button>
                                        </div>
                                </div>
                                <div class="form-group">
                                        <label>当前方案</label>
                                        <MainDropdown v-model="activeTtsProfileId" :options="ttsProfileOptions"
                                                placeholder="-- 请选择一个方案 --" />
                                </div>
                                <div v-if="currentTtsProfile" class="profile-form">
                                        <div class="form-group">
                                                <label>方案名称</label>
                                                <input type="text" v-model="currentTtsProfile.profileName"
                                                        placeholder="为你的方案起个名字">
                                        </div>
                                        <div class="form-group">
                                                <label for="elevenLabsApiKey">API 密钥</label>
                                                <div class="model-group">
                                                        <input id="elevenLabsApiKey" type="password"
                                                                v-model="currentTtsProfile.apiKey"
                                                                placeholder="你的 ElevenLabs API Key">
                                                        <button @click="testElevenLabsConnection"
                                                                :disabled="!currentTtsProfile.apiKey"
                                                                class="save-button pull-button">
                                                                测试
                                                        </button>
                                                </div>
                                        </div>
                                        <div v-if="elevenLabsVoices.length > 0" class="form-group">
                                                <p class="description">连接成功！</p>
                                        </div>
                                </div>
                        </section>

                        <section class="settings-card">
                                <div class="card-header">
                                        <h2>后台活动</h2>
                                </div>
                                <div class="setting-section">
                                        <div class="setting-header">
                                                <h3>启用后台活动</h3>
                                                <div class="toggle-switch">
                                                        <input type="checkbox" id="background-activity-enabled"
                                                                v-model="globalSettings.backgroundActivity.enabled" />
                                                        <label for="background-activity-enabled" class="toggle-label">
                                                                <span class="toggle-slider"></span>
                                                        </label>
                                                </div>
                                        </div>
                                        <p class="setting-description">
                                                启用后，应用会在后台模拟角色的活动，例如发送消息或发布动态。
                                        </p>
                                </div>

                                <div v-if="globalSettings.backgroundActivity.enabled" class="profile-form">
                                        <div class="form-group">
                                                <label>活动概率 (%)</label>
                                                <RangeSlider v-model="globalSettings.backgroundActivity.probability"
                                                        :min="0" :max="100" :step="1" />
                                        </div>
                                        <div class="form-group">
                                                <label>单次最大唤醒角色数</label>
                                                <input type="number"
                                                        v-model.number="globalSettings.backgroundActivity.maxChars"
                                                        min="1" placeholder="默认: 2">
                                        </div>
                                        <div class="form-group">
                                                <label>活动检测间隔 (秒)</label>
                                                <input type="number"
                                                        v-model.number="backgroundActivityIntervalInSeconds"
                                                        min="10" placeholder="默认: 100">
                                                <p class="form-help">
                                                        应用会每隔设定的时间尝试触发一次后台活动。
                                                </p>
                                        </div>
                                </div>
                        </section>
                        <section class="settings-card">
                                <div class="card-header">
                                        <h2>通知设置</h2>
                                </div>
                                <div class="setting-section">
                                        <div class="setting-header">
                                                <h3>启用推送通知</h3>
                                                <div class="toggle-switch">
                                                        <input type="checkbox" id="push-notifications-enabled"
                                                                :checked="notificationPermission === 'granted'"
                                                                @change="handleNotificationToggle" />
                                                        <label for="push-notifications-enabled" class="toggle-label">
                                                                <span class="toggle-slider"></span>
                                                        </label>
                                                </div>
                                        </div>
                                        <p class="setting-description">
                                                当有后台活动或新消息时，接收系统通知。这需要浏览器授权。
                                        </p>
                                </div>
                        </section>
                        <section class="settings-card">
                                <div class="card-header">
                                        <h2>图片上传服务 (Cloudinary)</h2>
                                </div>
                                <div class="form-group">
                                        <label for="cloudName">Cloud Name</label>
                                        <input id="cloudName" type="text" v-model="globalSettings.cloudinaryCloudName"
                                                placeholder="你的 Cloudinary Cloud Name">
                                </div>
                                <div class="form-group">
                                        <label for="uploadPreset">Upload Preset</label>
                                        <input id="uploadPreset" type="text"
                                                v-model="globalSettings.cloudinaryUploadPreset"
                                                placeholder="你的 Upload Preset">
                                </div>
                        </section>

                <section class="settings-card">
                        <div class="card-header">
                                <h2>云端同步</h2>
                                <div class="sync-status">
                                        <span v-if="isSyncing" class="status-indicator syncing">同步中...</span>
                                        <span v-else-if="lastSyncTime" class="status-indicator success">
                                                最后同步: {{ lastSyncTime }}
                                        </span>
                                </div>
                        </div>
                        
                        <!-- 同步方式选择 -->
                        <div class="form-group">
                                <label>同步服务</label>
                                <div class="segmented-control">
                                        <input type="radio" id="sync-github" value="github" v-model="syncServiceType">
                                        <label for="sync-github" :class="{ active: syncServiceType === 'github' }">GitHub Gist</label>
                                        <input type="radio" id="sync-nutstore" value="nutstore" v-model="syncServiceType">
                                        <label for="sync-nutstore" :class="{ active: syncServiceType === 'nutstore' }">坚果云</label>
                                </div>
                        </div>

                        <!-- GitHub Gist 配置 -->
                        <template v-if="syncServiceType === 'github'">
                                <div class="form-group">
                                        <label for="githubToken">GitHub Personal Access Token</label>
                                        <input id="githubToken" type="password" v-model="globalSettings.githubToken"
                                                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx">
                                        <p class="form-help">
                                                需要具有 'gist' 权限的 Personal Access Token。
                                                <a href="https://github.com/settings/tokens" target="_blank"
                                                        rel="noopener">创建 Token</a>
                                        </p>
                                </div>
                                <div class="form-group">
                                        <label for="gistId">Gist ID (可选)</label>
                                        <input id="gistId" type="text" v-model="globalSettings.githubGistId"
                                                placeholder="留空则自动创建新的 Gist">
                                        <p class="form-help">如果已有备份 Gist，请填入其 ID</p>
                                </div>
                        </template>

                        <!-- 坚果云配置 -->
                        <template v-if="syncServiceType === 'nutstore'">
                                <div class="form-group">
                                        <label for="nutstoreEmail">坚果云邮箱</label>
                                        <input id="nutstoreEmail" type="email" v-model="globalSettings.nutstoreEmail"
                                                placeholder="你的坚果云邮箱地址">
                                        <p class="form-help">
                                                坚果云账户的邮箱地址，用于WebDAV认证
                                        </p>
                                </div>
                                <div class="form-group">
                                        <label for="nutstoreToken">坚果云 Access Token</label>
                                        <input id="nutstoreToken" type="password" v-model="globalSettings.nutstoreToken"
                                                placeholder="你的坚果云 Access Token">
                                        <p class="form-help">
                                                Access Token作为WebDAV密码使用。
                                                <a href="https://www.jianguoyun.com/d/login" target="_blank"
                                                        rel="noopener">获取 Token</a>
                                        </p>
                                </div>
                                <div class="form-group">
                                        <label for="nutstorePath">备份路径 (可选)</label>
                                        <input id="nutstorePath" type="text" v-model="globalSettings.nutstorePath"
                                                placeholder="/mirrorPhone/backup.json">
                                        <p class="form-help">坚果云中的备份文件路径，留空则使用默认路径</p>
                                </div>
                        </template>
                        
                        <!-- 自动备份设置 -->
                        <div class="setting-section">
                                <div class="setting-header">
                                        <h3>自动云端备份</h3>
                                        <div class="toggle-switch">
                                                <input type="checkbox" id="auto-backup-enabled"
                                                        v-model="autoBackupSettings.enabled" />
                                                <label for="auto-backup-enabled" class="toggle-label">
                                                        <span class="toggle-slider"></span>
                                                </label>
                                        </div>
                                </div>
                                <p class="setting-description">
                                        启用后，应用会自动将数据备份到{{ syncServiceType === 'github' ? ' GitHub Gist' : ' 坚果云' }}，无需手动操作。
                                </p>
                        </div>

                        <div v-if="autoBackupSettings.enabled" class="auto-backup-settings">
                                <div class="form-group">
                                        <label>备份间隔</label>
                                        <select v-model.number="autoBackupSettings.interval">
                                                <option :value="6 * 60 * 60 * 1000">每 6 小时</option>
                                                <option :value="12 * 60 * 60 * 1000">每 12 小时</option>
                                                <option :value="24 * 60 * 60 * 1000">每 24 小时</option>
                                                <option :value="48 * 60 * 60 * 1000">每 48 小时</option>
                                                <option :value="7 * 24 * 60 * 60 * 1000">每周</option>
                                        </select>
                                </div>
                                <div class="form-group">
                                        <label>变更阈值</label>
                                        <input type="number" v-model.number="autoBackupSettings.maxChanges" 
                                               min="10" max="500" placeholder="达到指定变更数时自动备份">
                                        <p class="form-help">
                                                当数据变更达到指定次数时，即使未到时间间隔也会触发备份
                                        </p>
                                </div>
                                <div v-if="backupStats" class="backup-stats">
                                        <h4>备份统计</h4>
                                        <div class="stats-grid">
                                                <div class="stat-item">
                                                        <span class="stat-label">当前变更数</span>
                                                        <span class="stat-value">{{ backupStats.changeCount }}</span>
                                                </div>
                                                <div class="stat-item">
                                                        <span class="stat-label">最后自动备份</span>
                                                        <span class="stat-value">
                                                                {{ backupStats.lastAutoBackup ? formatDate(backupStats.lastAutoBackup) : '从未' }}
                                                        </span>
                                                </div>
                                                <div class="stat-item">
                                                        <span class="stat-label">下次备份时间</span>
                                                        <span class="stat-value">
                                                                {{ backupStats.nextAutoBackup ? formatDate(backupStats.nextAutoBackup) : '未知' }}
                                                        </span>
                                                </div>
                                        </div>
                                </div>
                        </div>

                        <div class="sync-actions">
                                <button @click="handleSync" :disabled="!canSync || isSyncing"
                                        class="sync-button primary">
                                        <span v-if="isSyncing">同步中...</span>
                                        <span v-else>
                                                {{ syncServiceType === 'github' 
                                                        ? (globalSettings.githubGistId ? '更新到 Gist' : '创建并同步到 Gist')
                                                        : '同步到坚果云' }}
                                        </span>
                                </button>
                                <button @click="handleRestore" :disabled="!canRestore || isSyncing"
                                        class="sync-button secondary">
                                        {{ syncServiceType === 'github' ? '从 Gist 恢复' : '从坚果云恢复' }}
                                </button>
                        </div>
                </section>                        <section class="settings-card">
                                <div class="card-header">
                                        <h2>本地数据管理</h2>
                                </div>
                                <p class="description">导入导出本地备份文件</p>
                                <div class="data-actions">
                                        <button @click="handleLocalExport" class="data-button export">
                                                <span class="button-text">
                                                        <strong>导出备份</strong>
                                                        <small>保存所有数据到本地文件</small>
                                                </span>
                                        </button>
                                        <button @click="triggerFileInput" class="data-button import">
                                                <span class="button-text">
                                                        <strong>导入备份</strong>
                                                        <small>从本地文件恢复数据</small>
                                                </span>
                                        </button>
                                </div>
                                <input type="file" ref="fileInput" @change="handleLocalImport" accept=".json"
                                        style="display: none;">
                        </section>
                </main>
        </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import db, { initializeGlobalSettings } from '../services/database.js';
import { fetchModels } from '../services/APIConnection.js';
import { fetchElevenLabsVoices } from '../services/elevenLabsService.js';
import AppHeader from '../components/layout/Header.vue';
import MainDropdown from '../components/ui/MainDropdown.vue';
import { packDataForExport, unpackAndImportData } from '../services/dataService.js';
import { syncToGist, restoreFromGist } from '../services/gistService.js';
import { syncToNutstore, restoreFromNutstore } from '../services/nutstoreService.js';
import { showToast, showConfirm } from '../services/uiService.js';
import RangeSlider from '../components/ui/RangeSlider.vue';
import { requestNotificationPermission } from '../services/notificationService.js'; 
import { 
        getAutoBackupSettings, 
        saveAutoBackupSettings, 
        getBackupStats, 
        initializeBackupTracking 
} from '../services/incrementalBackupService.js'; 

const router = useRouter();

// --- 状态管理 ---
const apiProfiles = ref([]); // 存储所有API方案的列表
const ttsProfiles = ref([]); // 存储所有TTS方案的列表
const activeProfileId = ref(null); // 当前选中的方案ID
const activeTtsProfileId = ref(null); // 当前选中的TTS方案ID
const currentProfile = ref(null); // 正在编辑的方案的完整数据对象
const currentTtsProfile = ref(null); // 正在编辑的TTS方案的完整数据对象
const isNewProfile = ref(false); // 标记是否正在创建新方案
const isNewTtsProfile = ref(false); // 标记是否正在创建新TTS方案
const globalSettings = ref({
        backgroundActivity: {
                enabled: true,
                probability: 50,
                maxChars: 2,
                interval: 100000,
        },
        // 云端同步配置
        syncServiceType: 'github', // 'github' 或 'nutstore'
        // GitHub 配置
        githubToken: '',
        githubGistId: '',
        // 坚果云配置
        nutstoreEmail: '',
        nutstoreToken: '',
        nutstorePath: '/mirrorPhone-backup.json'
    });
const isFetchingModels = ref(false);
const availableModels = ref([]);
const fileInput = ref(null); // 用于访问隐藏的文件输入框
const notificationPermission = ref('default'); 

// ElevenLabs TTS 状态
const elevenLabsVoices = ref([]);

// 云端同步相关状态
const isSyncing = ref(false);
const lastSyncTime = ref('');
const syncServiceType = ref('github'); // 'github' 或 'nutstore'

// 自动备份相关状态
const autoBackupSettings = ref({
        enabled: false,
        interval: 24 * 60 * 60 * 1000, // 24小时
        maxChanges: 50
});
const backupStats = ref(null);

// 计算属性
const canSync = computed(() => {
        if (syncServiceType.value === 'github') {
                return globalSettings.value.githubToken && globalSettings.value.githubToken.trim() !== '';
        } else if (syncServiceType.value === 'nutstore') {
                return globalSettings.value.nutstoreEmail && globalSettings.value.nutstoreEmail.trim() !== '' &&
                       globalSettings.value.nutstoreToken && globalSettings.value.nutstoreToken.trim() !== '';
        }
        return false;
});

const canRestore = computed(() => {
        if (syncServiceType.value === 'github') {
                return canSync.value && globalSettings.value.githubGistId && globalSettings.value.githubGistId.trim() !== '';
        } else if (syncServiceType.value === 'nutstore') {
                return canSync.value; // 坚果云可以从默认路径恢复
        }
        return false;
});

// 后台活动间隔秒数转换
const backgroundActivityIntervalInSeconds = computed({
        get: () => Math.floor(globalSettings.value.backgroundActivity.interval / 1000),
        set: (value) => {
                globalSettings.value.backgroundActivity.interval = value * 1000;
        }
});

// 下拉菜单选项
const profileOptions = computed(() => {
        return apiProfiles.value.map(profile => ({
                label: profile.profileName,
                value: profile.id
        }));
});

const ttsProfileOptions = computed(() => {
        return ttsProfiles.value.map(profile => ({
                label: profile.profileName,
                value: profile.id
        }));
});

const connectionTypeOptions = [
        { label: 'Gemini 直连', value: 'direct' },
        { label: '默认 / 其他反代', value: 'proxy' }
];

const modelOptions = computed(() => {
        return availableModels.value.map(model => ({
                label: model,
                value: model
        }));
});


const checkNotificationPermission = () => {
        if ('Notification' in window) {
                notificationPermission.value = Notification.permission;
        }
};

const handleNotificationToggle = async (event) => {
        const isEnabled = event.target.checked;

        if (isEnabled) {
                // 只需请求权限
                await requestNotificationPermission();
        } else {
                // 浏览器没有提供直接撤销权限的API
                // 只能提示用户去浏览器设置中关闭
                showToast('请在浏览器设置中关闭通知权限', 'info');
                // 由于无法编程方式撤销，我们将开关状态重置回它本来的状态
                event.target.checked = (notificationPermission.value === 'granted');
                return;
        }

        // 重新检查并更新UI状态
        checkNotificationPermission();
};

// --- 生命周期钩子 ---
onMounted(async () => {
        await initializeGlobalSettings();
        await loadApiProfiles();
        await loadTtsProfiles();
        await loadGlobalSettings();
        checkNotificationPermission();
        
        // 初始化备份相关
        loadAutoBackupSettings();
        loadBackupStats();
        initializeBackupTracking();
});

// --- 监听下拉框选择变化 ---
watch(activeProfileId, (newId) => {
        availableModels.value = []; // 切换方案时，清空已拉取的模型列表
        if (newId !== null) {
                isNewProfile.value = false;
                loadProfileForEditing(newId);
        } else {
                currentProfile.value = null;
        }
});

watch(activeTtsProfileId, (newId) => {
        if (newId !== null) {
                isNewTtsProfile.value = false;
                loadTtsProfileForEditing(newId);
        } else {
                currentTtsProfile.value = null;
        }
});

async function handleFetchModels() {
        if (!currentProfile.value?.apiKey) {
                showToast('请输入 API 密钥后才能拉取模型。', 'error');
                return;
        }
        // 反代模式下，同样需要检查URL
        if (currentProfile.value.connectionType === 'proxy' && !currentProfile.value.apiUrl) {
                showToast('反向代理地址不能为空。', 'error');
                return;
        }

        isFetchingModels.value = true;
        availableModels.value = [];
        try {
                const models = await fetchModels(currentProfile.value);

                availableModels.value = models;

                if (models.length > 0 && !models.includes(currentProfile.value.model)) {
                        currentProfile.value.model = models[0];
                }

                showToast(`成功获取 ${models.length} 个可用模型！`, 'success');
        } catch (error) {
                showToast(`获取模型失败：${error.message}`, 'error');
        } finally {
                isFetchingModels.value = false;
        }
}

// --- 数据库交互 ---
async function loadGlobalSettings() {
        const settings = await db.globalSettings.get('global');
        if (settings) {
                globalSettings.value = { ...globalSettings.value, ...settings }; 
                // 加载同步服务类型
                if (settings.syncServiceType) {
                        syncServiceType.value = settings.syncServiceType;
                }
                if (settings.activeApiProfileId) {
                        activeProfileId.value = settings.activeApiProfileId;
                        loadProfileForEditing(activeProfileId.value);
                } else {
                        currentProfile.value = null;
                }
                if (settings.activeTtsProfileId) {
                        activeTtsProfileId.value = settings.activeTtsProfileId;
                        loadTtsProfileForEditing(activeTtsProfileId.value);
                } else {
                        currentTtsProfile.value = null;
                }
        }
}

async function loadApiProfiles() {
        apiProfiles.value = await db.apiProfiles.toArray();
}

async function loadTtsProfiles() {
        ttsProfiles.value = await db.ttsProfiles.toArray();
}

async function loadProfileForEditing(id) {
        const profile = await db.apiProfiles.get(id);
        currentProfile.value = profile ? { ...profile } : null;
}

async function loadTtsProfileForEditing(id) {
        const profile = await db.ttsProfiles.get(id);
        currentTtsProfile.value = profile ? { ...profile } : null;
}

// --- 用户操作 ---
function addNewProfile(type) {
        if (type === 'api') {
                isNewProfile.value = true;
                activeProfileId.value = null;
                availableModels.value = []; // 新建时也清空
                currentProfile.value = {
                        profileName: '',
                        connectionType: 'proxy',
                        apiUrl: '',
                        apiKey: '',
                        model: '',
                };
        } else if (type === 'tts') {
                isNewTtsProfile.value = true;
                activeTtsProfileId.value = null;
                elevenLabsVoices.value = [];
                currentTtsProfile.value = {
                        profileName: '',
                        apiKey: '',
                };
        }
}

async function deleteCurrentProfile(type) {
        if (type === 'api') {
                if (!activeProfileId.value) return;
                const confirmed = await showConfirm(
                        '删除方案',
                        `确定要删除方案 "${currentProfile.value.profileName}" 吗？`,
                );
                if (confirmed) {
                        const deletedId = activeProfileId.value;
                        await db.apiProfiles.delete(deletedId);

                        if (globalSettings.value.activeApiProfileId === deletedId) {
                                globalSettings.value.activeApiProfileId = null;
                        }

                        activeProfileId.value = null;
                        currentProfile.value = null;
                        await loadApiProfiles();
                        showToast('方案已删除。', 'success');
                }
        } else if (type === 'tts') {
                if (!activeTtsProfileId.value) return;
                const confirmed = await showConfirm(
                        '删除方案',
                        `确定要删除方案 "${currentTtsProfile.value.profileName}" 吗？`,
                );
                if (confirmed) {
                        const deletedId = activeTtsProfileId.value;
                        await db.ttsProfiles.delete(deletedId);

                        if (globalSettings.value.activeTtsProfileId === deletedId) {
                                globalSettings.value.activeTtsProfileId = null;
                        }

                        activeTtsProfileId.value = null;
                        currentTtsProfile.value = null;
                        await loadTtsProfiles();
                        showToast('方案已删除。', 'success');
                }
        }
}

async function saveChanges() {
        try {
                if (globalSettings.value.backgroundActivity.enabled) {
                        const confirmed = await showConfirm(
                                '启用后台活动确认',
                                '后台活动会持续调用AI服务并可能产生费用。您确定要启用并保存设置吗？'
                        );
                        if (!confirmed) {
                                showToast('操作已取消', 'info');
                                return; // 如果用户取消，则不执行任何保存操作
                        }
                }
                // 1. 保存 API 方案（如果有修改）
                if (currentProfile.value) {
                        const profileToSave = { ...currentProfile.value };

                        let savedId;
                        if (isNewProfile.value) {
                                // 使用纯净对象进行 add 操作
                                savedId = await db.apiProfiles.add(profileToSave);
                                isNewProfile.value = false;
                        } else {
                                // 使用纯净对象进行 put 操作
                                savedId = profileToSave.id;
                                await db.apiProfiles.put(profileToSave);
                        }

                        // 将当前编辑的方案ID同步到全局设置中
                        globalSettings.value.activeApiProfileId = savedId;
                        activeProfileId.value = savedId; // 更新下拉框
                        await loadApiProfiles();
                }

                // 2. 保存 TTS 方案（如果有修改）
                if (currentTtsProfile.value) {
                        const profileToSave = { ...currentTtsProfile.value };

                        let savedId;
                        if (isNewTtsProfile.value) {
                                // 使用纯净对象进行 add 操作
                                savedId = await db.ttsProfiles.add(profileToSave);
                                isNewTtsProfile.value = false;
                        } else {
                                // 使用纯净对象进行 put 操作
                                savedId = profileToSave.id;
                                await db.ttsProfiles.put(profileToSave);
                        }

                        // 将当前编辑的方案ID同步到全局设置中
                        globalSettings.value.activeTtsProfileId = savedId;
                        activeTtsProfileId.value = savedId; // 更新下拉框
                        await loadTtsProfiles();
                }

                // 3. 保存所有全局设置
                const existingSettings = await db.globalSettings.get('global') || {};

                // 然后，创建一个新的对象，包含旧设置和当前页面要更新的设置
                const settingsToSave = {
                        ...existingSettings, // 展开所有现有设置，保留个性化等配置
                        id: 'global', // 确保主键存在
                        // 更新 SettingsView 相关的字段
                        activeApiProfileId: globalSettings.value.activeApiProfileId,
                        activeTtsProfileId: globalSettings.value.activeTtsProfileId,
                        cloudinaryCloudName: globalSettings.value.cloudinaryCloudName,
                        cloudinaryUploadPreset: globalSettings.value.cloudinaryUploadPreset,
                        // 云端同步配置
                        syncServiceType: syncServiceType.value,
                        githubGistId: globalSettings.value.githubGistId,
                        githubToken: globalSettings.value.githubToken,
                        nutstoreEmail: globalSettings.value.nutstoreEmail,
                        nutstoreToken: globalSettings.value.nutstoreToken,
                        nutstorePath: globalSettings.value.nutstorePath,
                        backgroundActivity: JSON.parse(JSON.stringify(globalSettings.value.backgroundActivity)),

                };

                // 使用 put 方法保存合并后的完整设置对象
                await db.globalSettings.put(settingsToSave);

                showToast('设置已保存！', 'success');
        } catch (error) {
                console.error('保存失败:', error);
                showToast('保存失败。', 'error');
        }
}

// --- ElevenLabs TTS a ---
async function testElevenLabsConnection() {
        if (!currentTtsProfile.value.apiKey) {
                showToast('请输入 ElevenLabs API Key', 'error');
                return;
        }

        try {
                const voices = await fetchElevenLabsVoices(currentTtsProfile.value.apiKey);
                elevenLabsVoices.value = voices;
                showToast(`连接成功！获取到 ${voices.length} 个声音。`, 'success');
        } catch (error) {
                elevenLabsVoices.value = [];
                showToast(`连接失败: ${error.message}`, 'error');
        }
}

// --- 自动备份相关方法 ---
function loadAutoBackupSettings() {
        autoBackupSettings.value = getAutoBackupSettings();
}

function loadBackupStats() {
        backupStats.value = getBackupStats();
}

// 监听同步服务类型变化
watch(syncServiceType, (newType) => {
        // 当切换同步服务类型时，可以在这里添加逻辑
        // 例如重置相关配置或显示提示
});

// 格式化日期
function formatDate(timestamp) {
        if (!timestamp) return '从未';
        return new Date(timestamp).toLocaleString('zh-CN');
}

// --- 云端同步处理 ---

async function handleSync() {
        if (!canSync.value) {
                const serviceName = syncServiceType.value === 'github' ? 'GitHub Token' : '坚果云邮箱和Access Token';
                showToast(`请先配置 ${serviceName}`, 'error');
                return;
        }

        isSyncing.value = true;
        try {
                if (syncServiceType.value === 'github') {
                        const gistId = await syncToGist(globalSettings.value.githubToken, globalSettings.value.githubGistId);

                        // 如果是新创建的 Gist，更新设置中的 Gist ID
                        if (!globalSettings.value.githubGistId) {
                                globalSettings.value.githubGistId = gistId;
                                await saveChanges(); // 保存新的 Gist ID
                        }

                        showToast('数据已成功同步到 GitHub Gist！', 'success');
                } else if (syncServiceType.value === 'nutstore') {
                        await syncToNutstore(globalSettings.value.nutstoreEmail, globalSettings.value.nutstoreToken, globalSettings.value.nutstorePath);
                        showToast('数据已成功同步到坚果云！', 'success');
                }

                lastSyncTime.value = new Date().toLocaleString('zh-CN');
        } catch (error) {
                console.error('同步失败:', error);
                showToast(`同步失败: ${error.message}`, 'error');
        } finally {
                isSyncing.value = false;
        }
}

async function handleRestore() {
        if (!canRestore.value) {
                const message = syncServiceType.value === 'github' 
                        ? '请先配置 GitHub Token 和 Gist ID'
                        : '请先配置坚果云邮箱和Access Token';
                showToast(message, 'error');
                return;
        }

        const serviceName = syncServiceType.value === 'github' ? 'Gist' : '坚果云';
        const confirmed = await showConfirm(
                `从 ${serviceName} 恢复`,
                '这将覆盖所有本地数据，确定要继续吗？'
        );

        if (!confirmed) return;

        isSyncing.value = true;
        try {
                if (syncServiceType.value === 'github') {
                        await restoreFromGist(globalSettings.value.githubToken, globalSettings.value.githubGistId);
                } else if (syncServiceType.value === 'nutstore') {
                        await restoreFromNutstore(globalSettings.value.nutstoreEmail, globalSettings.value.nutstoreToken, globalSettings.value.nutstorePath);
                }

                showToast('数据恢复成功！应用将重新加载。', 'success');
                // 重新加载页面以确保所有状态都从新数据库中读取
                setTimeout(() => {
                        window.location.reload();
                }, 1500);
        } catch (error) {
                console.error('恢复失败:', error);
                showToast(`恢复失败: ${error.message}`, 'error');
        } finally {
                isSyncing.value = false;
        }
}

// --- 数据导入/导出处理 ---

function triggerFileInput() {
        // 模拟点击隐藏的文件输入框
        fileInput.value.click();
}

async function handleLocalExport() {
        try {
                const jsonData = await packDataForExport();
                const blob = new Blob([jsonData], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                // 使用当前日期时间生成文件名
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                a.download = `mirrorPhone-backup-${timestamp}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                showToast('数据已开始导出！', 'info');
        } catch (error) {
                console.error('导出失败:', error);
                showToast(`导出失败: ${error.message}`, 'error');
        }
}

async function handleLocalImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const confirmed = await showConfirm('导入备份将覆盖所有现有数据，确定要继续吗？');
        if (!confirmed) {
                // 重置文件输入框，以便下次还能选择同一个文件
                event.target.value = '';
                return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
                try {
                        const jsonString = e.target.result;
                        await unpackAndImportData(jsonString);
                        showToast('数据导入成功！应用将重新加载以应用更改。', 'success');
                        // 重新加载页面以确保所有状态都从新数据库中读取
                        window.location.reload();
                } catch (error) {
                        console.error('导入失败:', error);
                        showToast(`导入失败: ${error.message}`, 'error');
                } finally {
                        event.target.value = '';
                }
        };
        reader.onerror = (e) => {
                showToast('读取文件失败！', 'error');
                event.target.value = '';
        };
        reader.readAsText(file);
}

</script>

<style scoped>
.header-action-button {
        background: none;
        border: none;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
}

.profile-actions {
        display: flex;
        gap: 10px;
}

.button-group {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
}

.action-button {
        background: none;
        border: 1px solid var(--border-color);
        color: var(--text-secondary);
        padding: 4px 12px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 14px;
}

.action-button.delete:not(:disabled) {
        color: #e57373;
        border-color: #e57373;
}

.action-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
}

.form-group {
        margin-bottom: 15px;
}

.form-group label {
        display: block;
        margin-bottom: 8px;
        font-size: 14px;
        color: var(--text-secondary);
}

.form-group input,
.form-group select {
        width: 100%;
        padding: 12px;
        border-radius: 4px;
        border: 1px solid var(--border-color);
        background-color: var(--bg-primary);
        color: var(--text-primary);
        box-sizing: border-box;
        font-size: 16px;
}

.profile-form {
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid var(--border-color);
}

.model-group {
        display: flex;
        gap: 10px;
}

.model-group input {
        flex-grow: 1;
}

.pull-button {
        padding: 0 20px;
        background-color: var(--bg-secondary);
        color: var(--text-primary);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        cursor: pointer;
}

.pull-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
}

/* 云端同步样式 */
.sync-status {
        display: flex;
        align-items: center;
}

.status-indicator {
        font-size: 12px;
        padding: 4px 8px;
        border-radius: 12px;
        font-weight: 500;
}

.status-indicator.syncing {
        background-color: #ffc107;
        color: #000;
}

.status-indicator.success {
        background-color: #28a745;
        color: #fff;
}

.form-help {
        font-size: 12px;
        color: var(--text-secondary);
        margin-top: 5px;
        line-height: 1.4;
}

.form-help a {
        color: var(--accent-primary);
        text-decoration: none;
}

.form-help a:hover {
        text-decoration: underline;
}

.sync-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-top: 15px;
}

.sync-button {
        padding: 12px 20px;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 14px;
}

.sync-button.primary {
        background-color: var(--accent-primary);
        color: var(--accent-text);
}

.sync-button.primary:hover:not(:disabled) {
        background-color: var(--accent-darker);
}

.sync-button.secondary {
        background-color: var(--bg-secondary);
        color: var(--text-primary);
        border: 1px solid var(--border-color);
}

.sync-button.secondary:hover:not(:disabled) {
        background-color: var(--bg-card);
}

.sync-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
}

/* 数据管理样式 */
.data-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
        margin-top: 15px;
}

.data-button {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        border: 2px solid var(--border-color);
        border-radius: 12px;
        background-color: var(--bg-secondary);
        color: var(--text-primary);
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: left;
}

.data-button:hover {
        border-color: var(--accent-primary);
        background-color: var(--bg-card);
        transform: translateY(-1px);
}

.data-button.export:hover {
        border-color: var(--accent-primary);
}

.data-button.import:hover {
        border-color: var(--accent-primary);
}

.button-icon {
        font-size: 24px;
        flex-shrink: 0;
}

.button-text {
        display: flex;
        flex-direction: column;
        gap: 4px;
}

.button-text strong {
        font-size: 14px;
        font-weight: 600;
}

.button-text small {
        font-size: 12px;
        color: var(--text-secondary);
}

/* 自动备份样式 */
.auto-backup-settings {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid var(--border-color);
}

.backup-stats {
        margin-top: 20px;
        padding: 16px;
        background: var(--bg-primary);
        border-radius: 8px;
        border: 1px solid var(--border-color);
}

.backup-stats h4 {
        margin: 0 0 12px 0;
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
}

.stats-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
}

.stat-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
}

.stat-label {
        font-size: 12px;
        color: var(--text-secondary);
}

.stat-value {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
}

/* Toggle Switch 样式 */
.setting-section {
        margin: 20px 0;
        padding: 16px;
        background: var(--bg-primary);
        border-radius: 8px;
        border: 1px solid var(--border-color);
}

.setting-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
}

.setting-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary);
}

.setting-description {
        margin: 0;
        font-size: 14px;
        color: var(--text-secondary);
        line-height: 1.5;
}
</style>