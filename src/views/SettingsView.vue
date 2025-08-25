<!-- src/views/SettingsView.vue -->
<template>
        <div class="page-container">
                <AppHeader title="设置">
                        <template #right>
                                <button @click="saveChanges" class="header-action-button">保存</button>
                        </template>
                </AppHeader>

                <main class="settings-content content">
                        <!-- AI API 设置卡片 -->
                        <section class="settings-card">
                                <div class="card-header">
                                        <h2>AI API 设置</h2>
                                        <div class="profile-actions">
                                                <button @click="addNewProfile" class="action-button">+ 新增</button>
                                                <button @click="deleteCurrentProfile" :disabled="!activeProfileId"
                                                        class="action-button delete">- 删除</button>
                                        </div>
                                </div>

                                <div class="form-group">
                                        <label>当前方案</label>
                                        <select v-model="activeProfileId">
                                                <option :value="null" disabled>-- 请选择一个方案 --</option>
                                                <option v-for="profile in apiProfiles" :key="profile.id"
                                                        :value="profile.id">
                                                        {{ profile.profileName }}
                                                </option>
                                        </select>
                                </div>

                                <!-- 方案编辑表单 -->
                                <div v-if="currentProfile" class="profile-form">
                                        <div class="form-group">
                                                <label>方案名称</label>
                                                <input type="text" v-model="currentProfile.profileName"
                                                        placeholder="为你的方案起个名字">
                                        </div>
                                        <div class="form-group">
                                                <label>API 服务商</label>
                                                <select v-model="currentProfile.connectionType">
                                                        <option value="direct">Gemini 直连</option>
                                                        <option value="proxy">默认 / 其他反代</option>
                                                </select>
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
                                                        <!-- 如果已拉取到模型列表，则显示下拉框 -->
                                                        <select v-if="availableModels.length > 0"
                                                                v-model="currentProfile.model">
                                                                <option v-for="modelName in availableModels"
                                                                        :key="modelName" :value="modelName">
                                                                        {{ modelName }}
                                                                </option>
                                                        </select>
                                                        <!-- 否则，显示文本输入框 -->
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

                        <!-- TTS 设置卡片 (框架) -->
                        <section class="settings-card">
                                <div class="card-header">
                                        <h2>TTS 语音服务</h2>
                                        <!-- 未来可以添加新增/删除按钮 -->
                                </div>
                                <p class="description">此功能待开发。</p>
                        </section>

                        <!-- 图片上传服务卡片 -->
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

                        <!-- 云端同步卡片 -->
                        <section class="settings-card">
                                <div class="card-header">
                                        <h2>云端同步 (GitHub Gist)</h2>
                                        <div class="sync-status">
                                                <span v-if="isSyncing" class="status-indicator syncing">同步中...</span>
                                                <span v-else-if="lastSyncTime" class="status-indicator success">
                                                        最后同步: {{ lastSyncTime }}
                                                </span>
                                        </div>
                                </div>
                                <div class="form-group">
                                        <label for="githubToken">GitHub Personal Access Token</label>
                                        <input id="githubToken" type="password" v-model="globalSettings.githubToken"
                                                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx">
                                        <p class="form-help">
                                                需要具有 'gist' 权限的 Personal Access Token。
                                                <a href="https://github.com/settings/tokens" target="_blank" rel="noopener">创建 Token</a>
                                        </p>
                                </div>
                                <div class="form-group">
                                        <label for="gistId">Gist ID (可选)</label>
                                        <input id="gistId" type="text" v-model="globalSettings.githubGistId"
                                                placeholder="留空则自动创建新的 Gist">
                                        <p class="form-help">如果已有备份 Gist，请填入其 ID</p>
                                </div>
                                <div class="sync-actions">
                                        <button @click="handleSyncToGist" :disabled="!canSync || isSyncing" 
                                                class="sync-button primary">
                                                <span v-if="isSyncing">同步中...</span>
                                                <span v-else>{{ globalSettings.githubGistId ? '更新到 Gist' : '创建并同步到 Gist' }}</span>
                                        </button>
                                        <button @click="handleRestoreFromGist" :disabled="!canRestore || isSyncing" 
                                                class="sync-button secondary">
                                                从 Gist 恢复
                                        </button>
                                </div>
                        </section>

                        <!-- 数据管理卡片 -->
                        <section class="settings-card">
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
                                <!-- 隐藏的文件输入框 -->
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
import AppHeader from '../components/layout/Header.vue';
import { packDataForExport, unpackAndImportData } from '../services/dataService.js';
import { syncToGist, restoreFromGist } from '../services/gistService.js';
import { showToast, showConfirm } from '../services/uiService.js';

