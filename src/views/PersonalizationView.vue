<template>
        <div class="page-container">
                <AppHeader title="个性化">
                        <template #right>
                                <button @click="isEditMode ? isEditMode = false : saveAllSettings()"
                                        class="header-action-button">
                                        {{ isEditMode ? '完成' : '保存' }}
                                </button>
                        </template>
                </AppHeader>

                <main class="settings-content content">
                        <section class="settings-card">
                                <div class="form-group">
                                        <label>选择自定义内容</label>
                                        <div class="segmented-control">
                                                <label :class="{ active: activeMainMode === 'wallpaper' }">
                                                        <input type="radio" v-model="activeMainMode" value="wallpaper">
                                                        <span>壁纸与主题</span>
                                                </label>
                                                <label :class="{ active: activeMainMode === 'icon' }">
                                                        <input type="radio" v-model="activeMainMode" value="icon">
                                                        <span>图标</span>
                                                </label>
                                                <label :class="{ active: activeMainMode === 'notification' }">
                                                        <input type="radio" v-model="activeMainMode"
                                                                value="notification">
                                                        <span>通知特效</span>
                                                </label>
                                        </div>
                                </div>

                                <div id="wallpaper-preview" ref="wallpaperPreviewRef" class="wallpaper-preview">
                                        <div ref="wallpaperEffectRef" class="wallpaper-effect-container"></div>

                                        <div class="icon-preview-grid"
                                                :class="{ 'is-wallpaper-mode': activeMainMode === 'wallpaper' }">
                                                <div v-for="app in homeScreenApps" :key="app.id"
                                                        class="app-wrapper-preview"
                                                        @click="activeMainMode === 'icon' && selectAppIcon(app)">
                                                        <div class="app-wrapper" :class="{
                                                                'has-notification': activeMainMode === 'notification' && notificationEffectsEnabled && ['chat', 'offline-summary'].includes(app.id)
                                                        }">
                                                                <AppIcon :name="app.name"
                                                                        :icon-src="appIconSettings[app.id]"
                                                                        :is-preview="true">
                                                                        <component :is="app.component" />
                                                                </AppIcon>
                                                        </div>
                                                        <span class="app-name-preview">{{ app.name }}</span>
                                                </div>
                                        </div>
                                </div>

                                <!-- 通知特效设置 - 放置在预览框下方 -->
                                <div v-if="activeMainMode === 'notification'" class="notification-settings">
                                        <div class="form-group">
                                                <div class="toggle-switch-container">
                                                        <label>新消息通知特效</label>
                                                        <div class="toggle-switch">
                                                                <input type="checkbox" id="notification-effects"
                                                                        v-model="notificationEffectsEnabled"
                                                                        @change="saveNotificationSettings">
                                                                <label for="notification-effects" class="toggle-label">
                                                                        <span class="toggle-slider"></span>
                                                                </label>
                                                        </div>
                                                </div>
                                                <p class="setting-description">当有新消息或离线总结时，主屏幕图标会显示发光特效</p>
                                        </div>
                                </div>

                                <div v-if="activeMainMode === 'wallpaper'">

                                        <div class="form-group">
                                                <label>选择壁纸模式</label>
                                                <div class="segmented-control">
                                                        <label :class="{ active: activeWallpaperMode === 'image' }">
                                                                <input type="radio" v-model="activeWallpaperMode"
                                                                        value="image"
                                                                        @change="handleModeChange"><span>图片</span>
                                                        </label>
                                                        <label :class="{ active: activeWallpaperMode === 'gradient' }">
                                                                <input type="radio" v-model="activeWallpaperMode"
                                                                        value="gradient"
                                                                        @change="handleModeChange"><span>渐变</span>
                                                        </label>
                                                        <label :class="{ active: activeWallpaperMode === 'animated' }">
                                                                <input type="radio" v-model="activeWallpaperMode"
                                                                        value="animated"
                                                                        @change="handleModeChange"><span>动态</span>
                                                        </label>
                                                </div>
                                        </div>

                                        <div v-if="activeWallpaperMode === 'image'">

                                                <!-- 为图片模式也添加预设功能 -->
                                                <div class="form-group">
                                                        <label>从图片预设中选择</label>
                                                        <div class="preset-grid"
                                                                @mousedown="startLongPress('wallpaper')"
                                                                @mouseup="cancelLongPress" @mouseleave="cancelLongPress"
                                                                @touchstart="startLongPress('wallpaper')"
                                                                @touchend="cancelLongPress"
                                                                @touchmove="cancelLongPress">
                                                                <div v-for="(p, index) in currentPresets"
                                                                        :key="p.name + index"
                                                                        class="preset-swatch-container">
                                                                        <div class="preset-swatch image-preset"
                                                                                :class="{ 'active-preset': isActivePreset(p) }"
                                                                                :style="{ 
                                                                        backgroundImage: `url('${p.info}')`,
                                                                        borderColor: isActivePreset(p) ? p.theme : 'transparent' 
                                                                     }" @click="handlePresetClick(p)"></div>
                                                                        <a v-if="isEditMode"
                                                                                @click="deleteWallpaperPreset(p)"
                                                                                class="delete-preset-btn">
                                                                                <svg xmlns="http://www.w3.org/2000/svg"
                                                                                        width="16" height="16"
                                                                                        fill="currentColor"
                                                                                        class="bi bi-dash"
                                                                                        viewBox="0 0 16 16">
                                                                                        <path
                                                                                                d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8" />
                                                                                </svg>
                                                                        </a>
                                                                </div>
                                                                <div class="preset-swatch-container">
                                                                        <div class="preset-swatch custom-btn"
                                                                                @click="saveCurrentAsPreset">
                                                                                <svg xmlns="http://www.w3.org/2000/svg"
                                                                                        width="24" height="24"
                                                                                        fill="currentColor"
                                                                                        viewBox="0 0 16 16">
                                                                                        <path
                                                                                                d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z" />
                                                                                </svg>
                                                                        </div>
                                                                </div>
                                                        </div>
                                                </div>
                                                <div class="form-group">
                                                        <label>图片 URL</label>
                                                        <div class="input-with-button">
                                                                <input type="url" v-model="editablePreset.info"
                                                                        @input="handleSettingsChange"
                                                                        placeholder="https://example.com/image.png">
                                                                <button @click="openAlbumPicker"
                                                                        class="save-button">相册</button>
                                                        </div>
                                                </div>
                                                <div class="form-group">
                                                        <label>主题色</label>
                                                        <input type="color" class="color-picker full-width"
                                                                v-model="editablePreset.theme"
                                                                @input="handleSettingsChange">
                                                </div>
                                        </div>

                                        <div v-else>
                                                <div class="form-group">
                                                        <label>从预设中选择</label>
                                                        <div class="preset-grid"
                                                                @mousedown="startLongPress('wallpaper')"
                                                                @mouseup="cancelLongPress" @mouseleave="cancelLongPress"
                                                                @touchstart="startLongPress('wallpaper')"
                                                                @touchend="cancelLongPress"
                                                                @touchmove="cancelLongPress">
                                                                <div v-for="(p, index) in currentPresets"
                                                                        :key="p.name + index"
                                                                        class="preset-swatch-container">
                                                                        <div class="preset-swatch"
                                                                                :class="{ 'active-preset': isActivePreset(p) }"
                                                                                :style="{ 
                                                                        background: getPresetBackground(p),
                                                                        borderColor: isActivePreset(p) ? p.theme : 'transparent' 
                                                                     }" @click="handlePresetClick(p)"></div>
                                                                        <a v-if="isEditMode"
                                                                                @click="deleteWallpaperPreset(p)"
                                                                                class="delete-preset-btn">
                                                                                <svg xmlns="http://www.w3.org/2000/svg"
                                                                                        width="16" height="16"
                                                                                        fill="currentColor"
                                                                                        class="bi bi-dash"
                                                                                        viewBox="0 0 16 16">
                                                                                        <path
                                                                                                d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8" />
                                                                                </svg>
                                                                        </a>
                                                                </div>
                                                                <div class="preset-swatch-container">
                                                                        <div class="preset-swatch custom-btn"
                                                                                @click="showCustomPresetEditor">
                                                                                <svg xmlns="http://www.w3.org/2000/svg"
                                                                                        width="24" height="24"
                                                                                        fill="currentColor"
                                                                                        viewBox="0 0 16 16">
                                                                                        <path
                                                                                                d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z" />
                                                                                </svg>
                                                                        </div>
                                                                </div>
                                                        </div>
                                                </div>
                                                <button v-if="isEditMode" @click="restoreDefaultPresets"
                                                        class="manage-button full-width">恢复默认预设</button>

                                                <div v-if="expandedAccordion === 'wallpaperEditor'"
                                                        class="accordion-content">
                                                        <div class="color-editor">
                                                                <div class="form-group color-group">
                                                                        <label>{{ activeWallpaperMode === 'gradient' ?
                                                                                '渐变1' :
                                                                                '左下' }}</label>
                                                                        <input type="color" class="color-picker"
                                                                                v-model="editablePreset.info[0]"
                                                                                @input="handleSettingsChange">
                                                                </div>
                                                                <div class="form-group color-group">
                                                                        <label>{{ activeWallpaperMode === 'gradient' ?
                                                                                '渐变2' :
                                                                                '右上' }}</label>
                                                                        <input type="color" class="color-picker"
                                                                                v-model="editablePreset.info[1]"
                                                                                @input="handleSettingsChange">
                                                                </div>
                                                                <div class="form-group color-group">
                                                                        <label>主题色</label>
                                                                        <input type="color" class="color-picker"
                                                                                v-model="editablePreset.theme"
                                                                                @input="handleSettingsChange">
                                                                </div>
                                                        </div>
                                                        <button v-if="isAddingNewPreset" @click="saveCustomPreset"
                                                                class="manage-button primary full-width">另存为新预设</button>
                                                </div>
                                        </div>
                                </div>
                                <div v-if="activeMainMode === 'icon'">
                                        <div class="form-group">
                                                <label>自定义App图标</label>
                                                <p class="description">点击上方预览区域中的图标即可为其更换新图片。推荐使用正方形的图片。</p>
                                        </div>
                                        <button @click="restoreDefaultIcons"
                                                class="manage-button full-width">恢复默认图标</button>
                                </div>
                        </section>

                        <section class="settings-card">
                                <h2 class="card-title">主题模式</h2>
                                <div class="form-group">
                                        <label>选择主题模式</label>
                                        <div class="segmented-control">
                                                <label :class="{ active: themeMode === 'system' }">
                                                        <input type="radio" v-model="themeMode" value="system"
                                                                @change="handleThemeModeChange">
                                                        <span>跟随系统</span>
                                                </label>
                                                <label :class="{ active: themeMode === 'light' }">
                                                        <input type="radio" v-model="themeMode" value="light"
                                                                @change="handleThemeModeChange">
                                                        <span>浅色模式</span>
                                                </label>
                                                <label :class="{ active: themeMode === 'dark' }">
                                                        <input type="radio" v-model="themeMode" value="dark"
                                                                @change="handleThemeModeChange">
                                                        <span>深色模式</span>
                                                </label>
                                        </div>
                                </div>
                        </section>

                        <section class="settings-card">
                                <h2 class="card-title">字体</h2>
                                <div class="form-group">
                                        <label for="font-url-input">字体 CSS URL (例如 Google Fonts)</label>
                                        <div class="input-with-button">
                                                <input id="font-url-input" type="url" v-model="newFontUrl"
                                                        placeholder="https://fonts.googleapis.com/css2?family=...">
                                                <button @click="promptForFontName" class="save-button">添加</button>
                                        </div>
                                </div>
                                <div class="font-preview" :style="{ fontFamily: activeFontFamily }">
                                        <p>你好，镜中世界。</p>
                                        <p>The quick brown fox jumps over the lazy dog</p>
                                </div>
                                <div class="accordion-header" @click="toggleAccordion('fonts')">
                                        <span>已保存的字体</span>
                                        <span :class="['arrow', { 'is-open': expandedAccordion === 'fonts' }]">›</span>
                                </div>
                                <div v-if="expandedAccordion === 'fonts'" class="accordion-content font-list-container"
                                        @mousedown="startLongPress('fonts')" @mouseup="cancelLongPress"
                                        @mouseleave="cancelLongPress" @touchstart="startLongPress('fonts')"
                                        @touchend="cancelLongPress" @touchmove="cancelLongPress">
                                        <ul class="font-list">
                                                <li v-for="font in fonts" :key="font.id"
                                                        :class="['font-list-item', { active: activeFontId === font.id }]"
                                                        @click="!isEditMode && selectFont(font)">
                                                        <span class="font-name">{{ font.name }}</span>
                                                        <a v-if="isEditMode && !font.isDefault"
                                                                @click="deleteFont(font)" class="delete-button">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16"
                                                                        height="16" fill="currentColor" class="bi bi-x"
                                                                        viewBox="0 0 16 16">
                                                                        <path
                                                                                d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
                                                                </svg>
                                                        </a>
                                                </li>
                                        </ul>
                                </div>
                        </section>
                </main>
        </div>
