<template>
        <div class="page-container">
                <AppHeader :title="'  '" :override-back-action="goBack">

                        <template #right>
                                <button class="header-action-button" @click="goToEdit">编辑</button>
                        </template>
                </AppHeader>

                <main v-if="actor" class="profile-content content">
                        <section class="profile-header">
                                <div class="avatar-wrapper">
                                        <div class="avatar">
                                                <img v-if="actor.currentAvatar" :src="actor.currentAvatar" :alt="actor.name" class="avatar-image">
                                                <span v-else class="avatar-initial">{{ getInitial(actor.name) }}</span>
                                        </div>
                                </div>
                                <div class="name-section">
                                        <div class="name-with-gender">
                                                <h1 class="nickname">{{ actor.name }}</h1>
                                                <svg v-if="actor.gender === '男'" class="gender-icon male"
                                                        xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"
                                                        width="24px" fill="currentColor">
                                                        <path
                                                                d="M480-660q-29 0-49.5-20.5T410-730q0-29 20.5-49.5T480-800q29 0 49.5 20.5T550-730q0 29-20.5 49.5T480-660Zm-80 500v-200h-40v-180q0-33 23.5-56.5T440-620h80q33 0 56.5 23.5T600-540v180h-40v200H400Z" />
                                                </svg>
                                                <svg v-else-if="actor.gender === '女'" class="gender-icon female"
                                                        xmlns="http://www.w3.org/2000/svg" height="24px"
                                                        viewBox="0 -960 960 960" width="24px" fill="currentColor">
                                                        <path
                                                                d="M480-660q-29 0-49.5-20.5T410-730q0-29 20.5-49.5T480-800q29 0 49.5 20.5T550-730q0 29-20.5 49.5T480-660Zm-80 500v-160h-80l95-255q8-20 25.5-32.5T480-620q22 0 39.5 12.5T545-575l95 255h-80v160H400Z" />
                                                </svg>
                                        </div>
                                        <p v-if="actor.realName" class="realname">名字: {{ actor.realName }}</p>
                                        <p v-if="relationshipScore !== null" class="affection">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
                                                        fill="currentColor" class="bi bi-heart-fill"
                                                        viewBox="0 0 16 16">
                                                        <path fill-rule="evenodd"
                                                                d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314" />
                                                </svg>

                                                {{ relationshipScore }}
                                        </p>
                                </div>
                                <div class="special-care-toggle" @click="toggleSpecialCare">
                                        <svg :class="{ active: actor.specialCare }" xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 24 24" fill="currentColor">
                                                <path fill-rule="evenodd"
                                                        d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
                                                        clip-rule="evenodd" />
                                        </svg>
                                </div>
                        </section>

                        <section class="details-section">
                                <div class="detail-item" v-if="actor.birthday">
                                        <span class="label">星座</span>
                                        <span class="value">{{ zodiacSign }}</span>
                                </div>
                                <div class="detail-item">
                                        <span class="label">年龄</span>
                                        <span class="value">{{ calculatedAge }}岁</span>
                                </div>
                                <div class="detail-item">
                                        <span class="label">分组</span>
                                        <span class="value">{{ groupNames || '未分组' }}</span>
                                </div>
                        </section>

                        <section class="actions-section">
                                <div class="detail-item" @click="goToMoments">
                                        <span class="label">动态</span>
                                        <span class="value accessory">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                                        fill="currentColor" class="bi bi-chevron-right"
                                                        viewBox="0 0 16 16">
                                                        <path fill-rule="evenodd"
                                                                d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708" />
                                                </svg>
                                        </span>
                                </div>
                                <div class="detail-item" @click="goToMemories">
                                        <span class="label">回忆</span>
                                        <span class="value accessory">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                                        fill="currentColor" class="bi bi-chevron-right"
                                                        viewBox="0 0 16 16">
                                                        <path fill-rule="evenodd"
                                                                d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708" />
                                                </svg>
                                        </span>
                                </div>
                                <div class="detail-item" @click="goToDiary">
                                        <span class="label">日记</span>
                                        <span class="value accessory">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                                        fill="currentColor" class="bi bi-chevron-right"
                                                        viewBox="0 0 16 16">
                                                        <path fill-rule="evenodd"
                                                                d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708" />
                                                </svg>
                                        </span>
                                </div>
                        </section>
                </main>

                <!-- 底部发消息按钮 -->
                <div class="bottom-actions" v-if="actor">
                        <button class="action-btn primary" @click="goToChat">发消息</button>
                </div>

                <div v-else class="loading-state">
                        <p>正在加载角色信息...</p>
                </div>
        </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useObservable } from '@vueuse/rxjs';
