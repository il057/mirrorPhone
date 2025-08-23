<!-- src/views/SettingsView.vue -->
<template>
        <div class="page-container">
                <AppHeader title="设置">
                        <template #right>
                                <button @click="saveChanges" class="header-action-button">保存</button>
                        </template>
                </AppHeader>

                <main class="settings-content">
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

                        <!-- 数据同步卡片 -->
                        <section class="settings-card">
                                <div class="card-header">
                                        <h2>云端同步 (GitHub Gist)</h2>
                                </div>
                                <div class="form-group">
                                        <label for="gistId">Gist ID</label>
                                        <input id="gistId" type="text" v-model="globalSettings.githubGistId"
                                                placeholder="用于同步的 Gist ID">
                                </div>
                                <p class="description">登录和同步功能待开发。</p>
                        </section>

                        <!-- 数据管理卡片 -->
                        <section class="settings-card">
                                <div class="card-header">
                                        <h2>数据管理</h2>
                                </div>
                                <p class="description">备份你的所有设置、方案和聊天记录。</p>
                                <div class="button-group">
                                        <button @click="handleLocalExport" class="manage-button">导出到本地</button>
                                        <button @click="triggerFileInput" class="manage-button">从本地导入</button>
                                </div>
                                <p class="description" style="margin-top: 15px;">云端同步功能待开发。</p>
                                <div class="button-group">
                                        <button class="manage-button" disabled>同步到 Gist</button>
                                        <button class="manage-button" disabled>从 Gist 恢复</button>
                                </div>
                                <!-- 隐藏的文件输入框 -->
                                <input type="file" ref="fileInput" @change="handleLocalImport" accept=".json"
                                        style="display: none;">
                        </section>
                </main>
        </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import db, { initializeGlobalSettings } from '../services/database.js';
import { fetchModels } from '../services/APIConnection.js';
import AppHeader from '../components/layout/Header.vue';
import { packDataForExport, unpackAndImportData } from '../services/dataService.js';
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
                await db.globalSettings.put({ ...globalSettings.value });

                showToast('设置已保存！', 'success');
        } catch (error) {
                console.error('保存失败:', error);
                showToast('保存失败。', 'error');
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
.page-container {
        background-color: var(--bg-primary);
        color: var(--text-primary);
        width: 100vw;
        height: 100vh;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
}

.header-action-button {
        background: none;
        border: none;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
}

.settings-content {
        flex-grow: 1;
        overflow-y: auto;
        padding: 20px;
}

.settings-card {
        background-color: var(--bg-card);
        border-radius: 8px;
        padding: 15px 20px;
        margin-bottom: 20px;
}

.card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
}

.card-header h2 {
        margin: 0;
        font-size: 18px;
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
</style>