</template>

<script setup>
import { ref, shallowRef, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue';
import db from '../services/database.js';
import { showToast, showConfirm, promptForInput, showAlbumPickerModal, showUploadChoiceModal } from '../services/uiService.js';
import AppHeader from '../components/layout/Header.vue';
import IconGrid from '../components/IconGrid.vue';
import { homeScreenApps as defaultHomeScreenApps } from '../services/iconService.js';
import { getContrastTextColor, generateColorScheme } from '../utils/colorUtils.js';
import AppIcon from '../components/AppIcon.vue';
import { uploadToCloudinary } from '../services/cloudinaryService.js';
import { injectNotificationStyles } from '../services/notificationEffectService.js';


// --- State Management ---
const wallpaperPreviewRef = ref(null);
const wallpaperEffectRef = ref(null);

const activeMainMode = ref('wallpaper'); // 'wallpaper', 'icon', or 'notification'

// 通知特效设置
const notificationEffectsEnabled = ref(true);

// 图标设置状态
const appIconSettings = ref({});
const homeScreenApps = shallowRef(defaultHomeScreenApps);

const activeWallpaperMode = ref('gradient');
const wallpaperPresets = ref([]);
const fonts = ref([]);
const activeFontId = ref(1);
const newFontUrl = ref('');

// 主题模式状态
const themeMode = ref('system'); // 'system', 'light', 'dark'

// 用于缓存每种模式的最后配置，以便在切换时恢复
const modeConfigs = reactive({
  image: { wallpaper: '', theme: '#3b82f6' },
  gradient: { wallpaper: 'linear-gradient(to top, #a18cd1, #fbc2eb)', theme: '#9333ea' },
  animated: { wallpaper: 'animated(#a18cd1,#fbc2eb,45)', theme: '#9333ea' } // 新的动态渐变配置
});

// 当前正在编辑器中调整的预设对象
const editablePreset = ref({ type: 'gradient', info: ['#a18cd1', '#fbc2eb'], theme: '#9333ea' });

// UI状态
const expandedAccordion = ref(null);
const isAddingNewPreset = ref(false);
const isEditMode = ref(false);
let longPressTimer = null;

const currentPresets = computed(() => {
        return wallpaperPresets.value.filter(p => p.type === activeWallpaperMode.value);
});

// 在 State Management 部分下添加当前选中预设的变量
const activePreset = ref(null);

// --- Lifecycle Hooks ---
let mediaQueryListener = null;

onMounted(async () => {
        // 注入通知特效样式
        injectNotificationStyles();
        await loadSettings();
});

onUnmounted(() => {
        // 清理系统主题监听器
        if (mediaQueryListener) {
                const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                mediaQuery.removeEventListener('change', mediaQueryListener);
        }
});

// --- Database & Settings Functions ---
async function loadSettings() {
        const settings = await db.globalSettings.get('global') || {};

        // 加载已保存的图标设置
        appIconSettings.value = settings.appIconSettings || {};

        // 加载通知特效设置
        notificationEffectsEnabled.value = settings.notificationEffectsEnabled !== false; // 默认开启

        // 加载壁纸和主题
        wallpaperPresets.value = settings.wallpaperPresets || [];
        
        const savedWallpaper = settings.wallpaper || modeConfigs.gradient.wallpaper;
        const savedTheme = settings.themeColor || modeConfigs.gradient.theme;
        
        // 设置当前壁纸模式
        if (savedWallpaper.startsWith('url(')) {
                activeWallpaperMode.value = 'image';
                modeConfigs.image = { wallpaper: savedWallpaper, theme: savedTheme };
        } else if (savedWallpaper.startsWith('animated(')) {
                activeWallpaperMode.value = 'animated';
                modeConfigs.animated = { wallpaper: savedWallpaper, theme: savedTheme };
        } else {
                activeWallpaperMode.value = 'gradient';
                modeConfigs.gradient = { wallpaper: savedWallpaper, theme: savedTheme };
        }

        // 更新编辑器和预览
        updateEditablePreset();
        await nextTick();
        updateWallpaperPreview(modeConfigs[activeWallpaperMode.value].wallpaper);
        applyThemeColor(savedTheme);
        
        // 查找并设置当前活动的预设
        findAndSetActivePreset();

        // 加载主题模式
        themeMode.value = settings.themeMode || 'system';
        applyThemeMode(themeMode.value);

        // 加载字体
        activeFontId.value = settings.activeFontId || 1;
        await loadFonts();
        const activeFont = fonts.value.find(f => f.id === activeFontId.value);
        if (activeFont) {
                applyFont(activeFont);
        }
}

async function saveAllSettings() {
        try {
                const currentConfig = modeConfigs[activeWallpaperMode.value];
                const settingsToSave = {
                        ...(await db.globalSettings.get('global')),
                        id: 'global',
                        wallpaper: currentConfig.wallpaper,
                        themeColor: currentConfig.theme,
                        themeMode: themeMode.value,
                        wallpaperPresets: JSON.parse(JSON.stringify(wallpaperPresets.value)),
                        activeFontId: activeFontId.value,
                        appIconSettings: JSON.parse(JSON.stringify(appIconSettings.value)), // 保存图标设置
                        notificationEffectsEnabled: notificationEffectsEnabled.value, // 保存通知特效设置

                };
                await db.globalSettings.put(settingsToSave);

                // 将当前字体应用到全局
                const activeFont = fonts.value.find(f => f.id === activeFontId.value);
                if (activeFont) applyFontToBody(activeFont);

                showToast('个性化设置已保存！', 'success');
                isEditMode.value = false;
        } catch (error) {
                console.error("保存失败:", error);
                showToast(`保存失败: ${error.message}`, 'error');
        }
}

// 保存通知特效设置
async function saveNotificationSettings() {
        try {
                const settings = await db.globalSettings.get('global') || {};
                settings.notificationEffectsEnabled = notificationEffectsEnabled.value;
                await db.globalSettings.put(settings);
                showToast(`通知特效已${notificationEffectsEnabled.value ? '开启' : '关闭'}`, 'success');
        } catch (error) {
                console.error('保存通知设置失败:', error);
                showToast('保存失败', 'error');
        }
}

async function selectAppIcon(app) {
        const choice = await showUploadChoiceModal();
        if (!choice) return;

        try {
                let imageUrl;
                if (choice.type === 'local') {
                        showToast('正在上传...', 'info');
                        imageUrl = await uploadToCloudinary(choice.value);
                } else {
                        imageUrl = choice.value;
                }

                if (imageUrl) {
                        appIconSettings.value[app.id] = imageUrl;
                        showToast(`“${app.name}”的图标已更新`, 'info');
                }
        } catch (error) {
                console.error('更换图标失败:', error);
                showToast(`更换失败: ${error.message}`, 'error');
        }
}

async function restoreDefaultIcons() {
        const confirmed = await showConfirm('恢复默认图标', '确定要移除所有自定义图标吗？此操作会立即生效，但需要点击右上角的“保存”按钮来永久保存更改。');
        if (confirmed) {
                appIconSettings.value = {};
                showToast('已恢复默认图标，请点击保存。', 'info');
        }
}


// 添加查找和设置当前活动预设的函数
function findAndSetActivePreset() {
  const currentMode = activeWallpaperMode.value;
  const currentConfig = modeConfigs[currentMode];
  
  // 遍历当前模式的所有预设，查找匹配项
  for (const preset of currentPresets.value) {
    if (isActivePreset(preset)) {
      activePreset.value = preset;
      console.log('找到匹配的预设:', preset.name);
      return;
    }
  }
  
  console.log('未找到匹配的预设，当前使用的是自定义设置');
  activePreset.value = null;
}

// --- Wallpaper & Theme Functions ---

function applyThemeColor(color) {
        if (!color) return;
        // 设置主题色
        document.documentElement.style.setProperty('--accent-primary', color);
        
        // 计算并设置对比文本颜色
        const textColor = getContrastTextColor(color);
        document.documentElement.style.setProperty('--accent-text', textColor);
        
        // 获取更丰富的配色方案
        const colorScheme = generateColorScheme(color);
        document.documentElement.style.setProperty('--accent-lighter', colorScheme.lighter);
        document.documentElement.style.setProperty('--accent-darker', colorScheme.darker);
}

function handleModeChange() {
        const newMode = activeWallpaperMode.value;
        const config = modeConfigs[newMode];
        
        // 确保在模式切换时重置编辑器状态
        isAddingNewPreset.value = false;
        expandedAccordion.value = null;
        
        updateWallpaperPreview(config.wallpaper);
        applyThemeColor(config.theme);
        updateEditablePreset();
}

// --- Theme Mode Functions ---
function handleThemeModeChange() {
        applyThemeMode(themeMode.value);
}

function applyThemeMode(mode) {
        const html = document.documentElement;
        
        // 清理之前的监听器
        if (mediaQueryListener) {
                const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                mediaQuery.removeEventListener('change', mediaQueryListener);
                mediaQueryListener = null;
        }
        
        if (mode === 'system') {
                // 跟随系统设置
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                html.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
                
                // 创建新的监听器
                mediaQueryListener = (e) => {
                        if (themeMode.value === 'system') {
                                html.setAttribute('data-theme', e.matches ? 'dark' : 'light');
                        }
                };
                
                // 监听系统主题变化
                const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                mediaQuery.addEventListener('change', mediaQueryListener);
        } else if (mode === 'light') {
                html.setAttribute('data-theme', 'light');
        } else if (mode === 'dark') {
                html.setAttribute('data-theme', 'dark');
        }
}

// --- 新增：处理预设点击的函数 ---
function handlePresetClick(preset) {
  if (isEditMode.value) return; // 编辑模式下不允许选择预设
  
  activePreset.value = preset;
  const mode = activeWallpaperMode.value;
  let newWallpaper;
  
  if (mode === 'image') {
    newWallpaper = `url("${preset.info}")`;
  } else if (mode === 'gradient') {
    newWallpaper = `linear-gradient(to top, ${preset.info[0]}, ${preset.info[1]})`;
  } else if (mode === 'animated') {
    // 确保动态渐变有正确的格式
    const angle = preset.info[2] || 45;
    newWallpaper = `animated(${preset.info[0]},${preset.info[1]},${angle})`;
  }
  
  // 更新模式配置
  modeConfigs[mode] = { 
    wallpaper: newWallpaper, 
    theme: preset.theme 
  };
  
  // 更新编辑器状态
  updateEditablePreset();
  
  // 更新预览和主题
  updateWallpaperPreview(newWallpaper);
  applyThemeColor(preset.theme);
}

// 修改 handleSettingsChange 函数以在手动更改时清除活动预设
function handleSettingsChange() {
  // 当手动修改设置时，清除当前活动的预设
  activePreset.value = null;
  
  const mode = activeWallpaperMode.value;
  let newWallpaper;
  
  if (mode === 'image') {
    newWallpaper = `url("${editablePreset.value.info}")`;
  } else if (mode === 'gradient') {
    newWallpaper = `linear-gradient(to top, ${editablePreset.value.info[0]}, ${editablePreset.value.info[1]})`;
  } else if (mode === 'animated') {
    // 格式: animated(color1,color2,angle)
    const angle = editablePreset.value.info[2] || 45;
    newWallpaper = `animated(${editablePreset.value.info[0]},${editablePreset.value.info[1]},${angle})`;
  }

  modeConfigs[mode] = { wallpaper: newWallpaper, theme: editablePreset.value.theme };
  updateWallpaperPreview(newWallpaper);
  applyThemeColor(editablePreset.value.theme);
  
  // 检查更改后是否匹配某个预设
  findAndSetActivePreset();
}

function getPresetBackground(preset) {
  if (preset.type === 'image') {
    return `url("${preset.info}")`;
  } else if ((preset.type === 'gradient' || preset.type === 'animated') && Array.isArray(preset.info)) {
    // 对于动态渐变预设，在预览中显示为静态渐变
    return `linear-gradient(to top, ${preset.info[0]}, ${preset.info[1]})`;
  }
  return 'none';
}

// --- 修复：isActivePreset 函数 ---
function isActivePreset(preset) {
  const currentMode = activeWallpaperMode.value;
  const currentConfig = modeConfigs[currentMode];
  
  if (currentMode === 'image') {
    // 图片模式：比较URL
    const currentUrl = currentConfig.wallpaper.match(/url\(['"]?(.*?)['"]?\)/?.[1] || '');
    return currentUrl === preset.info && currentConfig.theme === preset.theme;
  } else if (currentMode === 'gradient') {
    // 渐变模式：比较两个颜色
    if (!Array.isArray(preset.info) || preset.info.length < 2) return false;
    const currentColors = currentConfig.wallpaper.match(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})/gi) || [];
    return currentColors.length >= 2 && 
           currentColors[0] === preset.info[0] && 
           currentColors[1] === preset.info[1] &&
           currentConfig.theme === preset.theme;
  } else if (currentMode === 'animated') {
    // 动态渐变：比较颜色和主题色
    if (!Array.isArray(preset.info) || preset.info.length < 2) return false;
    const currentMatch = currentConfig.wallpaper.match(/animated\((.*?),(.*?),(\d+)\)/);
    if (currentMatch) {
      return currentMatch[1] === preset.info[0] && 
             currentMatch[2] === preset.info[1] && 
             currentConfig.theme === preset.theme;
    }
  }
  
  return false;
}

// 当模式或预设变化时，更新编辑器内的值
function updateEditablePreset() {
  const mode = activeWallpaperMode.value;
  const config = modeConfigs[mode];

  if (mode === 'image') {
    const urlMatch = config.wallpaper.match(/url\(['"]?(.*?)['"]?\)/);
    const imageUrl = urlMatch ? urlMatch[1] : '';
    editablePreset.value = { type: 'image', info: imageUrl, theme: config.theme };
  } else if (mode === 'animated') {
    // 解析动态渐变格式：animated(color1,color2,angle)
    const match = config.wallpaper.match(/animated\((.*?),(.*?),(\d+)\)/);
    if (match) {
      editablePreset.value = { 
        type: 'animated', 
        info: [match[1], match[2], parseInt(match[3])], 
        theme: config.theme 
      };
    } else {
      // 默认值
      editablePreset.value = { 
        type: 'animated', 
        info: ['#a18cd1', '#fbc2eb', 45], 
        theme: config.theme 
      };
    }
  } else {
    // 渐变模式
    const colors = config.wallpaper.match(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})/gi) || ['#000000', '#ffffff'];
    editablePreset.value = { type: mode, info: colors, theme: config.theme };
  }
}

// 修改壁纸预览函数，简化实现
function updateWallpaperPreview(style) {
        const previewEl = wallpaperEffectRef.value;
        if (!previewEl || typeof style !== 'string') return;
  
  // 清理预览元素样式
  previewEl.innerHTML = '';
  previewEl.style.backgroundImage = 'none';
  previewEl.style.background = 'none';
  previewEl.style.animation = 'none';
  previewEl.style.position = 'relative';
  
  // 根据壁纸类型设置预览
  if (style.startsWith('animated(')) {
    // 解析动态渐变的参数
    const match = style.match(/animated\((.*?),(.*?),(\d+)\)/);
    if (match) {
      const [_, color1, color2, angle] = match;
      
      console.log('创建动态渐变预览:', color1, color2, angle);
      
      // 直接在预览元素上应用渐变和动画
      const gradientStyle = `linear-gradient(${angle}deg, ${color1} 0%, ${color2} 100%)`;
      previewEl.style.background = gradientStyle;
      previewEl.style.backgroundSize = '200% 200%';
      previewEl.style.animation = `gradientAnimation 4s ease infinite`;
    }
  } else {
    // 处理其他类型的壁纸
    previewEl.style.backgroundImage = style;
    previewEl.style.backgroundSize = 'cover';
    previewEl.style.backgroundPosition = 'center';
  }
}

// --- 从相册选择图片 ---
async function openAlbumPicker() {
        // 调用异步模态框，等待用户选择
        const selectedResult = await showAlbumPickerModal();

        // 如果用户选择了图片 (返回值不是 null)
        if (selectedResult) {
                // 更新当前编辑器中的图片 URL
                editablePreset.value.info = selectedResult.url;
                // 手动触发更新，以刷新预览和内部状态
                handleSettingsChange();
                showToast('壁纸已更新', 'info');
        }
}

// --- Font Functions ---
async function loadFonts() {
        fonts.value = await db.fonts.toArray();
}

// 使用 @font-face 动态加载字体
function applyFont(font) {
        if (!font) return;
        
        let styleTag = document.getElementById('dynamic-font-style');
        if (!styleTag) {
                styleTag = document.createElement('style');
                styleTag.id = 'dynamic-font-style';
                document.head.appendChild(styleTag);
        }
        
        // 检查URL类型并相应处理
        if (font.url) {
                if (font.url.includes('googleapis.com') || font.url.endsWith('.css')) {
                        // 使用link标签加载CSS
                        const linkId = `font-link-${font.id}`;
                        let linkTag = document.getElementById(linkId);
                        
                        if (!linkTag) {
                                linkTag = document.createElement('link');
                                linkTag.id = linkId;
                                linkTag.rel = 'stylesheet';
                                linkTag.href = font.url;
                                document.head.appendChild(linkTag);
                        }
                } else {
                        // 处理直接字体文件，使用@font-face
                        const fontName = font.family || `custom-font-${font.id}`;
                        const format = getFontFormat(font.url);
                        
                        const fontFaceRule = `
                                @font-face {
                                        font-family: "${fontName}";
                                        src: url("${font.url}") format("${format}");
                                        font-display: swap;
                                }
                        `;
                        
                        // 只有在还没有添加过这个字体的情况下添加
                        if (!styleTag.textContent.includes(font.url)) {
                                styleTag.textContent += fontFaceRule;
                        }
                        
                        // 如果字体没有family属性，设置它
                        if (!font.family) {
                                font.family = fontName;
                                // 保存到数据库
                                db.fonts.update(font.id, { family: fontName });
                        }
                }
        }
}

// 将字体应用到全局body - 添加这个缺失的函数
function applyFontToBody(font) {
        if (!font) return;
        
        // 先应用字体（确保加载）
        applyFont(font);
        
        // 然后设置字体族
        const systemFont = `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
        document.body.style.fontFamily = font && font.family ? `${font.family}, ${systemFont}` : systemFont;
}

// 获取字体格式
function getFontFormat(url) {
        if (url.endsWith('.otf')) return 'opentype';
        if (url.endsWith('.ttf')) return 'truetype';
        if (url.endsWith('.woff')) return 'woff';
        if (url.endsWith('.woff2')) return 'woff2';
        return 'opentype'; // 默认为opentype
}

// --- 保存当前图片设置为预设 ---
async function saveCurrentAsPreset() {
        if (activeWallpaperMode.value !== 'image') return;
        
        const name = await promptForInput('为你的图片壁纸命名');
        if (name) {
                const newPreset = { 
                        type: 'image',
                        name,
                        info: editablePreset.value.info,
                        theme: editablePreset.value.theme,
                        isDefault: false
                };
                
                wallpaperPresets.value.push(newPreset);
                showToast('图片预设已添加，记得点击顶部保存哦！', 'info');
        }
}

// --- 其他UI辅助函数 ---
const getStyleFromPreset = (preset) => {
        if (!preset || !preset.type || !preset.info) return '';
        
        if (preset.type === 'gradient') {
                return `linear-gradient(to top, ${preset.info[0]}, ${preset.info[1]})`;
        } else if (preset.type === 'animated') {
                // 确保角度存在，否则使用默认值45
                const angle = preset.info[2] || 45;
                return `animated(${preset.info[0]},${preset.info[1]},${angle})`;
        } else if (preset.type === 'image') {
                return `url("${preset.info}")`;
        }
        
        return '';
};

async function saveCustomPreset() {
        const name = await promptForInput('为你的新预设命名');
        if (name) {
                const newPreset = { ...editablePreset.value, name, isDefault: false };
                wallpaperPresets.value.push(newPreset);
                showToast('预设已添加，记得点击顶部保存哦！', 'info');
                isAddingNewPreset.value = false;
        }
}

async function deleteWallpaperPreset(presetToDelete) {
        const index = wallpaperPresets.value.findIndex(p => p.name === presetToDelete.name && p.type === presetToDelete.type);
        if (index > -1) {
                wallpaperPresets.value.splice(index, 1);
                showToast('预设已删除', 'success');
        }
}

function restoreDefaultPresets() {
        const defaultPresets = [
                { type: 'image', name: '天空', info: 'https://w.wallhaven.cc/full/og/wallhaven-og3d99.jpg', theme: '#3986ac', isDefault: true },
                // 渐变类型
                { "type": "gradient", "name": "黑白", "info": ["#000000", "#ffffff"], "theme": "#808080", "isDefault": true },
                { "type": "gradient", "name": "红黑", "info": ["#ff0000", "#000000"], "theme": "#b22222", "isDefault": true },
                { "type": "gradient", "name": "黄紫", "info": ["#ffff00", "#4b0082"], "theme": "#9400d3", "isDefault": true },
                { "type": "gradient", "name": "青黑", "info": ["#00ffff", "#000000"], "theme": "#008b8b", "isDefault": true },
                { "type": "gradient", "name": "橙蓝", "info": ["#ffa500", "#00008b"], "theme": "#ff8c00", "isDefault": true },
                // 动态渐变类型
                { "type": "animated", "name": "光与影", "info": ["#ffffff", "#000000", 45], "theme": "#808080", "isDefault": true },
                { "type": "animated", "name": "赛博", "info": ["#ff00ff", "#00ffff", 60], "theme": "#ff00ff", "isDefault": true },
                { "type": "animated", "name": "熔岩", "info": ["#ff4500", "#000000", 30], "theme": "#ff4500", "isDefault": true },
                { "type": "animated", "name": "霓虹", "info": ["#39ff14", "#000000", 45], "theme": "#39ff14", "isDefault": true },
                { "type": "animated", "name": "闪电", "info": ["#ffd700", "#191970", 60], "theme": "#ffd700", "isDefault": true }
       ];

        // 过滤掉所有非默认预设
        let userPresets = wallpaperPresets.value.filter(p => !p.isDefault);
        wallpaperPresets.value = wallpaperPresets.value.filter(p => p.isDefault);

        // 添加丢失的默认预设
        defaultPresets.forEach(dp => {
                if (!wallpaperPresets.value.some(p => p.name === dp.name && p.type === dp.type)) {
                        wallpaperPresets.value.push(dp);
                }
        });

        // 重新添加用户的非默认预设
        wallpaperPresets.value.push(...userPresets);
        showToast('已恢复默认预设，请点击保存', 'info');
}

const activeFontFamily = computed(() => {
        const font = fonts.value.find(f => f.id === activeFontId.value);
        const systemFont = `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
        return font && font.family ? `${font.family}, ${systemFont}` : systemFont;
});

function selectFont(font) {
        activeFontId.value = font.id;
        applyFont(font); // 加载字体
}

async function promptForFontName() {
        if (!newFontUrl.value.trim()) {
                showToast('请先输入字体URL', 'error');
                return;
        }
        const name = await promptForInput('为新字体命名');
        if (name) {
                try {
                        const newId = await db.fonts.add({ name, url: newFontUrl.value, isDefault: 0 });
                        await loadFonts();
                        const newFont = fonts.value.find(f => f.id === newId);
                        if (newFont) selectFont(newFont);
                        newFontUrl.value = '';
                        showToast('字体添加成功！', 'success');
                } catch (error) {
                        showToast(`添加失败: ${error.message}`, 'error');
                }
        }
}

async function deleteFont(font) {
        const confirmed = await showConfirm('删除字体', `确定要删除 "${font.name}" 吗？`);
        if (confirmed) {
                await db.fonts.delete(font.id);
                if (activeFontId.value === font.id) {
                        const defaultFont = fonts.value.find(f => f.id === 1);
                        if (defaultFont) selectFont(defaultFont);
                }
                await loadFonts();
                showToast('字体已删除', 'success');
        }
}

function toggleAccordion(name) {
        if (isEditMode.value) return;
        expandedAccordion.value = expandedAccordion.value === name ? null : name;
}

function findPresetByStyle(style) {
        for (const p of wallpaperPresets.value) {
                if (getStyleFromPreset(p) === style) return p;
        }
        return null;
}

function startLongPress(context) {
        cancelLongPress();
        longPressTimer = setTimeout(() => {
                isEditMode.value = true;
                showToast(`进入${context === 'fonts' ? '字体' : '壁纸'}编辑模式`, 'info');
        }, 700);
}

function cancelLongPress() {
        clearTimeout(longPressTimer);
}

function showCustomPresetEditor() {
        isAddingNewPreset.value = true;
        expandedAccordion.value = 'wallpaperEditor';
}
</script>

<style scoped>

.header-action-button {
        background: none;
        border: none;
        color: var(--text-primary);
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
}

.card-title {
        margin: 0 0 15px 0;
        font-size: 16px;
        font-weight: 600;
}

.wallpaper-preview {
        width: 100%;
        height: 200px;
        border-radius: 8px;
        margin-bottom: 20px;
        background-size: cover;
        background-position: center;
        border: 1px solid var(--border-color);
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
}

.form-group {
        margin-bottom: 20px;
}

.form-group label {
        display: block;
        margin-bottom: 8px;
        font-size: 14px;
        color: var(--text-secondary);
}

.form-group input[type="text"],
.form-group input[type="url"] {
        width: 100%;
        padding: 12px;
        border-radius: 8px;
        border: 1px solid var(--border-color);
        background-color: var(--bg-primary);
        color: var(--text-primary);
        box-sizing: border-box;
        font-size: 14px;
}

.input-with-button {
        display: flex;
        gap: 10px;
}

.input-with-button input {
        flex-grow: 1;
}

.save-button {
        padding: 0 20px;
        border: none;
        border-radius: 8px;
        background-color: var(--accent-primary);
        color: var(--accent-text, white); /* 使用计算的文本颜色 */
        font-weight: 600;
        cursor: pointer;
        flex-shrink: 0;
}

.preset-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
        gap: 12px;
}

.preset-swatch-container {
        position: relative;
        width: 100%;
        aspect-ratio: 1/1;
}

.preset-swatch {
        width: 100%;
        height: 100%;
        border-radius: 8px;
        cursor: pointer;
        border: 2px solid transparent;
        transition: all 0.2s ease;
        position: absolute;
        top: 0;
        left: 0;
}

/* 选中的预设样式 */
.preset-swatch.active-preset {
        transform: scale(1.05);
        box-shadow: 0 0 10px var(--accent-primary);
        border: 2px solid var(--accent-primary);
}

/* 图片预设特殊样式 */
.image-preset {
        background-size: cover !important;
        background-position: center !important;
}

.delete-preset-btn {
        position: absolute;
        top: -8px;
        right: -8px;
        width: 22px;
        height: 22px;
        background-color: #f44336;
        color: white;
        border: none;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        font-weight: bold;
        cursor: pointer;
}

.delete-button {
        background-color: #f44336;
        color: white;
        border: none;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 14px;
        line-height: 22px;
        text-align: center;
        font-weight: bold;
        flex-shrink: 0;
}

.custom-btn {
        border: 2px dashed var(--border-color);
        display: flex;
        justify-content: center;
        align-items: center;
        color: var(--text-secondary);
}

/* 动态渐变效果容器 */
.gradient-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
}