import { liveQuery } from 'dexie';
import db from '../services/database.js';
import AppHeader from '../components/layout/Header.vue';
import { calculateAge, getZodiacSign } from '../utils/datetime.js';
import { applyActorTheme, restoreOriginalTheme } from '../services/themeService.js';

const route = useRoute();
const router = useRouter();
const actorId = ref(route.params.id);

// 保存当前页面的来源信息，用于后续导航
onMounted(async () => {
        const fromPage = route.query.from;
        if (fromPage) {
                sessionStorage.setItem(`profile_${actorId.value}_from`, fromPage);
        }
        
        // 应用角色主题（使用用户保存的主题选择）
        if (actorId.value) {
                await applyActorTheme(actorId.value, null);
        }
});

// 组件卸载时恢复原始主题
onUnmounted(() => {
        restoreOriginalTheme();
});

const actor = useObservable(
        liveQuery(() => db.actors.get(actorId.value)),
        { initialValue: null }
);

const allGroups = useObservable(
        liveQuery(() => db.groups.toArray()),
        { initialValue: [] }
);

// 查询好感度（始终查询与__USER__的关系）
const relationshipScore = useObservable(
        liveQuery(async () => {
                const relationship = await db.relationships
                        .where('sourceId').equals(actorId.value)
                        .and(r => r.targetId === '__USER__')
                        .first();
                return relationship ? relationship.score : null;
        }),
        { initialValue: null }
);

const getInitial = (name) => {
        if (!name) return '#';
        const firstChar = name.charAt(0);
        return /^[a-zA-Z]/.test(firstChar) ? firstChar.toUpperCase() : firstChar;
};

const toggleSpecialCare = async () => {
        if (!actor.value) return;
        await db.actors.update(actorId.value, { specialCare: !actor.value.specialCare });
};

const calculatedAge = computed(() => actor.value ? calculateAge(actor.value.birthday) : null);
const zodiacSign = computed(() => actor.value ? getZodiacSign(actor.value.birthday) : '未知');
const groupNames = computed(() => {
        if (!actor.value?.groupIds || actor.value.groupIds.length === 0 || !allGroups.value) {
                return '未分组';
        }
        return allGroups.value
                .filter(g => actor.value.groupIds.includes(g.id))
                .map(g => g.name)
                .join(', ');
});

// 返回上一页
const goBack = () => {
        // 优先从 sessionStorage 获取最初的来源页面
        const originalFrom = sessionStorage.getItem(`profile_${actorId.value}_from`);

        if (originalFrom && originalFrom !== 'profile' && originalFrom !== 'edit') {
                if (originalFrom === 'contacts') {
                        router.push('/chat/contacts');
                } else if (originalFrom === 'messages') {
                        router.push('/chat/messages');
                } else if (originalFrom === 'chatroom') {
                        // 如果从聊天室来，返回到对应的聊天室
                        router.push(`/chatroom/${actorId.value}`);
                } else {
                        // 其他未知的来源，默认返回消息
                        router.push('/chat/messages');
                }
        } else {
                // 如果没有找到来源信息，提供一个安全的默认行为
                router.push('/chat/messages');
        }
};

