import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/main.css' // 引入全局样式
import { populateMockData } from './services/mockData.js';
import { initializeGlobalSettings, initializeDefaultFonts, initializeUserEntity } from './services/database.js';
import { cleanupCorruptedSessions } from './services/listenTogetherService.js';
import db from './services/database.js';
import { getContrastTextColor, generateColorScheme } from './utils/colorUtils.js';

// 应用主题色
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

// 初始化主题
async function initializeTheme() {
        const settings = await db.globalSettings.get('global');
        const themeMode = settings?.themeMode || 'system';
        const themeColor = settings?.themeColor;
        
        const html = document.documentElement;
        
        if (themeMode === 'system') {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                html.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        } else {
                html.setAttribute('data-theme', themeMode);
        }
        
        // 应用自定义主题色
        if (themeColor) {
                applyThemeColor(themeColor);
        }
}

const app = createApp(App)

app.use(router) // 使用路由

Promise.all([
        initializeGlobalSettings(),
        initializeDefaultFonts(),
        initializeUserEntity(),
        populateMockData(),
        initializeTheme(),
        cleanupCorruptedSessions()
]).then(() => {
        app.mount('#app');
    });