.accordion-content {
        border-top: 1px solid var(--border-color);
}

.color-editor {
        display: flex;
        justify-content: space-around;
        margin-bottom: 15px;
}

.color-group {
        text-align: center;
        margin-bottom: 0;
}

.color-picker {
        width: 60px;
        height: 30px;
        border: none;
        background: none;
        border-radius: 4px;
        cursor: pointer;
}

.color-picker.full-width {
        width: 100%;
        height: 40px;
}

.font-preview {
        background-color: var(--bg-primary);
        padding: 15px;
        border-radius: 8px;
        font-size: 14px;
        margin: 15px 0;
        color: var(--text-secondary);
        transition: font-family 0.3s ease;
}

.font-preview p {
        margin: 0;
}

.accordion-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 0;
        cursor: pointer;
}

.arrow {
        font-size: 20px;
        transition: transform 0.2s ease;
        transform: rotate(90deg);
}

.arrow.is-open {
        transform: rotate(-90deg);
}

.font-list {
        list-style: none;
        padding: 0;
        margin: 0;
}

.font-list-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 5px;
        border-top: 1px solid var(--border-color);
        cursor: pointer;
        position: relative;
}

.font-list-item.active {
        color: var(--accent-primary);
        font-weight: bold;
}

.manage-button {
        padding: 10px 15px;
        border-radius: 8px;
        border: 1px solid var(--border-color);
        background-color: var(--bg-secondary);
        color: var(--text-primary);
        cursor: pointer;
        font-weight: 600;
}