const router = useRouter();

// --- 状态管理 ---
const apiProfiles = ref([]); // 存储所有API方案的列表
const activeProfileId = ref(null); // 当前选中的方案ID
const currentProfile = ref(null); // 正在编辑的方案的完整数据对象
const isNewProfile = ref(false); // 标记是否正在创建新方案
const globalSettings = ref({});
const isFetchingModels = ref(false);
const availableModels = ref([]);
const fileInput = ref(null); // 用于访问隐藏的文件输入框

// 云端同步相关状态
const isSyncing = ref(false);
const lastSyncTime = ref('');

// 计算属性
const canSync = computed(() => {
        return globalSettings.value.githubToken && globalSettings.value.githubToken.trim() !== '';
});

const canRestore = computed(() => {
        return canSync.value && globalSettings.value.githubGistId && globalSettings.value.githubGistId.trim() !== '';
});

// --- 生命周期钩子 ---
onMounted(async () => {
        await initializeGlobalSettings();
        await loadApiProfiles();
        await loadGlobalSettings();
});

// --- 监听下拉框选择变化 ---
watch(activeProfileId, (newId) => {
        availableModels.value = []; // 切换方案时，清空已拉取的模型列表
        if (newId !== null) {
                isNewProfile.value = false;
                loadProfileForEditing(newId);
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
                globalSettings.value = settings; // 加载所有全局设置
                if (settings.activeApiProfileId) {
                        activeProfileId.value = settings.activeApiProfileId;
                        loadProfileForEditing(activeProfileId.value);
                } else {
                        currentProfile.value = null;
                }
        }
}

async function loadApiProfiles() {
        apiProfiles.value = await db.apiProfiles.toArray();
}

async function loadProfileForEditing(id) {
        const profile = await db.apiProfiles.get(id);
        currentProfile.value = profile ? { ...profile } : null;
}

// --- 用户操作 ---
function addNewProfile() {
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
      }

async function deleteCurrentProfile() {
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
}

async function saveChanges() {
        try {
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

                // 2. 保存所有全局设置
                // 只保存可序列化的全局设置
                const { activeApiProfileId, cloudinaryCloudName, cloudinaryUploadPreset, githubGistId, githubToken } = globalSettings.value;
                await db.globalSettings.put({
                        id: 'global',
                        activeApiProfileId,
                        cloudinaryCloudName,
                        cloudinaryUploadPreset,
                        githubGistId,
                        githubToken
                });

                showToast('设置已保存！', 'success');
        } catch (error) {
                console.error('保存失败:', error);
                showToast('保存失败。', 'error');
        }
}

// --- 云端同步处理 ---

async function handleSyncToGist() {
        if (!canSync.value) {
                showToast('请先配置 GitHub Token', 'error');
                return;
        }

        isSyncing.value = true;
        try {
                const gistId = await syncToGist(globalSettings.value.githubToken, globalSettings.value.githubGistId);
                
                // 如果是新创建的 Gist，更新设置中的 Gist ID
                if (!globalSettings.value.githubGistId) {
                        globalSettings.value.githubGistId = gistId;
                        await saveChanges(); // 保存新的 Gist ID
                }
                
                lastSyncTime.value = new Date().toLocaleString('zh-CN');
                showToast('数据已成功同步到 GitHub Gist！', 'success');
        } catch (error) {
                console.error('同步失败:', error);
                showToast(`同步失败: ${error.message}`, 'error');
        } finally {
                isSyncing.value = false;
        }
}

async function handleRestoreFromGist() {
        if (!canRestore.value) {
                showToast('请先配置 GitHub Token 和 Gist ID', 'error');
                return;
        }

        const confirmed = await showConfirm(
                '从 Gist 恢复',
                '这将覆盖所有本地数据，确定要继续吗？'
        );
        
        if (!confirmed) return;

        isSyncing.value = true;
        try {
                await restoreFromGist(globalSettings.value.githubToken, globalSettings.value.githubGistId);
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
</style>
