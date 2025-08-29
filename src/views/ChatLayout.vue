<template>
        <div class="app-main-container">
                <AppHeader :title="currentTitle">
                        <template #right>
                                <button v-if="showPlusMenu" @click="isDropdownOpen = true" class="header-action-button">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                                stroke-linecap="round" stroke-linejoin="round">
                                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                        </svg>
                                </button>
                                <button v-if="route.name === 'chat-me'" class="header-action-button">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                                stroke-linecap="round" stroke-linejoin="round">
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                <circle cx="12" cy="7" r="4"></circle>
                                        </svg>
                                </button>
                        </template>
                </AppHeader>

                <main class="chat-content content">
                        <router-view />
                </main>

                <AppFooter :has-notification="hasNotification" />

                <HeaderDropdownMenu :is-open="isDropdownOpen" @close="isDropdownOpen = false">
                        <template v-if="route.name === 'chat-messages' || route.name === 'chat-contacts'">
                                <li @click="handleDropdownAction('addFriend')">添加好友</li>
                                <li @click="handleDropdownAction('suggestedFriends')">可能认识</li>
                                <li @click="handleDropdownAction('startGroupChat')">发起群聊</li>
                                <li v-if="route.name === 'chat-contacts'" @click="handleDropdownAction('manageGroups')">
                                        管理分组</li>
                        </template>
                        <template v-if="route.name === 'chat-moments'">
                                <li @click="handleDropdownAction('writePost')">写动态</li>
                                <li @click="handleDropdownAction('postPhoto')">发照片</li>
                        </template>
                </HeaderDropdownMenu>

        </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useObservable } from '@vueuse/rxjs';
import { liveQuery } from 'dexie';
import db from '../services/database';
import AppHeader from '../components/layout/Header.vue';
import AppFooter from '../components/layout/Footer.vue';
import HeaderDropdownMenu from '../components/ui/HeaderDropdownMenu.vue';
import { showToast, showManageGroupsModal } from '../services/uiService'; // 导入新的服务

const route = useRoute();
const router = useRouter();
const currentTitle = ref('');
const isDropdownOpen = ref(false);

const showPlusMenu = computed(() => {
        const routesWithPlus = ['chat-messages', 'chat-contacts', 'chat-moments'];
        // 在个人动态页，如果是自己的动态页则显示，否则隐藏
        if (route.name === 'personal-moments') {
                return route.params.id === '__USER__';
        }
        return routesWithPlus.includes(route.name);
});

const conversations = useObservable(
        liveQuery(() => db.conversations.toArray()),
        { initialValue: [] }
);

const hasUnreadMessages = computed(() => {
        return conversations.value.some(convo => convo.unreadCount > 0);
});

const hasNewMoments = useObservable(
        liveQuery(async () => {
                // 检查是否有新的动态（用户最后查看时间之后）
                const settings = await db.globalSettings.get('global');
                const lastViewedTime = settings?.lastViewedMoments || 0;
                const recentMoments = await db.events
                        .where('type').equals('post')
                        .and(event => event.timestamp > lastViewedTime)
                        .toArray();
                return recentMoments.length > 0;
        }),
        { initialValue: false }
);

const hasNotification = computed(() => {
        return hasUnreadMessages.value || hasNewMoments.value;
});


watch(
        () => route,
        async (newRoute) => {
                if (newRoute.name === 'personal-moments') {
                        const actorId = newRoute.params.id;
                        let actorName = '';
                        if (actorId === '__USER__') {
                                const persona = await db.actors.where('isDefault').equals(1).first();
                                actorName = persona?.name || '我';
                        } else {
                                const actor = await db.actors.get(actorId);
                                actorName = actor?.name || '未知';
                        }
                        currentTitle.value = `${actorName}的动态`;
                } else {
                        currentTitle.value = newRoute.meta.title || '';
                }
        },
        { immediate: true, deep: true }
);


// This logic runs in the background to keep the 'Special Care' group in sync.
const actors = useObservable(liveQuery(() => db.actors.toArray()), { initialValue: [] });
watch(actors, async (newActors) => {
        if (!newActors) return;

        const specialCareActorsExist = newActors.some(a => a.specialCare && !a.isGroup);
        const specialGroup = await db.groups.get('group_special');

        if (specialCareActorsExist && !specialGroup) {
                await db.groups.put({ id: 'group_special', name: '特别关心', order: 0 });
        } else if (!specialCareActorsExist && specialGroup) {
                // If no special care characters exist but the group does, delete it.
                await db.groups.delete('group_special');
        }
}, { immediate: true });

const handleDropdownAction = (action) => {
        isDropdownOpen.value = false;
        switch (action) {
                case 'addFriend':
                        router.push('/edit');
                        break;
                case 'manageGroups':
                        showManageGroupsModal('groups');
                        break;
                case 'writePost':
                        // 发送事件给MomentsView
                        window.dispatchEvent(new CustomEvent('openWritePostModal', { detail: { type: 'text' } }));
                        break;
                case 'postPhoto':
                        // 发送事件给MomentsView
                        window.dispatchEvent(new CustomEvent('openWritePostModal', { detail: { type: 'image' } }));
                        break;
                default:
                        showToast(`${action} 功能待开发`, 'info');
                        break;
        }
};

</script>

<style scoped>
.app-main-container {
        width: 100vw;
        height: 100vh;
        background-color: var(--bg-primary);
        display: flex;
        flex-direction: column;
        overflow: hidden;
}

.chat-content {
        flex: 1;
        overflow-y: auto;   
}


/* Header action button styles */
.header-action-button {
        color: var(--text-primary);
        background: none;
        border: none;
        padding: 5px;
        cursor: pointer;
}
</style>