<template>
        <main class="page-content">
                <div v-if="!conversations" class="empty-state">
                        <p>正在加载...</p>
                </div>
                <div v-else-if="conversations.length === 0" class="empty-state">
                        <p>暂无消息</p>
                </div>
                <ul v-if="conversations" class="conversation-list">
                        <li v-for="convo in conversations" :key="convo.id" class="conversation-item">
                                <div class="avatar">
                                        <span class="avatar-initial">{{ convo.actor?.name[0] }}</span>
                                </div>
                                <div class="convo-details">
                                        <div class="convo-header">
                                                <span class="convo-name">{{ convo.actor?.name }}</span>
                                                <span class="convo-timestamp">{{
                                                        formatTimestamp(convo.lastEventTimestamp) }}</span>
                                        </div>
                                        <div class="convo-body">
                                                <p class="convo-last-message">{{ convo.lastEventContent.content
                                                        }}</p>
                                                <span v-if="convo.unreadCount > 0" class="unread-badge">{{
                                                        convo.unreadCount }}</span>
                                        </div>
                                </div>
                        </li>
                </ul>
        </main>

</template>

<script setup>
import { computed } from 'vue';
import db from '../../services/database.js';
import { useObservable } from '@vueuse/rxjs';
import { liveQuery } from 'dexie';

const conversations = useObservable(
        liveQuery(async () => {
                const convos = await db.conversations.orderBy('lastEventTimestamp').reverse().toArray();
                // Fetch actor details for each conversation
                for (let convo of convos) {
                        convo.actor = await db.actors.get(convo.id);
                }
                return convos;
        })
);


function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
        return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else {
        return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
}

</script>

<style scoped>

.messages-view-container {
        height: 100%;
        padding-top: var(--header-height);
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
}

.conversation-list {
    list-style: none;
    padding: 0;
    margin: 0;
}
.conversation-item {
    display: flex;
    align-items: center;
    padding: 12px 15px;
    border-bottom: 1px solid var(--border-color);
    cursor: pointer;
}
.conversation-item:hover {
    background-color: var(--bg-secondary);
}
.avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background-color: #555;
    margin-right: 15px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 20px;
    font-weight: bold;
}
.convo-details {
    flex-grow: 1;
    overflow: hidden;
}
.convo-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
}
.convo-name {
    font-weight: 600;
}
.convo-timestamp {
    font-size: 12px;
    color: var(--text-secondary);
}
.convo-body {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.convo-last-message {
    font-size: 14px;
    color: var(--text-secondary);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.unread-badge {
    background-color: #f44336;
    color: white;
    font-size: 12px;
    padding: 2px 6px;
    border-radius: 10px;
    min-width: 20px;
    text-align: center;
}
.empty-state {
    text-align: center;
    margin-top: 50px;
    color: var(--text-secondary);
}
</style>