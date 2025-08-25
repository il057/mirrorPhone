import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/main.css' // 引入全局样式
import { populateMockData } from './services/mockData.js';
import { initializeGlobalSettings, initializeDefaultFonts } from './services/database.js';
import db from './services/database.js';

// 初始化主题
async function initializeTheme() {
        const settings = await db.globalSettings.get('global');
        const themeMode = settings?.themeMode || 'system';
        
        const html = document.documentElement;
        
        if (themeMode === 'system') {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                html.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        } else {
                html.setAttribute('data-theme', themeMode);
        }
}

const app = createApp(App)

app.use(router) // 使用路由

Promise.all([
        initializeGlobalSettings(),
        initializeDefaultFonts(),
        populateMockData(),
        initializeTheme()
]).then(() => {
        app.mount('#app');
    });