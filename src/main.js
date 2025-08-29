import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/main.css' // 引入全局样式
import { populateMockData } from './services/mockData.js';
import { initializeGlobalSettings, initializeDefaultFonts, initializeUserEntity, recordUserOnline, recordUserOffline } from './services/database.js';
import { startBackgroundActivityTimer } from './services/backgroundActivityService.js'; 
import { initializeBackupTracking } from './services/incrementalBackupService.js';

import db from './services/database.js';
import { calculateThemeColors, applyThemeColors } from './utils/colorUtils.js';
import { loadActiveFont } from './services/fontService.js';
import { initializeThemeSystem } from './services/themeService.js';

// 应用主题色
function applyThemeColor(color) {
        if (!color) return;

        // 使用新的颜色工具函数计算完整的主题色
        const themeColors = calculateThemeColors(color);

        // 应用所有主题色变量
        applyThemeColors(themeColors);
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

        // 初始化主题系统
        initializeThemeSystem();

        await loadActiveFont(); 

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
        //populateMockData(),
        initializeTheme()
]).then(() => {
        app.mount('#app');
        startBackgroundActivityTimer(); // 在应用挂载后启动定时器
        initializeBackupTracking(); // 初始化备份跟踪
        registerServiceWorker();
        
        // 记录用户上线
        recordUserOnline();
        
        // 监听页面隐藏/显示事件来追踪用户状态
        document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                        recordUserOffline();
                } else {
                        recordUserOnline();
                }
        });
        
        // 监听窗口焦点事件
        window.addEventListener('focus', recordUserOnline);
        window.addEventListener('blur', recordUserOffline);
        
        // 监听页面卸载事件
        window.addEventListener('beforeunload', recordUserOffline);
    });