// 跳转到动态页面
const goToMoments = () => {
        router.push(`/moments/${actorId.value}?from=profile`);
};

// 跳转到回忆页面
const goToMemories = () => {
        router.push(`/memories?actorId=${actorId.value}`);
};

// 跳转到日记页面
const goToDiary = () => {
        router.push(`/diary?actorId=${actorId.value}`);
};


// 跳转到编辑页面
const goToEdit = () => {
        // 添加query参数标识来源，防止无限循环
        router.push(`/edit/${actorId.value}?from=profile`);
};

// 跳转到聊天室
const goToChat = () => {
        router.push(`/chatroom/${actorId.value}`);
};
</script>

<style scoped>

.header-action-button {
        font-size: 16px;
        font-weight: 400;
        text-decoration: none;
        color: var(--accent-primary);
        background: none;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 8px;
}

.header-action-button svg {
        width: 24px;
        height: 24px;
}

.profile-content {
        flex-grow: 1;
        overflow-y: auto;
        padding: 20px;
        padding-top: var(--header-height);
}

.profile-header {
        display: flex;
        align-items: center;
        gap: 15px;
        margin-top: 30px;
        margin-bottom: 30px;
}

.avatar-wrapper .avatar {
        width: 80px;
        height: 80px;
}

.avatar-wrapper .avatar-initial {
        font-size: 40px;
}

.name-section {
        flex-grow: 1;
}

.name-with-gender {
        display: flex;
        align-items: center;
}

.gender-icon {
        width: 24px;
        height: 24px;
        flex-shrink: 0;
        display: block;
}

.gender-icon.male {
        color: #2196F3;
}

.gender-icon.female {
        color: #E91E63;
}

.nickname {
        font-size: 24px;
        font-weight: 600;
        margin: 0;
}

.realname {
        font-size: 14px;
        color: var(--text-secondary);
        margin: 5px 0 0 0;
}

.affection {
        font-size: 14px;
        color: var(--accent-primary);
        margin: 5px 0 0 0;
        font-weight: 500;
}

.special-care-toggle svg {
        width: 28px;
        height: 28px;
        color: var(--text-secondary);
        cursor: pointer;
        transition: color 0.2s, transform 0.2s;
}

.special-care-toggle svg.active {
        color: #ffc107;
        transform: scale(1.2);
}

.details-section,
.actions-section,
.persona-section {
        background-color: var(--bg-card);
        border-radius: 8px;
        padding: 5px 15px;
        margin-bottom: 20px;
}

.detail-item {
        display: flex;
        justify-content: space-between;
        padding: 12px 0;
        font-size: 16px;
}

.detail-item:not(:last-child) {
        border-bottom: 1px solid var(--border-color);
}

.label {
        color: var(--text-secondary);
}

.value {
        color: var(--text-primary);
        font-weight: 500;
}

.section-title {
        font-size: 14px;
        color: var(--text-secondary);
        margin-bottom: 10px;
        border-bottom: 1px solid var(--border-color);
        padding-bottom: 10px;
}

.persona-text {
        font-size: 16px;
        line-height: 1.6;
        white-space: pre-wrap;
        margin-top: 10px;
}

.action-buttons {
        margin-top: 30px;
        display: flex;
        flex-direction: column;
        gap: 15px;
}

/* 底部按钮样式 */
.bottom-actions {
        position: fixed;
        bottom: calc(var(--safe-bottom) + 20px);
        left: var(--safe-left);
        right: var(--safe-right);
        padding: 0 20px;
        z-index: 100;
}

.action-btn {
        width: 100%;
        padding: 15px;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
}

.action-btn.primary {
        background-color: var(--accent-primary);
        color: var(--accent-text);
}

.action-btn:not(.primary) {
        background-color: var(--bg-card);
        color: var(--text-primary);
}

.loading-state {
        text-align: center;
        margin-top: 50px;
        color: var(--text-secondary);
}
</style>