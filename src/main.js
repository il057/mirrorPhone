import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/main.css' // 引入全局样式
import { populateMockData } from './services/mockData.js';

const app = createApp(App)

app.use(router) // 使用路由

populateMockData().then(() => {
        app.mount('#app');
    });