.manage-button.primary {
        background-color: var(--accent-primary);
        color: var(--accent-text, white); /* 使用计算的文本颜色 */
}

.manage-button.full-width {
        width: 100%;
}

.theme-preview {
        display: flex;
        justify-content: space-around;
        align-items: center;
        margin-top: 15px;
        padding: 15px;
        background-color: var(--bg-secondary);
        border-radius: 8px;
}

.preview-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
}

.preview-circle {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 2px solid var(--border-color);
        transition: all 0.3s ease;
}

.preview-item span {
        font-size: 12px;
        color: var(--text-secondary);
        text-align: center;
}

.wallpaper-effect-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1;
        /* 确保在图标下方 */
}

.icon-preview-grid {
        /* 让图标填满整个容器 */
        display: grid;
        grid-template-columns: repeat(4, 1fr); /* 固定4列，与HomeView竖屏保持一致 */
        grid-auto-rows: minmax(70px, 1fr); /* 增加行高以容纳图标和app-name */
        width: 100%;
        height: 100%;
        padding: 16px;
        gap: 16px;
        box-sizing: border-box;
        justify-items: center;
        align-items: start; /* 改为start，让图标从顶部开始排列 */
        position: absolute;
        top: 0;
        left: 0;
        transition: opacity 0.3s ease;
        /* 添加过渡效果 */
        z-index: 2;
        overflow: hidden;
        align-content: start;
}

.icon-preview-grid.is-wallpaper-mode {
        opacity: 0;
}

.app-wrapper-preview {
        /* 这是每个图标的外部容器，使其可点击 */
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        gap: 4px; /* 在图标和名字之间添加间距 */
}

.app-wrapper {
        /* 这是内部容器，与HomeView保持一致 */
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 48px; /* 固定宽度 */
        height: 48px; /* 固定高度，保持正方形 */
        position: relative; /* 为绝对定位的app-name提供定位上下文 */
}

/* 预览模式下的app名称样式 */
.app-name-preview {
        font-size: 10px;
        color: white;
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 48px;
        margin-top: 2px;
        line-height: 1.2;
}


/* === 通知特效设置样式 === */
.notification-settings {
        margin-top: 20px;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        gap: 24px;
}

.toggle-switch-container {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        margin-top: 0;
}

.setting-description {
        font-size: 12px;
        color: var(--text-secondary);
        margin-top: 8px;
        line-height: 1.4;
}
</style>