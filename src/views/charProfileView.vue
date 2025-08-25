<template>
        <div class="page-container">
                <AppHeader :title="actor?.name || '详细资料'">
                        <template #right>
                                <router-link :to="`/edit/${actorId}`" class="header-action-button">编辑</router-link>
                        </template>
                </AppHeader>

                <main v-if="actor" class="profile-content content">
                        <section class="profile-header">
                                <div class="avatar-wrapper">
                                        <div class="avatar">
                                                <span class="avatar-initial">{{ getInitial(actor.name) }}</span>
                                        </div>
                                </div>
                                <div class="name-section">
                                        <h1 class="nickname">{{ actor.name }}</h1>
                                        <p v-if="actor.realName" class="realname">名字: {{ actor.realName }}</p>
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
                                <div class="detail-item">
                                        <span class="label">年龄</span>
                                        <span class="value">{{ calculatedAge }}岁</span>
                                </div>
                                <div class="detail-item" v-if="actor.birthday">
                                        <span class="label">星座</span>
                                        <span class="value">{{ zodiacSign }}</span>
                                </div>
                                <div class="detail-item">
                                        <span class="label">性别</span>
                                        <span class="value">{{ actor.gender || '未设置' }}</span>
                                </div>
                                <div class="detail-item">
                                        <span class="label">分组</span>
                                        <span class="value">{{ groupNames || '未分组' }}</span>
                                </div>
                        </section>

                        <div class="action-buttons">
                                <button class="action-btn primary">发消息</button>
                        </div>
                </main>
                <div v-else class="loading-state">
                        <p>正在加载角色信息...</p>
                </div>
        </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useObservable } from '@vueuse/rxjs';
import { liveQuery } from 'dexie';
import db from '../services/database.js';
import AppHeader from '../components/layout/Header.vue';
import { calculateAge, getZodiacSign } from '../utils/datetime.js';

const route = useRoute();
const actorId = ref(route.params.id);

const actor = useObservable(
        liveQuery(() => db.actors.get(actorId.value)),
        { initialValue: null }
);

const allGroups = useObservable(
        liveQuery(() => db.groups.toArray()),
        { initialValue: [] }
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
</script>

<style scoped>

.header-action-button {
        font-size: 16px;
        font-weight: 400;
        text-decoration: none;
        color: var(--accent-primary);
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
        margin-bottom: 30px;
}

.avatar-wrapper .avatar {
        width: 80px;
        height: 80px;
        border-radius: 12px;
        background-color: #555;
        display: flex;
        justify-content: center;
        align-items: center;
        font-weight: bold;
}

.avatar-wrapper .avatar-initial {
        color: var(--accent-primary);
        font-size: 40px;
}

.name-section {
        flex-grow: 1;
}

.nickname {
        font-size: 24px;
        font-weight: 600;
        margin: 0 0 5px 0;
}

.realname {
        font-size: 14px;
        color: var(--text-secondary);
        margin: 0;
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
        color: var(--text-inverse);
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