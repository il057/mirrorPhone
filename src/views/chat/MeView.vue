<template>
        <div class="page-container">
                <AppHeader title="我">
                        <template #right>
                                <button class="header-action-button" @click="openPersonaManagement" title="管理人格预设">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <circle cx="12" cy="12" r="3"/>
                                                <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
                                        </svg>
                                </button>
                        </template>
                </AppHeader>

                <main class="page-content">
                        <div class="user-profile-header">
                                <div class="avatar">
                                        <img v-if="currentPersona?.avatar" :src="currentPersona.avatar" :alt="currentPersona.name || 'User'">
                                        <span v-else class="avatar-initial">{{ getInitial(currentPersona?.name || 'User') }}</span>
                                </div>
                                <div class="user-info">
                                        <h2 class="user-name">{{ currentPersona?.name || 'User' }}</h2>
                                        <p class="user-status">{{ currentPersona?.realName || '查看我的动态' }}</p>
                                </div>
                        </div>

                        <div class="menu-list">
                                <router-link to="/stickers" class="menu-item">
                                        <span>表情</span>
                                        <svg class="chevron" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                                stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                        d="M9 5l7 7-7 7" />
                                        </svg>
                                </router-link>
                                <div class="menu-item">
                                        <span>收藏</span>
                                        <svg class="chevron" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                                stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                        d="M9 5l7 7-7 7" />
                                        </svg>
                                </div>
                              
                                <div class="menu-item">
                                        <span>设置</span>
                                        <svg class="chevron" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                                stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                        d="M9 5l7 7-7 7" />
                                        </svg>
                                </div>
                        </div>
                </main>
        </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useObservable } from '@vueuse/rxjs';
import { liveQuery } from 'dexie';
import db from '../../services/database.js';
import AppHeader from '../../components/layout/Header.vue';
import { showUserPersonaModal } from '../../services/uiService.js';
import { getDefaultUserPersona } from '../../services/userPersonaService.js';

// 当前默认人格预设
const currentPersona = ref(null);

// 加载当前默认人格预设
const loadCurrentPersona = async () => {
        try {
                const defaultPersona = await getDefaultUserPersona();
                
                if (defaultPersona) {
                        currentPersona.value = defaultPersona;
                } else {
                        // 如果没有默认人格，创建一个默认的
                        const defaultUserPersona = {
                                id: 'user_persona_default',
                                name: 'User',
                                realName: '',
                                aliases: [],
                                gender: '',
                                birthday: '',
                                persona: '',
                                avatar: '',
                                groupIds: [],
                                isDefault: true,
                                type: 'user_persona',
                                avatarLibrary: []
                        };
                        
                        await db.actors.put(defaultUserPersona);
                        currentPersona.value = defaultUserPersona;
                }
        } catch (error) {
                console.error('加载当前人格预设失败:', error);
        }
};

// 打开人格预设管理
const openPersonaManagement = async () => {
        console.log('Opening persona management modal...');
        try {
                await showUserPersonaModal();
                // 重新加载当前人格预设，以防有变更
                await loadCurrentPersona();
        } catch (error) {
                console.error('Failed to open persona management:', error);
        }
};

onMounted(() => {
        loadCurrentPersona();
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
        background-color: var(--bg-secondary);
        color: var(--accent-primary);
}

.page-content {
        flex: 1;
        padding: 20px 15px;
        background-color: var(--bg-primary);
        padding-top: calc(var(--header-height) + 20px);
        overflow-y: auto;
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
