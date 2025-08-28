<template>
        <footer class="app-footer">
                <nav class="footer-nav">
                        <router-link v-for="item in navItems" :key="item.id" :to="item.path" class="nav-item">
                                <span class="nav-text">{{ item.name }}</span>
                                <span v-if="(item.id === 'messages' || item.id === 'moments') && hasNotification"
                                        class="notification-glow"></span>
                        </router-link>
                </nav>
        </footer>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
        hasNotification: {
                type: Boolean,
                default: false,
        },
});

const navItems = ref([
        { id: 'messages', name: '消息', path: '/chat/messages' },
        { id: 'contacts', name: '通讯录', path: '/chat/contacts' },
        { id: 'moments', name: '动态', path: '/chat/moments' },
        { id: 'me', name: '我', path: '/chat/me' },
]);
</script>

<style scoped>
.app-footer {
        /* 定位与尺寸 */
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        z-index: 100;
        box-sizing: border-box;

        /* 毛玻璃效果 */
        background-color: var(--header-bg, rgba(42, 42, 42, 0.75));
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-top: 1px solid var(--border-color);

        /* 安全区域适配 iPhone 等设备 */
        height: calc(56px + var(--safe-bottom));
        padding-bottom: var(--safe-bottom);
}

.footer-nav {
        display: flex;
        justify-content: space-around;
        align-items: center;
        height: 55px;
}

.nav-item {
        position: relative;
        /* 用于定位光晕 */
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-decoration: none;
        color: var(--text-secondary);
        font-size: 14px;
        transition: color 0.2s ease;
}

/* Vue Router 会自动为当前激活的链接添加这个 class */
.nav-item.router-link-exact-active {
        color: var(--accent-primary);
}

.nav-text {
        z-index: 2;
        /* 确保文字在光晕之上 */
}

/* --- 新消息光晕动画 --- */
@keyframes glow-pulse {
        0% {
                transform: scale(0);
                opacity: 0.8;
        }

        70% {
                opacity: 1;
        }

        100% {
                transform: scale(1.3);
                opacity: 0;
        }
}

.notification-glow {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 40px;
        height: 40px;
        margin-top: -20px;
        margin-left: -20px;
        border-radius: 50%;
        z-index: 1;
}

.notification-glow::before,
.notification-glow::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 40px;
        height: 40px;
        margin-top: -20px;
        margin-left: -20px;
        border-radius: 50%;
        z-index: 0;
        animation: glow-pulse 2s infinite ease-out;
        box-shadow: 0 0 18px var(--accent-primary);
}

.notification-glow::after {
        animation-delay: 0.75s;
}
</style>
