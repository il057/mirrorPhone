<template>
        <div class="page-container">
                <AppHeader title=" ">
                        <template #right>
                                <button class="header-action-button" @click="openPersonaManagement" title="管理人格预设">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                                fill="currentColor" class="bi bi-person-gear" viewBox="0 0 16 16">
                                                <path
                                                        d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0M8 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4m.256 7a4.5 4.5 0 0 1-.229-1.004H3c.001-.246.154-.986.832-1.664C4.484 10.68 5.711 10 8 10q.39 0 .74.025c.226-.341.496-.65.804-.918Q8.844 9.002 8 9c-5 0-6 3-6 4s1 1 1 1zm3.63-4.54c.18-.613 1.048-.613 1.229 0l.043.148a.64.64 0 0 0 .921.382l.136-.074c.561-.306 1.175.308.87.869l-.075.136a.64.64 0 0 0 .382.92l.149.045c.612.18.612 1.048 0 1.229l-.15.043a.64.64 0 0 0-.38.921l.074.136c.305.561-.309 1.175-.87.87l-.136-.075a.64.64 0 0 0-.92.382l-.045.149c-.18.612-1.048.612-1.229 0l-.043-.15a.64.64 0 0 0-.921-.38l-.136.074c-.561.305-1.175-.309-.87-.87l.075-.136a.64.64 0 0 0-.382-.92l-.148-.045c-.613-.18-.613-1.048 0-1.229l.148-.043a.64.64 0 0 0 .382-.921l-.074-.136c-.306-.561.308-1.175.869-.87l.136.075a.64.64 0 0 0 .92-.382zM14 12.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0" />
                                        </svg>
                                </button>
                        </template>
                </AppHeader>

                <main class="page-content">
                        <router-link to="/moments/__USER__" class="user-profile-header-link">
                                <div class="user-profile-header">
                                        <div class="avatar">
                                                <img v-if="currentPersona?.avatar" :src="currentPersona.avatar"
                                                        :alt="currentPersona.name || 'User'">
                                                <span v-else class="avatar-initial">{{ getInitial(currentPersona?.name
                                                        ||
                                                        'User') }}</span>
                                        </div>
                                        <div class="user-info">
                                                <h2 class="user-name">{{ currentPersona?.name || 'User' }}</h2>
                                                <p class="user-status">{{ currentPersona?.realName || '查看我的动态' }}</p>
                                        </div>
                                </div>
                        </router-link>

                        <div class="menu-list">
                                <router-link to="/memories" class="menu-item">
                                        <span>回忆</span>
                                        <svg class="chevron" xmlns="http://www.w3.org/2000/svg" fill="none"
                                                viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                        d="M9 5l7 7-7 7" />
                                        </svg>
                                </router-link>
                                <router-link to="/stickers" class="menu-item">
                                        <span>表情</span>
                                        <svg class="chevron" xmlns="http://www.w3.org/2000/svg" fill="none"
                                                viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                        d="M9 5l7 7-7 7" />
                                        </svg>
                                </router-link>
                                <router-link to="/favorites" class="menu-item">
                                        <span>收藏</span>
                                        <svg class="chevron" xmlns="http://www.w3.org/2000/svg" fill="none"
                                                viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                        d="M9 5l7 7-7 7" />
                                        </svg>
                                </router-link>

                                <router-link to="/personal-settings" class="menu-item">
                                        <span>设置</span>
                                        <svg class="chevron" xmlns="http://www.w3.org/2000/svg" fill="none"
                                                viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                        d="M9 5l7 7-7 7" />
                                        </svg>
                                </router-link>
                        </div>
                </main>
        </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useObservable } from '@vueuse/rxjs';
import { liveQuery } from 'dexie';
import db from '../../services/database.js';
import AppHeader from '../../components/layout/Header.vue';
import { getDefaultUserPersona } from '../../services/userPersonaService.js';

const router = useRouter();

// 当前默认人格预设 - 使用响应式观察
const currentPersona = useObservable(
        liveQuery(() => getDefaultUserPersona()),
        { initialValue: null }
);

// 打开人格预设管理
const openPersonaManagement = () => {
        router.push('/user-persona');
};

// 初始化函数 - 确保至少有一个默认人格
const initializeDefaultPersona = async () => {
        try {
                const defaultPersona = await getDefaultUserPersona();
                if (!defaultPersona) {
                        // 如果没有默认人格，创建一个默认的
                        const defaultUserPersona = {
                                id: 'user_default',
                                name: 'User',
                                realName: '',
                                aliases: [],
                                gender: '',
                                birthday: '',
                                persona: '',
                                avatar: '',
                                groupIds: [],
                                isDefault: true,
                                type: 'user',
                                avatarLibrary: []
                        };
                        
                        await db.actors.put(defaultUserPersona);
                }
        } catch (error) {
                console.error('初始化默认人格失败:', error);
        }
};

onMounted(() => {
        initializeDefaultPersona();
});

// 生成首字母头像
const getInitial = (name) => {
        if (!name) return 'U';
        return name.charAt(0).toUpperCase();
};
</script>

<style scoped>
.page-container {
        display: flex;
        flex-direction: column;
        height: 100vh;
}

.header-action-button {
        background: none;
        border: none;
        color: var(--text-primary);
        cursor: pointer;
        padding: 8px;
        border-radius: 6px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
}

.header-action-button:hover {
        color: var(--accent-primary);
}

.page-content {
        flex: 1;
        padding: 10px 15px 0;
        background-color: var(--bg-primary);
        overflow-y: auto;
}

.user-profile-header-link {
        text-decoration: none;
        color: inherit;
        display: block;
        margin-bottom: 30px;
}

.user-profile-header-link .avatar {
        transition: transform 0.2s ease-in-out;
}

.user-profile-header-link:hover .avatar {
        transform: scale(1.05);
}

.user-profile-header {
        display: flex;
        align-items: center;
        gap: 15px;
        margin-bottom: 30px;
}

.avatar {
        width: 72px;
        height: 72px;
        border-radius: 8px;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: var(--bg-secondary);
        overflow: hidden;
}

.avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
}

.avatar-initial {
        color: var(--accent-primary);
        font-size: 36px;
        font-weight: bold;
}

.user-name {
        font-size: 22px;
        font-weight: bold;
        margin: 0 0 4px 0;
        color: var(--text-primary);
}

.user-status {
        font-size: 14px;
        color: var(--text-secondary);
        margin: 0;
}

.menu-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
}

.menu-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 15px;
        background-color: var(--bg-card);
        border-radius: 8px;
        color: var(--text-primary);
        text-decoration: none;
        cursor: pointer;
        transition: all 0.2s ease;
}

.menu-item:hover {
        background-color: var(--bg-secondary);
}

.chevron {
        width: 20px;
        height: 20px;
        color: var(--text-secondary);
}
</style>
