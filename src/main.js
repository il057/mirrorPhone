import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/main.css' // 引入全局样式
import { populateMockData } from './services/mockData.js';
import { initializeGlobalSettings, initializeDefaultFonts, initializeUserEntity } from './services/database.js';
import { startBackgroundActivityTimer } from './services/backgroundActivityService.js'; 
import { initializeBackupTracking } from './services/incrementalBackupService.js';

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

const registerServiceWorker = () => {
        if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                        navigator.serviceWorker.register('/sw.js').then(registration => {
                                console.log('ServiceWorker registration successful with scope: ', registration.scope);
                        }).catch(err => {
                                console.log('ServiceWorker registration failed: ', err);
                        });
                });
        }
    };

const app = createApp(App)

app.use(router) // 使用路由

Promise.all([
        initializeGlobalSettings(),
        initializeDefaultFonts(),
        initializeUserEntity(),
        populateMockData(),
        initializeTheme()
]).then(() => {
        app.mount('#app');
        startBackgroundActivityTimer(); // 在应用挂载后启动定时器
        initializeBackupTracking(); // 初始化备份跟踪
        registerServiceWorker();

    });